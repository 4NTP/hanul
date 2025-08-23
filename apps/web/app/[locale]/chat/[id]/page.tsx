import { ChatPage } from '@/components/chat-page';

export default function ChatWithId({ params }: { params: { id: string } }) {
  const chatId = params.id;

  return <ChatPage chatId={chatId} />;
}
