import useApi from "../../hooks/useApi";
import { RatingEndpointsV1 } from "./constants";
import { SubmitCourseDto } from "./types";

const useRatingService = () => {
    const { callApi, loading, error } = useApi();

    const submitCourseRating = async (course: SubmitCourseDto) => {
        return await callApi({
            method: "post",
            url: `${RatingEndpointsV1.submitCourseRating}/${course.id}/rate`,
            data: { "rating": course.rating, "feedback": course.feedback }
        });
    }

    const getCourseRating = async (courseId: number) => {
        return await callApi({
            method: "get",
            url: `${RatingEndpointsV1.submitCourseRating}/${courseId}/ratings`,
        });
    }
    return {
        submitCourseRating,
        getCourseRating,
        loading,
        error,
    };
};

export default useRatingService;
