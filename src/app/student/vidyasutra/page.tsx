import StudentAgent from '@/components/agents/StudentAgent';
import MultimodalGenerator from '@/components/agents/MultimodalGenerator';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle,CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


export default function VidyaSutraPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="p-4 md:p-6 border-b">
        <h1 className="font-headline text-2xl font-bold">VidyaSutra: Your Companion to Study</h1>
        <p className="text-muted-foreground">Your personal AI-powered toolkit for learning, all in one place.</p>
      </div>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6 overflow-hidden">
        <div className="h-full min-h-0 lg:col-span-2 overflow-y-auto">
          <MultimodalGenerator />
        </div>
        <div className="h-full min-h-0 lg:col-span-1">
          <Suspense fallback={
            <Card className="w-full h-full flex flex-col">
              <CardHeader>
                <CardTitle>Loading Assistant...</CardTitle>
                <CardDescription>Please wait</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-16 w-3/4" />
                    <div className="flex justify-end"><Skeleton className="h-16 w-3/4" /></div>
                    <Skeleton className="h-16 w-3/4" />
                  </div>
                  <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          }>
            <StudentAgent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
