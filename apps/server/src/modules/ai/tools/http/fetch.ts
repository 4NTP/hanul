export const fetchTool = {
  type: 'function' as const,
  function: {
    name: 'fetch',
    description:
      'Fetch content from a URL. After fetching, ALWAYS synthesize the result for the user (do not dump raw). If incomplete, chain with other tools or ask the user a clarifying question before finalizing.',
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
};

export async function fetchData({
  url,
  method = 'GET',
  headers = {},
  body,
  timeout = 10000,
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: headers ? { ...headers } : undefined,
      body: body && method !== 'GET' && method !== 'HEAD' ? body : undefined,
      signal: controller.signal,
    });

    clearTimeout(id);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseBody = await response.json();
    } else if (contentType?.includes('text/')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      ok: response.ok,
      url: response.url,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
