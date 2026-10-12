'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Brain, Mic, History, Save, Plus, Trash2, Loader2, Check } from 'lucide-react';

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

// ─── Soul editor ─────────────────────────────────────────────────────────────

function SoulSection() {
  const [soul, setSoul] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/ctroom/milo/soul', { headers: await authHeaders() });
      const data = await res.json();
      setSoul(data.soul || '');
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/ctroom/milo/soul', {
      method: 'PUT',
      headers: await authHeaders(),
      body: JSON.stringify({ soul }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium flex items-center gap-2"><Brain size={16} /> Soul</h3>
        <p className="text-sm text-muted-foreground">Who Milo is. His personality, tone, loyalties. He reads this before every reply.</p>
      </div>
      {loading ? <Loader2 className="animate-spin" size={18} /> : (
        <>
          <textarea
            value={soul}
            onChange={e => setSoul(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm font-mono"
            placeholder="You are Milo..."
          />
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Saved' : 'Save soul'}
          </button>
        </>
      )}
    </section>
  );
}

// ─── Memories ────────────────────────────────────────────────────────────────

function MemoriesSection() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fact, setFact] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch('/api/ctroom/milo/memories', { headers: await authHeaders() });
    const data = await res.json();
    setMemories(data.memories || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!fact.trim()) return;
    setAdding(true);
    await fetch('/api/ctroom/milo/memories', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ fact }),
    });
    setFact('');
    setAdding(false);
    load();
  };

  const forget = async (id: string) => {
    await fetch(`/api/ctroom/milo/memories?id=${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    load();
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium">Memories</h3>
        <p className="text-sm text-muted-foreground">Things Milo never forgets. He recalls these in every conversation.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={fact}
          onChange={e => setFact(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Milo should remember that..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button onClick={add} disabled={adding || !fact.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50">
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Remember
        </button>
      </div>
      {loading ? <Loader2 className="animate-spin" size={18} /> : (
        <ul className="space-y-2">
          {memories.map(m => (
            <li key={m.id} className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm">
              <span className="flex-1">{m.fact}</span>
              <span className="text-xs text-muted-foreground shrink-0">{m.category}</span>
              <button onClick={() => forget(m.id)} title="Forget"
                className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
          {memories.length === 0 && <p className="text-sm text-muted-foreground">No memories yet.</p>}
        </ul>
      )}
    </section>
  );
}

// ─── Voice ───────────────────────────────────────────────────────────────────

function VoiceSection() {
  const [voiceReply, setVoiceReply] = useState(false);
  const [continuous, setContinuous] = useState(false);

  useEffect(() => {
    setVoiceReply(localStorage.getItem('milo-voice-reply') === '1');
    setContinuous(localStorage.getItem('milo-voice-continuous') === '1');
  }, []);

  const toggle = (key: string, val: boolean, set: (v: boolean) => void) => {
    set(val);
    localStorage.setItem(key, val ? '1' : '0');
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium flex items-center gap-2"><Mic size={16} /> Voice</h3>
        <p className="text-sm text-muted-foreground">Talk to Milo like a person.</p>
      </div>
      {[
        { label: 'Speak replies aloud', desc: 'Milo talks back after every message', key: 'milo-voice-reply', val: voiceReply, set: setVoiceReply },
        { label: 'Continuous listening', desc: 'Keep the mic open between messages', key: 'milo-voice-continuous', val: continuous, set: setContinuous },
      ].map(t => (
        <button key={t.key} onClick={() => toggle(t.key, !t.val, t.set)}
          className="w-full flex items-center justify-between rounded-xl border border-border p-3 text-left">
          <span>
            <span className="block text-sm font-medium">{t.label}</span>
            <span className="block text-xs text-muted-foreground">{t.desc}</span>
          </span>
          <span className={cn('w-10 h-6 rounded-full p-1 transition-colors', t.val ? 'bg-primary' : 'bg-muted')}>
            <span className={cn('block w-4 h-4 rounded-full bg-white transition-transform', t.val && 'translate-x-4')} />
          </span>
        </button>
      ))}
    </section>
  );
}

// ─── Action history ──────────────────────────────────────────────────────────

function ActionsSection() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/ctroom/milo/actions?limit=30', { headers: await authHeaders() });
      const data = await res.json();
      setActions(data.actions || []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium flex items-center gap-2"><History size={16} /> Action history</h3>
        <p className="text-sm text-muted-foreground">Everything Milo has done, newest first.</p>
      </div>
      {loading ? <Loader2 className="animate-spin" size={18} /> : (
        <ul className="space-y-2">
          {actions.map(a => (
            <li key={a.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{a.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              {a.target && <p className="mt-1 text-muted-foreground">{a.target}</p>}
              {a.result && <p className="mt-1">{a.result}</p>}
            </li>
          ))}
          {actions.length === 0 && <p className="text-sm text-muted-foreground">No actions logged yet.</p>}
        </ul>
      )}
    </section>
  );
}

export default function MiloTab() {
  return (
    <div className="space-y-8">
      <SoulSection />
      <MemoriesSection />
      <VoiceSection />
      <ActionsSection />
    </div>
  );
}
