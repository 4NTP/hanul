export const fetchTool = {
  type: 'function',
  name: 'fetch',
  description: 'Fetches data from a given URL using the Fetch API.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch data from.',
      },
      method: {
        type: 'string',
        description:
          'The HTTP method to use for the request (e.g., GET, POST).',
        default: 'GET',
      },
      headers: {
        type: 'object',
        description:
          'An object representing the headers to include in the request.',
        additionalProperties: {
          type: 'string',
        },
      },
      body: {
        type: 'string',
        description:
          'The body of the request, if applicable (e.g., for POST requests).',
      },
      timeout: {
        type: 'number',
        description:
          'The maximum time in milliseconds to wait for the request to complete.',
        default: 10000,
      },
    },
    required: ['url'],
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
