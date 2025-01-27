"use client";

import { useState } from 'react';
import { Monitor, Layout } from 'lucide-react';

interface ViewToggleProps {
  onToggle: (isTV: boolean) => void;
}

export default function ViewToggle({ onToggle }: ViewToggleProps) {
  const [isTV, setIsTV] = useState(false);

  const toggle = () => {
    const newValue = !isTV;
    setIsTV(newValue);
    onToggle(newValue);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      title={isTV ? "Modo Normal" : "Modo TV"}
    >
      {isTV ? (
        <>
          <Layout size={20} />
          <span>Normal</span>
        </>
      ) : (
        <>
          <Monitor size={20} />
          <span>TV</span>
        </>
      )}
    </button>
  );
} 