import MentalHealthAgent from '@/components/agents/MentalHealthAgent';

export default function SwasthyaMitraPage() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-4">
            <h1 className="font-headline text-2xl font-bold">SwasthyaMitra Wellness</h1>
            <p className="text-muted-foreground">A safe and confidential space for your well-being.</p>
        </div>
        <MentalHealthAgent />
    </div>
  );
}
