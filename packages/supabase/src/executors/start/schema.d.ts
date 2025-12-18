export interface StartExecutorSchema {
  supabaseDirectory: string;
  ignorePaths?: string[];
  excludeServices?: string[];
  debug?: boolean;
}
