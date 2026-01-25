/**
 * Mock utilities for testing
 */

export class MockHTTPClient {
  private responses: Map<string, any> = new Map();
  private calls: Array<{ method: string; url: string; body?: any }> = [];

  mockResponse(url: string, response: any) {
    this.responses.set(url, response);
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    this.calls.push({
      method: options?.method || "GET",
      url,
      body: options?.body,
    });

    const mockData = this.responses.get(url);
    if (!mockData) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  getCalls() {
    return this.calls;
  }

  reset() {
    this.responses.clear();
    this.calls = [];
  }
}

export const createMockFocalboardAPI = () => {
  const client = new MockHTTPClient();
  const baseURL = "http://localhost:8000";

  return {
    client,
    baseURL,
    
    mockGetBoards: (boards: any[]) => {
      client.mockResponse(`${baseURL}/api/v2/teams/test-team/boards`, boards);
    },

    mockGetBoard: (boardId: string, board: any) => {
      client.mockResponse(`${baseURL}/api/v2/boards/${boardId}`, board);
    },

    mockCreateBoard: (board: any) => {
      client.mockResponse(`${baseURL}/api/v2/boards`, board);
    },

    mockGetBlocks: (boardId: string, blocks: any[]) => {
      client.mockResponse(`${baseURL}/api/v2/boards/${boardId}/blocks`, blocks);
    },

    mockGetBlock: (boardId: string, blockId: string, block: any) => {
      client.mockResponse(
        `${baseURL}/api/v2/boards/${boardId}/blocks/${blockId}`,
        block
      );
    },

    mockCreateBlock: (boardId: string, block: any) => {
      client.mockResponse(`${baseURL}/api/v2/boards/${boardId}/blocks`, block);
    },

    mockSearch: (query: string, results: any[]) => {
      client.mockResponse(
        `${baseURL}/api/v2/teams/test-team/boards/search?q=${encodeURIComponent(query)}`,
        results
      );
    },
  };
};
