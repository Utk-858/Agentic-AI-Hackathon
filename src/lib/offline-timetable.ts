import { set, get } from 'idb-keyval';

interface TimeSlot {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    time: string;
}

interface Teacher {
    name: string;
    subjects: string[];
    availability: string;
    maxHours: number;
}

interface Room {
    name: string;
    type: 'theory' | 'lab';
    capacity: number;
}

interface Class {
    name: string;
    students: number;
    subjects: string[];
}

interface TimetableEntry {
    time: string;
    subject: string;
    teacher: string;
    class: string;
    room: string;
}

const StorageKeys = {
    TIMETABLE: 'offline_timetable',
    TEACHERS: 'offline_teachers',
    CLASSES: 'offline_classes',
    ROOMS: 'offline_rooms',
};

export async function generateOfflineTimetable(input: any) {
    try {
        const timeSlots = JSON.parse(input.timeSlots);
        const breaks = JSON.parse(input.breaks);
        const subjectsPerClass = JSON.parse(input.subjectsPerClass);
        const faculty = JSON.parse(input.faculty);
        const rooms = JSON.parse(input.rooms);
        const classDetails = JSON.parse(input.classDetails);
        const holidays = JSON.parse(input.holidays);

        // Debug logs for input data
        console.log('Offline Timetable Input:');
        console.log('timeSlots:', timeSlots);
        console.log('breaks:', breaks);
        console.log('subjectsPerClass:', subjectsPerClass);
        console.log('faculty:', faculty);
        console.log('rooms:', rooms);
        console.log('classDetails:', classDetails);
        console.log('holidays:', holidays);

        // Store data locally
        await set(StorageKeys.TEACHERS, faculty);
        await set(StorageKeys.CLASSES, classDetails);
        await set(StorageKeys.ROOMS, rooms);

        const timetable = generateTimetableOffline({
            timeSlots,
            breaks,
            subjectsPerClass,
            faculty,
            rooms,
            classDetails,
            holidays,
        });

        // Store generated timetable
        await set(StorageKeys.TIMETABLE, timetable);

        return timetable;
    } catch (error) {
        console.error('Error generating offline timetable:', error);
        throw error;
    }
}

function generateTimetableOffline(params: any) {
    const { timeSlots, breaks, subjectsPerClass, faculty, rooms, classDetails, holidays } = params;

    // Initialize empty timetable
    const timetable: Record<string, TimetableEntry[]> = {
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
    };

    const days = Object.keys(timetable);
    // Track teacher and room usage, and consecutive lectures
    const teacherHours: Record<string, number> = {};
    const classConsecutive: Record<string, number> = {};
    const lastClassSlot: Record<string, string> = {};
    const teacherLastSlot: Record<string, string> = {};

    // Helper to check if a teacher is available and not over max hours
    function canAssignTeacher(teacher: Teacher, day: string, slot: string) {
        if (!teacher.subjects) return false;
        if (!isTeacherAvailable(teacher, day, slot)) return false;
        if ((teacherHours[teacher.name] || 0) >= teacher.maxHours) return false;
        if (teacherLastSlot[teacher.name] === slot) return false; // Already assigned this slot
        return true;
    }

    // Helper to check consecutive lectures for a class
    function canAssignClass(className: string, slot: string) {
        if (lastClassSlot[className] === slot) return false;
        if ((classConsecutive[className] || 0) >= 3) return false;
        return true;
    }

    // Helper to reset consecutive count if not consecutive slot
    function updateConsecutive(className: string, prevSlot: string, currSlot: string) {
        if (!prevSlot || prevSlot === currSlot) return;
        classConsecutive[className] = 1;
    }

    // For each day
    days.forEach((day: string) => {
        if (holidays.includes(day)) return;

        // For each time slot
        (timeSlots as string[]).forEach((slot: string) => {
            if (breaks.includes(slot)) return;

            // For each class
            (classDetails as Class[]).forEach((classInfo: Class) => {
                const className = classInfo.name;
                const subjects = subjectsPerClass[className];
                let assigned = false;
                // Try to assign a subject/teacher/room
                for (const subject of subjects) {
                    // Prefer grouping labs together
                    const isLab = subject.toLowerCase().includes('lab');
                    const availableTeacher = faculty.find(t => t.subjects.includes(subject) && canAssignTeacher(t, day, slot));
                    if (!availableTeacher) continue;
                    const availableRoom = rooms.find(r => r.capacity >= classInfo.students && (!isLab || r.type === 'lab'));
                    if (!availableRoom) continue;
                    if (isSlotAvailable(timetable[day], slot, className) && canAssignClass(className, slot)) {
                        timetable[day].push({
                            time: slot,
                            subject,
                            teacher: availableTeacher.name,
                            class: className,
                            room: availableRoom.name,
                        });
                        teacherHours[availableTeacher.name] = (teacherHours[availableTeacher.name] || 0) + 1;
                        lastClassSlot[className] = slot;
                        teacherLastSlot[availableTeacher.name] = slot;
                        classConsecutive[className] = (classConsecutive[className] || 0) + 1;
                        assigned = true;
                        break;
                    }
                }
                // If nothing assigned, mark as Free
                if (!assigned && isSlotAvailable(timetable[day], slot, className)) {
                    timetable[day].push({
                        time: slot,
                        subject: 'Free',
                        teacher: '-',
                        class: className,
                        room: '-',
                    });
                    classConsecutive[className] = 0;
                }
            });
        });
    });

    // Optionally: sort each day's entries by time slot order
    for (const day of days) {
        timetable[day].sort((a, b) => timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time));
    }

    return { timetable };
}

function findAvailableTeacher(faculty: Teacher[], subject: string, day: string, slot: string, timetable: Record<string, TimetableEntry[]>) {
    return faculty.find(teacher => {
        // Check if teacher teaches this subject
        if (!teacher.subjects.includes(subject)) return false;

        // Check availability
        if (!isTeacherAvailable(teacher, day, slot)) return false;

        // Check if already teaching at this time
        const teachingHours = countTeachingHours(teacher.name, timetable);
        if (teachingHours >= teacher.maxHours) return false;

        // Check if already assigned in this slot
        const isTeaching = timetable[day].some(entry =>
            entry.time === slot && entry.teacher === teacher.name
        );

        return !isTeaching;
    });
}

function findAvailableRoom(rooms: Room[], students: number, daySchedule: TimetableEntry[], slot: string) {
    return rooms.find(room => {
        if (room.capacity < students) return false;

        const isOccupied = daySchedule.some(entry =>
            entry.time === slot && entry.room === room.name
        );

        return !isOccupied;
    });
}

function isTeacherAvailable(teacher: Teacher, day: string, slot: string): boolean {
    // Robust availability check: handle 'Mon'/'Monday', etc.
    const dayShort = day.slice(0, 3).toLowerCase();
    const availability = teacher.availability.toLowerCase();
    // Accept both 'mon' and 'monday' in availability
    return availability.includes(dayShort) || availability.includes(day.toLowerCase());
}

function isSlotAvailable(daySchedule: TimetableEntry[], slot: string, className: string): boolean {
    return !daySchedule.some(entry =>
        entry.time === slot && entry.class === className
    );
}

function countTeachingHours(teacherName: string, timetable: Record<string, TimetableEntry[]>): number {
    return Object.values(timetable).reduce((total, daySchedule) => {
        return total + daySchedule.filter(entry => entry.teacher === teacherName).length;
    }, 0);
} 