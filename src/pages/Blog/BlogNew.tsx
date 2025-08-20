/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import { useNavigate, useParams } from "react-router-dom";

interface BlogFormData {
    thumbnail: File | null;
    location: string;
    title: string;
    description: string;
    markdown: string;
    status: "published" | "draft";
    tags: string; // Thêm trường tags
}

interface FormErrors {
    thumbnail?: string;
    location?: string;
    title?: string;
    description?: string;
    markdown?: string;
    tags?: string;
}

const BlogNew: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState<BlogFormData>({
        thumbnail: null,
        location: "",
        title: "",
        description: "",
        markdown: "",
        status: "published",
        tags: "", // Khởi tạo giá trị rỗng cho tags
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const { notifySuccess, notifyError } = useNotifier();

    // Fetch blog data if editing
    useEffect(() => {
        const fetchBlog = async () => {
            if (!id) return;

            try {
                const res = await API.get(`/blogs/${id}`);
                if (res.data && res.data.data) {
                    const blog = res.data.data;
                    setFormData({
                        thumbnail: null,
                        location: blog.location,
                        title: blog.title,
                        description: blog.description,
                        markdown: blog.markdown,
                        status: blog.status,
                        tags: blog.tags || "", // Lấy tags từ dữ liệu blog
                    });
                    if (blog.thumbnail_url) {
                        setThumbnailPreview(blog.thumbnail_url);
                    }
                }
            } catch (error) {
                console.error("Error fetching blog:", error);
                notifyError("Không thể tải thông tin blog");
                navigate("/blogs");
            }
        };

        fetchBlog();
    }, [id]);

    const handleInputChange = (
        field: keyof BlogFormData,
        value: string | File
    ): void => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        setErrors((prev) => ({
            ...prev,
            [field]: "",
        }));
    };

    // Hàm hiển thị các tags dưới dạng badge
    const renderTagsPreview = () => {
        if (!formData.tags) return null;

        const tagArray = formData.tags
            .split(",")
            .filter((tag) => tag.trim() !== "");

        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {tagArray.map((tag, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                        {tag.trim()}
                    </span>
                ))}
            </div>
        );
    };

    // Cập nhật hàm handleFileUpload để kiểm tra định dạng file chặt chẽ hơn
    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
            // Kiểm tra định dạng file
            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/jpg",
                "image/gif",
            ];
            if (validTypes.includes(file.type)) {
                if (file.size <= 2 * 1024 * 1024) {
                    // 2MB
                    const url = URL.createObjectURL(file);
                    setThumbnailPreview(url);
                    handleInputChange("thumbnail", file);
                } else {
                    notifyError("Hình ảnh phải nhỏ hơn 2MB!");
                }
            } else {
                notifyError(
                    "Chỉ chấp nhận file định dạng: JPEG, PNG, JPG, GIF"
                );
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!id && !formData.thumbnail && !thumbnailPreview) {
            newErrors.thumbnail = "Vui lòng upload thumbnail!";
        }

        if (!formData.location.trim()) {
            newErrors.location = "Vui lòng nhập địa điểm!";
        }

        if (!formData.title.trim()) {
            newErrors.title = "Vui lòng nhập tiêu đề!";
        } else if (formData.title.length < 10) {
            newErrors.title = "Tiêu đề phải có ít nhất 10 ký tự!";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Vui lòng nhập mô tả!";
        } else if (formData.description.length < 20) {
            newErrors.description = "Mô tả phải có ít nhất 20 ký tự!";
        }

        if (!formData.markdown.trim()) {
            newErrors.markdown = "Vui lòng nhập nội dung!";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const formPayload = new FormData();

            // Ensure required fields are present
            formPayload.append("title", formData.title.trim());
            formPayload.append("markdown", formData.markdown.trim());

            // Optional fields
            if (formData.description) {
                formPayload.append("description", formData.description.trim());
            }
            if (formData.location) {
                formPayload.append("location", formData.location.trim());
            }
            if (formData.status) {
                formPayload.append("status", formData.status);
            }

            // Thêm tags vào form data
            if (formData.tags) {
                formPayload.append("tags", formData.tags.trim());
            }

            // Handle thumbnail if present
            if (formData.thumbnail instanceof File) {
                formPayload.append("thumbnail", formData.thumbnail);
            }

            // Log request data for debugging
            console.log("Request Data:", {
                title: formData.title,
                markdown: formData.markdown,
                description: formData.description,
                location: formData.location,
                status: formData.status,
                tags: formData.tags,
                hasFile: formData.thumbnail instanceof File,
            });

            const config = {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            };

            let response;
            if (id) {
                response = await API.post(
                    `/blogs/${id}/update-with-files`,
                    formPayload,
                    config
                );
            } else {
                response = await API.post("/blogs", formPayload, config);
            }

            if (response.status === 200 || response.status === 201) {
                notifySuccess(
                    id
                        ? "Blog đã được cập nhật thành công!"
                        : "Blog đã được tạo thành công!"
                );
                navigate("/blogs");
            }
        } catch (error: any) {
            console.error("Validation Error:", error.response?.data);

            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach((key) => {
                    notifyError(`${key}: ${errors[key][0]}`);
                });
            } else {
                notifyError(
                    error.response?.data?.message ||
                        (id ? "Lỗi khi cập nhật blog!" : "Lỗi khi tạo blog!")
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {id ? "Chỉnh sửa Blog" : "Tạo Blog Mới"}
                    </h1>
                    <p className="text-gray-600">
                        {id
                            ? "Cập nhật thông tin blog của bạn"
                            : "Tạo và chia sẻ nội dung blog của bạn"}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="space-y-6">
                        {/* Thumbnail Upload */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Thumbnail *
                            </label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg
                                                className="w-8 h-8 mb-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">
                                                    Click để upload
                                                </span>{" "}
                                                hoặc kéo thả
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF (tối đa 2MB)
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                </div>
                                {thumbnailPreview && (
                                    <div className="mt-4">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="w-full max-w-md h-48 object-cover rounded-lg border"
                                        />
                                    </div>
                                )}
                                {errors.thumbnail && (
                                    <p className="text-red-500 text-sm">
                                        {errors.thumbnail}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Địa điểm *
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập địa điểm (ví dụ: Hà Nội, Việt Nam)"
                                value={formData.location}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleInputChange(
                                        "location",
                                        e.target.value
                                    )
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                            />
                            {errors.location && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.location}
                                </p>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Tiêu đề *
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập tiêu đề blog hấp dẫn..."
                                value={formData.title}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleInputChange("title", e.target.value)
                                }
                                maxLength={100}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                            />
                            <div className="flex justify-between mt-1">
                                {errors.title && (
                                    <p className="text-red-500 text-sm">
                                        {errors.title}
                                    </p>
                                )}
                                <p className="text-gray-500 text-sm ml-auto">
                                    {formData.title.length}/100
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Mô tả ngắn *
                            </label>
                            <textarea
                                placeholder="Viết mô tả ngắn gọn về nội dung blog..."
                                value={formData.description}
                                onChange={(
                                    e: ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value
                                    )
                                }
                                rows={3}
                                maxLength={300}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg resize-none"
                            />
                            <div className="flex justify-between mt-1">
                                {errors.description && (
                                    <p className="text-red-500 text-sm">
                                        {errors.description}
                                    </p>
                                )}
                                <p className="text-gray-500 text-sm ml-auto">
                                    {formData.description.length}/300
                                </p>
                            </div>
                        </div>

                        {/* Tags - THÊM MỚI */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Tags
                            </label>
                            <input
                                type="text"
                                placeholder="Nhập các tags cách nhau bởi dấu phẩy (ví dụ: du lịch,ẩm thực,phượt)"
                                value={formData.tags}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleInputChange("tags", e.target.value)
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                            />
                            <p className="text-gray-500 text-sm mt-1">
                                Các tags giúp phân loại bài viết và dễ dàng tìm
                                kiếm hơn
                            </p>

                            {/* Preview tags */}
                            {renderTagsPreview()}
                        </div>

                        {/* Markdown Content */}
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                Nội dung (Markdown) *
                            </label>
                            <MdEditor
                                style={{ height: "300px" }}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                value={formData.markdown}
                                onChange={({ text }) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        markdown: text,
                                    }));
                                }}
                            />
                            <div className="flex justify-between mt-1">
                                {errors.markdown && (
                                    <p className="text-red-500 text-sm">
                                        {errors.markdown}
                                    </p>
                                )}
                                <p className="text-gray-500 text-sm ml-auto">
                                    {formData.markdown.length} ký tự
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate("/blogs")}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    marginLeft: "6px",
                                    color: "white",
                                }}
                                className={`px-6 py-3 rounded-lg ml-[6px] text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-2 ${
                                    loading
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                }`}
                            >
                                {loading && (
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                )}
                                <span>
                                    {loading
                                        ? id
                                            ? "Đang cập nhật..."
                                            : "Đang tạo..."
                                        : id
                                        ? "Cập nhật Blog"
                                        : "Tạo Blog"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tips Card */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-blue-800 flex items-center space-x-2">
                            <span>💡</span>
                            <span>Mẹo viết blog hiệu quả</span>
                        </h3>
                        <ul className="text-blue-700 space-y-1 ml-6">
                            <li>
                                • Sử dụng tiêu đề hấp dẫn để thu hút người đọc
                            </li>
                            <li>• Chọn thumbnail chất lượng cao, rõ nét</li>
                            <li>
                                • Viết mô tả ngắn gọn nhưng đầy đủ thông tin
                            </li>
                            <li>
                                • Sử dụng Markdown để định dạng nội dung đẹp mắt
                            </li>
                            <li>
                                • Thêm các tags phù hợp để tăng khả năng tìm
                                kiếm
                            </li>
                            <li>
                                • Thêm địa điểm cụ thể để tăng tính địa phương
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogNew;
