import { API } from "@/lib/axios";

type Props = {
    tour_id?: number;
    page?: number;
    rating?: number;
    search?: string | null;
};

export const getReviewes = async ({ page, rating, search, tour_id }: Props) => {
    try {
        let query = "reviews?";
        if (tour_id) {
            query += `tour_id=${tour_id}&`;
        }
        if (page) {
            query += `page=${page}&`;
        }
        if (rating) {
            query += `rating=${rating}&`;
        }
        if (search) {
            query += `search=${search}&`;
        }
        const response = await API.get(query);
        return response.data;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw error;
    }
};
