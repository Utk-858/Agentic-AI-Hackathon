'use client';

import { useRef, ChangeEvent, useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bot, FileText, ClipboardList, BookText, GraduationCap, X, FileImage, Download, Edit, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import { generateLessonPlan } from '@/ai/flows/generate-lesson-plan';
import { generateWorksheet } from '@/ai/flows/worksheet-generation';
import { simplifyContent } from '@/ai/flows/simplify-content';
import { worksheetAutoCorrector } from '@/ai/flows/worksheet-autocorrector';
import { useToast } from '@/hooks/use-toast';
import HtmlRenderer from '@/components/HtmlRenderer';
import { useTeacherState } from '@/context/TeacherStateContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const lessonPlanSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  gradeLevel: z.string().min(1, 'Grade level is required.'),
  duration: z.string().optional(),
  language: z.string().min(2, 'Language is required.'),
  specialRequest: z.string().optional(),
});

const worksheetSchema = z.object({
  topic: z.string().min(3, 'Topic is required.'),
  gradeLevel: z.string().min(1, 'Grade level is required.'),
  numberOfQuestions: z.coerce.number().min(1).max(20),
  language: z.string().min(2, 'Language is required.'),
  specialRequest: z.string().optional(),
});

const simplifySchema = z.object({
  complexText: z.string().min(10, 'Please enter at least 10 characters.'),
  targetAudience: z.string().min(3, 'Please specify a target audience.'),
  language: z.string().min(2, 'Language is required.'),
  specialRequest: z.string().optional(),
});

const ImageUpload = ({ title, onFileSelect, onRemove, imageDataUri, isLoading }: { title: string, onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void, onRemove: () => void, imageDataUri: string | null, isLoading: boolean }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      {imageDataUri ? (
        <div className="relative w-full h-48 rounded-md overflow-hidden border bg-muted/20">
          <Image src={imageDataUri} alt={`${title} preview`} layout="fill" objectFit="contain" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={onRemove} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted"
          onClick={() => !isLoading && inputRef.current?.click()}
        >
          <div className="text-center">
            <FileImage className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-1 text-sm text-muted-foreground">Click to upload image</p>
          </div>
        </div>
      )}
      <input type="file" ref={inputRef} onChange={onFileSelect} accept="image/*" className="hidden" disabled={isLoading} />
    </div>
  )
}

