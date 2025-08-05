import { API } from "@/lib/axios";
import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

interface Blog {
    id: string;
    thumbnail: string;
    location: string;
    title: string;
    description: string;
    createdAt: string;
    status: "published" | "draft";
}

interface DeleteModalProps {
    isOpen: boolean;
    blog: Blog | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen,
    blog,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen || !blog) return null;

    return (
        <div
            className="fixed inset-0  flex items-center justify-center z-50"
            style={{
                background: "rgba(0,0,0,0.5)",
            }}
        >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Xác nhận xóa blog
                        </h3>
                    </div>
                </div>
                <div className="mb-6">
                    <p className="text-gray-600">
                        Bạn có chắc chắn muốn xóa blog{" "}
                        <strong>"{blog.title}"</strong>? Hành động này không thể
                        hoàn tác.
                    </p>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            color: "#fff",
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none transition-colors"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

const Blogs: React.FC = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [idDelete, setIdDelete] = useState(0);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        blog: Blog | null;
    }>({
        isOpen: false,
        blog: null,
    });
    // const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                const res = await API.get("/blogs");
            } catch (error) {
                console.error("Error fetching blogs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, [searchTerm]);

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // setCurrentPage(1);
    };

    const handleEdit = (blogId: string) => {
        navigate(`/blogs/edit/${blogId}`);
    };

    const handleDeleteClick = (blog: Blog) => {
        setDeleteModal({
            isOpen: true,
            blog,
        });
    };

    const handleDeleteConfirm = () => {
        if (deleteModal.blog) {
            setDeleteModal({
                isOpen: false,
                blog: null,
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({
            isOpen: false,
            blog: null,
        });
    };
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Quản lý Blogs
                    </h1>
                    <p className="text-gray-600">
                        Quản lý và chỉnh sửa các bài blog của bạn
                    </p>
                </div>

                {/* Search and Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm blog..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <svg
                                    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <button
                            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none transition-colors flex items-center space-x-2"
                            style={{
                                color: "#fff",
                            }}
                            onClick={() => navigate("/blogs/new")}
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            <span>Tạo blog mới</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Blog
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Địa điểm
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ngày tạo
                                            </th>
                                            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th> */}
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {blogs.map((blog) => (
                                            <tr
                                                key={blog.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <img
                                                            src={blog.thumbnail}
                                                            alt={blog.title}
                                                            className="w-16 h-12 object-cover rounded-lg mr-4"
                                                        />
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                                {blog.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                {
                                                                    blog.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {blog.location}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {new Date(
                                                            blog.createdAt
                                                        ).toLocaleDateString(
                                                            "vi-VN"
                                                        )}
                                                    </span>
                                                </td>
                                                {/* <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            blog.status ===
                                                            "published"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {blog.status ===
                                                        "published"
                                                            ? "Đã xuất bản"
                                                            : "Bản nháp"}
                                                    </span>
                                                </td> */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEdit(
                                                                    blog.id
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                            style={{
                                                                color: "blue",
                                                            }}
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    blog
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa"
                                                            style={{
                                                                color: "red",
                                                            }}
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {/* {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Trang {currentPage} / {totalPages}
                                        </div>
                                        {renderPagination()}
                                        <div className="text-sm text-gray-700">
                                            Tổng cộng: {mockBlogs.length} blogs
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        </>
                    )}
                </div>

                {/* Delete Modal */}
                <DeleteModal
                    isOpen={deleteModal.isOpen}
                    blog={deleteModal.blog}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                />
            </div>
        </div>
    );
};

export default Blogs;
