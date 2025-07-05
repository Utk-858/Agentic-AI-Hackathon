import TeacherAssistantAgent from '@/components/agents/TeacherAssistantAgent';

export default function TeacherAssistantPage() {
  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-4">
            <h1 className="font-headline text-2xl font-bold">AI Teaching Assistant</h1>
            <p className="text-muted-foreground">Your conversational partner for brainstorming, content creation, and teaching strategies.</p>
        </div>
        <TeacherAssistantAgent />
    </div>
  );
}
