export interface MigrateExecutorSchema {
  supabaseDirectory: string;
  target?: 'local' | 'remote';
  dryRun?: boolean;
}
