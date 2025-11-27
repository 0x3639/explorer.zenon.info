'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
  data: unknown;
  title?: string;
}

// Custom theme based on vscDarkPlus but matching our app's colors
const customStyle = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.5',
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
  },
  string: {
    color: '#7fff00', // Our accent color for strings (hashes, addresses)
  },
  number: {
    color: '#fbbf24', // Yellow for numbers
  },
  property: {
    color: '#9ca3af', // Gray for property names
  },
  punctuation: {
    color: '#6b7280', // Darker gray for brackets, commas
  },
  boolean: {
    color: '#60a5fa', // Blue for booleans
  },
  null: {
    color: '#6b7280', // Gray for null
  },
};

export function JsonViewer({ data, title }: JsonViewerProps) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div>
      {title && <h2 className="text-white font-medium mb-3">{title}</h2>}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
        <SyntaxHighlighter
          language="json"
          style={customStyle}
          showLineNumbers
          lineNumberStyle={{
            minWidth: '2.5rem',
            paddingRight: '1rem',
            color: '#4b5563',
            userSelect: 'none',
          }}
          customStyle={{
            margin: 0,
            background: 'transparent',
            overflowX: 'auto',
          }}
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
