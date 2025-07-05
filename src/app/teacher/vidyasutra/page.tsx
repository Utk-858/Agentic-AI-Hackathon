'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, FileText, ClipboardList, BookText } from 'lucide-react';

import { generateLessonPlan } from '@/ai/flows/generate-lesson-plan';
import { generateWorksheet } from '@/ai/flows/worksheet-generation';
import { simplifyContent } from '@/ai/flows/simplify-content';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const lessonPlanSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  gradeLevel: z.string().min(1, 'Grade level is required.'),
  language: z.string().min(2, 'Language is required.'),
});

const worksheetSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  gradeLevel: z.string().min(1, 'Grade level is required.'),
  numberOfQuestions: z.coerce.number().min(1).max(20),
  language: z.string().min(2, 'Language is required.'),
});

const simplifySchema = z.object({
  complexText: z.string().min(10, 'Please enter at least 10 characters.'),
  targetAudience: z.string().min(3, 'Please specify a target audience.'),
  language: z.string().min(2, 'Language is required.'),
});

interface GenerationResult {
    title: string;
    content: string;
}

export default function ShikshaSahayakPage() {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const lessonPlanForm = useForm<z.infer<typeof lessonPlanSchema>>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: { topic: 'The Solar System', gradeLevel: '5th Grade', language: 'English' },
  });

  const worksheetForm = useForm<z.infer<typeof worksheetSchema>>({
    resolver: zodResolver(worksheetSchema),
    defaultValues: { topic: 'Fractions', gradeLevel: '4th Grade', numberOfQuestions: 5, language: 'English' },
  });
  
  const simplifyForm = useForm<z.infer<typeof simplifySchema>>({
    resolver: zodResolver(simplifySchema),
    defaultValues: { complexText: 'The process of photosynthesis converts light energy into chemical energy, through a process that occurs in chloroplasts.', targetAudience: 'a 5th grader', language: 'English' },
  });

  const handleGeneration = async (type: string, action: () => Promise<any>, resultMapper: (result: any) => GenerationResult) => {
    setIsLoading(prev => ({ ...prev, [type]: true }));
    setResult(null);
    try {
        const result = await action();
        setResult(resultMapper(result));
    } catch (error) {
        console.error(`Error generating ${type}:`, error);
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: `Failed to generate the ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}. Please try again.`,
        });
        setResult(null);
    } finally {
        setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleLessonPlan = (values: z.infer<typeof lessonPlanSchema>) => {
    handleGeneration('lessonPlan', () => generateLessonPlan(values), (r) => ({ title: 'Lesson Plan', content: r.lessonPlan }));
  };

  const handleWorksheet = (values: z.infer<typeof worksheetSchema>) => {
    handleGeneration('worksheet', () => generateWorksheet(values), (r) => ({ title: 'Worksheet', content: r.worksheet }));
  };

  const handleSimplify = (values: z.infer<typeof simplifySchema>) => {
    handleGeneration('simplify', () => simplifyContent(values), (r) => ({ title: 'Simplified Content', content: r.simplifiedText }));
  };


  return (
    <div className="flex flex-1 flex-col">
      <div className="p-4 md:p-6 border-b">
        <h1 className="font-headline text-2xl font-bold">ShikshaSahayak: Content Creation Toolkit</h1>
        <p className="text-muted-foreground">Your personal AI-powered toolkit for creating educational materials.</p>
      </div>

      <Tabs defaultValue="lesson-plan" className="p-4 md:p-6 flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="lesson-plan" className="gap-2"><FileText className="h-4 w-4" />Lesson Plan</TabsTrigger>
          <TabsTrigger value="worksheet" className="gap-2"><ClipboardList className="h-4 w-4" />Worksheet</TabsTrigger>
          <TabsTrigger value="simplify" className="gap-2"><BookText className="h-4 w-4" />Simplifier</TabsTrigger>
        </TabsList>
        
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Content Generator</CardTitle>
                    <CardDescription>Fill in the details for your chosen tool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TabsContent value="lesson-plan">
                        <FormProvider {...lessonPlanForm}>
                          <form onSubmit={lessonPlanForm.handleSubmit(handleLessonPlan)} className="space-y-4">
                            <FormField name="topic" control={lessonPlanForm.control} render={({field}) => <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., The Water Cycle" {...field} /></FormControl><FormMessage/></FormItem>}/>
                            <FormField name="gradeLevel" control={lessonPlanForm.control} render={({field}) => <FormItem><FormLabel>Grade Level</FormLabel><FormControl><Input placeholder="e.g., 3rd Grade" {...field} /></FormControl><FormMessage/></FormItem>}/>
                            <FormField name="language" control={lessonPlanForm.control} render={({field}) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage/></FormItem>}/>
                            <Button type="submit" disabled={isLoading['lessonPlan']} className="w-full">{isLoading['lessonPlan'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</> : 'Generate Lesson Plan'}</Button>
                          </form>
                        </FormProvider>
                    </TabsContent>

                    <TabsContent value="worksheet">
                        <FormProvider {...worksheetForm}>
                            <form onSubmit={worksheetForm.handleSubmit(handleWorksheet)} className="space-y-4">
                                <FormField name="topic" control={worksheetForm.control} render={({field}) => <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., Basic Addition" {...field}/></FormControl><FormMessage/></FormItem>}/>
                                <FormField name="gradeLevel" control={worksheetForm.control} render={({field}) => <FormItem><FormLabel>Grade Level</FormLabel><FormControl><Input placeholder="e.g., 1st Grade" {...field}/></FormControl><FormMessage/></FormItem>}/>
                                <FormField name="numberOfQuestions" control={worksheetForm.control} render={({field}) => <FormItem><FormLabel>Number of Questions</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>}/>
                                <FormField name="language" control={worksheetForm.control} render={({field}) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage/></FormItem>}/>
                                <Button type="submit" disabled={isLoading['worksheet']} className="w-full">{isLoading['worksheet'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Creating...</> : 'Create Worksheet'}</Button>
                            </form>
                        </FormProvider>
                    </TabsContent>

                    <TabsContent value="simplify">
                        <FormProvider {...simplifyForm}>
                          <form onSubmit={simplifyForm.handleSubmit(handleSimplify)} className="space-y-4">
                            <FormField name="complexText" control={simplifyForm.control} render={({field}) => <FormItem><FormLabel>Complex Text</FormLabel><FormControl><Textarea placeholder="Paste text here..." {...field} rows={5}/></FormControl><FormMessage/></FormItem>}/>
                            <FormField name="targetAudience" control={simplifyForm.control} render={({field}) => <FormItem><FormLabel>Simplify For</FormLabel><FormControl><Input placeholder="e.g., 5th Graders" {...field}/></FormControl><FormMessage/></FormItem>}/>
                            <FormField name="language" control={simplifyForm.control} render={({field}) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage/></FormItem>}/>
                            <Button type="submit" disabled={isLoading['simplify']} className="w-full">{isLoading['simplify'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Simplifying...</> : 'Simplify Content'}</Button>
                          </form>
                        </FormProvider>
                    </TabsContent>
                </CardContent>
            </Card>
          </div>
          <div className="h-full min-h-0 lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                  <CardTitle className="font-headline">Generated Content</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                  <ScrollArea className="h-full w-full rounded-md border min-h-[500px]">
                      {result ? (
                           <MarkdownRenderer content={result.content} className="p-4 bg-transparent"/>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                              <Bot className="w-12 h-12 mb-4"/>
                              <p className="text-lg font-medium">Your generated content will appear here.</p>
                              <p>Select a tool and provide the details to get started.</p>
                          </div>
                      )}
                  </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
