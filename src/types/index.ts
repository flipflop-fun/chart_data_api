export interface MintTokenEntity {
  timestamp: string;
  mintSizeEpoch: string;
  mintFee: string;
  currentEra: number;
  currentEpoch: number;
}

// export interface GraphQLResponse {
//   mintTokenEntities: MintTokenEntity[];
// }

export interface MintRecord {
  address: string;
  name?: string;
  symbol?: string;
  feeRate: number;
}

export interface TransactionRecord {
  id: number;
  mint_id: string; // Changed to string type
  timestamp: number;
  mint_size_epoch: number;
  mint_fee: number;
  price: number;
  current_era?: number;
  current_epoch?: number;
  // created_at: Date;
}

export interface OHLCRecord {
  id: number;
  mint_id: string; // Changed to string type
  period: string;
  timestamp: number;
  open_price: string;
  high_price: string;
  low_price: string;
  close_price: string;
  volume: string;
  trade_count: number;
  // created_at: Date;
  updated_at: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface OHLCQueryParams {
  period: '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
  from?: number;
  to?: number;
  limit?: number;
}

export interface TransactionQueryParams {
  from?: number;
  to?: number;
  limit?: number;
}

export type Period = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface PeriodConfig {
  [key: string]: number;
}

export interface PGMintTokenResponse {
  allMintTokenEntities: {
    nodes: Array<{
      timestamp: string;
      mintSizeEpoch: string;
      mintFee: string;
      currentEra: number;
      currentEpoch: number;
    }>;
  };
};

// Define GraphQL response interface
export interface InitializeTokenEventEntity {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  tokenId: string;
  feeRate: number;
}

export interface GraphQLMintListResponse {
  allInitializeTokenEventEntities: {
    nodes: InitializeTokenEventEntity[];
    totalCount?: number;
  };
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  timestamp: Date;
}

// Define GraphQL response interface
export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
  }>;
}
