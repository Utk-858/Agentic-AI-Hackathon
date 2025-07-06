import TeacherAssistantAgent from '@/components/agents/TeacherAssistantAgent';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherAssistantPage() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-4">
            <h1 className="font-headline text-2xl font-bold">AI Teaching Assistant</h1>
            <p className="text-muted-foreground">Your conversational partner for brainstorming, content creation, and teaching strategies.</p>
        </div>
        <Suspense fallback={
          <Card className="w-full h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0 pt-6">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-16 w-3/4" />
                  <div className="flex justify-end"><Skeleton className="h-16 w-3/4" /></div>
                  <Skeleton className="h-16 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        }>
          <TeacherAssistantAgent />
        </Suspense>
    </div>
  );
}
