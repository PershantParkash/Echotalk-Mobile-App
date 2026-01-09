import useApi from "../../hooks/useApi";
import { CourseEndpointsV1 } from "./constants";
import { CreateCourseDto, UpdateCourseDto } from "./types";
import {
  UpdateCourseProgressDto,
  UpdateProgressResponse,
  MarkLessonCompletedResponse,
} from "./progress.types";

const useCourseService = () => {
  const { callApi, loading, error } = useApi();

  const getAllCourses = async () => {
    return await callApi({
      method: "get",
      url: CourseEndpointsV1.getAllCourses,
    });
  };

  const getAllUserCourses = async (
    page: number,
    limit: number,
    sortBy: string,
    sortDirection: string,
    search?: string,
    ratings?: number[],
    priceRange?: number[], // must be exactly two numbers: [min, max]
    expertiseLevels?: string[]
  ) => {
    const params = new URLSearchParams();

    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);

    if (search) {
      params.append("search", search);
    }

    if (ratings && ratings.length > 0) {
      ratings
        .filter((r) => typeof r === "number" && r >= 0 && r <= 5)
        .forEach((rating) => {
          params.append("ratings", rating.toString());
        });
    }

    if (priceRange && priceRange.length === 2) {
      priceRange
        .filter((p) => typeof p === "number" && p >= 0)
        .forEach((price) => {
          params.append("priceRange", price.toString());
        });
    }

    // Send expertiseLevels as multiple params: expertiseLevels=beginner&expertiseLevels=advanced
    if (expertiseLevels && expertiseLevels.length > 0) {
      expertiseLevels.forEach((level) => {
        params.append("expertiseLevels", level);
      });
    }

    return await callApi({
      method: "get",
      url: `${CourseEndpointsV1.getAllUserCourses}?${params.toString()}`,
    });
  };

  const getCourseDetails = async (courseId: number) => {
    return await callApi({
      method: "get",
      url: `${CourseEndpointsV1.getCourseDetails}/${courseId}`,
    });
  };

  const createCourse = async (course: CreateCourseDto) => {
    return await callApi({
      method: "post",
      url: CourseEndpointsV1.createCourse,
      data: course,
    });
  };

  const updateCourse = async (course: UpdateCourseDto) => {
    return await callApi({
      method: "put",
      url: CourseEndpointsV1.updateCourse,
      data: course,
    });
  };

  const logWatchTime = async (courseId: number) => {
    return await callApi({
      method: "put",
      url: `${CourseEndpointsV1.logWatchTime}/${courseId}/log-watch-time?seconds=10`,
    });
  };

  const totalUserProgress = async () => {
    return await callApi({
      method: "get",
      url: `${CourseEndpointsV1.totalUserProgress}`,
    });
  };

  const updateCourseProgress = async (
    courseId: number,
    lessonId: number,
    watchPosition?: number
  ): Promise<UpdateProgressResponse> => {
    const data: UpdateCourseProgressDto = { lessonId, watchPosition };
    return await callApi({
      method: "put",
      url: `${CourseEndpointsV1.updateProgress}/${courseId}/progress`,
      data,
    });
  };

  const markLessonCompleted = async (
    courseId: number,
    lessonId: number
  ): Promise<MarkLessonCompletedResponse> => {
    return await callApi({
      method: "post",
      url: `${CourseEndpointsV1.markLessonCompleted}/${courseId}/lessons/${lessonId}/complete`,
    });
  };

  return {
    getAllCourses,
    getAllUserCourses,
    getCourseDetails,
    createCourse,
    updateCourse,
    logWatchTime,
    totalUserProgress,
    updateCourseProgress,
    markLessonCompleted,
    loading,
    error,
  };
};

export default useCourseService;
