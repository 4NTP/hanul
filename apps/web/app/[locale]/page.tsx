import { getServerUser } from '@/lib/auth/server-auth';
import { LandingPage } from '@/components/landing-page';
import { ChatPage } from '@/components/chat-page';

export default async function HomePage() {
  const user = await getServerUser();

  return user ? <ChatPage user={user} /> : <LandingPage />;
}
