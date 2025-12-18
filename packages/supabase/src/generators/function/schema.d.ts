export interface FunctionGeneratorSchema {
  name: string;
  project: string;
  verifyJwt?: boolean;
  template?: 'basic' | 'crud' | 'webhook';
  directory?: string;
}
