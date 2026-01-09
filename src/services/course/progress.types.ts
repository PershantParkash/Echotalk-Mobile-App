export interface UpdateCourseProgressDto {
  lessonId: number;
  watchPosition?: number;
}

export interface LastWatchedLesson {
  id: number;
  title: string;
}

export interface UpdateProgressResponse {
  message: string;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface MarkLessonCompletedResponse {
  message: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
}

export interface UserCourseProgress {
  courseId: number;
  courseTitle: string;
  progressPercentage: number;
  completedLessons: number;
  lastWatchedLesson: LastWatchedLesson | null;
  isCompleted: boolean;
  updatedAt: Date | string;
}
