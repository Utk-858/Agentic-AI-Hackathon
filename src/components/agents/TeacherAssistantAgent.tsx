'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Send, Play, Pause, FileImage, X, Square } from 'lucide-react';
import { teacherAssistant } from '@/ai/flows/teacher-assistant';
import HtmlRenderer from '../HtmlRenderer';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import Logo from '../Logo';

interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string | null;
  media?: string | null;
}

interface PlaybackState {
  isPlaying: boolean;
  messageIndex: number | null;
}

export default function TeacherAssistantAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({ isPlaying: false, messageIndex: null });
  const [isRecording, setIsRecording] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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

  const stopCurrentAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
    setPlaybackState({ isPlaying: false, messageIndex: null });
  };

  const togglePlayback = (messageIndex: number, mediaUrl: string) => {
    if (playbackState.isPlaying && playbackState.messageIndex === messageIndex) {
        stopCurrentAudio();
    } else {
        stopCurrentAudio();
        const audio = new Audio(mediaUrl);
        audioRef.current = audio;
        audio.onplay = () => setPlaybackState({ isPlaying: true, messageIndex });
        audio.onpause = () => setPlaybackState({ isPlaying: false, messageIndex: null });
        audio.onended = () => setPlaybackState({ isPlaying: false, messageIndex: null });
        audio.play();
    }
  };

  const submitQuery = async ({ audioDataUri }: { audioDataUri?: string }) => {
    stopCurrentAudio();
    setIsLoading(true);

    const userMessage: Message = { 
      role: 'user', 
      content: audioDataUri ? '[Audio Message]' : query, 
      image: imageDataUri 
    };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    const history = messages.map(({ role, content }) => ({ role, content }));

    try {
      const result = await teacherAssistant({ 
        query: audioDataUri ? undefined : query,
        audioDataUri,
        history, 
        imageDataUri,
      });
      setMessages(prev => [...prev, { role: 'model', content: result.response, media: result.media }]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to get a response. Please try again.',
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
      if (!audioDataUri) {
        setQuery('');
        removeImage();
      }
    }
  };

  const startRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
      };
      
      mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
              const base64Audio = reader.result as string;
              if (base64Audio) submitQuery({ audioDataUri: base64Audio });
          };
          stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
          variant: 'destructive',
          title: 'Microphone access denied',
          description: 'Please allow microphone access in your browser settings to use this feature.',
      });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !imageDataUri) return;
    submitQuery({});
  };

  return (
    <Card className="w-full h-full flex flex-col">
       <CardContent className="flex-1 flex flex-col gap-4 min-h-0 pt-6">
        <ScrollArea className="flex-1 min-h-0 -mx-6" ref={scrollAreaRef}>
          <div className="px-6 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center p-8 rounded-lg bg-muted/30">
                  <p className="text-lg font-medium">Hello! I'm ShikshaSahayak.</p>
                  <p>How can I help you prepare for your class today?</p>
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
                  "p-3 rounded-lg max-w-sm md:max-w-md flex items-start gap-2", 
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                    <div className="flex-1 prose prose-sm text-inherit max-w-none space-y-2">
                        {message.image && (
                            <Image src={message.image} alt="User upload" width={200} height={200} className="rounded-md" />
                        )}
                        {message.content && <HtmlRenderer content={message.content} className="bg-transparent p-0" />}
                    </div>
                  {message.role === 'model' && message.media && (
                    <Button onClick={() => togglePlayback(index, message.media!)} size="icon" variant="ghost" className="shrink-0">
                      {playbackState.isPlaying && playbackState.messageIndex === index ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  )}
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
          <form onSubmit={handleTextSubmit} className="space-y-2">
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
                <Textarea
                placeholder="Ask for ideas, simplify a topic, or use the mic..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={1}
                className="pr-[150px] min-h-[40px]"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleTextSubmit(e as any);
                    }
                }}
                disabled={isLoading || isRecording}
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Attach image" disabled={isLoading || isRecording}>
                       <FileImage className="h-5 w-5"/>
                    </Button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        disabled={isLoading || isRecording}
                     />
                    <Button type="button" size="icon" variant="ghost" onClick={startRecording} disabled={isLoading} title={isRecording ? "Stop Recording" : "Start Recording"}>
                        {isRecording ? <Square className="h-5 w-5 fill-red-500 text-red-500 animate-pulse" /> : <Mic className="h-5 w-5"/>}
                    </Button>
                    <Button type="submit" size="icon" disabled={isLoading || (!query.trim() && !imageDataUri) || isRecording} title="Send">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
              </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
