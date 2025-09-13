import client from '../graphql/client';
import { GET_MINT_BY_ADDRESS, GET_ALL_MINTS } from '../graphql/queries';
import { GraphQLMintListResponse, MintRecord } from '../types';

export class Mint {
  static async findByAddress(address: string): Promise<MintRecord | undefined> {
    try {
      const response = await client.request<GraphQLMintListResponse>(GET_MINT_BY_ADDRESS, { mint: address.trim() });
      const nodes = response.allInitializeTokenEventEntities?.nodes ?? [];
      if (nodes.length === 0) {
        return undefined;
      }

      const entity = nodes[0];
      
      return {
        address: entity.mint,
        name: entity.tokenName || undefined,
        symbol: entity.tokenSymbol || undefined,
        feeRate: entity.feeRate || 0,
      };
    } catch (error) {
      console.error('Error fetching mint by address:', error);
      return undefined;
    }
  }

  static async getAll(): Promise<MintRecord[]> {
    try {
      const response = await client.request<GraphQLMintListResponse>(GET_ALL_MINTS);
      const nodes = response.allInitializeTokenEventEntities?.nodes ?? [];
      // Convert GraphQL response to MintRecord array
      return nodes.map(entity => ({
        address: entity.mint,
        name: entity.tokenName || undefined,
        symbol: entity.tokenSymbol || undefined,
        feeRate: entity.feeRate || 0,
      }));
    } catch (error) {
      console.error('Error fetching all mints:', error);
      return [];
    }
  }
}