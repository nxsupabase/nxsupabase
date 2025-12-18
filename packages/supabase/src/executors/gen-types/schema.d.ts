export interface GenTypesExecutorSchema {
  supabaseDirectory: string;
  outputPath: string;
  source?: 'local' | 'linked' | 'db-url';
  dbUrl?: string;
  schemas?: string[];
}
