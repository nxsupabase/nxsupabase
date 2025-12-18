export interface FunctionGeneratorSchema {
  name: string;
  project: string;
  verifyJwt?: boolean;
  template?: 'basic' | 'crud' | 'webhook' | 'x402';
  directory?: string;
  paymentAmount?: string;
  paymentNetwork?: 'base' | 'base-sepolia' | 'ethereum' | 'polygon';
}