export default function ShikshaSahayakPage() {
  const { state, setVidyasutraState } = useTeacherState();
  const {
    result,
    isLoading,
    studentSheetUri,
    answerKeyUri,
    studentInfo,
    isEditing,
    editableContent,
    showAnswerKey
  } = state.vidyasutra;

  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const { online } = useNetworkStatus();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const lessonPlanForm = useForm<z.infer<typeof lessonPlanSchema>>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: { topic: 'The Solar System', gradeLevel: '5th Grade', language: 'English', specialRequest: '', duration: '45 minutes' },
  });

  const worksheetForm = useForm<z.infer<typeof worksheetSchema>>({
    resolver: zodResolver(worksheetSchema),
    defaultValues: { topic: 'Fractions', gradeLevel: '4th Grade', numberOfQuestions: 5, language: 'English', specialRequest: '' },
  });

  const simplifyForm = useForm<z.infer<typeof simplifySchema>>({
    resolver: zodResolver(simplifySchema),
    defaultValues: { complexText: 'The process of photosynthesis converts light energy into chemical energy, through a process that occurs in chloroplasts.', targetAudience: 'a 5th grader', language: 'English', specialRequest: '' },
  });

  const handleFileChange = (field: 'studentSheetUri' | 'answerKeyUri') => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 4MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setVidyasutraState({ [field]: e.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGeneration = async (type: string, action: () => Promise<any>, onResult: (result: any) => void) => {
    setVidyasutraState({
      isLoading: { ...isLoading, [type]: true },
      result: null,
      isEditing: false
    });

    try {
      const genResult = await action();
      onResult(genResult);
    } catch (error: any) {
      console.error(`Error generating ${type}:`, error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error.message || `Failed to generate the ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}. Please try again.`,
      });
      setVidyasutraState({ result: null });
    } finally {
      setVidyasutraState({ isLoading: { ...isLoading, [type]: false } });
    }
  };

  // Update handlers to use online status
  const handleLessonPlan = (values: z.infer<typeof lessonPlanSchema>) => handleGeneration(
    'lessonPlan',
    () => generateLessonPlan(values, online),
    (r) => setVidyasutraState({ result: { type: 'lessonPlan', title: 'Lesson Plan', content: r.lessonPlan } })
  );

  const handleWorksheet = (values: z.infer<typeof worksheetSchema>) => handleGeneration(
    'worksheet',
    () => generateWorksheet(values, online),
    (r) => setVidyasutraState({ result: { type: 'worksheet', title: 'Worksheet', content: r.worksheet, answerKey: r.answerKey } })
  );

  const handleSimplify = (values: z.infer<typeof simplifySchema>) => handleGeneration(
    'simplify',
    () => simplifyContent(values, online),
    (r) => setVidyasutraState({ result: { type: 'simplify', title: 'Simplified Content', content: r.simplifiedText } })
  );

  const handleCorrector = async () => {
    if (!studentSheetUri || !answerKeyUri) {
      toast({ variant: 'destructive', title: 'Missing Images', description: 'Please upload both the student worksheet and the answer key.' });
      return;
    }
    if (!studentInfo.language.trim()) {
      toast({ variant: 'destructive', title: 'Language Required', description: 'Please specify the language for the feedback.' });
      return;
    }
    handleGeneration(
      'corrector',
      () => worksheetAutoCorrector({
        studentWorksheetDataUri: studentSheetUri,
        answerKeyDataUri: answerKeyUri,
        language: studentInfo.language,
        specialRequest: studentInfo.specialRequest,
        isOnline: online
      }),
      (r) => {
        setVidyasutraState({
          result: {
            type: 'corrector',
            title: 'Grading Result',
            score: r.score,
            total: r.total,
            feedback: r.feedback,
          } as typeof r & { summaryTable?: string }
        });
      }
    );
  };

  const handleEdit = () => {
    if (!result) return;
    const contentToEdit = result.type === 'corrector' ? result.feedback : result.content;

    const textContent = contentToEdit
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li>/gi, '\n• ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    setVidyasutraState({ editableContent: textContent, isEditing: true });
  };

  const handleSave = () => {
    if (!result) return;
    const newHtmlContent = editableContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .split('\n')
      .map(p => p.trim() === '' ? '<br>' : `<p>${p}</p>`)
      .join('');

    const newResult = { ...result };
    if (newResult.type === 'corrector') {
      newResult.feedback = newHtmlContent;
    } else {
      newResult.content = newHtmlContent;
    }
    setVidyasutraState({ result: newResult, isEditing: false });
  };

  const handleDownloadPdf = () => {
    const input = contentRef.current;
    if (input) {
      const pdfTitle = result?.type === 'corrector' ? 'Grading Report' : result?.title || 'Generated Content';
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
        pdf.text(pdfTitle, pdfWidth / 2, 10, { align: 'center' });
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${pdfTitle.replace(/\s+/g, '_').toLowerCase() || 'content'}.pdf`);
      });
    }
  };

  const anyLoading = Object.values(isLoading).some(Boolean);

  const renderResult = () => {
    if (anyLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
          <p className="text-lg font-medium">AI is thinking...</p>
          <p>This may take a moment.</p>
        </div>
      );
    }
    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <Bot className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium">Your generated content will appear here.</p>
          <p>Select a tool and provide the details to get started.</p>
        </div>
      );
    }

    if (result && result.type === 'corrector') {
      const isFeedbackEditing = isEditing;
      const feedbackContent = isFeedbackEditing ? editableContent : result.feedback;
      const hasScore = typeof result.score === 'number' && typeof result.total === 'number';
      const showExtractionWarning = hasScore && result.total === 0;
      return (
        <div className="p-4" ref={contentRef}>
          <h2 className="text-2xl font-bold text-center mb-4">Grading Report</h2>
          <Table className="mb-4">
            <TableBody>
              <TableRow><TableCell className="font-semibold">Student Name</TableCell><TableCell>{studentInfo.name || 'N/A'}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">Class</TableCell><TableCell>{studentInfo.classVal || 'N/A'}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">Roll No.</TableCell><TableCell>{studentInfo.rollNo || 'N/A'}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">Date</TableCell><TableCell>{new Date().toLocaleDateString()}</TableCell></TableRow>
            </TableBody>
          </Table>
          <div className="text-center p-4 bg-muted rounded-lg my-4">
            <p className="text-muted-foreground">Total Score</p>
            <p className="text-4xl font-bold">{hasScore ? `${result.score} / ${result.total}` : 'N/A'}</p>
            {showExtractionWarning && (
              <div className="mt-2 p-2 bg-yellow-100 text-yellow-900 rounded text-sm">
                Could not extract any questions/answers. Please check the image quality or try again.
              </div>
            )}
          </div>
          {isFeedbackEditing ? (
            <Textarea
              value={feedbackContent}
              onChange={(e) => setVidyasutraState({ editableContent: e.target.value })}
              className="h-full w-full min-h-[300px] border-dashed border-2 focus-visible:ring-primary"
              placeholder="Edit feedback..."
            />
          ) : (
            <HtmlRenderer content={result.feedback || ''} />
          )}
        </div>
      );
    }

    // Default for text-based results
    let finalContent = result.content || '';
    if (result.type === 'worksheet' && showAnswerKey && result.answerKey) {
      finalContent += `<hr class="my-8" />` + result.answerKey;
    }

    if (isEditing) {
      return (
        <Textarea
          value={editableContent}
          onChange={(e) => setVidyasutraState({ editableContent: e.target.value })}
          className="h-full w-full min-h-[500px] border-0 rounded-none focus-visible:ring-0"
          placeholder="Edit your content here..."
        />
      );
    } else {
      return (
        <div ref={contentRef} className="p-4">
          <HtmlRenderer content={finalContent} />
        </div>
      );
    }
  }


  return (
    <div className="flex flex-1 flex-col">
      <div className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="font-headline text-2xl font-bold">ShikshaSahayak: Content Creation Toolkit</h1>
          <p className="text-muted-foreground">Your personal AI-powered toolkit for creating educational materials.</p>
        </div>
        {/* Removed local online/offline status button */}
      </div>
      <Tabs defaultValue="lesson-plan" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="lesson-plan" className="gap-2"><FileText className="h-4 w-4" />Lesson Plan</TabsTrigger>
          <TabsTrigger value="worksheet" className="gap-2"><ClipboardList className="h-4 w-4" />Worksheet</TabsTrigger>
          <TabsTrigger value="simplify" className="gap-2"><BookText className="h-4 w-4" />Simplifier</TabsTrigger>
          <TabsTrigger value="auto-corrector" className="gap-2"><GraduationCap className="h-4 w-4" />Auto-Corrector</TabsTrigger>
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
                      <FormField name="topic" control={lessonPlanForm.control} render={({ field }) => <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., The Water Cycle" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="gradeLevel" control={lessonPlanForm.control} render={({ field }) => <FormItem><FormLabel>Grade Level</FormLabel><FormControl><Input placeholder="e.g., 3rd Grade" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="duration" control={lessonPlanForm.control} render={({ field }) => <FormItem><FormLabel>Duration (Optional)</FormLabel><FormControl><Input placeholder="e.g., 45 minutes" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="language" control={lessonPlanForm.control} render={({ field }) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="specialRequest" control={lessonPlanForm.control} render={({ field }) => <FormItem><FormLabel>Special Request (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 'Include a hands-on activity' or 'Focus on visual aids'" {...field} disabled={anyLoading} rows={3} /></FormControl><FormMessage /></FormItem>} />
                      <Button type="submit" disabled={isLoading['lessonPlan'] || anyLoading} className="w-full">{isLoading['lessonPlan'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Lesson Plan'}</Button>
                    </form>
                  </FormProvider>
                </TabsContent>

                <TabsContent value="worksheet">
                  <FormProvider {...worksheetForm}>
                    <form onSubmit={worksheetForm.handleSubmit(handleWorksheet)} className="space-y-4">
                      <FormField name="topic" control={worksheetForm.control} render={({ field }) => <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., Basic Addition" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="gradeLevel" control={worksheetForm.control} render={({ field }) => <FormItem><FormLabel>Grade Level</FormLabel><FormControl><Input placeholder="e.g., 1st Grade" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="numberOfQuestions" control={worksheetForm.control} render={({ field }) => <FormItem><FormLabel>Number of Questions</FormLabel><FormControl><Input type="number" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="language" control={worksheetForm.control} render={({ field }) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="specialRequest" control={worksheetForm.control} render={({ field }) => <FormItem><FormLabel>Special Request (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 'Include more word problems' or 'Make questions multiple choice'" {...field} disabled={anyLoading} rows={3} /></FormControl><FormMessage /></FormItem>} />
                      <Button type="submit" disabled={isLoading['worksheet'] || anyLoading} className="w-full">{isLoading['worksheet'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Worksheet'}</Button>
                    </form>
                  </FormProvider>
                </TabsContent>

                <TabsContent value="simplify">
                  <FormProvider {...simplifyForm}>
                    <form onSubmit={simplifyForm.handleSubmit(handleSimplify)} className="space-y-4">
                      <FormField name="complexText" control={simplifyForm.control} render={({ field }) => <FormItem><FormLabel>Complex Text</FormLabel><FormControl><Textarea placeholder="Paste text here..." {...field} rows={5} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="targetAudience" control={simplifyForm.control} render={({ field }) => <FormItem><FormLabel>Simplify For</FormLabel><FormControl><Input placeholder="e.g., 5th Graders" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="language" control={simplifyForm.control} render={({ field }) => <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} disabled={anyLoading} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="specialRequest" control={simplifyForm.control} render={({ field }) => <FormItem><FormLabel>Special Request (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 'Focus on the main idea' or 'Use a formal tone'" {...field} disabled={anyLoading} rows={3} /></FormControl><FormMessage /></FormItem>} />
                      <Button type="submit" disabled={isLoading['simplify'] || anyLoading} className="w-full">{isLoading['simplify'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simplifying...</> : 'Simplify Content'}</Button>
                    </form>
                  </FormProvider>
                </TabsContent>

                <TabsContent value="auto-corrector">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student Name</Label>
                      <Input value={studentInfo.name} onChange={(e) => setVidyasutraState({ studentInfo: { ...studentInfo, name: e.target.value } })} disabled={anyLoading} placeholder="Enter student's name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Input value={studentInfo.classVal} onChange={(e) => setVidyasutraState({ studentInfo: { ...studentInfo, classVal: e.target.value } })} disabled={anyLoading} placeholder="e.g., 5B" />
                      </div>
                      <div className="space-y-2">
                        <Label>Roll No.</Label>
                        <Input value={studentInfo.rollNo} onChange={(e) => setVidyasutraState({ studentInfo: { ...studentInfo, rollNo: e.target.value } })} disabled={anyLoading} placeholder="e.g., 23" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Language for Feedback</Label>
                      <Input value={studentInfo.language} onChange={(e) => setVidyasutraState({ studentInfo: { ...studentInfo, language: e.target.value } })} disabled={anyLoading} placeholder="e.g., English, Hindi" />
                    </div>
                    <ImageUpload title="Student's Completed Worksheet" imageDataUri={studentSheetUri} onFileSelect={handleFileChange('studentSheetUri')} onRemove={() => setVidyasutraState({ studentSheetUri: null })} isLoading={anyLoading} />
                    <ImageUpload title="Answer Key" imageDataUri={answerKeyUri} onFileSelect={handleFileChange('answerKeyUri')} onRemove={() => setVidyasutraState({ answerKeyUri: null })} isLoading={anyLoading} />
                    <div className="space-y-2">
                      <Label>Special Request (Optional)</Label>
                      <Textarea
                        placeholder="e.g., 'Be lenient with spelling mistakes for fill-in-the-blanks.'"
                        value={studentInfo.specialRequest}
                        onChange={(e) => setVidyasutraState({ studentInfo: { ...studentInfo, specialRequest: e.target.value } })}
                        disabled={anyLoading}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCorrector} disabled={isLoading['corrector'] || anyLoading || !studentSheetUri || !answerKeyUri} className="w-full">
                      {isLoading['corrector'] ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grading...</> : 'Grade Worksheet'}
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>
          <div className="h-full min-h-0 lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <CardTitle className="font-headline">
                    {result ? result.title : 'Generated Content'}
                  </CardTitle>
                  {result?.type === 'worksheet' && result.answerKey && (
                    <div className="flex items-center space-x-2">
                      <Switch id="show-key" checked={showAnswerKey} onCheckedChange={(checked) => setVidyasutraState({ showAnswerKey: checked })} disabled={isEditing} />
                      <Label htmlFor="show-key" className="text-sm text-muted-foreground">Show Answer Key</Label>
                    </div>
                  )}
                </div>
                {result && (
                  <div className="flex gap-2">
                    {isEditing ? (
                      <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={isEditing}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full w-full rounded-md border min-h-[500px]">
                  {renderResult()}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
