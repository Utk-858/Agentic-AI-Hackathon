'use client';

import { useRef } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ClipboardSignature, Download, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HtmlRenderer from '@/components/HtmlRenderer';
import { blackboardDesigner } from '@/ai/flows/blackboard-designer';
import { useTeacherState } from '@/context/TeacherStateContext';

const formSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  gradeLevels: z.string().min(1, 'Grade levels are required.'),
  language: z.string().min(2, 'Language is required.'),
  specialRequest: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BlackboardDesignerPage() {
  const { state, setBlackboardDesignerState } = useTeacherState();
  const { result, isLoading } = state.blackboardDesigner;
  
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'The Food Chain',
      gradeLevels: 'Class 3 and 5',
      language: 'English',
      specialRequest: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setBlackboardDesignerState({ isLoading: true, result: null });
    if(audioRef.current) audioRef.current.pause();

    try {
      const response = await blackboardDesigner(values);
      if (!response.layoutImageUrl && !response.explanation) {
        throw new Error('The AI failed to generate any content. Please try a different prompt.');
      }
      setBlackboardDesignerState({ result: response });
      toast({ title: 'Layout generated!', description: 'Your blackboard design is ready.' });
    } catch (error: any) {
      console.error('Error designing blackboard:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error.message || 'Failed to design the blackboard. Please try again.',
      });
      setBlackboardDesignerState({ result: null });
    } finally {
      setBlackboardDesignerState({ isLoading: false });
    }
  };
  
  const handleDownloadPdf = () => {
    const input = contentRef.current;
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 30) / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 15;
        pdf.setFontSize(20);
        pdf.text("Blackboard Design", pdfWidth / 2, 10, { align: 'center' });
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save('blackboard_design.pdf');
      });
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary"/>
            <p className="text-lg font-medium">Board Buddy is drawing...</p>
            <p>Designing your layout, explanation, and audio.</p>
        </div>
      );
    }
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <Bot className="w-12 h-12 mb-4"/>
            <p className="text-lg font-medium">Your blackboard design will appear here.</p>
            <p>Describe a concept to get started.</p>
        </div>
      );
    }
    
    return (
        <div ref={contentRef} className="p-4 space-y-4">
          {result.layoutImageUrl ? (
            <div className="border rounded-lg p-2 bg-gray-800">
               <Image src={result.layoutImageUrl} alt="Generated Blackboard Layout" width={800} height={450} className="rounded-md w-full h-auto" />
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted text-center text-muted-foreground">
                <p>Image generation failed or was not possible for this request.</p>
                <p>Please check the text explanation below.</p>
            </div>
          )}
          <HtmlRenderer content={result.explanation} />
        </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col">
       <div className="mb-6">
            <h1 className="font-headline text-2xl font-bold">Board Buddy: Blackboard Designer</h1>
            <p className="text-muted-foreground">Instantly create clear, grade-appropriate chalkboard layouts from a simple text prompt.</p>
        </div>
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Design a Board</CardTitle>
              <CardDescription>Describe the concept you want to visualize.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="topic" render={({field}) => <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., The Water Cycle" {...field} disabled={isLoading} /></FormControl><FormMessage/></FormItem>}/>
                  <FormField control={form.control} name="gradeLevels" render={({field}) => <FormItem><FormLabel>Grade Level(s)</FormLabel><FormControl><Input placeholder="e.g., Class 3 and 5" {...field} disabled={isLoading} /></FormControl><FormMessage/></FormItem>}/>
                  <FormField control={form.control} name="language" render={({field}) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} disabled={isLoading} /></FormControl><FormMessage/></FormItem>}/>
                  <FormField control={form.control} name="specialRequest" render={({field}) => <FormItem><FormLabel>Special Request (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 'Make it look like a cartoon' or 'Focus on the labels'" {...field} disabled={isLoading} rows={3} /></FormControl><FormMessage/></FormItem>}/>
                  <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Designing...</> : <><ClipboardSignature className="mr-2 h-4 w-4" /> Generate Layout</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="h-full min-h-0 lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Generated Layout & Explanation</CardTitle>
                    <CardDescription>Review the design, listen to the audio, and download.</CardDescription>
                </div>
              {result && (
                <div className="flex items-center gap-2">
                    {result.audioDataUri && <audio ref={audioRef} src={result.audioDataUri} controls />}
                    <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
                      <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ScrollArea className="h-full w-full rounded-md border min-h-[400px]">
                {renderResult()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
