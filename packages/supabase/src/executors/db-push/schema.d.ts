export interface DbPushExecutorSchema {
  supabaseDirectory: string;
  dryRun?: boolean;
  linkedProject?: string;
  password?: string;
  includeSeed?: boolean;
}
