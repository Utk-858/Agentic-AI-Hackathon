import MentalHealthAgent from '@/components/agents/MentalHealthAgent';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SwasthyaMitraPage() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-4">
            <h1 className="font-headline text-2xl font-bold">SwasthyaMitra Wellness</h1>
            <p className="text-muted-foreground">A safe and confidential space for your well-being.</p>
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
          <MentalHealthAgent />
        </Suspense>
    </div>
  );
}
