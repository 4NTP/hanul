'use client';

import { Button } from '@hanul/ui/components/button';
import { Input } from '@hanul/ui/components/input';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from 'next-intl';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface ChatPageProps {
  user: User;
}

export function ChatPage({ user }: ChatPageProps) {
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! AI 채팅에 오신 것을 환영합니다.',
      sender: 'ai',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);

    // 임시 AI 응답
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `"${inputValue}"에 대한 AI 응답입니다. 이것은 임시 구현입니다.`,
        sender: 'ai',
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);

    setInputValue('');
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'ai' && (
                <div className="mr-3 flex-shrink-0">
                  <Image
                    src="/symbol.svg"
                    alt="AI"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
              )}
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage}>전송</Button>
        </div>
      </div>
    </div>
  );
}
