// 获取指定 mint 的交易数据（用于图表）
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

// 获取指定 mint 的交易数据（通用查询）
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

// 根据地址查找单个 mint 信息
export const GET_MINT_BY_ADDRESS = `
  query GetMintByAddress($mint: String!) {
    initializeTokenEventEntities(where: {mint: $mint}) {
      mint
      tokenName
      tokenSymbol
      tokenId
    }
  }
`;

// 获取所有 mint 信息
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