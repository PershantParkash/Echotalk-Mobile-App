export type CreateCourseDto = Partial<{
  title: string;
  tagline: string;
  description: string;
  whatYouLearn: string[],
  requirements: string,
  expertiseLevel:string,
  previewVideoUrl: string;
  thumbnail: string;
  price: number;
  discount: number;
  isPublished: boolean;
  isFree: boolean;
  isDraft: boolean;
  keywords: string[]; 
}>;

export type UpdateCourseDto = {
  courseId: number;
  title?: string;
  tagline?: string;
  whatYouLearn?: string[],
  requirements?: string,
  expertiseLevel?:string,
  description?: string;
  previewVideoUrl?: string;
  thumbnail?: string;
  price?: number;
  discount?: number;
  isPublished?: boolean;
  isFree?: boolean;
  isDraft?: boolean;
  keywords?: string[]; 
};

