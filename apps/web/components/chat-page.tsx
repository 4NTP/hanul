'use client';

import { Button } from '@hanul/ui/components/button';
import { Textarea } from '@hanul/ui/components/textarea';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { useToast } from '@hanul/ui/components/toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api/chat';
import type { Chat } from '@/lib/api/chat';
import { agentsAPI, type SubAgentDto } from '@/lib/api/agents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';
const DiffView = dynamic(() => import('./diff-view').then((m) => m.DiffView), {
  ssr: false,
});
const AgentPromptEditor = dynamic(() => import('./agent-prompt-editor'), {
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
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [expandedThink, setExpandedThink] = useState<Record<string, boolean>>(
    {},
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [inputScrollTop, setInputScrollTop] = useState(0);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const { push } = useToast();
  const prevAgentsRef = useRef<SubAgentDto[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/`);
    }
  }, [isAuthenticated, router]);

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: agentsAPI.list,
    enabled: !!user,
  });

  const selectedAgent: SubAgentDto | undefined = (agentsQuery.data || []).find(
    (a) => a.id === selectedAgentId,
  );

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
      a: ({ children, href }: { children: React.ReactNode; href?: string }) => {
        if (href && href.startsWith('mention:')) {
          const name = href.slice('mention:'.length);
          return (
            <span
              onClick={() => {
                setIsMentionOpen(true);
                setMentionQuery(name);
                setMentionIndex(0);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              className="inline-flex cursor-pointer items-center rounded-sm bg-sky-100 text-sky-800 px-1.5 py-0.5 hover:bg-sky-200"
              title={`@${name}`}
            >
              {children}
            </span>
          );
        }
        return (
          <a
            href={href}
            className="text-blue-500 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        );
      },
    } as const;
  }, [setIsMentionOpen, setMentionQuery]);

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

  const pushToast = useCallback(
    (title: string, description: string | undefined, onClick?: () => void) => {
      push({ title, description, onClick });
    },
    [push],
  );

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

  const renderPromptDiffs = useCallback(
    (agent: SubAgentDto) => {
      // Build versions: [old1, old2, ..., current]
      const versions: { id: string; text: string; createdAt: string }[] = [
        ...(agent.updateHistories || []).map((h) => ({
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
        return (
          <div className="text-xs text-muted-foreground">{t('noChanges')}</div>
        );
      }
      return <div className="space-y-2">{items.reverse()}</div>;
    },
    [t],
  );

  const transformMentions = useCallback(
    (text: string) => {
      const names = new Set(
        (agentsQuery.data || [])
          .map((a) => (a.name || '').toLowerCase())
          .filter((n) => n.length > 0),
      );
      let out = text;
      // Support @<name with spaces>
      out = out.replace(/@<([^>]+)>/g, (_m, raw: string) => {
        const name = String(raw || '').trim();
        if (!name) return _m;
        if (names.has(name.toLowerCase())) {
          return `[${'@' + name}](mention:${name})`;
        }
        return _m;
      });
      // Support @word (Unicode letters/numbers/_/-.), avoid already converted mention: links
      out = out.replace(/@([\p{L}\p{N}_\-.]+)/gu, (_m, raw: string) => {
        const name = String(raw || '');
        // underscores are treated as spaces when resolving to agent canonical name
        const canonical = name.replace(/_/g, ' ');
        if (names.has(canonical.toLowerCase())) {
          // Keep visual as typed (with underscores), link to canonical with spaces
          return `[${'@' + name}](mention:${canonical})`;
        }
        return '@' + name;
      });
      return out;
    },
    [agentsQuery.data],
  );

  const escapeHtml = useCallback(
    (s: string) =>
      s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;'),
    [],
  );

  const buildHighlightedInputHtml = useCallback(() => {
    const names = new Set(
      (agentsQuery.data || [])
        .map((a) => (a.name || '').toLowerCase())
        .filter((n) => n.length > 0),
    );
    const pattern = /@<([^>]+)>|@[\p{L}\p{N}_\-.]+/gu;
    const input = inputValue;
    let last = 0;
    let out = '';
    for (const m of input.matchAll(pattern)) {
      const idx = m.index ?? 0;
      if (idx > last) {
        out += escapeHtml(input.slice(last, idx));
      }
      const full = m[0];
      const raw = full.startsWith('@<') ? (m[1] || '').trim() : full.slice(1);
      const canonical = full.startsWith('@<') ? raw : raw.replace(/_/g, ' ');
      if (raw && names.has(canonical.toLowerCase())) {
        out += `<span class=\"inline-flex items-center rounded-sm bg-sky-100 text-sky-800 px-1 py-0.5\">@${escapeHtml(
          raw,
        )}</span>`;
      } else {
        out += escapeHtml(full);
      }
      last = idx + full.length;
    }
    if (last < input.length) out += escapeHtml(input.slice(last));
    // Ensure empty line to preserve height when input ends with newline
    return out.replace(/\n$/, '\n\u200b');
  }, [agentsQuery.data, escapeHtml, inputValue]);

  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const compute = () => {
      const cs = window.getComputedStyle(ta);
      setOverlayStyle({
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight as any,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
        paddingTop: parseFloat(cs.paddingTop) || undefined,
        paddingRight: parseFloat(cs.paddingRight) || undefined,
        paddingBottom: parseFloat(cs.paddingBottom) || undefined,
        paddingLeft: parseFloat(cs.paddingLeft) || undefined,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(ta);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [textareaRef]);

  const filteredMentions = useMemo(() => {
    const list = (agentsQuery.data || []).filter((a) => !a.deletedAt);
    if (!mentionQuery) return list;
    const q = mentionQuery.toLowerCase().replace(/_/g, ' ');
    return list.filter((a) => (a.name || '').toLowerCase().includes(q));
  }, [agentsQuery.data, mentionQuery]);

  const selectMentionByIndex = useCallback(
    (index: number) => {
      const list = filteredMentions;
      if (list.length === 0) return;
      const i = Math.max(0, Math.min(index, list.length - 1));
      const chosen = list[i]!;
      if (!textareaRef.current || mentionStart == null) return;
      const el = textareaRef.current;
      const before = inputValue.slice(0, mentionStart);
      const after = inputValue.slice(el.selectionStart ?? inputValue.length);
      const rawName = (chosen.name || 'unknown').trim();
      const safeName = rawName.replace(/\s+/g, '_');
      const insertion = `@${safeName} `;
      const nextVal = `${before}${insertion}${after}`;
      setInputValue(nextVal);
      setIsMentionOpen(false);
      setMentionQuery('');
      setMentionStart(null);
      setTimeout(() => {
        const pos = (before + insertion).length;
        el.setSelectionRange(pos, pos);
        el.focus();
      }, 0);
    },
    [filteredMentions, inputValue, mentionStart],
  );

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

        // Refresh Sub Agents and toast on changes
        try {
          const previous = (agentsQuery.data || []) as SubAgentDto[];
          prevAgentsRef.current = previous;
          const res = await agentsQuery.refetch();
          const current = (res.data || []) as SubAgentDto[];
          const prevMap = new Map(previous.map((a) => [a.id, a]));
          // Detect creations
          const created = current.filter((a) => !prevMap.has(a.id));
          // Detect prompt updates
          const updated = current.filter((a) => {
            const prev = prevMap.get(a.id);
            return prev && prev.prompt !== a.prompt;
          });
          if (created.length > 0 || updated.length > 0) {
            const mkName = (a: SubAgentDto) => a.name || t('untitled');
            created.forEach((a) =>
              pushToast(
                t('agentCreatedTitle'),
                t('agentCreated', { name: mkName(a) }),
                () => setSelectedAgentId(a.id),
              ),
            );
            updated.forEach((a) =>
              pushToast(
                t('agentUpdatedTitle'),
                t('agentUpdated', { name: mkName(a) }),
                () => setSelectedAgentId(a.id),
              ),
            );
          }
        } catch (_) {
          // ignore toast errors
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
      {/* Toaster provided globally in ClientProviders */}
      {/* Desktop sidebar */}
      <aside className="w-64 border-r overflow-y-auto p-3 hidden md:block">
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            {t('subAgents')}
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {(agentsQuery.data || []).length === 0 && (
              <div className="flex items-center justify-center h-24 rounded-md border text-xs text-muted-foreground">
                <span className="mr-2">🤖</span>
                {t('subAgentsEmpty')}
              </div>
            )}
            {(agentsQuery.data || []).map((agent) => (
              <div key={agent.id} className="relative">
                <button
                  onClick={() => setSelectedAgentId(agent.id)}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirm(t('confirmDelete'))) return;
                    agentsAPI
                      .delete(agent.id)
                      .then(() => agentsQuery.refetch());
                  }}
                  className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 z-10 inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-md text-base sm:text-sm text-muted-foreground hover:text-destructive hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={t('delete')}
                  aria-label={t('delete')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {chats.map((c) => {
            const isActive = c.id === chatId;
            const title = c.title || t('untitled');
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/chat/${c.id}`)}
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
              router.push(`/chat`);
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
                      ? 'bg-chart-4/15 dark:bg-chart-4/25 text-foreground'
                      : 'bg-chart-2/15 dark:bg-chart-2/25 text-foreground'
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
                      transformMentions(
                        message.text.replace(/^\[sub:[^\]]+\]\s*/, ''),
                      ),
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
                    {renderMessageText(
                      'stream',
                      transformMentions(currentResponse),
                    )}
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
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {(agentsQuery.data || []).length === 0 && (
                      <div className="flex items-center justify-center h-24 rounded-md border text-xs text-muted-foreground">
                        <span className="mr-2">🤖</span>
                        {t('subAgentsEmpty')}
                      </div>
                    )}
                    {(agentsQuery.data || []).map((agent) => (
                      <div key={agent.id} className="relative">
                        <button
                          onClick={() => setSelectedAgentId(agent.id)}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!confirm(t('confirmDelete'))) return;
                            agentsAPI
                              .delete(agent.id)
                              .then(() => agentsQuery.refetch());
                          }}
                          className="absolute right-1.5 top-1.5 z-10 inline-flex items-center justify-center w-10 h-10 rounded-md text-base text-muted-foreground hover:text-destructive hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title={t('delete')}
                          aria-label={t('delete')}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {chats.map((c) => {
                  const isActive = c.id === chatId;
                  const title = c.title || t('untitled');
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        router.push(`/chat/${c.id}`);
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

        {/* Right-side overlay for selected sub agent */}
        {selectedAgent && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedAgentId(null)}
            />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-background border-l shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="text-sm font-semibold truncate">
                  {selectedAgent.name || t('untitled')} — {t('details')}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAgentId(null)}
                  className="cursor-pointer"
                >
                  {t('close')}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold mb-1">
                    {t('prompt')}
                  </div>
                  <AgentPromptEditor
                    agentId={selectedAgent.id}
                    initialPrompt={selectedAgent.prompt}
                    onUpdated={() => agentsQuery.refetch()}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">
                    {t('history')}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {renderPromptDiffs(selectedAgent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t p-3 sm:p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <div
                className="hidden pointer-events-none absolute inset-0 whitespace-pre-wrap break-words text-sm text-transparent selection:bg-transparent"
                aria-hidden
              >
                <div
                  className="[&_*]:align-middle"
                  style={{
                    ...overlayStyle,
                    whiteSpace: 'pre-wrap',
                    marginTop: -inputScrollTop,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: buildHighlightedInputHtml(),
                  }}
                />
              </div>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('input.placeholder')}
                className="relative bg-transparent w-full max-h-48"
                rows={3}
                onKeyDown={(e) => {
                  // Mention navigation
                  if (isMentionOpen) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMentionIndex(
                        (i) => (i + 1) % Math.max(1, filteredMentions.length),
                      );
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setMentionIndex(
                        (i) =>
                          (i - 1 + Math.max(1, filteredMentions.length)) %
                          Math.max(1, filteredMentions.length),
                      );
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      selectMentionByIndex(mentionIndex);
                      return;
                    }
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      selectMentionByIndex(mentionIndex);
                      return;
                    }
                    if (e.key === 'Escape') {
                      setIsMentionOpen(false);
                    }
                  }
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onKeyUp={(e) => {
                  // Ignore nav/commit keys so Arrow/Enter/Tab don't reset selection
                  if (
                    isMentionOpen &&
                    (e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'Enter' ||
                      e.key === 'Tab')
                  ) {
                    return;
                  }
                  const el = e.currentTarget;
                  const caret = el.selectionStart ?? 0;
                  const val = el.value;
                  const atIdx = val.lastIndexOf('@', caret - 1);
                  if (atIdx >= 0) {
                    const afterAt = val[atIdx + 1];
                    const names = new Set(
                      (agentsQuery.data || [])
                        .map((a) => (a.name || '').toLowerCase())
                        .filter((n) => n.length > 0),
                    );
                    // Bracketed mention @<name with spaces>
                    if (afterAt === '<') {
                      const closeIdx = val.indexOf('>', atIdx + 2);
                      // Completed tag if '>' exists and caret is after it
                      if (closeIdx !== -1 && caret > closeIdx) {
                        setIsMentionOpen(false);
                        setMentionQuery('');
                        setMentionStart(null);
                        return;
                      }
                      // If caret is inside bracket, suggest by inner segment
                      const segment = val.slice(atIdx + 2, caret);
                      // Basic guard against invalid chars
                      if (/^[^<>@]{0,64}$/.test(segment)) {
                        // Do not open if exact match
                        if (
                          segment.length > 0 &&
                          names.has(segment.toLowerCase())
                        ) {
                          setIsMentionOpen(false);
                          setMentionQuery('');
                          setMentionStart(null);
                          return;
                        }
                        setIsMentionOpen(true);
                        setMentionStart(atIdx);
                        setMentionQuery(segment);
                        setMentionIndex((i) =>
                          segment !== mentionQuery ? 0 : i,
                        );
                        return;
                      }
                    } else {
                      // Simple mention @word
                      const segment = val.slice(atIdx + 1, caret);
                      if (/^[\p{L}\p{N}_\-.]{0,32}$/u.test(segment)) {
                        // Do not open if exact match
                        if (
                          segment.length > 0 &&
                          names.has(segment.toLowerCase())
                        ) {
                          setIsMentionOpen(false);
                          setMentionQuery('');
                          setMentionStart(null);
                          return;
                        }
                        setIsMentionOpen(true);
                        setMentionStart(atIdx);
                        setMentionQuery(segment);
                        setMentionIndex((i) =>
                          segment !== mentionQuery ? 0 : i,
                        );
                        return;
                      }
                    }
                  }
                  setIsMentionOpen(false);
                  setMentionQuery('');
                  setMentionStart(null);
                }}
                onScroll={(e) => setInputScrollTop(e.currentTarget.scrollTop)}
                onFocus={() => setTimeout(() => scrollToBottom(), 100)}
              />
            </div>
            {isMentionOpen && filteredMentions.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 sm:left-4 sm:right-auto z-50 w-auto sm:w-72 max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                {filteredMentions.map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                      idx === mentionIndex % filteredMentions.length
                        ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100'
                        : 'hover:bg-muted'
                    }`}
                    onMouseEnter={() => setMentionIndex(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectMentionByIndex(idx);
                    }}
                  >
                    <span className="truncate">@{a.name || t('untitled')}</span>
                    <span className="ml-2 text-xs text-muted-foreground truncate max-w-32">
                      {a.prompt.replace(/\s+/g, ' ').slice(0, 28)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Button onClick={sendMessage} disabled={isStreaming}>
              {isStreaming ? t('sending') : t('send')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
