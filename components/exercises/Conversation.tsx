'use client';

import { useState, useRef, useEffect } from 'react';
import { ConversationExercise, ChatMessage } from '@/lib/types';

interface Props {
  exercise: ConversationExercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function Conversation({ exercise, onComplete }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: exercise.openingMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          scenario: exercise.scenario,
          assistantRole: exercise.assistantRole,
          userRole: exercise.userRole,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, ha habido un error. ¿Puedes intentarlo de nuevo?' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function end() {
    setEnded(true);
    const userTurns = messages.filter(m => m.role === 'user').length;
    onComplete?.(userTurns, userTurns);
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-800 space-y-1.5">
        <p><strong>Szenario:</strong> {exercise.scenario_de}</p>
        <p><strong>Deine Rolle:</strong> {exercise.userRole}</p>
        <p><strong>Gesprächspartner:</strong> {exercise.assistantRole}</p>
      </div>

      {exercise.vocabularyHints.length > 0 && (
        <details className="rounded-xl border border-gray-200">
          <summary className="p-3 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 rounded-xl select-none">
            💡 Vokabelhilfen ({exercise.vocabularyHints.length})
          </summary>
          <div className="p-3 pt-0 grid grid-cols-2 gap-1.5">
            {exercise.vocabularyHints.map((h, i) => (
              <div key={i} className="text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                <span className="font-medium text-gray-800">{h.word}</span>
                <span className="text-gray-400 ml-1">– {h.translation}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-red-700 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-300">
                <span className="animate-pulse">●●●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!ended && (
          <div className="flex gap-2 p-3 border-t border-gray-200 bg-white">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Antworte auf Spanisch..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-red-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-200 text-white rounded-xl text-sm font-medium transition-colors"
            >
              ↵
            </button>
          </div>
        )}
      </div>

      {!ended ? (
        <button
          onClick={end}
          className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl text-sm transition-colors"
        >
          Gespräch beenden
        </button>
      ) : (
        <div className="p-4 bg-green-50 rounded-xl text-green-800 text-sm text-center font-medium">
          ¡Muy bien! Du hast {messages.filter(m => m.role === 'user').length} Nachrichten auf Spanisch geschrieben.
        </div>
      )}
    </div>
  );
}
