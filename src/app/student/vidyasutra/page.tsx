import StudentAgent from '@/components/agents/StudentAgent';
import MultimodalGenerator from '@/components/agents/MultimodalGenerator';

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
          <StudentAgent />
        </div>
      </div>
    </div>
  );
}
