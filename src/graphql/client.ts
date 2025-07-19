import dotenv from 'dotenv';

dotenv.config();

// Define GraphQL response interface
interface GraphQLResponse<T = any> {
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

class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, options: { headers?: Record<string, string> } = {}) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  async request<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as GraphQLResponse<T>;
    
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query');
    }

    return result.data;
  }
}

const client = new GraphQLClient(process.env.GRAPHQL_ENDPOINT || '');

export default client;