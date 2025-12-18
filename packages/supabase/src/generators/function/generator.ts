import {
  Tree,
  formatFiles,
  joinPathFragments,
  readProjectConfiguration,
  names,
  logger,
} from '@nx/devkit';
import { FunctionGeneratorSchema } from './schema';

const CORS_HELPER = `// CORS headers for Supabase Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
`;

const BASIC_TEMPLATE = (functionName: string) => `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("${functionName} function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();

    const data = {
      message: \`Hello \${name || "World"}!\`,
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
`;

const CRUD_TEMPLATE = (functionName: string) => `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("${functionName} CRUD function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    switch (req.method) {
      case "GET": {
        // List or get single item
        if (id) {
          const { data, error } = await supabaseClient
            .from("your_table")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { data, error } = await supabaseClient
            .from("your_table")
            .select("*");

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "POST": {
        const body = await req.json();
        const { data, error } = await supabaseClient
          .from("your_table")
          .insert(body)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 201,
        });
      }

      case "PUT": {
        if (!id) throw new Error("ID required for update");
        const body = await req.json();
        const { data, error } = await supabaseClient
          .from("your_table")
          .update(body)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE": {
        if (!id) throw new Error("ID required for delete");
        const { error } = await supabaseClient
          .from("your_table")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return new Response(null, {
          headers: corsHeaders,
          status: 204,
        });
      }

      default:
        return new Response("Method not allowed", {
          headers: corsHeaders,
          status: 405,
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
`;

const WEBHOOK_TEMPLATE = (functionName: string) => `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("${functionName} webhook function started");

// Verify webhook signature (implement based on your provider)
async function verifySignature(payload: string, signature: string): Promise<boolean> {
  // Example: Stripe webhook verification
  // const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
  // Implement your verification logic here
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      headers: corsHeaders,
      status: 405,
    });
  }

  try {
    const signature = req.headers.get("x-webhook-signature") || "";
    const payload = await req.text();

    // Verify the webhook signature
    const isValid = await verifySignature(payload, signature);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const event = JSON.parse(payload);

    // Handle different event types
    switch (event.type) {
      case "user.created":
        console.log("User created:", event.data);
        // Handle user created event
        break;

      case "payment.completed":
        console.log("Payment completed:", event.data);
        // Handle payment completed event
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
`;

export async function functionGenerator(
  tree: Tree,
  options: FunctionGeneratorSchema
): Promise<void> {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;
  const supabaseDir = options.directory || 'supabase';

  const functionName = names(options.name).fileName;

  const functionsDir = joinPathFragments(projectRoot, supabaseDir, 'functions');

  // Create _shared directory with CORS helper if it doesn't exist
  const sharedDir = joinPathFragments(functionsDir, '_shared');
  const corsPath = joinPathFragments(sharedDir, 'cors.ts');
  if (!tree.exists(corsPath)) {
    tree.write(corsPath, CORS_HELPER);
  }

  // Create the function directory and index.ts
  const functionDir = joinPathFragments(functionsDir, functionName);
  const indexPath = joinPathFragments(functionDir, 'index.ts');

  let template: string;
  switch (options.template) {
    case 'crud':
      template = CRUD_TEMPLATE(functionName);
      break;
    case 'webhook':
      template = WEBHOOK_TEMPLATE(functionName);
      break;
    default:
      template = BASIC_TEMPLATE(functionName);
  }

  tree.write(indexPath, template);

  // Update config.toml to add function-specific settings
  const configPath = joinPathFragments(projectRoot, supabaseDir, 'config.toml');
  if (tree.exists(configPath)) {
    let config = tree.read(configPath, 'utf-8') || '';
    const functionConfig = `
[functions.${functionName}]
verify_jwt = ${options.verifyJwt !== false}
`;
    if (!config.includes(`[functions.${functionName}]`)) {
      config += functionConfig;
      tree.write(configPath, config);
    }
  }

  await formatFiles(tree);

  logger.info('');
  logger.info(`Edge Function '${functionName}' created at ${functionDir}`);
  logger.info('');
  logger.info('Next steps:');
  logger.info(`  1. Edit the function at ${indexPath}`);
  logger.info(`  2. Run 'nx run ${options.project}:supabase-start' to test locally`);
  logger.info(`  3. Invoke locally: curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/${functionName}' \\`);
  logger.info(`       --header 'Authorization: Bearer <anon-key>' \\`);
  logger.info(`       --header 'Content-Type: application/json' \\`);
  logger.info(`       --data '{"name":"World"}'`);
  logger.info('');
}

export default functionGenerator;
