/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import {
    Form,
    Input,
    Button,
    Select,
    Upload,
    message,
    Space,
    InputNumber,
    Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import { API } from "@/lib/axios";
import { useNotifier } from "@/hooks/useNotifier";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "antd";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";

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

interface GuideType {
    guide_id: number;
    name: string;
    is_deleted: "active" | "inactive";
}

interface BusRouteType {
    bus_route_id: number;
    name: string;
    is_deleted: "active" | "inactive";
}

type TourSchedule = {
    day: number;
    start_time: string;
    end_time: string;
    title: string;
    activity_description?: string;
    destination_id?: number;
};

interface TourType {
    tour_id: number;
    tour_name: string;
    category_id: number;
    description: string;
    itinerary: string;
    price: number;
    discount_price: number | null;
    destination: string;
    destination_ids: number[];
    duration: string;
    status: string;
    image: string | null; // filename
    images: string[]; // album images filenames
    schedules: TourSchedule[];
}

export default function CreateTour() {
    const { id } = useParams<{ id: string }>();
    const [loadingData, setLoadingData] = useState(true);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<TourCategoryType[]>([]);
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [albumFileList, setAlbumFileList] = useState<UploadFile[]>([]);
    // const
    const { contextHolder, notifySuccess, notifyError } = useNotifier();
    const [guides, setGuides] = useState<GuideType[]>([]);
    const [busRoutes, setBusRoutes] = useState<BusRouteType[]>([]);

    const navigate = useNavigate();

    const fetchTour = async () => {
        if (!id) return;
        try {
            const res = await API.get(`/tours/${id}`);
            const tour: TourType = res?.data;

            // Gán dữ liệu vào form
            form.setFieldsValue({
                category_id: tour.category_id,
                tour_name: tour.tour_name,
                description: tour.description,
                itinerary: tour.itinerary,
                price: Number(tour.price),
                discount_price: Number(tour.discount_price),
                destination: tour.destination,
                destination_ids: tour.destination_ids,
                duration: tour.duration,
                status: tour.status,
                schedules: (tour?.schedules || []).map((i) => ({
                    ...i,
                    activity_description: i.activity_description || "",
                })),
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
        if (id) {
            fetchTour();
        }
    }, [id]);

    // Fetch danh mục tour
    const fetchCategories = async () => {
        try {
            const res = await API.get("/tour-categories");
            setCategories(
                (res?.data || []).filter(
                    (cat: TourCategoryType) => cat.is_deleted === "active"
                )
            );
        } catch (error) {
            notifyError("Không tải được danh mục tour");
        }
    };

    // Fetch điểm đến
    const fetchDestinations = async () => {
        try {
            const res = await API.get("/destinations");
            setDestinations(
                res.data.filter(
                    (d: DestinationType) => d.is_deleted === "active"
                )
            );
        } catch (error) {
            notifyError("Không tải được danh sách điểm đến");
        }
    };

    // Fetch hướng dẫn viên
    const fetchGuides = async () => {
        try {
            const res = await API.get("/guides");
            setGuides(
                res.data.filter((g: GuideType) => g.is_deleted === "active")
            );
        } catch (error) {
            notifyError("Không tải được danh sách hướng dẫn viên");
        }
    };

    // Fetch tuyến xe buýt
    const fetchBusRoutes = async () => {
        try {
            const res = await API.get("/bus-routes");
            setBusRoutes(
                res.data.filter((r: BusRouteType) => r.is_deleted === "active")
            );
        } catch (error) {
            console.log(error);
            notifyError("Không tải được các tuyến xe buýt");
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchDestinations();
        fetchGuides();
        fetchBusRoutes();
    }, []);

    const beforeUploadImage = (file: RcFile) => {
        const isImage = file.type.startsWith("image/");
        const isValidFormat = ["image/jpeg", "image/png", "image/jpg"].includes(
            file.type
        );
        const isValidSize = file.size / 1024 / 1024 < 2; // Max 2MB
        if (!isImage || !isValidFormat) {
            message.error("Chỉ được tải ảnh định dạng JPEG, PNG, JPG");
            return Upload.LIST_IGNORE;
        }
        if (!isValidSize) {
            message.error("Ảnh phải nhỏ hơn 2MB");
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const onCancel = () => {
        Modal.confirm({
            title: "Xác nhận hủy",
            content: "Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.",
            onOk: () => navigate("/tours"),
        });
    };

    const handleCreateTour = async (values: any) => {
        try {
            setLoading(true);

            if (imageFileList.length === 0) {
                notifyError("Vui lòng chọn ảnh đại diện tour");
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("category_id", values.category_id);
            formData.append("tour_name", values.tour_name);
            formData.append("description", values.description || "");
            formData.append("itinerary", values.itinerary || "");
            formData.append("price", values.price.toString());
            if (
                values.discount_price !== undefined &&
                values.discount_price !== null &&
                values.discount_price !== ""
            ) {
                formData.append(
                    "discount_price",
                    values.discount_price.toString()
                );
            }
            formData.append("duration", values.duration || "");
            formData.append("status", values.status || "visible");
            if (values.guide_id) {
                formData.append("guide_id", values.guide_id);
            }
            if (values.bus_route_id) {
                formData.append("bus_route_id", values.bus_route_id);
            }

            // Ảnh đại diện
            if (imageFileList[0].originFileObj) {
                formData.append("image", imageFileList[0].originFileObj);
            }

            // Album ảnh
            albumFileList.forEach((file) => {
                if (file.originFileObj) {
                    formData.append("images[]", file.originFileObj);
                }
            });

            // Điểm đến
            if (
                values.destination_ids &&
                Array.isArray(values.destination_ids)
            ) {
                values.destination_ids.forEach((id: number) => {
                    formData.append("destination_ids[]", id.toString());
                });
            }

            // Lịch trình
            if (values.schedules && Array.isArray(values.schedules)) {
                values.schedules.forEach(
                    (schedule: TourSchedule, index: number) => {
                        Object.entries(schedule).forEach(([key, value]) => {
                            if (value !== undefined && value !== null) {
                                // Format thời gian thành H:i
                                if (
                                    key === "start_time" ||
                                    key === "end_time"
                                ) {
                                    const time = new Date(
                                        `1970-01-01T${value}`
                                    );
                                    value = time.toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    });
                                }
                                formData.append(
                                    `schedules[${index}][${key}]`,
                                    String(value)
                                );
                            }
                        });
                    }
                );
            }

            const res = await API.post("/tours", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            notifySuccess(res.data.message || "Tạo tour thành công");
            form.resetFields();
            setImageFileList([]);
            setAlbumFileList([]);
            navigate("/tours");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            notifyError(error?.response?.data?.message || "Tạo tour thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTour = async (values: any) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("category_id", values.category_id);
            formData.append("tour_name", values.tour_name);
            formData.append("description", values.description || "");
            formData.append("itinerary", values.itinerary || "");
            formData.append("price", values.price.toString());
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

            await API.put(`/tours/${id}?_method=PUT`, formData, {
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

    const onFinish = async (values: any) => {
        console.log("lot khong?");

        if (id) {
            handleUpdateTour(values);
        } else {
            handleCreateTour(values);
        }
    };

    if (id && loadingData) {
        return (
            <div className="flex justify-center items-center h-60">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            {contextHolder}
            <div className="mx-auto p-8 bg-white rounded-[8px] shadow">
                <h1 className="text-2xl font-bold mb-6">Tạo Tour Mới</h1>

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
                            {
                                max: 255,
                                message:
                                    "Tên tour không được vượt quá 255 ký tự",
                            },
                        ]}
                    >
                        <Input placeholder="Nhập tên tour" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        {/* <TextArea rows={3} placeholder="Mô tả tour" /> */}
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
                            {
                                type: "number",
                                min: 0,
                                message: "Giá phải lớn hơn hoặc bằng 0",
                            },
                        ]}
                    >
                        <InputNumber
                            type="number"
                            min={0}
                            placeholder="Nhập giá gốc"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Giá giảm"
                        name="discount_price"
                        rules={[
                            {
                                type: "number",
                                min: 0,
                                message: "Giá giảm phải lớn hơn hoặc bằng 0",
                            },
                        ]}
                    >
                        <InputNumber
                            type="number"
                            min={0}
                            placeholder="Nhập giá giảm (nếu có)"
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
                                2 ngày
                            </Select.Option>
                            <Select.Option value="3 ngày 2 đêm">
                                3 ngày
                            </Select.Option>
                            <Select.Option value="4 ngày 3 đêm">
                                4 ngày
                            </Select.Option>
                            <Select.Option value="5 ngày 4 đêm">
                                5 ngày
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Điểm đến (có thể chọn nhiều)"
                        name="destination_ids"
                        rules={[
                            {
                                type: "array",
                                message: "Vui lòng chọn ít nhất một điểm đến",
                            },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn điểm đến"
                            optionFilterProp="children"
                            showSearch
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

                    <Form.Item label="Hướng dẫn viên" name="guide_id">
                        <Select allowClear placeholder="Chọn hướng dẫn viên">
                            {guides.map((g) => (
                                <Select.Option
                                    key={g.guide_id}
                                    value={g.guide_id}
                                >
                                    {g.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Tuyến xe buýt" name="bus_route_id">
                        <Select allowClear placeholder="Chọn tuyến xe buýt">
                            {busRoutes.map((route) => (
                                <Select.Option
                                    key={route.bus_route_id}
                                    value={route.bus_route_id}
                                >
                                    {route.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.List name="schedules" initialValue={[{}]}>
                        {(fields, { add, remove }) => (
                            <>
                                <h3 className="text-lg font-semibold">
                                    Lịch trình tour
                                </h3>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space
                                        key={key}
                                        direction="vertical"
                                        style={{
                                            display: "flex",
                                            marginBottom: 8,
                                        }}
                                        size="middle"
                                    >
                                        <Form.Item
                                            {...restField}
                                            name={[name, "day"]}
                                            label="Ngày"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập ngày",
                                                },
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message:
                                                        "Ngày phải lớn hơn 0",
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const days =
                                                            getFieldValue(
                                                                "schedules"
                                                            ).map(
                                                                (
                                                                    s: TourSchedule
                                                                ) => s.day
                                                            );
                                                        if (
                                                            days.filter(
                                                                (d: number) =>
                                                                    d === value
                                                            ).length > 1
                                                        ) {
                                                            return Promise.reject(
                                                                "Ngày không được trùng lặp"
                                                            );
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                        >
                                            <InputNumber
                                                type="number"
                                                min={1}
                                                placeholder="Nhập ngày"
                                                style={{
                                                    width: "100%",
                                                }}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "start_time"]}
                                            label="Giờ bắt đầu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập giờ bắt đầu",
                                                },
                                            ]}
                                        >
                                            <Input
                                                type="time"
                                                placeholder="Chọn giờ bắt đầu"
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "end_time"]}
                                            label="Giờ kết thúc"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập giờ kết thúc",
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const startTime =
                                                            getFieldValue([
                                                                "schedules",
                                                                name,
                                                                "start_time",
                                                            ]);
                                                        if (
                                                            !startTime ||
                                                            !value
                                                        ) {
                                                            return Promise.resolve();
                                                        }
                                                        if (
                                                            value <= startTime
                                                        ) {
                                                            return Promise.reject(
                                                                "Giờ kết thúc phải sau giờ bắt đầu"
                                                            );
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                        >
                                            <Input
                                                type="time"
                                                placeholder="Chọn giờ kết thúc"
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "title"]}
                                            label="Tiêu đề hoạt động"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập tiêu đề",
                                                },
                                                {
                                                    max: 255,
                                                    message:
                                                        "Tiêu đề không được vượt quá 255 ký tự",
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Nhập tiêu đề hoạt động" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[
                                                name,
                                                "activity_description",
                                            ]}
                                            label="Mô tả hoạt động"
                                        >
                                            <MdEditor
                                                style={{ height: "300px" }}
                                                renderHTML={(text) => (
                                                    <ReactMarkdown>
                                                        {text}
                                                    </ReactMarkdown>
                                                )}
                                                value={
                                                    form.getFieldValue([
                                                        "schedules",
                                                        name,
                                                        "activity_description",
                                                    ]) || ""
                                                }
                                                onChange={({ text }) => {
                                                    const schedules =
                                                        form.getFieldValue(
                                                            "schedules"
                                                        ) || [];
                                                    const newSchedules =
                                                        schedules.map(
                                                            (
                                                                item: any,
                                                                idx: number
                                                            ) =>
                                                                idx === name
                                                                    ? {
                                                                          ...item,
                                                                          activity_description:
                                                                              text,
                                                                      }
                                                                    : item
                                                        );
                                                    form.setFieldsValue({
                                                        schedules: newSchedules,
                                                    });
                                                }}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "destination_id"]}
                                            label="Điểm đến"
                                        >
                                            <Select
                                                allowClear
                                                placeholder="Chọn điểm đến"
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
                                        <Button
                                            danger
                                            onClick={() => remove(name)}
                                        >
                                            Xoá lịch trình
                                        </Button>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button
                                        onClick={() => add()}
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm lịch trình
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

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
                        <Select placeholder="Chọn trạng thái">
                            <Select.Option value="visible">
                                Hiển thị
                            </Select.Option>
                            <Select.Option value="hidden">Ẩn</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Ảnh đại diện"
                        required
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn ảnh đại diện",
                            },
                        ]}
                    >
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            fileList={imageFileList}
                            beforeUpload={beforeUploadImage}
                            onChange={({ fileList }) =>
                                setImageFileList(fileList)
                            }
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
                                disabled={
                                    categories.length === 0 ||
                                    destinations.length === 0
                                }
                            >
                                {id ? "Cập nhật tour" : "Tạo tour"}
                            </Button>
                            <Button onClick={onCancel}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
}
