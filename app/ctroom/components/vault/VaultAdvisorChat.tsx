'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { VaultDataService } from '@/app/ctroom/services/vaultDataService';

const PRESETS = [
  { label: 'Am I on track this month?', prompt: 'Am I on track with my spending and savings this month? Be specific with numbers.' },
  { label: 'Pay off debt faster', prompt: 'Which debt should I attack first and how much faster would I be debt-free with an extra $200/month?' },
  { label: 'Where is my money going?', prompt: 'Break down where my money went this month and flag anything unusual.' },
  { label: 'Savings plan', prompt: 'Given my goals and cash flow, what is a realistic monthly savings plan?' },
];

export function VaultAdvisorChat() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    action: string;
    payload: Record<string, unknown>;
    message: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setAuthHeaders({ Authorization: `Bearer ${session.access_token}` });
      }
    });
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ctroom/vault/advisor',
        headers: () => authHeaders,
      }),
    [authHeaders],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: async ({ messages: finished }) => {
      const plain = finished.map(m => ({
        role: m.role,
        content: m.parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('') || '',
        timestamp: new Date().toISOString(),
      }));
      const title = plain.find(m => m.role === 'user')?.content.slice(0, 48) || 'Vault chat';
      const id = await VaultDataService.saveVaultChat(chatId, plain, title, 'gemini-2.0-flash');
      if (id) setChatId(id);

      const last = finished[finished.length - 1];
      const text = last?.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('') || '';
      const match = text.match(/"action"\s*:\s*"(\w+)"/);
      if (text.includes('"preview": true') || text.includes('preview":true')) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*"preview"\s*:\s*true[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.preview && parsed.action && parsed.payload) {
              setPendingConfirm({
                action: parsed.action,
                payload: parsed.payload,
                message: parsed.message || 'Confirm this change?',
              });
            }
          }
        } catch {
          /* ignore parse errors */
        }
      }
      if (match && !pendingConfirm) {
        /* tool previews surface via message text */
      }
    },
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sendMessage({ text });
      setInput('');
    },
    [isLoading, sendMessage],
  );

  const confirmAction = async () => {
    if (!pendingConfirm) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/ctroom/vault/advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ confirmAction: pendingConfirm }),
    });
    const result = await res.json();
    setPendingConfirm(null);
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: result.success ? 'Done — your data was updated.' : `Could not apply: ${result.error || 'unknown error'}` }],
      },
    ]);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '520px' }}>
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-vault-muted">AI Financial Advisor</p>
        <p className="text-xs text-vault-muted">Streaming · Tools · Gemini 2.0 Flash</p>
      </div>

      {messages.length === 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => submit(p.prompt)}
              className="p-3 rounded-xl text-left text-xs transition-all hover:bg-white/8 text-white/70 border border-white/8"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {pendingConfirm && (
        <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-100 mb-3">{pendingConfirm.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={confirmAction} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black">
              Confirm
            </button>
            <button type="button" onClick={() => setPendingConfirm(null)} className="px-3 py-1.5 rounded-lg text-xs text-white/60 border border-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: '380px' }}>
        {messages.map(msg => {
          const text = msg.parts
            ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map(p => p.text)
            .join('') || '';
          if (!text) return null;
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
                }`}
                style={{
                  background: msg.role === 'user' ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,255,255,0.08)',
                  color: msg.role === 'user' ? '#e5e5e5' : 'rgba(255,255,255,0.8)',
                }}
              >
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about debt, budgets, savings…"
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-transparent border border-white/10 placeholder-white/25"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
