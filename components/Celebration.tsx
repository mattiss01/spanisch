'use client';

import { useEffect } from 'react';

const EMOJIS = ['🎉', '✨', '🎊', '⭐', '🔥', '🏅'];

// A self-dismissing celebration toast with a lightweight emoji burst (no deps).
export default function Celebration({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      key={message}
      className="fixed inset-0 z-[60] pointer-events-none flex items-start justify-center"
    >
      <style>{`
        @keyframes confettiFall { 0%{transform:translateY(-10vh) rotate(0);opacity:1} 100%{transform:translateY(65vh) rotate(360deg);opacity:0} }
        @keyframes toastPop { 0%{transform:scale(.8);opacity:0} 12%{transform:scale(1.05);opacity:1} 22%{transform:scale(1)} 85%{opacity:1} 100%{opacity:0} }
      `}</style>
      {Array.from({ length: 16 }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const dur = 1.6 + Math.random() * 0.9;
        return (
          <span
            key={i}
            className="absolute text-xl select-none"
            style={{ left: `${left}%`, top: 0, animation: `confettiFall ${dur}s ease-in ${delay}s forwards` }}
          >
            {EMOJIS[i % EMOJIS.length]}
          </span>
        );
      })}
      <div
        className="mt-20 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg"
        style={{ animation: 'toastPop 2.6s ease-out forwards' }}
      >
        {message}
      </div>
    </div>
  );
}
