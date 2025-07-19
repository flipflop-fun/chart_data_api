// Get transaction data for a specific mint (for charts)
export const queryAllTokenMintForChart = `
  query QueryAllTokenMintForChart($mint: String!, $skip: Int!, $first: Int!) {
    mintTokenEntities(
      where: { mint: $mint }
      skip: $skip
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      timestamp
      mintSizeEpoch
      mintFee
      currentEra
      currentEpoch
    }
  }
`;

// Get transaction data for a specific mint (general query)
export const GET_MINT_TRANSACTIONS = `
  query GetMintTransactions($mintAddress: String!, $limit: Int, $offset: Int) {
    mintTokenEntities(
      where: { mint: $mintAddress }
      skip: $offset
      first: $limit
      orderBy: timestamp
      orderDirection: desc
    ) {
      timestamp
      mintSizeEpoch
      mintFee
      currentEra
      currentEpoch
    }
  }
`;

// Find a single mint by address
export const GET_MINT_BY_ADDRESS = `
  query GetMintByAddress($mint: String!) {
    initializeTokenEventEntities(where: {mint: $mint}) {
      mint
      tokenName
      tokenSymbol
      tokenId
      feeRate
    }
  }
`;

// Get all mint information
export const GET_ALL_MINTS = `
  query GetAllMints {
    initializeTokenEventEntities {
      mint
      tokenName
      tokenSymbol
      tokenId
    }
  }
`;