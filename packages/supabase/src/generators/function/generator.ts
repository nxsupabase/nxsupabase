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

const X402_TEMPLATE = (functionName: string, amount: string, network: string) => `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * x402 Payment-Required Edge Function
 *
 * This function implements the x402 protocol for internet-native payments.
 * Learn more: https://x402.org
 *
 * Environment variables required:
 * - X402_WALLET_ADDRESS: Your wallet address to receive payments
 * - X402_FACILITATOR_URL: (optional) Custom facilitator URL
 */

console.log("${functionName} x402 payment function started");

// x402 Payment Configuration
const PAYMENT_CONFIG = {
  amount: "${amount}",
  currency: "USDC",
  network: "${network}",
  recipient: Deno.env.get("X402_WALLET_ADDRESS") ?? "",
  facilitatorUrl: Deno.env.get("X402_FACILITATOR_URL") ?? "https://x402.org/facilitator",
};

// Build the x402 payment requirement response
function buildPaymentRequired(description: string) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: PAYMENT_CONFIG.network,
        maxAmountRequired: PAYMENT_CONFIG.amount,
        resource: PAYMENT_CONFIG.recipient,
        description: description,
        mimeType: "application/json",
        payTo: PAYMENT_CONFIG.recipient,
        maxTimeoutSeconds: 60,
        asset: \`\${PAYMENT_CONFIG.network === "base" || PAYMENT_CONFIG.network === "base-sepolia" ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" : "USDC"}\`,
        extra: {
          name: "${functionName}",
          facilitator: PAYMENT_CONFIG.facilitatorUrl,
        },
      },
    ],
    error: null,
  };
}

// Verify payment with the facilitator
async function verifyPayment(paymentHeader: string): Promise<{ valid: boolean; txHash?: string }> {
  try {
    const response = await fetch(\`\${PAYMENT_CONFIG.facilitatorUrl}/verify\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: paymentHeader,
        recipient: PAYMENT_CONFIG.recipient,
        amount: PAYMENT_CONFIG.amount,
        network: PAYMENT_CONFIG.network,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { valid: true, txHash: result.txHash };
    }
    return { valid: false };
  } catch (error) {
    console.error("Payment verification error:", error);
    return { valid: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check for x402 payment header
    const paymentHeader = req.headers.get("X-Payment") || req.headers.get("x-payment");

    if (!paymentHeader) {
      // No payment provided - return 402 Payment Required
      const paymentRequired = buildPaymentRequired("Access to ${functionName} API endpoint");

      return new Response(JSON.stringify(paymentRequired), {
        status: 402,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Payment-Required": "true",
        },
      });
    }

    // Verify the payment
    const verification = await verifyPayment(paymentHeader);

    if (!verification.valid) {
      return new Response(JSON.stringify({ error: "Invalid or expired payment" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment verified! Execute your business logic here
    // ================================================

    const { name } = await req.json().catch(() => ({}));

    const data = {
      message: \`Hello \${name || "World"}! Payment verified.\`,
      txHash: verification.txHash,
      paidAmount: PAYMENT_CONFIG.amount,
      currency: PAYMENT_CONFIG.currency,
    };

    // ================================================

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
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
    case 'x402':
      template = X402_TEMPLATE(
        functionName,
        options.paymentAmount || '0.01',
        options.paymentNetwork || 'base'
      );
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

  if (options.template === 'x402') {
    logger.info('x402 Payment-Required Function Setup:');
    logger.info('');
    logger.info('  1. Set your wallet address in .env:');
    logger.info('     X402_WALLET_ADDRESS=0xYourWalletAddress');
    logger.info('');
    logger.info(`  2. Payment configured: ${options.paymentAmount || '0.01'} USDC on ${options.paymentNetwork || 'base'}`);
    logger.info('');
    logger.info('  3. Test locally:');
    logger.info(`     nx run ${options.project}:supabase-start`);
    logger.info('');
    logger.info('  4. Without payment (returns 402):');
    logger.info(`     curl -i 'http://127.0.0.1:54321/functions/v1/${functionName}'`);
    logger.info('');
    logger.info('  Learn more: https://x402.org');
  } else {
    logger.info('Next steps:');
    logger.info(`  1. Edit the function at ${indexPath}`);
    logger.info(`  2. Run 'nx run ${options.project}:supabase-start' to test locally`);
    logger.info(`  3. Invoke locally: curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/${functionName}' \\`);
    logger.info(`       --header 'Authorization: Bearer <anon-key>' \\`);
    logger.info(`       --header 'Content-Type: application/json' \\`);
    logger.info(`       --data '{"name":"World"}'`);
  }
  logger.info('');
}

export default functionGenerator;
