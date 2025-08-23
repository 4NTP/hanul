import { ChatPage } from '@/components/chat-page';

export default async function ChatWithId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatPage chatId={id} />;
}
