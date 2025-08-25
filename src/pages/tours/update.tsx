/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import { PlusOutlined } from "@ant-design/icons";
import {
    Button,
    Form,
    Input,
    InputNumber,
    message,
    Select,
    Space,
    Spin,
    Upload,
    Tabs,
} from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import TourDepartureManager from "@/components/TourDepartureManager";

interface TourCategoryType {
    category_id: number;
    category_name: string;
    is_deleted: "active" | "inactive";
}

interface DestinationType {
    destination_id: number;
    name: string;
    is_deleted: "active" | "inactive";
}

interface TourType {
    tour_id: number;
    tour_name: string;
    category_id: number;
    description: string;
    itinerary: string;
    price: number;
    discount_price: number | null;
    min_people: number;
    destination: string;
    destination_ids: number[];
    duration: string;
    status: string;
    image: string | null; // filename
    images: string[]; // album images filenames
}

export default function UpdateTour() {
    const { id } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<TourCategoryType[]>([]);
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [albumFileList, setAlbumFileList] = useState<UploadFile[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const { contextHolder, notifySuccess, notifyError } = useNotifier();
    const navigate = useNavigate();

    // Lấy danh mục tour
    const fetchCategories = async () => {
        try {
            const res = await API.get("/tour-categories");
            setCategories(
                res.data.filter(
                    (cat: TourCategoryType) => cat.is_deleted === "active"
                )
            );
        } catch {
            notifyError("Không tải được danh mục tour");
        }
    };

    // Lấy điểm đến
    const fetchDestinations = async () => {
        try {
            const res = await API.get("/destinations");
            setDestinations(
                res.data.filter(
                    (d: DestinationType) => d.is_deleted === "active"
                )
            );
        } catch {
            notifyError("Không tải được danh sách điểm đến");
        }
    };

    // Lấy dữ liệu tour theo id
    const fetchTour = async () => {
        if (!id) return;
        setLoadingData(true);
        try {
            const res = await API.get(`/tours/${id}`);
            const tour: TourType = res.data;

            // Gán dữ liệu vào form
            form.setFieldsValue({
                category_id: tour.category_id,
                tour_name: tour.tour_name,
                description: tour.description,
                itinerary: tour.itinerary,
                price: tour.price,
                discount_price: tour.discount_price,
                min_people: tour.min_people || 2,
                destination: tour.destination,
                destination_ids: tour.destination_ids,
                duration: tour.duration,
                status: tour.status,
            });

            // Ảnh đại diện nếu có => đưa vào fileList để hiển thị preview
            if (tour.image) {
                setImageFileList([
                    {
                        uid: "-1",
                        name: tour.image,
                        status: "done",
                        url: `${import.meta.env.VITE_BACKEND_URL}storage/${
                            tour.image
                        }`,
                    },
                ]);
            }

            if ((tour as any).album?.images?.length > 0) {
                const albumFiles = (tour as any).album.images.map(
                    (img: any, index: number) => ({
                        uid: `album-${index}`,
                        name: img.image_url,
                        status: "done",
                        url: `${import.meta.env.VITE_BACKEND_URL}storage/${
                            img.image_url
                        }`,
                    })
                );
                setAlbumFileList(albumFiles);
            }
        } catch {
            notifyError("Không tải được dữ liệu tour");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchDestinations();
        fetchTour();
    }, [id]);

    const beforeUploadImage = (file: RcFile) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("Chỉ được tải ảnh");
        }
        return isImage ? true : Upload.LIST_IGNORE;
    };

    // Xử lý submit chỉnh sửa
    const onFinish = async (values: any) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("category_id", values.category_id);
            formData.append("tour_name", values.tour_name);
            formData.append("description", values.description || "");
            formData.append("itinerary", values.itinerary || "");
            formData.append("price", values.price.toString());
            formData.append(
                "min_people",
                values.min_people ? values.min_people.toString() : "2"
            );
            formData.append(
                "discount_price",
                values.discount_price?.toString() || ""
            );
            formData.append("destination", values.destination || "");
            formData.append("duration", values.duration || "");
            formData.append("status", values.status || "visible");

            // Ảnh đại diện mới hoặc giữ ảnh cũ
            if (imageFileList.length > 0) {
                if (imageFileList[0].originFileObj) {
                    // ảnh mới upload
                    formData.append("image", imageFileList[0].originFileObj);
                } else {
                    // giữ ảnh cũ (file không có originFileObj, có url)
                    formData.append("old_image", imageFileList[0].name);
                }
            }

            // Album ảnh
            albumFileList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("images[]", file.originFileObj);
                } else {
                    // nếu file cũ thì gửi tên ảnh để backend biết giữ lại
                    formData.append("old_images[]", file.name);
                }
            });

            // Điểm đến (nhiều)
            if (
                values.destination_ids &&
                Array.isArray(values.destination_ids)
            ) {
                values.destination_ids.forEach((id: number) => {
                    formData.append("destination_ids[]", id.toString());
                });
            }

            await API.post(`/tours/${id}?_method=PUT`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            notifySuccess("Cập nhật tour thành công");
            navigate("/tours");
        } catch (error: any) {
            notifyError(
                error?.response?.data?.message || "Cập nhật tour thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center h-60">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            {contextHolder}

            <div className="mx-auto p-8 bg-white rounded-[8px] shadow-[8px]">
                <h1 className="text-2xl font-bold mb-6">Chỉnh sửa Tour</h1>

                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: 'Thông tin tour',
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    initialValues={{ status: "visible" }}
                                >
                    <Form.Item
                        label="Danh mục tour"
                        name="category_id"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn danh mục tour",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Chọn danh mục"
                            loading={categories.length === 0}
                        >
                            {categories.map((cat) => (
                                <Select.Option
                                    key={cat.category_id}
                                    value={cat.category_id}
                                >
                                    {cat.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Tên tour"
                        name="tour_name"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên tour",
                            },
                        ]}
                    >
                        <Input placeholder="Nhập tên tour" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <MdEditor
                            style={{ height: "300px" }}
                            value={form.getFieldValue("description") || ""}
                            renderHTML={(text) => (
                                <ReactMarkdown>{text}</ReactMarkdown>
                            )}
                            onChange={({ text }) =>
                                form.setFieldsValue({ description: text })
                            }
                        />
                    </Form.Item>

                    <Form.Item label="Hành trình" name="itinerary">
                        <MdEditor
                            style={{ height: "300px" }}
                            value={form.getFieldValue("itinerary") || ""}
                            renderHTML={(text) => (
                                <ReactMarkdown>{text}</ReactMarkdown>
                            )}
                            onChange={({ text }) =>
                                form.setFieldsValue({ itinerary: text })
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Giá gốc"
                        name="price"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập giá gốc",
                            },
                        ]}
                    >
                        <InputNumber
                            type="number"
                            min={0}
                            placeholder="Nhập giá gốc"
                        />
                    </Form.Item>

                    <Form.Item label="Giá giảm" name="discount_price">
                        <InputNumber
                            type="number"
                            min={0}
                            placeholder="Nhập giá giảm (nếu có)"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Số người tối thiểu"
                        name="min_people"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập số người tối thiểu",
                            },
                            {
                                type: "number",
                                min: 1,
                                max: 50,
                                message: "Số người tối thiểu từ 1 đến 50",
                            },
                        ]}
                    >
                        <InputNumber
                            type="number"
                            min={1}
                            max={50}
                            placeholder="Nhập số người tối thiểu"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="duration"
                        label="Thời lượng tour"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn thời lượng tour!",
                            },
                        ]}
                    >
                        <Select placeholder="Chọn thời lượng">
                            <Select.Option value="1 ngày">1 ngày</Select.Option>
                            <Select.Option value="2 ngày 1 đêm">
                                2 ngày 1 đêm
                            </Select.Option>
                            <Select.Option value="3 ngày 2 đêm">
                                3 ngày 2 đêm
                            </Select.Option>
                            <Select.Option value="4 ngày 3 đêm">
                                4 ngày 3 đêm
                            </Select.Option>
                            <Select.Option value="5 ngày 4 đêm">
                                5 ngày 4 đêm
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Tỉnh/thành điểm đến" name="destination">
                        <Input placeholder="VD: Hà Nội, Huế,..." />
                    </Form.Item>

                    <Form.Item
                        label="Điểm đến (có thể chọn nhiều)"
                        name="destination_ids"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn điểm đến"
                            optionFilterProp="children"
                            showSearch
                            loading={destinations.length === 0}
                        >
                            {destinations.map((d) => (
                                <Select.Option
                                    key={d.destination_id}
                                    value={d.destination_id}
                                >
                                    {d.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="status"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn trạng thái",
                            },
                        ]}
                    >
                        <Select>
                            <Select.Option value="visible">
                                Hiển thị
                            </Select.Option>
                            <Select.Option value="hidden">Ẩn</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Ảnh đại diện" required>
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            fileList={imageFileList}
                            beforeUpload={beforeUploadImage}
                            onChange={({ fileList }) =>
                                setImageFileList(fileList)
                            }
                            onRemove={() => setImageFileList([])}
                        >
                            {imageFileList.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Ảnh album (nhiều ảnh)">
                        <Upload
                            listType="picture-card"
                            multiple
                            fileList={albumFileList}
                            beforeUpload={beforeUploadImage}
                            onChange={({ fileList }) =>
                                setAlbumFileList(fileList)
                            }
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Tải ảnh</div>
                            </div>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                Cập nhật
                            </Button>
                            <Button onClick={() => navigate("/tours")}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Quản lý ngày khởi hành',
                            children: (
                                <div>
                                    <TourDepartureManager tourId={parseInt(id!)} />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </>
    );
}
