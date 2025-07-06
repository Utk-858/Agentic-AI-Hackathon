import React from 'react';
import { cn } from '@/lib/utils';

interface HtmlRendererProps {
  content: string;
  className?: string;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ content, className }) => {
  // This component renders raw HTML provided by the AI.
  // The AI is prompted to provide simple, clean HTML using tags like h2, p, ul, ol, li.
  return (
    <div
      className={cn(
        'bg-transparent space-y-4 text-sm',
        '[&_h1]:text-2xl [&_h1]:font-bold',
        '[&_h2]:text-xl [&_h2]:font-bold',
        '[&_h3]:text-lg [&_h3]:font-semibold',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
        '[&_strong]:font-semibold',
        '[&_p]:leading-relaxed',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HtmlRenderer;
