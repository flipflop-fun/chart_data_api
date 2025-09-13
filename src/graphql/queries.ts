// Get transaction data for a specific mint (for charts)
export const queryAllTokenMintForChart = `
  query QueryAllTokenMintForChart($mint: String!, $offset: Int!, $first: Int!) {
    allMintTokenEntities(
      condition: { mint: $mint }
      offset: $offset
      first: $first
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        timestamp
        mintSizeEpoch
        mintFee
        currentEra
        currentEpoch
      }
    }
  }
`;

// Get transaction data for a specific mint (general query)
export const GET_MINT_TRANSACTIONS = `
  query GetMintTransactions($mintAddress: String!, $limit: Int, $offset: Int) {
    allMintTokenEntities(
      condition: { mint: $mintAddress }
      offset: $offset
      first: $limit
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        timestamp
        mintSizeEpoch
        mintFee
        currentEra
        currentEpoch
      }
      totalCount
    }
  }
`;

// Find a single mint by address
export const GET_MINT_BY_ADDRESS = `
  query GetMintByAddress($mint: String!) {
    allInitializeTokenEventEntities(
      condition: { mint: $mint }
      first: 1
    ) {
      nodes {
        mint
        tokenName
        tokenSymbol
        tokenId
        feeRate
      }
    }
  }
`;

// Get all mint information
export const GET_ALL_MINTS = `
  query GetAllMints {
    allInitializeTokenEventEntities {
      nodes {
        mint
        tokenName
        tokenSymbol
        tokenId
      }
      totalCount
    }
  }
`;