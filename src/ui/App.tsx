import React, { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-neutral-950 text-neutral-100 font-sans">
      <h1 className="text-3xl font-bold tracking-tight">
        MindReel + React + Electron
      </h1>
      <p className="text-neutral-400 max-w-prose text-center">
        This UI is now powered by React and styled with Tailwind.
      </p>
      <div className="flex items-center gap-4">
        <button
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 focus:outline-none focus-ring transition"
          onClick={() => setCount((c) => c + 1)}
        >
          Count: {count}
        </button>
        <button
          className="rounded border border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-800/70 focus:outline-none focus-ring transition"
          onClick={() => setCount(0)}
        >
          Reset
        </button>
      </div>
    </main>
  );
}
