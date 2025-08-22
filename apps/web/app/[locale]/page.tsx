import { isServerLoggedIn } from '@/lib/auth/server-auth';
import { LandingPage } from '@/components/landing-page';
import { ChatPage } from '@/components/chat-page';

export default async function HomePage() {
  const isLoggedIn = await isServerLoggedIn();

  return isLoggedIn ? <ChatPage /> : <LandingPage />;
}
