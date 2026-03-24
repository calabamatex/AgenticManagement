'use client';

import { useEffect, useState, useRef } from 'react';
import type { DemoScenario, DemoLine } from '@/data/demo-scenarios';

interface SimulatedTerminalProps {
  scenario: DemoScenario;
}

function getLineClasses(line: DemoLine): string {
  switch (line.type) {
    case 'command':
      return 'text-green-400 font-bold';
    case 'output':
      return 'text-gray-300';
    case 'highlight': {
      if (line.text.includes('\u26A0')) return 'text-yellow-300 font-semibold';
      if (line.text.includes('\u2713')) return 'text-green-400 font-semibold';
      return 'text-cyan-400 font-semibold';
    }
    case 'blank':
      return '';
    default:
      return 'text-gray-300';
  }
}

export default function SimulatedTerminal({ scenario }: SimulatedTerminalProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleLines(0);

    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= scenario.lines.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [scenario]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const linesToRender = scenario.lines.slice(0, visibleLines);
  const allLinesShown = visibleLines >= scenario.lines.length;

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-gray-400 text-sm ml-2">{scenario.title}</span>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className="p-6 font-mono text-sm min-h-[400px] overflow-y-auto"
      >
        {linesToRender.map((line, index) => {
          if (line.type === 'blank') {
            return <div key={index} className="h-4" />;
          }

          return (
            <div key={index} className={getLineClasses(line)}>
              {line.text}
            </div>
          );
        })}

        {allLinesShown && (
          <span className="text-green-400 animate-pulse">{'\u258C'}</span>
        )}
      </div>
    </div>
  );
}
