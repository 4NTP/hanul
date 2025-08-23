export interface CreateChatRequest {
  prompt: string;
}

export interface ContinueChatRequest {
  prompt: string;
}

export interface CreateChatResponse {
  id: string;
}

export interface ChatHistory {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface Chat {
  id: string;
  title?: string;
  authorId: string;
  histories?: ChatHistory[];
}

export interface GetChatsResponse {
  success: boolean;
  message: string;
  data: Chat[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const chatAPI = {
  createChat: async (data: CreateChatRequest): Promise<ReadableStream> => {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create chat');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  },

  continueChat: async (
    chatId: string,
    data: ContinueChatRequest,
  ): Promise<ReadableStream> => {
    const response = await fetch(`${API_BASE_URL}/ai/chat/${chatId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to continue chat');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  },

  getChats: async (): Promise<Chat[]> => {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get chats');
    }

    const result = await response.json();
    return result.data || result;
  },

  getChatById: async (chatId: string): Promise<ChatHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/ai/chat/${chatId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get chat detail');
    }

    const result = await response.json();
    return result.data || result;
  },
};
