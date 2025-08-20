/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import { PlusOutlined } from "@ant-design/icons";
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
    Space,
    Spin,
    Upload,
} from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import { useNavigate, useParams } from "react-router-dom";

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
    min_people: number;
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
    const [dataLoaded, setDataLoaded] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<TourCategoryType[]>([]);
    const [destinations, setDestinations] = useState<DestinationType[]>([]);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [albumFileList, setAlbumFileList] = useState<UploadFile[]>([]);
    const [selectedDuration, setSelectedDuration] = useState<string>("");
    // const
    const { contextHolder, notifySuccess, notifyError } = useNotifier();
    const [guides, setGuides] = useState<GuideType[]>([]);
    const [busRoutes, setBusRoutes] = useState<BusRouteType[]>([]);

    console.log(guides);
    console.log(busRoutes);
    // Function để tạo số lượng form dựa trên thời lượng
    const getScheduleCount = (duration: string): number => {
        if (duration === "1 ngày") return 1;
        if (duration === "2 ngày 1 đêm") return 2;
        if (duration === "3 ngày 2 đêm") return 3;
        if (duration === "4 ngày 3 đêm") return 4;
        if (duration === "5 ngày 4 đêm") return 5;
        return 0;
    };

    // Function để cập nhật schedules khi thời lượng thay đổi
    const handleDurationChange = useCallback(
        (duration: string) => {
            setSelectedDuration(duration);
            const scheduleCount = getScheduleCount(duration);

            // Lấy schedules hiện tại từ form
            const currentSchedules = form.getFieldValue("schedules") || [];

            // Tạo mảng schedules mới với số lượng phù hợp
            const newSchedules = Array.from(
                { length: scheduleCount },
                (_, index) => {
                    // Giữ lại dữ liệu cũ nếu có, nếu không thì tạo mới
                    const existingSchedule = currentSchedules[index];
                    return (
                        existingSchedule || {
                            day: index + 1,
                            title: "",
                            activity_description: "",
                        }
                    );
                }
            );

            form.setFieldsValue({ schedules: newSchedules });

            // Force re-render form fields
            form.resetFields(["schedules"]);
            setTimeout(() => {
                form.setFieldsValue({ schedules: newSchedules });
            }, 0);
        },
        [form]
    );

    const navigate = useNavigate();

    const fetchTour = useCallback(async () => {
        if (!id) return;
        try {
            setLoadingData(true);
            const res = await API.get(`/tours/${id}`);
            const tour: TourType = res?.data;

            // Set selectedDuration từ dữ liệu tour để hiển thị form schedules
            if (tour.duration) {
                setSelectedDuration(tour.duration);
            }

            // Prepare schedules data
            const schedulesData = (tour?.schedules || []).map((schedule) => ({
                day: schedule.day,
                title: schedule.title || "",
                activity_description: schedule.activity_description || "",
            }));

            // Set form values
            const formValues = {
                category_id: tour.category_id,
                tour_name: tour.tour_name,
                description: tour.description || "",
                itinerary: tour.itinerary || "",
                price: Number(tour.price),
                discount_price: tour.discount_price
                    ? Number(tour.discount_price)
                    : undefined,
                min_people: tour.min_people || 2,
                destination: tour.destination,
                duration: tour.duration,
                status: tour.status,
                schedules: schedulesData,
                destination_ids:
                    ((tour as any)?.destinations as any)?.map(
                        (item: any) => item?.destination_id
                    ) || [],
            };

            form.setFieldsValue(formValues);

            // Set dataLoaded to true after form values are set
            setDataLoaded(true);

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
        } catch (error) {
            console.error("Không tải được dữ liệu tour", error);
        } finally {
            setLoadingData(false);
            if (!id) {
                setDataLoaded(true); // For create mode
            }
        }
    }, [id, form]);

    useEffect(() => {
        if (id) {
            fetchTour();
        } else {
            // Nếu không có id (tạo mới), không cần loading
            setLoadingData(false);
            setDataLoaded(true);
        }
    }, [id, fetchTour]);

    // Fetch danh mục tour
    const fetchCategories = useCallback(async () => {
        try {
            const res = await API.get("/tour-categories");
            setCategories(
                (res?.data || []).filter(
                    (cat: TourCategoryType) => cat.is_deleted === "active"
                )
            );
        } catch (error) {
            console.error("Không tải được danh mục tour", error);
        }
    }, []);

    // Fetch điểm đến
    const fetchDestinations = useCallback(async () => {
        try {
            const res = await API.get("/destinations");
            setDestinations(
                res.data.filter(
                    (d: DestinationType) => d.is_deleted === "active"
                )
            );
        } catch (error) {
            console.error("Không tải được danh sách điểm đến", error);
        }
    }, []);

    // Fetch hướng dẫn viên
    const fetchGuides = useCallback(async () => {
        try {
            const res = await API.get("/guides");
            setGuides(
                res.data.filter((g: GuideType) => g.is_deleted === "active")
            );
        } catch (error) {
            console.error("Không tải được danh sách hướng dẫn viên", error);
        }
    }, []);

    // Fetch tuyến xe buýt
    const fetchBusRoutes = useCallback(async () => {
        try {
            const res = await API.get("/bus-routes");
            setBusRoutes(
                res.data.filter((r: BusRouteType) => r.is_deleted === "active")
            );
        } catch (error) {
            console.error("Không tải được các tuyến xe buýt", error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
        fetchDestinations();
        fetchGuides();
        fetchBusRoutes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            formData.append(
                "min_people",
                values.min_people ? values.min_people.toString() : "2"
            );
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
                console.log(
                    "Processing schedules for create:",
                    values.schedules
                );
                values.schedules.forEach((schedule: any, index: number) => {
                    // Chỉ gửi schedules có dữ liệu
                    if (schedule && schedule.title && schedule.title.trim()) {
                        const dayNumber = schedule.day || index + 1;

                        formData.append(
                            `schedules[${index}][day]`,
                            dayNumber.toString()
                        );

                        formData.append(
                            `schedules[${index}][title]`,
                            schedule.title.trim()
                        );

                        if (
                            schedule.activity_description &&
                            schedule.activity_description.trim()
                        ) {
                            formData.append(
                                `schedules[${index}][activity_description]`,
                                schedule.activity_description.trim()
                            );
                        }

                        console.log(`Create Schedule ${index}:`, {
                            day: dayNumber,
                            title: schedule.title.trim(),
                            activity_description:
                                schedule.activity_description?.trim() || "",
                        });
                    }
                });
            }

            // Debug FormData
            console.log("FormData contents:");
            for (const [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const res = await API.post("/tours", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            notifySuccess(res.data.message || "Tạo tour thành công");
            form.resetFields();
            setImageFileList([]);
            setAlbumFileList([]);
            navigate("/tours");
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

            // Lịch trình
            if (values.schedules && Array.isArray(values.schedules)) {
                console.log(
                    "Processing schedules for update:",
                    values.schedules
                );
                values.schedules.forEach((schedule: any, index: number) => {
                    // Chỉ gửi schedules có dữ liệu
                    if (schedule && schedule.title && schedule.title.trim()) {
                        const dayNumber = schedule.day || index + 1;

                        formData.append(
                            `schedules[${index}][day]`,
                            dayNumber.toString()
                        );

                        formData.append(
                            `schedules[${index}][title]`,
                            schedule.title.trim()
                        );

                        if (
                            schedule.activity_description &&
                            schedule.activity_description.trim()
                        ) {
                            formData.append(
                                `schedules[${index}][activity_description]`,
                                schedule.activity_description.trim()
                            );
                        }

                        console.log(`Update Schedule ${index}:`, {
                            day: dayNumber,
                            title: schedule.title.trim(),
                            activity_description:
                                schedule.activity_description?.trim() || "",
                        });
                    }
                });
            }

            // Debug FormData
            console.log("Update FormData contents:");
            for (const [key, value] of formData.entries()) {
                console.log(key, value);
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

    const onFinish = async (values: any) => {
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
                <h1 className="text-2xl font-bold mb-6">
                    {id ? "Cập nhật Tour" : "Tạo Tour Mới"}
                </h1>

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
                        {dataLoaded && (
                            <MdEditor
                                key={`description-${id || "new"}-${dataLoaded}`}
                                style={{ height: "300px" }}
                                value={form.getFieldValue("description") || ""}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                onChange={({ text }) =>
                                    form.setFieldsValue({ description: text })
                                }
                            />
                        )}
                    </Form.Item>

                    <Form.Item label="Hành trình" name="itinerary">
                        {dataLoaded && (
                            <MdEditor
                                key={`itinerary-${id || "new"}-${dataLoaded}`}
                                style={{ height: "300px" }}
                                value={form.getFieldValue("itinerary") || ""}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                onChange={({ text }) =>
                                    form.setFieldsValue({ itinerary: text })
                                }
                            />
                        )}
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
                        <Select
                            placeholder="Chọn thời lượng"
                            onChange={handleDurationChange}
                        >
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

                    {/* <Form.Item label="Hướng dẫn viên" name="guide_id">
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
                    </Form.Item> */}

                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            Lịch trình tour
                        </h3>
                        {selectedDuration && (
                            <div>
                                {Array.from(
                                    {
                                        length: getScheduleCount(
                                            selectedDuration
                                        ),
                                    },
                                    (_, index) => (
                                        <Card
                                            key={index}
                                            type="inner"
                                            title={`Ngày ${index + 1}`}
                                            style={{ marginBottom: 16 }}
                                        >
                                            <Form.Item
                                                name={[
                                                    "schedules",
                                                    index,
                                                    "title",
                                                ]}
                                                label="Tiêu đề"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng nhập tiêu đề!",
                                                    },
                                                    {
                                                        max: 255,
                                                        message:
                                                            "Tiêu đề không được vượt quá 255 ký tự",
                                                    },
                                                ]}
                                            >
                                                <Input placeholder="Nhập tiêu đề cho ngày này" />
                                            </Form.Item>

                                            <Form.Item
                                                name={[
                                                    "schedules",
                                                    index,
                                                    "activity_description",
                                                ]}
                                                label="Mô tả"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng nhập mô tả!",
                                                    },
                                                ]}
                                            >
                                                {dataLoaded && (
                                                    <MdEditor
                                                        key={`schedule-${index}-${
                                                            id || "new"
                                                        }-${selectedDuration}-${dataLoaded}`}
                                                        style={{
                                                            height: "300px",
                                                        }}
                                                        renderHTML={(text) => (
                                                            <ReactMarkdown>
                                                                {text}
                                                            </ReactMarkdown>
                                                        )}
                                                        value={
                                                            form.getFieldValue([
                                                                "schedules",
                                                                index,
                                                                "activity_description",
                                                            ]) || ""
                                                        }
                                                        onChange={({
                                                            text,
                                                        }) => {
                                                            const currentSchedules =
                                                                form.getFieldValue(
                                                                    "schedules"
                                                                ) || [];
                                                            const newSchedules =
                                                                [
                                                                    ...currentSchedules,
                                                                ];

                                                            // Ensure the schedule object exists
                                                            if (
                                                                !newSchedules[
                                                                    index
                                                                ]
                                                            ) {
                                                                newSchedules[
                                                                    index
                                                                ] = {
                                                                    day:
                                                                        index +
                                                                        1,
                                                                    title: "",
                                                                    activity_description:
                                                                        "",
                                                                };
                                                            }

                                                            newSchedules[
                                                                index
                                                            ] = {
                                                                ...newSchedules[
                                                                    index
                                                                ],
                                                                activity_description:
                                                                    text,
                                                            };

                                                            form.setFieldsValue(
                                                                {
                                                                    schedules:
                                                                        newSchedules,
                                                                }
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </Form.Item>
                                        </Card>
                                    )
                                )}
                            </div>
                        )}
                        {!selectedDuration && (
                            <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                Vui lòng chọn thời lượng tour để hiển thị form
                                lịch trình
                            </div>
                        )}
                    </div>

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
