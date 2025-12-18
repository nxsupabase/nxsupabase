export interface DeployExecutorSchema {
  supabaseDirectory: string;
  projectRef?: string;
  functions?: string[];
  deployFunctions?: boolean;
  pushMigrations?: boolean;
  noVerifyJwt?: boolean;
}
