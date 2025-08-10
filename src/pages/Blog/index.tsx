import { API } from "@/lib/axios";
import type { ChangeEvent } from "react";
import React, { useEffect, useState } from "react";
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
                <div className="flex justify-end space-x-3 gap-2">
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
                if (res.data && res.data.data) {
                    setBlogs(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        res.data.data.data.map((blog: any) => ({
                            id: blog.id.toString(),
                            thumbnail:
                                blog.thumbnail_url ||
                                "https://www.shoshinsha-design.com/wp-content/uploads/2020/05/noimage-1-760x460.png", // Thêm ảnh placeholder nếu không có thumbnail
                            location: blog.location,
                            title: blog.title,
                            description: blog.description,
                            createdAt: blog.created_at,
                            status: blog.status,
                        }))
                    );
                }
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

    // Thêm state để theo dõi trạng thái xóa
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    // Cập nhật hàm handleDeleteConfirm để gọi API xóa
    const handleDeleteConfirm = async () => {
        if (deleteModal.blog) {
            try {
                setDeleteLoading(true);
                // Gọi API để xóa blog
                await API.delete(`/blogs/${deleteModal.blog.id}`);

                // Cập nhật state blogs sau khi xóa thành công
                setBlogs(
                    blogs.filter((blog) => blog.id !== deleteModal.blog?.id)
                );

                // Hiển thị thông báo thành công (nếu bạn có hệ thống thông báo)
                // notifySuccess("Xóa blog thành công");
            } catch (error) {
                console.error("Error deleting blog:", error);
                // Hiển thị thông báo lỗi (nếu bạn có hệ thống thông báo)
                // notifyError("Có lỗi xảy ra khi xóa blog");
            } finally {
                setDeleteLoading(false);
                // Đóng modal
                setDeleteModal({
                    isOpen: false,
                    blog: null,
                });
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({
            isOpen: false,
            blog: null,
        });
    };
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Quản lý Blogs
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Quản lý và chỉnh sửa các bài viết blog của bạn
                            </p>
                        </div>
                        <button
                            style={{
                                color: "white",
                            }}
                            onClick={() => navigate("/blogs/new")}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg
                                className="-ml-1 mr-2 h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Tạo blog mới
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                    <div className="max-w-lg w-full">
                        <label htmlFor="search" className="sr-only">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Tìm kiếm blog..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blog List */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 flex justify-center items-center">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Đang tải...
                                </p>
                            </div>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Không có bài viết nào
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Bắt đầu bằng việc tạo một bài viết mới.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Nội dung
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Địa điểm
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Ngày tạo
                                        </th>
                                        <th
                                            scope="col"
                                            className="relative px-6 py-3"
                                        >
                                            <span className="sr-only">
                                                Hành động
                                            </span>
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
                                                    <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-md">
                                                        <img
                                                            src={blog.thumbnail}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900 line-clamp-1">
                                                            {blog.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500 line-clamp-2">
                                                            {blog.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {blog.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(
                                                    blog.createdAt
                                                ).toLocaleDateString("vi-VN")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(blog.id)
                                                        }
                                                        className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
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
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
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
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                blog={deleteModal.blog}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
};

export default Blogs;
