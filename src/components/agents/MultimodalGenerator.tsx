'use client';

import { useState, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileImage, X, Mic, Wand2 } from 'lucide-react';
import { multimodalTutor, MultimodalTutorOutput } from '@/ai/flows/multimodal-tutor';
import MarkdownRenderer from '../MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

const generatorSchema = z.object({
  query: z.string().min(1, 'Please enter a prompt or question.'),
});

export default function MultimodalGenerator() {
  const [result, setResult] = useState<MultimodalTutorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof generatorSchema>>({
    resolver: zodResolver(generatorSchema),
    defaultValues: { query: '' },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 4MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
      setImageDataUri(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  const onSubmit = async (values: z.infer<typeof generatorSchema>) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await multimodalTutor({ 
          query: values.query, 
          ...(imageDataUri && { imageDataUri }) 
      });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the tutor. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-6 h-6" />
            Creative Studio
        </CardTitle>
        <CardDescription>Use text, images, or your voice to generate new ideas, summaries, images, and audio explanations. Designed for all learners.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Let's create something new!</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="e.g., Generate a picture of a friendly robot tutor, or write a short story about the attached image."
                                {...field}
                                rows={3}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                          <FileImage className="mr-2 h-4 w-4"/>
                          {imageDataUri ? 'Change' : 'Image'}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button type="button" variant="outline" disabled title="Voice input coming soon!">
                          <Mic className="mr-2 h-4 w-4"/>
                          Voice
                      </Button>
                  </div>
                  <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Wand2 className="mr-2 h-4 w-4" />Generate</>}
                  </Button>
              </div>
              {imageDataUri && (
                <div className="relative w-28 h-28 mt-2 rounded-md overflow-hidden border">
                    <Image src={imageDataUri} alt="Image preview" layout="fill" objectFit="cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>

        <div className="flex-1 flex flex-col min-h-0 pt-4">
          {isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating response...</p>
              </div>
          )}

          {!isLoading && result && (
            <>
              <h3 className="text-lg font-semibold mb-2">Generated Result</h3>
              <ScrollArea className="flex-1 w-full rounded-md border">
                <MarkdownRenderer content={result.response} className="bg-transparent p-4"/>
              </ScrollArea>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
