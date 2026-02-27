import { create } from 'zustand';
import type { SyllabusSchema } from '../types/course';

interface CourseStore {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;

  selectedCourseId: number | null;
  selectedCourseName: string | null;
  setSelectedCourse: (id: number, name: string) => void;
  clearSelectedCourse: () => void;

  parsedSyllabus: SyllabusSchema | null;
  newCourseName: string | null;
  setParsedSyllabus: (syllabus: SyllabusSchema, courseName: string) => void;
  clearParsedSyllabus: () => void;

  currentSubtopicId: number | null;
  currentSubtopicName: string | null;
  learningPhase: 1 | 2 | 3;
  hintsUsed: number;
  iDoContent: string | null;
  setCurrentSubtopic: (id: number, name: string) => void;
  setLearningPhase: (phase: 1 | 2 | 3) => void;
  setIDoContent: (content: string) => void;
  incrementHints: () => void;
  resetLearningSession: () => void;
}

export const useCourseStore = create<CourseStore>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),

  selectedCourseId: null,
  selectedCourseName: null,
  setSelectedCourse: (id, name) => set({ selectedCourseId: id, selectedCourseName: name }),
  clearSelectedCourse: () => set({ selectedCourseId: null, selectedCourseName: null }),

  parsedSyllabus: null,
  newCourseName: null,
  setParsedSyllabus: (syllabus, courseName) =>
    set({ parsedSyllabus: syllabus, newCourseName: courseName }),
  clearParsedSyllabus: () => set({ parsedSyllabus: null, newCourseName: null }),

  currentSubtopicId: null,
  currentSubtopicName: null,
  learningPhase: 1,
  hintsUsed: 0,
  iDoContent: null,
  setCurrentSubtopic: (id, name) => set({ currentSubtopicId: id, currentSubtopicName: name }),
  setLearningPhase: (phase) => set({ learningPhase: phase }),
  setIDoContent: (content) => set({ iDoContent: content }),
  incrementHints: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
  resetLearningSession: () =>
    set({ learningPhase: 1, hintsUsed: 0, iDoContent: null, currentSubtopicId: null, currentSubtopicName: null }),
}));
