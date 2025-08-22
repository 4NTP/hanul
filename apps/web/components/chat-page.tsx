'use client';

import { Button } from '@hanul/ui/components/button';
import { Input } from '@hanul/ui/components/input';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export function ChatPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const { user } = useAuth();

  // Load chat history mutation
  const loadChatHistoryMutation = useMutation({
    mutationFn: chatAPI.getChats,
    onSuccess: (chats) => {
      if (chatId) {
        const currentChat = chats.find((chat) => chat.id === chatId);
        if (currentChat) {
          const chatMessages: Message[] = currentChat.histories.map(
            (history, index) => ({
              id: history.id ? `${history.id}` : `${index}`,
              text: history.content,
              sender: history.role === 'user' ? 'user' : 'ai',
            }),
          );
          setMessages(chatMessages);
        }
      }
    },
  });

  // Load messages for current chat only on initial mount with chatId
  useEffect(() => {
    if (chatId && user && messages.length <= 1) {
      // Only load if no real messages exist
      loadChatHistoryMutation.mutate();
    }
  }, [chatId, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      if (chatId) {
        return chatAPI.continueChat(chatId, { prompt });
      } else {
        return chatAPI.createChat({ prompt });
      }
    },
    onSuccess: async (stream) => {
      setIsStreaming(true);
      setCurrentResponse('');

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let chatIdFromResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Split by lines to handle SSE format
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;

            // Handle SSE data format
            if (line.startsWith('data: ')) {
              const data = line.substring(6); // Remove 'data: ' prefix but keep spaces

              console.log('Raw data chunk:', JSON.stringify(data));

              // Check for chat ID in JSON format (for new chats)
              if (!chatId && data.includes('"id"')) {
                try {
                  const jsonData = JSON.parse(data.trim());
                  if (jsonData.id) {
                    chatIdFromResponse = jsonData.id;
                    continue; // Skip adding this to response
                  }
                } catch (e) {
                  // Not JSON, continue with text processing
                }
              }

              // Add actual content to response (including spaces)
              if (data && data.trim() !== '[DONE]' && !data.includes('"id"')) {
                fullResponse += data;
                setCurrentResponse(fullResponse);
              }
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      } finally {
        reader.releaseLock();
        setIsStreaming(false);

        // Add AI response to messages
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: fullResponse.trim(),
          sender: 'ai',
        };
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentResponse('');

        // Update URL without triggering refresh or data reload
        if (chatIdFromResponse && !chatId) {
          window.history.replaceState(
            null,
            '',
            `/${locale}/chat/${chatIdFromResponse}`,
          );
        }
      }
    },
  });

  const sendMessage = () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
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
                    alt="Hanul"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold mb-1">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-2">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted/60 border border-border px-2 py-1 rounded text-xs font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className={`${className} text-xs font-mono`}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-muted/80 border border-border p-4 rounded-lg overflow-x-auto text-xs font-mono mb-3 shadow-sm">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-blue-500 hover:text-blue-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Show streaming response */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="mr-3 flex-shrink-0">
                <Image
                  src="/symbol.svg"
                  alt="Hanul"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div className="max-w-[85%] sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-lg px-4 py-2 bg-muted">
                <div className="text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold mb-1">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-2">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted/60 border border-border px-2 py-1 rounded text-xs font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className={`${className} text-xs font-mono`}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-muted/80 border border-border p-4 rounded-lg overflow-x-auto text-xs font-mono mb-3 shadow-sm">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-blue-500 hover:text-blue-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {currentResponse}
                  </ReactMarkdown>
                  <span className="animate-pulse ml-1">▋</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isStreaming}>
            {isStreaming ? '전송 중...' : '전송'}
          </Button>
        </div>
      </div>
    </div>
  );
}
