'use client';

import { Button } from '@hanul/ui/components/button';
import { Textarea } from '@hanul/ui/components/textarea';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api/chat';
import type { Chat } from '@/lib/api/chat';
import { agentsAPI, type SubAgentDto } from '@/lib/api/agents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import dynamic from 'next/dynamic';
const DiffView = dynamic(() => import('./diff-view').then((m) => m.DiffView), {
  ssr: false,
});

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
  const [expandedThink, setExpandedThink] = useState<Record<string, boolean>>(
    {},
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: agentsAPI.list,
    enabled: !!user,
  });

  const markdownComponents = useMemo(() => {
    return {
      p: ({ children }: { children: React.ReactNode }) => (
        <p className="mb-2 last:mb-0">{children}</p>
      ),
      h1: ({ children }: { children: React.ReactNode }) => (
        <h1 className="text-lg font-bold mb-2">{children}</h1>
      ),
      h2: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-base font-bold mb-2">{children}</h2>
      ),
      h3: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-sm font-bold mb-1">{children}</h3>
      ),
      ul: ({ children }: { children: React.ReactNode }) => (
        <ul className="list-disc pl-4 mb-2">{children}</ul>
      ),
      ol: ({ children }: { children: React.ReactNode }) => (
        <ol className="list-decimal pl-4 mb-2">{children}</ol>
      ),
      li: ({ children }: { children: React.ReactNode }) => (
        <li className="mb-1">{children}</li>
      ),
      blockquote: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-muted-foreground pl-4 italic mb-2">
          {children}
        </blockquote>
      ),
      code: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => {
        const isInline = !className;
        return isInline ? (
          <code className="bg-muted/60 border border-border px-2 py-1 rounded text-xs font-mono">
            {children}
          </code>
        ) : (
          <code className={`${className} text-xs font-mono`}>{children}</code>
        );
      },
      pre: ({ children }: { children: React.ReactNode }) => (
        <pre className="bg-muted/80 border border-border p-4 rounded-lg overflow-x-auto text-xs font-mono mb-3 shadow-sm">
          {children}
        </pre>
      ),
      strong: ({ children }: { children: React.ReactNode }) => (
        <strong className="font-bold">{children}</strong>
      ),
      em: ({ children }: { children: React.ReactNode }) => (
        <em className="italic">{children}</em>
      ),
      a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
        <a
          href={href}
          className="text-blue-500 hover:text-blue-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    } as const;
  }, []);

  const parseThinkSegments = useCallback((text: string) => {
    const segments: { type: 'think' | 'text'; content: string }[] = [];
    const openTag = '<thinking>';
    const closeTag = '</thinking>';
    let cursor = 0;
    while (cursor < text.length) {
      const openIdx = text.indexOf(openTag, cursor);
      if (openIdx === -1) {
        segments.push({ type: 'text', content: text.slice(cursor) });
        break;
      }
      if (openIdx > cursor) {
        segments.push({ type: 'text', content: text.slice(cursor, openIdx) });
      }
      const closeIdx = text.indexOf(closeTag, openIdx + openTag.length);
      if (closeIdx === -1) {
        // No closing tag; treat rest as think
        segments.push({
          type: 'think',
          content: text.slice(openIdx + openTag.length),
        });
        break;
      }
      segments.push({
        type: 'think',
        content: text.slice(openIdx + openTag.length, closeIdx),
      });
      cursor = closeIdx + closeTag.length;
    }
    return segments;
  }, []);

  const renderMessageText = useCallback(
    (keyPrefix: string, text: string) => {
      const segments = parseThinkSegments(text);
      return (
        <>
          {segments.map((seg, idx) =>
            seg.type === 'think' ? (
              <div
                key={`think-${keyPrefix}-${idx}`}
                className="mb-2 rounded-md border border-amber-300 bg-amber-50"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedThink((prev) => ({
                      ...prev,
                      [`${keyPrefix}-${idx}`]: !prev[`${keyPrefix}-${idx}`],
                    }))
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    {t('think')}
                  </span>
                  <span className="text-amber-700 text-xs">
                    {expandedThink[`${keyPrefix}-${idx}`] ? '▼' : '▶'}
                  </span>
                </button>
                {expandedThink[`${keyPrefix}-${idx}`] ? (
                  <div className="px-3 pb-3">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents as any}
                    >
                      {seg.content}
                    </ReactMarkdown>
                  </div>
                ) : null}
              </div>
            ) : (
              <ReactMarkdown
                key={`text-${keyPrefix}-${idx}`}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents as any}
              >
                {seg.content}
              </ReactMarkdown>
            ),
          )}
        </>
      );
    },
    [markdownComponents, parseThinkSegments, t, expandedThink],
  );

  const renderPromptDiffs = useCallback((agent: SubAgentDto) => {
    // Build versions: [old1, old2, ..., current]
    const versions: { id: string; text: string; createdAt: string }[] = [
      ...agent.histories.map((h) => ({
        id: h.id,
        text: h.oldPrompt,
        createdAt: h.createdAt,
      })),
      {
        id: 'current',
        text: agent.prompt,
        createdAt: new Date(agent.updatedAt || agent.createdAt).toISOString(),
      },
    ];
    const items: React.ReactNode[] = [];
    for (let i = 1; i < versions.length; i++) {
      const prev = versions[i - 1]!;
      const curr = versions[i]!;
      items.push(
        <div key={`${agent.id}-diff-${i}`} className="rounded border p-2">
          <div className="text-[10px] text-muted-foreground mb-1">
            v{i} → v{i + 1} ({new Date(curr.createdAt).toLocaleString()})
          </div>
          <DiffView oldText={prev.text} newText={curr.text} />
        </div>,
      );
    }
    if (items.length === 0) {
      return <div className="text-xs text-muted-foreground">No changes</div>;
    }
    return <div className="space-y-2">{items}</div>;
  }, []);

  const mergeConsecutiveAI = useCallback((list: Message[]): Message[] => {
    const merged: Message[] = [];
    const SUB_PREFIX_RE = /^\[sub:[^\]]+\]\s*/;
    for (const msg of list) {
      if (
        merged.length > 0 &&
        merged[merged.length - 1]?.sender === 'ai' &&
        msg.sender === 'ai'
      ) {
        const prev = merged[merged.length - 1]!;
        const cleaned = msg.text.replace(SUB_PREFIX_RE, '').trim();
        const combined = cleaned ? `${prev.text}\n\n${cleaned}` : prev.text;
        merged[merged.length - 1] = {
          id: prev.id,
          sender: 'ai',
          text: combined,
        };
      } else {
        merged.push({ id: msg.id, sender: msg.sender, text: msg.text });
      }
    }
    return merged;
  }, []);

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
      const chatMessages: Message[] = (histories || [])
        .filter((h) => h.role !== 'tool')
        .map((history, index) => ({
          id: history.id ? `${history.id}` : `${index}`,
          text:
            history.role === 'assistant' && history.name
              ? `[sub:${history.name}] ${history.content}`
              : history.content,
          sender: history.role === 'user' ? 'user' : 'ai',
        }));
      setMessages(mergeConsecutiveAI(chatMessages));
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

            if (data.trim() !== '{{DONE}}' && !data.includes('"id"')) {
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
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1]?.sender === 'ai') {
            const last = prev[prev.length - 1]!;
            const combined = last.text
              ? `${last.text}\n\n${aiMessage.text}`
              : aiMessage.text;
            const updated: Message = {
              id: last.id,
              sender: 'ai',
              text: combined,
            };
            return [...prev.slice(0, -1), updated];
          }
          return [...prev, aiMessage];
        });
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
        const detailId = chatIdFromResponse || chatId;
        if (detailId) {
          loadChatDetailMutation.mutate(detailId);
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
    <div className="flex h-[calc(100svh-3.5rem)]">
      {/* Desktop sidebar */}
      <aside className="w-64 border-r overflow-y-auto p-3 hidden md:block">
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            {t('subAgents')}
          </div>
          <div className="space-y-1">
            {(agentsQuery.data || []).map((agent) => (
              <button
                key={agent.id}
                onClick={() =>
                  setSelectedAgentId((prev) =>
                    prev === agent.id ? null : agent.id,
                  )
                }
                className={`w-full text-left rounded-md px-3 py-2 transition-colors ${selectedAgentId === agent.id ? 'bg-accent' : 'hover:bg-muted'}`}
              >
                <div className="text-sm font-medium truncate">
                  {agent.name || t('untitled')}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {agent.prompt.replace(/\s+/g, ' ').slice(0, 80)}
                  {agent.prompt.length > 80 ? '…' : ''}
                </div>
              </button>
            ))}
          </div>
          {selectedAgentId && (
            <div className="mt-3 rounded border p-2">
              {(() => {
                const agent = (agentsQuery.data || []).find(
                  (a) => a.id === selectedAgentId,
                );
                if (!agent) return null;
                return (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold">{t('prompt')}</div>
                    <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap bg-muted/50 rounded p-2">
                      {agent.prompt}
                    </pre>
                    <div className="text-xs font-semibold">{t('history')}</div>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {renderPromptDiffs(agent)}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between p-2 border-b">
          {/* Mobile: open chat list */}
          <Button
            className="md:hidden"
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(true)}
            title={t('newChat')}
          >
            ☰
          </Button>
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
          className="flex-1 overflow-y-auto p-4 pb-28 sm:pb-4"
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
                  <div className="text-xs text-muted-foreground/80 mb-1">
                    {/* SubAgent label if present in history.name — we inject it into text prefix as [sub:...] */}
                    {(() => {
                      const match = message.text.match(/^\[sub:([^\]]+)\]\s*/);
                      if (match) {
                        return (
                          <span className="inline-block rounded bg-amber-100 text-amber-800 px-2 py-0.5 mr-1 align-middle">
                            {match[1]}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="text-sm">
                    {renderMessageText(
                      message.id,
                      message.text.replace(/^\[sub:[^\]]+\]\s*/, ''),
                    )}
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
                    {renderMessageText('stream', currentResponse)}
                    <span className="animate-pulse">▋</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-4/5 max-w-[320px] bg-background border-r shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="text-sm font-medium">{t('subAgents')}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="mb-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    {t('subAgents')}
                  </div>
                  <div className="space-y-1">
                    {(agentsQuery.data || []).map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() =>
                          setSelectedAgentId((prev) =>
                            prev === agent.id ? null : agent.id,
                          )
                        }
                        className={`w-full text-left rounded-md px-3 py-2 transition-colors ${selectedAgentId === agent.id ? 'bg-accent' : 'hover:bg-muted'}`}
                      >
                        <div className="text-sm font-medium truncate">
                          {agent.name || t('untitled')}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {agent.prompt.replace(/\s+/g, ' ').slice(0, 80)}
                          {agent.prompt.length > 80 ? '…' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedAgentId &&
                    (() => {
                      const agent = (agentsQuery.data || []).find(
                        (a) => a.id === selectedAgentId,
                      );
                      if (!agent) return null;
                      return (
                        <div className="mt-3 rounded border p-2">
                          <div className="text-xs font-semibold">
                            {t('prompt')}
                          </div>
                          <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap bg-muted/50 rounded p-2">
                            {agent.prompt}
                          </pre>
                          <div className="text-xs font-semibold mt-2">
                            {t('history')}
                          </div>
                          <div className="space-y-2 max-h-40 overflow-auto">
                            {renderPromptDiffs(agent)}
                          </div>
                        </div>
                      );
                    })()}
                </div>
                {chats.map((c) => {
                  const isActive = c.id === chatId;
                  const title = c.title || t('untitled');
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        router.push(`/${locale}/chat/${c.id}`);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full text-left rounded-md px-3 py-2 transition-colors ${
                        isActive ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium truncate">
                        {title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="border-t p-3 sm:p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex gap-2 items-end">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('input.placeholder')}
              className="flex-1 max-h-48"
              rows={3}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onFocus={() => setTimeout(() => scrollToBottom(), 100)}
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
