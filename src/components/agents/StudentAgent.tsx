'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Send, X, FileImage, BrainCircuit } from 'lucide-react';
import { conversationalTutor } from '@/ai/flows/conversational-tutor';
import MarkdownRenderer from '../MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import Logo from '../Logo';

interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string | null;
}

const StudentAgent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const tutorSchema = z.object({
    query: z.string(),
  }).refine((data) => data.query.trim() !== '' || !!imageDataUri, {
    message: "Please enter a question or attach an image.",
    path: ["query"],
  });

  const form = useForm<z.infer<typeof tutorSchema>>({
    resolver: zodResolver(tutorSchema),
    defaultValues: { query: '' },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const removeImage = () => {
    setImageDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      reader.onload = (e) => setImageDataUri(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof tutorSchema>) => {
    const { query } = values;
    if (!query.trim() && !imageDataUri) return;

    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: query, image: imageDataUri };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    // Prepare history by stripping image data, which is only sent with the current query
    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const result = await conversationalTutor({
        query,
        imageDataUri,
        history,
      });
      setMessages(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response from the tutor. Please try again.',
      });
      // OPTIONAL: remove the user's message if the API call fails
      setMessages(messages);
    } finally {
      setIsLoading(false);
      // Reset form and image after successful submission
      form.reset({ query: '' });
      removeImage();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            Your AI Learning Assistant
        </CardTitle>
        <CardDescription>Your personal AI tutor. Ask questions in any language, with text or images, and get instant help.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 min-h-0 -mx-6" ref={scrollAreaRef}>
          <div className="px-6 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center p-8 rounded-lg bg-muted/30">
                  <p className="text-lg font-medium">Ready to learn?</p>
                  <p>Ask a question below to start our session.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                {message.role === 'model' && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Logo className="w-5 h-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "p-3 rounded-lg max-w-sm md:max-w-md", 
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {message.image && (
                    <Image src={message.image} alt="User upload" width={200} height={200} className="rounded-md mb-2" />
                  )}
                  <div className="prose prose-sm text-inherit max-w-none">
                    <MarkdownRenderer content={message.content} className="bg-transparent p-0" />
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback><Logo className="w-5 h-5"/></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="pt-2">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {imageDataUri && (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden border">
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
              <div className="relative">
                <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                        <FormItem>
                          <FormControl>
                              <Textarea
                                  placeholder="Ask about a topic, explain this image..."
                                  {...field}
                                  rows={1}
                                  className="pr-[110px] min-h-[40px]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !isLoading && form.formState.isValid) {
                                      e.preventDefault();
                                      form.handleSubmit(onSubmit)();
                                    }
                                  }}
                              />
                          </FormControl>
                          <FormMessage className="absolute -bottom-5 text-xs" />
                        </FormItem>
                    )}
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Attach image" disabled={isLoading}>
                       <FileImage className="h-5 w-5"/>
                    </Button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                     />
                    <Button type="button" size="icon" variant="ghost" disabled title="Use microphone (coming soon)">
                        <Mic className="h-5 w-5"/>
                    </Button>
                    <Button type="submit" size="icon" disabled={isLoading || !form.formState.isValid} title="Send">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export default StudentAgent;
