/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import { useNavigate, useParams } from "react-router-dom";

interface BlogFormData {
    thumbnail: File | null;
    location: string;
    title: string;
    description: string;
    markdown: string;
}

interface FormErrors {
    thumbnail?: string;
    location?: string;
    title?: string;
    description?: string;
    markdown?: string;
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
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const { notifySuccess, notifyError } = useNotifier();

    const handleInputChange = (
        field: keyof BlogFormData,
        value: string | File
    ): void => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                if (file.size <= 2 * 1024 * 1024) {
                    // 2MB limit
                    const url = URL.createObjectURL(file);
                    setThumbnailPreview(url);
                    handleInputChange("thumbnail", file);
                } else {
                    alert("Hình ảnh phải nhỏ hơn 2MB!");
                }
            } else {
                alert("Chỉ có thể upload file hình ảnh!");
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.thumbnail) {
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
            console.log("Blog data:", formData);
            let payload = {
                ...formData,
            } as any;
            if (id) {
                payload.id = id;
            }
            const res = id
                ? await API.put(`/blogs`, payload, {
                      headers: { "Content-Type": "multipart/form-data" },
                  })
                : await API.post("/blog", payload, {
                      headers: { "Content-Type": "multipart/form-data" },
                  });

            notifySuccess(
                id ? "Blog đã được cập nhật!" : "Blog đã được tạo thành công!"
            );
            setFormData({
                thumbnail: null,
                location: "",
                title: "",
                description: "",
                markdown: "",
            });
            navigate("/blogs");
            setThumbnailPreview("");
        } catch (error) {
            console.log(error);
            notifyError("Có lỗi xảy ra khi tạo blog!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            const fetch = async () => {
                const res = await API.get(`/blogs/${id}`);
            };
            fetch();
        }
    }, [id]);

    // const handlePreview = (): void => {
    //     if (formData.markdown.trim()) {
    //         alert("Tính năng xem trước đang phát triển");
    //     } else {
    //         alert("Vui lòng nhập nội dung trước khi xem trước");
    //     }
    // };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Tạo Blog Mới
                    </h1>
                    <p className="text-gray-600">
                        Tạo và chia sẻ nội dung blog của bạn
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
                            {/* <button
                                type="button"
                                onClick={handlePreview}
                                className="cursor-pointer px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors flex items-center space-x-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                <span>Xem trước</span>
                            </button> */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    color: "#fff",
                                }}
                                className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <span>
                                    {loading ? "Đang tạo..." : "Tạo Blog"}
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
