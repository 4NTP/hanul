import { cookies } from 'next/headers';

export async function isServerLoggedIn(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.get('isLoggedIn')?.value;
    return isLoggedIn === 'true';
  } catch (error) {
    return false;
  }
}
