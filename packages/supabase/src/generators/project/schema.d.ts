export interface ProjectGeneratorSchema {
  project: string;
  directory?: string;
  projectId?: string;
  dbPort?: number;
  apiPort?: number;
  studioPort?: number;
  inbucketPort?: number;
  enableEdgeFunctions?: boolean;
  skipInit?: boolean;
}
