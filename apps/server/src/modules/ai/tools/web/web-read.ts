export const webReadTool = {
  type: 'function' as const,
  function: {
    name: 'web_read',
    description:
      'Extract and analyze detailed content from specific web pages, particularly effective for in-depth content like blog posts, articles, documentation, and detailed web pages. This tool performs comprehensive content analysis and extraction, not just simple HTML fetching. Best used for: blog articles, news articles, documentation pages, product pages, and other content-rich pages. Not suitable for: homepages like google.com, search result pages, or pages with minimal text content. If this tool fails to read a URL, retry with the fetch tool as a fallback option.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description:
            'The specific URL to analyze and extract content from (e.g., https://example.com/blog/detailed-article)',
        },
      },
      required: ['url'],
    },
  },
};

export const executeWebRead = async (
  surfApiUrl: string,
  { url }: { url: string },
): Promise<string | null> => {
  try {
    const response = await fetch(`${surfApiUrl}/read/${encodeURI(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Web read response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('Error fetching URL:', url);
    return null;
    // throw new Error(`Error fetching URL`);
  }
};
