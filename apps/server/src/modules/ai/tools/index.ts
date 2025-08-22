// AI Tools Export
export { fetchTool } from './http/fetch';
export { webSearchTool } from './web/web-search';

// Tool definitions for AI function calling
export const availableTools = [
  // HTTP Tools
  {
    type: 'function' as const,
    function: {
      name: 'fetch',
      description:
        'Fetch content from a URL. Use this to get specific web pages or API responses.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch content from',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET',
            description: 'HTTP method to use',
          },
          headers: {
            type: 'object',
            description: 'Optional HTTP headers',
          },
          body: {
            type: 'string',
            description: 'Request body for POST/PUT requests',
          },
        },
        required: ['url'],
      },
    },
  },

  // Web Search Tools
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description:
        'Search the web for current information on any topic. Use this when you need up-to-date information or facts that might not be in your training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The search query. Be specific and use relevant keywords.',
          },
          num_results: {
            type: 'number',
            description:
              'Number of search results to return (default: 5, max: 10)',
            default: 5,
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['query'],
      },
    },
  },
];
