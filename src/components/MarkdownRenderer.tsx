import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn("h-full w-full rounded-md p-4 bg-muted/30", className)}>
        <pre className="font-code text-sm whitespace-pre-wrap break-words">{content}</pre>
    </div>
  );
};

export default MarkdownRenderer;
