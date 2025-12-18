export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  sql?: string;
  directory?: string;
}
