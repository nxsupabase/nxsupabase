export interface FunctionsServeExecutorSchema {
  supabaseDirectory: string;
  functions?: string[];
  noVerifyJwt?: boolean;
  envFile?: string;
  debug?: boolean;
}
