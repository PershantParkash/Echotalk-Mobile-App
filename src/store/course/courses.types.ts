export type CourseError = Partial<{
  title: string;
  tagline: string;
  description: string;
  whatYouLearn: (string | undefined)[];
  requirements: string;
  expertiseLevel: string;
}>;

export type CourseReducerState = {
  readonly newCourse: Course;
  readonly newChapter: Chapter;
  readonly newLesson: Lesson;
  readonly chapters: Chapter[];
  readonly lessonSelection: LessonType | null;
  readonly activeTrainerTab: string;
};

export enum TrainerCurrentStep {
  Overview = "Overview",
  Curriculum = "Curriculum",
  SEO = "SEO",
  Pricing = "Pricing",
  Publish = "Publish",
}

export interface CourseProgress {
  progressPercentage: string;
  completedLessonIds: number[];
  lastWatchedLesson: {
    id: number;
    title: string;
  };
  lastWatchedPosition: number;
  isCompleted: boolean;
}


export type Course = {
  id: string | number;
  title: string;
  author?: string;
  instructor?: string; 
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  modules?: number;
  image?: string;
  thumbnail?: string; 
  coverImage?: string;
  progress?: number;
  currentLesson?: number;
  totalLessons?: number;
}

export type Chapter = {
  id: number;
  position: number;
  title: string;
  lessons: Lesson[];
  isOpen: boolean;
};

export interface QuizOption {
  id?: number;
  optionText: string;
  isCorrect: boolean;
  position: number;
}

export interface QuizQuestion {
  id?: number;
  question: string;
  position: number;
  options: QuizOption[];
}

export interface Lesson {
  id: number;
  title: string;
  lessonType: 'video' | 'text' | 'pdf' | 'quiz'; 
  videoSrc?: string;
  pdfSrc?: string;
  textContent?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  position: number;
  isFreeLesson: boolean;
  isAssignment: boolean;
  quizQuestions?: QuizQuestion[]; 
}


export type FetchedCourse = Partial<{
  id: number;
  title: string;
  tagline: string;
  description: string;
  previewVideoUrl: string;
  thumbnail: string;
  duration: number;
  lessons: number;
  assignments: boolean;
  rating: number;
  ratingCount: number;
  price: number;
  isFree: boolean;
  isDraft: boolean;
  discount: number;
  isPublished: boolean;
  updatedAt: Date;
  createdAt: Date;
  keywords: string[];
  whatYouLearn: string[];
  requirements: string;
  expertiseLevel: string;
  progress: CourseProgress | null; 
  chapters: FetchedChapters[];
}>;

export interface CourseCardProps {
  course: Partial<FetchedCourse>;
}

export type FetchedChapters = {
  id: number;
  title: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
  isOpen: boolean;
  lessons: FetchedLesson[];
};

export type FetchedLesson = {
  id: number;
  title: string;
  type: "video" | "text" | "pdf" | "quiz";
  duration: number;
  position: number;
  videoSrc: string;
  thumbnail: string;
  pdfSrc: string;
  textContent: string;
  videoDuration: number;
  isFreeLesson: boolean;
  isAssignment: boolean;
  isCompleted: boolean;
  lessonType: string;
  videoThumbnail?: string;
   quizQuestions?: Array<{
    id: number;
    question: string;
    position: number;
    options: Array<{
      id: number;
      optionText: string;
      isCorrect: boolean;
      position: number;
    }>;
  }>;
}


export type ChapterType = {
  id: number;
  title: string;
  position: number;
   lessons: FetchedLesson[];
};

export type FetchedDetailedCourse = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  whatYouLearn: string[];
  requirements: string;
  expertiseLevel: string;
  previewVideoUrl: string;
  thumbnail: string;
  duration: number;
  lessons: number;
  assignments: boolean;
  rating: number;
  ratingCount: number;
  price: number;
  isFree: boolean;
  isDraft: boolean;
  discount: number;
  isPublished: boolean;
  updatedAt: Date;
  createdAt: Date;
  keywords: string[];
  chapters: FetchedChapters[];
  trainer: {
    id: number;
    fullName: string;
    email: string;
    profileImage: string;
  };
  progress?: CourseProgress; 
};

export enum LessonType {
  video = "video",
  text = "text",
  pdf = "pdf",
  quiz = "quiz",
}

export interface ActionType {
  type: string;
  payload?: any;
}

interface User {
  id: number;
  fullName: string;
  email: string;
  profileImage: string | null;
}

export interface CourseReview {
  id: number;
  rating: number;
  feedback: string;
  createdAt: string;
  user: User;
}

export const SET_UPDATE_COURSE = "SET_UPDATE_COURSE";
export const SET_UPDATE_CHAPTER = "SET_UPDATE_CHAPTER";
export const SET_UPDATE_LESSON = "SET_UPDATE_LESSON";
export const SET_UPDATE_ALL_CHAPTERS = "SET_UPDATE_ALL_CHAPTERS";
export const RESET_NEW_COURSE = "RESET_NEW_COURSE";
export const RESET_NEW_CHAPTER = "RESET_NEW_CHAPTER";
export const RESET_NEW_LESSON = "RESET_NEW_LESSON";
export const SET_LESSON_TYPE = "SET_LESSON_TYPE";
export const SET_ACTIVE_TRAINER_TAB = "SET_ACTIVE_TRAINER_TAB";
export const SET_UPDATE_LESSON_QUIZ = "SET_UPDATE_LESSON_QUIZ";
export const SET_UPDATE_LESSON_FIELD = "SET_UPDATE_LESSON_FIELD";
