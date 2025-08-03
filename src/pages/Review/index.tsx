import { API } from "@/lib/axios";
import { getReviewes } from "@/services/review/get-reviewes";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface Review {
    review_id: number;
    user_id: number;
    tour_id: number;
    rating: number;
    comment: string;
    created_at: string;
    is_deleted: string;
    user: {
        id: number;
        full_name: string;
        email: string;
        avatar: string;
        phone: string;
        is_verified: boolean;
    };
    tour: {
        tour_name: string;
    };
}

// interface ReviewsResponse {
//     data: Review[];
//     total: number;
//     current_page: number;
//     last_page: number;
// }

const Review = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [tours, setTours] = useState<
        { tour_id: number; tour_name: string }[]
    >([]);
    const [isRefetching, setIsRefetching] = useState(false);
    const tourId = useMemo(
        () =>
            searchParams.get("tour_id")
                ? Number(searchParams.get("tour_id"))
                : 0,
        [searchParams]
    );
    const page = useMemo(
        () => (searchParams.get("page") ? Number(searchParams.get("page")) : 1),
        [searchParams]
    );
    const rating = useMemo(
        () =>
            searchParams.get("rating") ? Number(searchParams.get("rating")) : 0,
        [searchParams]
    );
    const search = useMemo(
        () => (searchParams.get("search") ? searchParams.get("search") : ""),
        [searchParams]
    );
    const [filters, setFilters] = useState({
        tour_id: tourId,
        page: page,
        rating: rating,
        search: search,
    });

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                tour_id: tourId,
                page: page,
                rating: rating,
                search: search,
            };

            const response = await getReviewes(params);
            console.log("Fetched reviews:", response);
            setReviews(response?.data?.data || []);
            setTotalPages(response.last_page || 1);
        } catch (err) {
            setError("Có lỗi xảy ra khi tải dữ liệu reviews");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateSearchParams = (newParams: Partial<typeof filters>) => {
        const updatedParams = new URLSearchParams(searchParams);

        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== 0) {
                updatedParams.set(key, value.toString());
            } else {
                updatedParams.delete(key);
            }
        });

        setSearchParams(updatedParams);
    };

    const handleFilterChange = (
        key: keyof typeof filters,
        value: number | string
    ) => {
        const newFilters = { ...filters, [key]: value };

        if (key !== "page") {
            newFilters.page = 1;
        }

        setFilters(newFilters);
        updateSearchParams(newFilters);
    };

    const handleResetFilters = () => {
        const resetFilters = {
            tour_id: 0,
            page: 1,
            rating: 0,
            search: "",
        };
        setFilters(resetFilters);
        setSearchParams({});
    };

    const handlePageChange = (newPage: number) => {
        handleFilterChange("page", newPage);
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 border rounded ${
                        i === page
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    const handleDelete = async (id: number) => {
        try {
            if (!id) return;
            await API.delete(`reviews/${id}`);
            setIsRefetching(!isRefetching);
        } catch (error) {
            console.error("Error deleting review:", error);
            setError("Có lỗi xảy ra khi xóa review");
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [searchParams, tourId, page, rating, search, isRefetching]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await API.get("tours");
                console.log("Fetched tours:", response.data);
                setTours(response.data || []);
            } catch (error) {
                console.error("Error fetching tours:", error);
            }
        };
        fetch();
    }, []);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-10">Quản lý Reviews</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6 mt-4">
                <h2 className="text-xl font-semibold mb-4">Bộ lọc</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tour
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.tour_id || ""}
                            onChange={(e) =>
                                handleFilterChange("tour_id", e.target.value)
                            }
                        >
                            <option value="">Chọn tour</option>
                            {tours?.length
                                ? (tours || []).map((i) => {
                                      return (
                                          <option
                                              key={i?.tour_id}
                                              value={i.tour_id}
                                          >
                                              {i.tour_name}
                                          </option>
                                      );
                                  })
                                : null}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                        </label>
                        <select
                            value={filters.rating}
                            onChange={(e) =>
                                handleFilterChange(
                                    "rating",
                                    Number(e.target.value)
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>Tất cả rating</option>
                            <option value={1}>1 sao</option>
                            <option value={2}>2 sao</option>
                            <option value={3}>3 sao</option>
                            <option value={4}>4 sao</option>
                            <option value={5}>5 sao</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            value={filters.search || ""}
                            onChange={(e) =>
                                handleFilterChange("search", e.target.value)
                            }
                            placeholder="Nhập từ khóa tìm kiếm"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end text-white">
                        <button
                            onClick={handleResetFilters}
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Reviews List */}
            {!loading && !error && (
                <>
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold">
                                Danh sách Reviews ({reviews.length} kết quả)
                            </h2>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có review nào được tìm thấy
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {reviews?.length &&
                                    reviews.map((review) => (
                                        <div
                                            key={review.review_id}
                                            className="p-6"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {review.user
                                                                ?.full_name ||
                                                                "Anonymous"}
                                                        </h3>
                                                        <span className="ml-4 text-sm text-gray-500">
                                                            Tour :{" "}
                                                            {review.tour
                                                                ?.tour_name ||
                                                                ""}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center mb-2">
                                                        {[...Array(5)].map(
                                                            (_, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`text-lg ${
                                                                        i <
                                                                        review.rating
                                                                            ? "text-yellow-400"
                                                                            : "text-gray-300"
                                                                    }`}
                                                                >
                                                                    ★
                                                                </span>
                                                            )
                                                        )}
                                                        <span className="ml-2 text-sm text-gray-600">
                                                            ({review.rating}/5)
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-700 mb-2">
                                                        {review.comment}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        {new Date(
                                                            review.created_at
                                                        ).toLocaleDateString(
                                                            "vi-VN"
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="text-white">
                                                    <button
                                                        className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg border border-red-500 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 flex items-center gap-2 transition-all duration-300 hover:scale-105"
                                                        onClick={() =>
                                                            handleDelete(
                                                                review.review_id
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            ></path>
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center">
                                <button
                                    onClick={() =>
                                        handlePageChange(Math.max(1, page - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-1 mx-1 border rounded bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    « Trước
                                </button>

                                {renderPagination()}

                                <button
                                    onClick={() =>
                                        handlePageChange(
                                            Math.min(totalPages, page + 1)
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className="px-3 py-1 mx-1 border rounded bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau »
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Review;
