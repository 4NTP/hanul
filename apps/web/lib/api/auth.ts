export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignInResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export const authAPI = {
  signIn: async (data: SignInRequest): Promise<SignInResponse> => {
    const response = await fetch(`${API_BASE_URL}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign in failed');
    }

    return response.json();
  },

  signOut: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/tokens/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign out failed');
    }
  },

  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sign up failed');
    }

    return response.json();
  },
};
