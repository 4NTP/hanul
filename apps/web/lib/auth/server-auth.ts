import { cookies } from 'next/headers';

interface JWTPayload {
  iss: string;
  iat: number;
  exp: number;
  sub: string;
  email: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return null;
    }

    const payload = parseJWT(token);
    if (!payload) {
      return null;
    }

    // Check if token is expired
    if (payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}
