import {z} from 'zod';

export const GenerateTimetableInputSchema = z.object({
  subjectsPerClass: z.string().describe('A JSON string detailing subjects for each class. E.g., \'{"Class 1": ["Math", "Science"], "Class 2": ["English"]}\''),
  faculty: z.string().describe('A JSON string of faculty details, including name, subjects, availability, and max hours.'),
  rooms: z.string().describe('A JSON string listing available rooms with their type and capacity.'),
  holidays: z.string().describe('A JSON string listing holidays or blocked-off slots.'),
  classDetails: z.string().describe('A JSON string with details for each class, including batch name and student count.'),
  timeSlots: z.string().describe('A JSON string defining the daily time slots, e.g., \'["09:00-10:00", "10:00-11:00"]\''),
  breaks: z.string().describe('A JSON string listing daily break times that apply to all classes and teachers, e.g., \'["12:00-13:00"]\'. These slots must be kept free in the schedule.'),
  specialDemands: z.string().optional().describe('Any special requests or other important considerations from the teacher in natural language, e.g., "Mr. Rao prefers not to have classes after 14:00" or "No tests on Mondays".')
});
export type GenerateTimetableInput = z.infer<typeof GenerateTimetableInputSchema>;

const TimetableSlotSchema = z.object({
    time: z.string().describe("The time slot for the class."),
    class: z.string().describe("The class that is scheduled."),
    subject: z.string().describe("The subject being taught."),
    teacher: z.string().describe("The teacher for the class."),
    room: z.string().describe("The room where the class is held."),
});

export const GenerateTimetableOutputSchema = z.object({
    timetable: z.object({
        Monday: z.array(TimetableSlotSchema).describe("Timetable for Monday."),
        Tuesday: z.array(TimetableSlotSchema).describe("Timetable for Tuesday."),
        Wednesday: z.array(TimetableSlotSchema).describe("Timetable for Wednesday."),
        Thursday: z.array(TimetableSlotSchema).describe("Timetable for Thursday."),
        Friday: z.array(TimetableSlotSchema).describe("Timetable for Friday."),
    }).describe("The generated 5-day weekly timetable.")
});
export type GenerateTimetableOutput = z.infer<typeof GenerateTimetableOutputSchema>;

export const WorksheetAutoCorrectorInputSchema = z.object({
  studentWorksheetDataUri: z
    .string()
    .describe(
      "An image of the student's completed worksheet, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  answerKeyDataUri: z
    .string()
    .describe(
        "An image of the correct answer key for the worksheet, as a data URI."
    ),
  language: z.string().describe('The language for the generated feedback.'),
  specialRequest: z.string().optional().describe('Any special requests for the grading process, e.g., "Be lenient with spelling."'),
});
export type WorksheetAutoCorrectorInput = z.infer<typeof WorksheetAutoCorrectorInputSchema>;

export const WorksheetAutoCorrectorOutputSchema = z.object({
    score: z.number().describe("The total score the student achieved."),
    total: z.number().describe("The total possible score for the worksheet."),
    feedback: z.string().describe("Detailed feedback on incorrect answers, formatted in markdown."),
});
export type WorksheetAutoCorrectorOutput = z.infer<typeof WorksheetAutoCorrectorOutputSchema>;
