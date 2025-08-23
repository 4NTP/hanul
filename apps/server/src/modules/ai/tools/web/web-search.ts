export const webSearchTool = {
  type: 'function' as const,
  function: {
    name: 'web_search',
    description:
      'Search the web for current information on any topic. Always follow up by selecting 2-3 promising URLs and invoking web_read to extract content (fallback to fetch if needed). Then synthesize a direct, helpful answer. Do NOT output raw tool results or a bare list of links; integrate findings into your response and include inline citations to the used URLs.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The search query. Be specific and use relevant keywords to find the most relevant sources for further analysis.',
        },
        num_results: {
          type: 'number',
          description:
            'Number of search results to return (default: 5, max: 10). Consider requesting more results if you plan to analyze multiple sources with web_read.',
          default: 5,
          minimum: 1,
          maximum: 10,
        },
      },
      required: ['query'],
    },
  },
};

interface WebSearchResult {
  result: { title: string; url: string; snippet: string }[];
}

interface SurfSearchResponse {
  query: string;
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
  provider: string;
}

export const executeWebSearch = async (
  surfApiUrl: string,
  {
    query,
    num_results = 5,
  }: {
    query: string;
    num_results?: number;
  },
): Promise<WebSearchResult> => {
  try {
    const response = await fetch(`${surfApiUrl}/search?q=${encodeURI(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `SURF API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: SurfSearchResponse = await response.json();
    const results: WebSearchResult = {
      result: data.results.slice(0, num_results).map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet.substring(0, 200) + '...',
      })),
    };
    return results;
  } catch (error) {
    console.error('Web search error:', error);
    throw new Error('Failed to perform web search');
  }
};

export const formatSearchResults = async (
  results: WebSearchResult,
): Promise<string> => {
  if (!results.result || results.result.length === 0) {
    return 'No search results found.';
  }

  return results.result
    .map((result, index) => {
      return `${index + 1}. **${result.title}**
   URL: ${result.url}
   ${result.snippet}`;
    })
    .join('\n\n');
};
