import client from '../graphql/client';
import { GET_MINT_BY_ADDRESS, GET_ALL_MINTS } from '../graphql/queries';
import { MintRecord } from '../types';

// Define GraphQL response interface
interface InitializeTokenEventEntity {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  tokenId: string;
}

interface GraphQLMintResponse {
  initializeTokenEventEntities: InitializeTokenEventEntity[];
}

export class Mint {
  static async findByAddress(address: string): Promise<MintRecord | undefined> {
    try {
      const response = await client.request<GraphQLMintResponse>(GET_MINT_BY_ADDRESS, { mint: address.trim() });
      if (response.initializeTokenEventEntities.length === 0) {
        return undefined;
      }

      const entity = response.initializeTokenEventEntities[0];
      
      return {
        address: entity.mint,
        name: entity.tokenName || undefined,
        symbol: entity.tokenSymbol || undefined,
      };
    } catch (error) {
      console.error('Error fetching mint by address:', error);
      return undefined;
    }
  }

  static async getAll(): Promise<MintRecord[]> {
    try {
      const response = await client.request<GraphQLMintResponse>(GET_ALL_MINTS);
      
      // Convert GraphQL response to MintRecord array
      return response.initializeTokenEventEntities.map(entity => ({
        address: entity.mint,
        name: entity.tokenName || undefined,
        symbol: entity.tokenSymbol || undefined,
      }));
    } catch (error) {
      console.error('Error fetching all mints:', error);
      return [];
    }
  }
}