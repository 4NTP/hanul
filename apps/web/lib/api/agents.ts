export interface SubAgentHistory {
  id: string;
  oldPrompt: string;
  createdAt: string;
}

export interface SubAgentDto {
  id: string;
  name?: string | null;
  prompt: string;
  chatId: string;
  createdAt: string;
  updatedAt: string;
  histories: SubAgentHistory[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  } as Record<string, string>;
};

export const agentsAPI = {
  list: async (): Promise<SubAgentDto[]> => {
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get agents');
    }
    const result = await response.json();
    return result.data || result;
  },
};
