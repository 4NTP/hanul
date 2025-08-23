'use client';

import { Button } from '@hanul/ui/components/button';
import { Input } from '@hanul/ui/components/input';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api/chat';
import type { Chat } from '@/lib/api/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export function ChatPage({ chatId: bChatId }: { chatId?: string }) {
  const locale = useLocale();
  const t = useTranslations('chat');
  const router = useRouter();
  const [chatId, setChatId] = useState<string | undefined>(bChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  // Load chat history mutation
  const loadChatListMutation = useMutation({
    mutationFn: chatAPI.getChats,
    onSuccess: (chats) => {
      setChats(chats);
    },
  });

  const loadChatDetailMutation = useMutation({
    mutationFn: chatAPI.getChatById,
    onSuccess: (histories) => {
      const chatMessages: Message[] = (histories || []).map(
        (history, index) => ({
          id: history.id ? `${history.id}` : `${index}`,
          text: history.content,
          sender: history.role === 'user' ? 'user' : 'ai',
        }),
      );
      setMessages(chatMessages);
    },
  });

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldAutoScroll]);

  // Handle scroll event to detect user manual scrolling
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Enable auto-scroll if user scrolls near bottom, disable if they scroll up
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Load chat list
  useEffect(() => {
    if (user) {
      loadChatListMutation.mutate();
    }
  }, [chatId, user]);

  // Load chat detail for current chat id
  useEffect(() => {
    if (user && chatId) {
      loadChatDetailMutation.mutate(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      if (typeof chatId === 'string' && chatId.length > 0) {
        return chatAPI.continueChat(chatId, { prompt });
      }
      return chatAPI.createChat({ prompt });
    },
    onSuccess: async (stream) => {
      setIsStreaming(true);
      setCurrentResponse('');

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let chatIdFromResponse = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events separated by blank lines (\n\n or \r\n\r\n)
          const events = buffer.split(/\r?\n\r?\n/);
          // Keep the last partial event (if any) in the buffer
          buffer = events.pop() || '';

          for (const event of events) {
            if (!event) continue;

            const lines = event.split(/\r?\n/);
            const dataLines: string[] = [];

            for (const line of lines) {
              const match = line.match(/^data:\s?(.*)$/);
              if (match) {
                dataLines.push(match[1] ?? '');
              }
            }

            const data = dataLines.join('\n');
            if (!data) continue;

            // Handle chat ID (first event for new chats)
            if (!chatId && data.includes('"id"')) {
              try {
                const jsonData = JSON.parse(data.trim());
                if (jsonData.id) {
                  chatIdFromResponse = jsonData.id;
                  continue;
                }
              } catch (_) {
                // Not JSON; fall through to treat as content
              }
            }

            if (data.trim() !== '[DONE]' && !data.includes('"id"')) {
              fullResponse += data;
              setCurrentResponse(fullResponse);
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

        // Auto-scroll to bottom after AI response
        setTimeout(() => scrollToBottom(), 100);

        // Update URL without triggering refresh or data reload
        if (chatIdFromResponse && !chatId) {
          setChatId(chatIdFromResponse);
          window.history.replaceState(
            null,
            '',
            `/${locale}/chat/${chatIdFromResponse}`,
          );
        }
        loadChatListMutation.mutate();
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

    // Auto-scroll to bottom after user message
    setTimeout(() => scrollToBottom(), 100);
  };

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [currentResponse, isStreaming, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-64 border-r overflow-y-auto p-3 hidden md:block">
        <div className="space-y-1">
          {chats.map((c) => {
            const isActive = c.id === chatId;
            const title = c.title || t('untitled');
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/${locale}/chat/${c.id}`)}
                className={`w-full text-left rounded-md px-3 py-2 transition-colors ${
                  isActive ? 'bg-accent' : 'hover:bg-muted'
                }`}
              >
                <div className="text-sm font-medium truncate">{title}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        <div className="flex items-center justify-end p-2 border-b">
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/${locale}/chat`);
              setChatId(undefined);
              setMessages([]);
            }}
            title={t('newChat')}
          >
            +
          </Button>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4"
          onScroll={handleScroll}
        >
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
                          <h2 className="text-base font-bold mb-2">
                            {children}
                          </h2>
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
                          <h2 className="text-base font-bold mb-2">
                            {children}
                          </h2>
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
                    <span className="animate-pulse">▋</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('input.placeholder')}
              onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isStreaming}>
              {isStreaming ? t('sending') : t('send')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
