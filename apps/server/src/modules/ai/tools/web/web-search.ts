import { ConfigService } from '@nestjs/config';
import { Env } from '@/modules/config/env.schema';

export const webSearchTool = {
  name: 'web_search',
  description:
    'Search the web for current information on any topic. Use this when you need up-to-date information or facts that might not be in your training data.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query. Be specific and use relevant keywords.',
      },
      num_results: {
        type: 'number',
        description: 'Number of search results to return (default: 5, max: 10)',
        default: 5,
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['query'],
  },
};

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SurfSearchResponse {
  query: string;
  results: {
    title: string;
    url: string;
    content: string;
  }[];
  total_results: number;
  search_engine: string;
}

export const executeWebSearch = async (
  surfApiUrl: string,
  query: string,
  numResults: number = 5,
): Promise<WebSearchResult[]> => {
  try {
    const response = await fetch(`${surfApiUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: Math.min(numResults, 10),
        search_engine: 'duckduckgo',
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `SURF API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: SurfSearchResponse = await response.json();

    return data.results.slice(0, numResults).map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content.substring(0, 200) + '...',
    }));
  } catch (error) {
    console.error('Web search error:', error);
    throw new Error('Failed to perform web search');
  }
};

export const formatSearchResults = async (
  results: WebSearchResult[],
): Promise<string> => {
  if (results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map((result, index) => {
      return `${index + 1}. **${result.title}**
   URL: ${result.url}
   ${result.snippet}`;
    })
    .join('\n\n');
};
