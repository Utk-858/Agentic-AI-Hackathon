'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CalendarDays, PlusCircle, X, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { generateTimetable } from '@/ai/flows/generate-timetable';
import type { GenerateTimetableInput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useTeacherState } from '@/context/TeacherStateContext';
import { generateOfflineTimetable } from '@/lib/offline-timetable';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface TimetableEntry {
  time: string;
  class: string;
  subject: string;
  teacher: string;
  room: string;
}

interface TimetableResult {
  timetable: Record<string, TimetableEntry[]>;
}

const formSchema = z.object({
  timeSlots: z.array(z.object({ value: z.string().min(1, 'Time slot cannot be empty.') })),
  breaks: z.array(z.object({ value: z.string().min(1, 'Break time cannot be empty.') })).min(1, 'At least one break is required.'),
  classes: z.array(z.object({
    name: z.string().min(1, 'Class name is required.'),
    students: z.coerce.number().min(1, 'Number of students is required.'),
    subjects: z.string().min(1, 'Enter at least one subject.')
  })),
  faculty: z.array(z.object({
    name: z.string().min(1, 'Faculty name is required.'),
    subjects: z.string().min(1, 'Enter at least one subject.'),
    availability: z.string().min(1, 'Availability is required.'),
    maxHours: z.coerce.number().min(1, 'Max hours are required.'),
  })),
  rooms: z.array(z.object({
    name: z.string().min(1, 'Room name is required.'),
    type: z.enum(['theory', 'lab']),
    capacity: z.coerce.number().min(1, 'Capacity is required.'),
  })),
  holidays: z.array(z.object({ value: z.string() })),
  specialDemands: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DynamicInputList = ({ control, name, label, buttonText }: { control: any, name: any, label: string, buttonText: string }) => {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`${name}.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  );
};


export default function TimetablePage() {
  const { state, setTimetableState } = useTeacherState();
  const { result, isLoading, isPreviewOpen } = state.timetable;
  const { toast } = useToast();
  const timetableRef = useRef<HTMLDivElement>(null);
  const { online: isOnline } = useNetworkStatus();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeSlots: [
        { value: '09:00-10:00' }, { value: '10:00-11:00' }, { value: '11:00-12:00' },
        { value: '13:00-14:00' }, { value: '14:00-15:00' }, { value: '15:00-16:00' }
      ],
      breaks: [{ value: '12:00-13:00' }],
      classes: [
        { name: 'Class 4A', students: 28, subjects: 'Math, English, Science, Hindi' },
        { name: 'Class 5B', students: 25, subjects: 'Math, English, Science, History, Art' }
      ],
      faculty: [
        { name: 'Mr. Rao', subjects: 'Math, Science', availability: 'Mon-Fri 09:00-16:00', maxHours: 20 },
        { name: 'Ms. Singh', subjects: 'English, History', availability: 'Mon,Tue,Thu 10:00-16:00', maxHours: 18 },
        { name: 'Mrs. Gupta', subjects: 'Hindi, Art', availability: 'Wed,Fri', maxHours: 12 }
      ],
      rooms: [
        { name: 'Room 101', type: 'theory', capacity: 30 },
        { name: 'Room 102', type: 'theory', capacity: 30 },
        { name: 'Science Lab', type: 'lab', capacity: 25 }
      ],
      holidays: [],
      specialDemands: '',
    },
  });

  const { fields: classFields, append: appendClass, remove: removeClass } = useFieldArray({ control: form.control, name: 'classes' });
  const { fields: facultyFields, append: appendFaculty, remove: removeFaculty } = useFieldArray({ control: form.control, name: 'faculty' });
  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({ control: form.control, name: 'rooms' });

  const onSubmit = async (values: FormValues) => {
    setTimetableState({ isLoading: true, result: null });

    try {
      const subjectsPerClass = values.classes.reduce((acc, curr) => {
        acc[curr.name] = curr.subjects.split(',').map(s => s.trim()).filter(s => s);
        return acc;
      }, {} as Record<string, string[]>);

      const classDetails = values.classes.map(({ name, students }) => ({ name, students }));

      const facultyDetails = values.faculty.map(({ name, subjects, availability, maxHours }) => ({
        name,
        subjects: subjects.split(',').map(s => s.trim()).filter(s => s),
        availability,
        maxHours
      }));

      const apiInput: GenerateTimetableInput = {
        timeSlots: JSON.stringify(values.timeSlots.map(ts => ts.value)),
        breaks: JSON.stringify(values.breaks.map(b => b.value)),
        subjectsPerClass: JSON.stringify(subjectsPerClass),
        classDetails: JSON.stringify(classDetails),
        faculty: JSON.stringify(facultyDetails),
        rooms: JSON.stringify(values.rooms),
        holidays: JSON.stringify(values.holidays.map(h => h.value)),
        specialDemands: values.specialDemands,
      };

      let response: TimetableResult;
      console.log('onSubmit isOnline:', isOnline);
      if (isOnline) {
        // Online: Use AI-powered generation
        response = await generateTimetable(apiInput);
      } else {
        // Offline: Use local constraint-based algorithm
        response = await generateOfflineTimetable(apiInput);
      }

      setTimetableState({ result: response });
      toast({
        title: "Success!",
        description: `Your timetable has been generated ${!isOnline ? ' (offline mode)' : ''}. Click 'Preview Timetable' to view it.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error.message || 'Failed to generate the timetable. Please check your inputs and try again.',
      });
    } finally {
      setTimetableState({ isLoading: false });
    }
  };

  const handleDownloadPdf = () => {
    const input = timetableRef.current;
    if (input) {
      setTimetableState({ isLoading: true });
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4', true); // landscape
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 15;
        pdf.setFontSize(20);
        pdf.text('Weekly Timetable', pdfWidth / 2, 10, { align: 'center' });
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save('timetable.pdf');
        setTimetableState({ isLoading: false });
      });
    }
  };

  const daysOfWeek = result ? Object.keys(result.timetable) : [];
  const breakSlots = form.getValues('breaks').map(b => b.value);
  const classTimeSlots = form.getValues('timeSlots').map(ts => ts.value);
  const allTimeSlots = result ? [...new Set([...classTimeSlots, ...breakSlots])].sort() : [];

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold flex items-center justify-center gap-2">
            <CalendarDays />
            Smart Timetable Generator
            {!isOnline && <span className="text-sm font-normal px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">(Offline Mode)</span>}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isOnline
              ? "Automate weekly schedules based on subjects, faculty, and room constraints."
              : "Generate clash-free timetables even without internet connectivity."}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Scheduling Inputs</CardTitle><CardDescription>Fill in all the details below. You can add or remove items in each section.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <DynamicInputList control={form.control} name="timeSlots" label="Class Time Slots" buttonText="Add Time Slot" />
                <Separator />

                <DynamicInputList control={form.control} name="breaks" label="Breaks (e.g., Lunch)" buttonText="Add Break" />
                <Separator />

                <FormLabel>Classes</FormLabel>
                {classFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeClass(index)}><X className="h-4 w-4" /></Button>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <FormField control={form.control} name={`classes.${index}.name`} render={({ field }) => <FormItem><FormLabel>Class Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Class 4A" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`classes.${index}.students`} render={({ field }) => <FormItem><FormLabel>No. of Students</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`classes.${index}.subjects`} render={({ field }) => <FormItem><FormLabel>Subjects (comma-separated)</FormLabel><FormControl><Input {...field} placeholder="e.g. Math, Science, Art" /></FormControl><FormMessage /></FormItem>} />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendClass({ name: '', students: 30, subjects: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Class</Button>
                <Separator />

                <FormLabel>Faculty</FormLabel>
                {facultyFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeFaculty(index)}><X className="h-4 w-4" /></Button>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <FormField control={form.control} name={`faculty.${index}.name`} render={({ field }) => <FormItem><FormLabel>Faculty Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Mr. Rao" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`faculty.${index}.subjects`} render={({ field }) => <FormItem><FormLabel>Subjects (comma-separated)</FormLabel><FormControl><Input {...field} placeholder="e.g. Math, Science" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`faculty.${index}.availability`} render={({ field }) => <FormItem><FormLabel>Availability</FormLabel><FormControl><Input {...field} placeholder="e.g. Mon-Fri 09:00-15:00" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`faculty.${index}.maxHours`} render={({ field }) => <FormItem><FormLabel>Max Weekly Hours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendFaculty({ name: '', subjects: '', availability: '', maxHours: 20 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Faculty</Button>
                <Separator />

                <FormLabel>Rooms</FormLabel>
                {roomFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative bg-muted/20">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeRoom(index)}><X className="h-4 w-4" /></Button>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <FormField control={form.control} name={`rooms.${index}.name`} render={({ field }) => <FormItem><FormLabel>Room Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Room 101" /></FormControl><FormMessage /></FormItem>} />
                      <FormField control={form.control} name={`rooms.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="theory">Theory</SelectItem><SelectItem value="lab">Lab</SelectItem></SelectContent>
                          </Select>
                          <FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`rooms.${index}.capacity`} render={({ field }) => <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendRoom({ name: '', type: 'theory', capacity: 30 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Room</Button>
                <Separator />

                <DynamicInputList control={form.control} name="holidays" label="Holidays (Optional)" buttonText="Add Holiday" />
                <Separator />

                <FormField
                  control={form.control}
                  name="specialDemands"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Demands (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Mr. Rao prefers not to teach after 2 PM.' or 'Try to keep Friday afternoons free for activities.'"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Timetable'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setTimetableState({ isPreviewOpen: true })} disabled={!result || isLoading} className="w-full" size="lg">
                Preview Timetable
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={(isOpen) => setTimetableState({ isPreviewOpen: isOpen })}>
        <DialogContent className="max-w-[90vw] md:max-w-7xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generated Timetable Preview</DialogTitle>
            <DialogDescription>
              Here is the AI-generated schedule based on your inputs. You can download it as a PDF.
            </DialogDescription>
          </DialogHeader>

          {isLoading && !result && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
              <p className="text-lg font-medium">Generating...</p>
              <p>This may take a few moments.</p>
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-y-auto">
              <div ref={timetableRef} className="p-4 bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Time</TableHead>
                      {daysOfWeek.map(day => <TableHead key={day}>{day}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTimeSlots.map((slot) => {
                      if (breakSlots.includes(slot)) {
                        return (
                          <TableRow key={slot} className="bg-muted/50 hover:bg-muted/50">
                            <TableCell className="font-medium">{slot}</TableCell>
                            <TableCell colSpan={daysOfWeek.length} className="text-center font-semibold text-muted-foreground tracking-widest">
                              BREAK
                            </TableCell>
                          </TableRow>
                        )
                      }
                      return (
                        <TableRow key={slot}>
                          <TableCell className="font-medium">{slot}</TableCell>
                          {daysOfWeek.map(day => {
                            const event = (result.timetable as any)[day]?.find((e: any) => e.time === slot);
                            return (
                              <TableCell key={`${day}-${slot}`}>
                                {event ? (
                                  <div className="text-xs p-2 rounded-md bg-muted border hover:shadow-md transition-shadow">
                                    <p className="font-bold text-primary">{event.subject}</p>
                                    <p className="text-sm font-semibold flex items-center gap-1">
                                      👩‍🏫 {event.teacher === '-' ? 'Self Study' : event.teacher}
                                    </p>
                                    <p className="text-muted-foreground">{event.class}</p>
                                    <p className="text-xs text-muted-foreground italic">({event.room})</p>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/30 border border-dashed">
                                    Free Period
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 sm:justify-end">
            <Button variant="outline" onClick={() => setTimetableState({ isPreviewOpen: false })}>Close</Button>
            <Button onClick={handleDownloadPdf} disabled={isLoading || !result}>
              {isLoading && result ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</> : <><Download className="mr-2 h-4 w-4" /> Download PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
