/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import {
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Drawer,
    Dropdown,
    Form,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography,
    Avatar,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    CalendarOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FilterOutlined,
    MoreOutlined,
    SearchOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface UserType {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    avatar: string | null;
    role: string;
    is_deleted: string;
    is_verified: number;
    created_at: string;
    updated_at: string;
    avatar_url: string | null;
}

interface CategoryType {
    category_id: number;
    category_name: string;
    thumbnail: string;
    updated_at: string;
    created_at: string;
    is_deleted: string;
}

interface DestinationType {
    destination_id: number;
    category_id: number;
    album_id: number;
    name: string;
    description: string;
    area: string;
    price: string | null;
    img_banner: string;
    is_deleted: string;
    slug: string;
    created_at: string;
    updated_at: string;
    img_banner_url: string;
    pivot: {
        tour_id: number;
        destination_id: number;
    };
}

interface ScheduleType {
    schedule_id: number;
    tour_id: number;
    day: string;
    start_time: string;
    end_time: string;
    title: string;
    activity_description: string;
    destination_id: number;
    created_at: string;
    updated_at: string;
}

interface TourType {
    tour_id: number;
    category_id: number;
    album_id: number;
    guide_id: number | null;
    bus_route_id: number | null;
    tour_name: string;
    description: string;
    itinerary: string;
    image: string;
    price: string;
    discount_price: string;
    duration: string;
    status: string;
    is_deleted: string;
    slug: string;
    created_at: string;
    updated_at: string;
    category: CategoryType;
    destinations: DestinationType[];
    schedules: ScheduleType[];
}

interface GuideType {
    guide_id: number;
    name: string;
    gender: string;
    language: string;
    experience_years: number;
    album_id: number;
    price_per_day: string;
    description: string | null;
    phone: string;
    email: string;
    average_rating: number;
    is_available: boolean;
    is_deleted: string;
    created_at: string;
    updated_at: string;
}

interface HotelType {
    hotel_id: number;
    name: string;
    location: string;
    room_type: string;
    price: string;
    description: string;
    image: string;
    album_id: number;
    contact_phone: string;
    contact_email: string;
    average_rating: number;
    is_available: boolean;
    max_guests: number;
    facilities: string;
    bed_type: string;
    is_deleted: string;
    created_at: string;
    updated_at: string;
}

interface BookingType {
    booking_id: number;
    user_id: number;
    tour_id: number;
    guide_id: number | null;
    hotel_id: number | null;
    bus_route_id: number | null;
    motorbike_id: number | null;
    custom_tour_id: number | null;
    quantity: number;
    start_date: string;
    end_date: string | null;
    total_price: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    cancel_reason: string | null;
    is_deleted: string;
    created_at: string;
    updated_at: string;
    user: UserType;
    tour: TourType;
    guide: GuideType | null;
    hotel: HotelType | null;
    bus_route: any | null;
    motorbike: any | null;
    custom_tour: any | null;
}

interface BookingResponse {
    message: string;
    total: number;
    data: BookingType[];
}

const statusColors = {
    pending: "orange",
    confirmed: "blue",
    cancelled: "red",
    completed: "green",
};

const statusLabels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
};

export default function Booking() {
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [filterForm] = Form.useForm();
    const { contextHolder, notifySuccess, notifyError } = useNotifier();

    const [allBookings, setAllBookings] = useState<BookingType[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([]);

    // Fetch all bookings once
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await API.get("/bookings/all");
            const data: BookingResponse = response.data;
            setAllBookings(data.data);
            setFilteredBookings(data.data);
        } catch (error: any) {
            notifyError(error?.response?.data?.message || "Không thể tải danh sách booking");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Handle status update
    const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
        try {
            await API.put(`/bookings/${bookingId}/status`, { status: newStatus });
            notifySuccess("Cập nhật trạng thái thành công");
            // Refresh data after status update
            const response = await API.get("/bookings/all");
            const data: BookingResponse = response.data;
            setAllBookings(data.data);
            setFilteredBookings(data.data);
        } catch (error: any) {
            notifyError(error?.response?.data?.message || "Cập nhật trạng thái thất bại");
        }
    };

    // Handle delete booking
    const handleDelete = async (bookingId: number) => {
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa booking này?",
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    await API.delete(`/bookings/${bookingId}`);
                    notifySuccess("Xóa booking thành công");
                    // Refresh data after delete
                    const response = await API.get("/bookings/all");
                    const data: BookingResponse = response.data;
                    setAllBookings(data.data);
                    setFilteredBookings(data.data);
                } catch (error: any) {
                    notifyError(error?.response?.data?.message || "Xóa booking thất bại");
                }
            },
        });
    };

    // Handle filter with JavaScript
    const handleFilter = (values: any) => {
        let filtered = [...allBookings];

        // Search filter
        if (values.search) {
            const searchTerm = values.search.toLowerCase();
            filtered = filtered.filter(booking => 
                booking.user.full_name.toLowerCase().includes(searchTerm) ||
                booking.user.email.toLowerCase().includes(searchTerm) ||
                booking.tour.tour_name.toLowerCase().includes(searchTerm) ||
                booking.tour.category.category_name.toLowerCase().includes(searchTerm) ||
                booking.tour.destinations.some(dest => 
                    dest.name.toLowerCase().includes(searchTerm)
                )
            );
        }

        // Status filter
        if (values.status) {
            filtered = filtered.filter(booking => booking.status === values.status);
        }

        // Date range filter
        if (values.dateRange && values.dateRange.length === 2) {
            const startDate = values.dateRange[0].startOf('day');
            const endDate = values.dateRange[1].endOf('day');
            
            filtered = filtered.filter(booking => {
                const bookingDate = dayjs(booking.start_date);
                return bookingDate.isAfter(startDate) && bookingDate.isBefore(endDate);
            });
        }

        setFilteredBookings(filtered);
    };

    // Table columns
    const columns: ColumnsType<BookingType> = [
        {
            title: "Mã Booking",
            dataIndex: "booking_id",
            key: "booking_id",
            width: 100,
            render: (id) => <Text strong>#{id}</Text>,
        },
        {
            title: "Khách hàng",
            dataIndex: "user",
            key: "user",
            width: 200,
            render: (user) => (
                <div className="flex items-center space-x-2">
                    <Avatar 
                        src={user.avatar_url} 
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Tour",
            dataIndex: "tour",
            key: "tour",
            width: 300,
            render: (tour) => (
                <div>
                    <div className="font-medium text-sm leading-tight mb-1">
                        {tour.tour_name}
                    </div>
                    <Tag color="blue">{tour.category.category_name}</Tag>
                    <div className="text-gray-500 text-xs mt-1">
                        {tour.duration}
                    </div>
                </div>
            ),
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            key: "quantity",
            width: 100,
            align: "center",
            render: (quantity) => (
                <Badge count={quantity} showZero color="#1890ff" />
            ),
        },
        {
            title: "Ngày khởi hành",
            dataIndex: "start_date",
            key: "start_date",
            width: 150,
            render: (date) => (
                <div className="text-center">
                    <div className="font-medium">
                        {dayjs(date).format("DD/MM/YYYY")}
                    </div>
                    <div className="text-gray-500 text-sm">
                        {dayjs(date).format("dddd")}
                    </div>
                </div>
            ),
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_price",
            key: "total_price",
            width: 150,
            render: (price) => (
                <Text strong className="text-green-600">
                    {parseInt(price).toLocaleString("vi-VN")} VNĐ
                </Text>
            ),
        },
        {
            title: "Dịch vụ",
            key: "services",
            width: 120,
            render: (_, record) => (
                <div className="space-y-1">
                    {record.guide && (
                        <Tag color="green" size="small">HDV</Tag>
                    )}
                    {record.hotel && (
                        <Tag color="purple" size="small">KS</Tag>
                    )}
                    {!record.guide && !record.hotel && (
                        <Tag color="default" size="small">Cơ bản</Tag>
                    )}
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 150,
            render: (status) => (
                <Tag color={statusColors[status as keyof typeof statusColors]}>
                    {statusLabels[status as keyof typeof statusLabels]}
                </Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 120,
            fixed: "right",
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: "view",
                                label: "Xem chi tiết",
                                icon: <EyeOutlined />,
                                onClick: () => {
                                    setSelectedBooking(record);
                                    setDrawerVisible(true);
                                },
                            },
                            {
                                key: "edit",
                                label: "Cập nhật trạng thái",
                                icon: <EditOutlined />,
                                onClick: () => {
                                    setSelectedBooking(record);
                                    setModalVisible(true);
                                },
                            },
                            // {
                            //     key: "delete",
                            //     label: "Xóa",
                            //     icon: <DeleteOutlined />,
                            //     danger: true,
                            //     onClick: () => handleDelete(record.booking_id),
                            // },
                        ],
                    }}
                    trigger={["click"]}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <Title level={2} className="mb-2">
                            Quản lý Booking
                        </Title>
                        <Text type="secondary">
                            Quản lý và theo dõi tất cả các booking của khách hàng
                        </Text>
                    </div>

                    {/* Filter Card */}
                    <Card className="mb-6 shadow-sm">
                        <Form
                            form={filterForm}
                            layout="inline"
                            onFinish={handleFilter}
                            className="flex flex-wrap gap-4"
                        >
                            <Form.Item name="search" className="mb-0">
                                <Input
                                    placeholder="Tìm kiếm theo tên khách hàng, tour..."
                                    prefix={<SearchOutlined />}
                                    style={{ width: 300 }}
                                    allowClear
                                />
                            </Form.Item>
                            
                            <Form.Item name="status" className="mb-0">
                                <Select
                                    placeholder="Trạng thái"
                                    style={{ width: 150 }}
                                    allowClear
                                >
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <Select.Option key={key} value={key}>
                                            {label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            
                            <Form.Item name="dateRange" className="mb-0">
                                <RangePicker
                                    placeholder={["Từ ngày", "Đến ngày"]}
                                    format="DD/MM/YYYY"
                                />
                            </Form.Item>
                            
                            <Form.Item className="mb-0">
                                <Space>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<FilterOutlined />}
                                    >
                                        Lọc
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            filterForm.resetFields();
                                            setFilteredBookings(allBookings);
                                        }}
                                    >
                                        Làm mới
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                    <br />

                    {/* Stats Cards */}
                    <Row gutter={16} className="mb-6">
                        <Col span={6}>
                            <Card className="text-center shadow-sm">
                                <div className="text-2xl font-bold text-blue-600">
                                    {filteredBookings.length}
                                </div>
                                <div className="text-gray-600">Kết quả tìm kiếm</div>
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card className="text-center shadow-sm">
                                <div className="text-2xl font-bold text-orange-600">
                                    {filteredBookings.filter(b => b.status === "pending").length}
                                </div>
                                <div className="text-gray-600">Chờ xác nhận</div>
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card className="text-center shadow-sm">
                                <div className="text-2xl font-bold text-green-600">
                                    {filteredBookings.filter(b => b.status === "completed").length}
                                </div>
                                <div className="text-gray-600">Hoàn thành</div>
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card className="text-center shadow-sm">
                                <div className="text-2xl font-bold text-red-600">
                                    {filteredBookings.filter(b => b.status === "cancelled").length}
                                </div>
                                <div className="text-gray-600">Đã hủy</div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Table */}
                    <Card className="shadow-sm">
                        <Table
                            columns={columns}
                            dataSource={filteredBookings}
                            rowKey="booking_id"
                            loading={loading}
                            pagination={{
                                total: filteredBookings.length,
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} booking`,
                            }}
                            scroll={{ x: 1400 }}
                        />
                    </Card>
                </div>
            </div>

            {/* Detail Drawer */}
            <Drawer
                title="Chi tiết Booking"
                placement="right"
                width={700}
                open={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            >
                {selectedBooking && (
                    <div className="space-y-6">
                        {/* Booking Info */}
                        <Card title="Thông tin Booking" size="small">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Mã Booking">
                                    <Text strong>#{selectedBooking.booking_id}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={statusColors[selectedBooking.status]}>
                                        {statusLabels[selectedBooking.status]}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số lượng">
                                    <Badge count={selectedBooking.quantity} showZero />
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng tiền">
                                    <Text strong className="text-green-600">
                                        {parseInt(selectedBooking.total_price).toLocaleString("vi-VN")} VNĐ
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày khởi hành">
                                    <div>
                                        <CalendarOutlined className="mr-2" />
                                        {dayjs(selectedBooking.start_date).format("DD/MM/YYYY")}
                                    </div>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                    <div>
                                        {dayjs(selectedBooking.created_at).format("DD/MM/YYYY HH:mm")}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Customer Info */}
                        <Card title="Thông tin khách hàng" size="small">
                            <div className="flex items-center space-x-4 mb-4">
                                <Avatar 
                                    src={selectedBooking.user.avatar_url} 
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <div>
                                    <Title level={4} className="mb-1">
                                        {selectedBooking.user.full_name}
                                    </Title>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center">
                                            <MailOutlined className="mr-2 text-gray-500" />
                                            {selectedBooking.user.email}
                                        </div>
                                        <div className="flex items-center">
                                            <PhoneOutlined className="mr-2 text-gray-500" />
                                            {selectedBooking.user.phone}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Tour Info */}
                        <Card title="Thông tin Tour" size="small">
                            <div className="mb-4">
                                <Title level={5} className="mb-2">
                                    {selectedBooking.tour.tour_name}
                                </Title>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Tag color="blue">{selectedBooking.tour.category.category_name}</Tag>
                                    <Tag color="green">{selectedBooking.tour.duration}</Tag>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <DollarOutlined className="mr-1" />
                                    Giá gốc: {parseInt(selectedBooking.tour.price).toLocaleString("vi-VN")} VNĐ
                                    {selectedBooking.tour.discount_price && (
                                        <span className="ml-2 text-green-600">
                                            → Giảm: {parseInt(selectedBooking.tour.discount_price).toLocaleString("vi-VN")} VNĐ
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Điểm đến">
                                    <div className="space-y-1">
                                        {selectedBooking.tour.destinations.map((dest, index) => (
                                            <Tag key={index} color="green">
                                                <EnvironmentOutlined className="mr-1" />
                                                {dest.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Schedule */}
                        {selectedBooking.tour.schedules.length > 0 && (
                            <Card title="Lịch trình" size="small">
                                <div className="space-y-3">
                                    {selectedBooking.tour.schedules.map((schedule) => (
                                        <div key={schedule.schedule_id} className="border-l-4 border-blue-500 pl-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                                                    Ngày {schedule.day}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {schedule.start_time} - {schedule.end_time}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium mb-1">{schedule.title}</div>
                                                <div className="text-sm text-gray-600">
                                                    {schedule.activity_description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Services */}
                        <Card title="Dịch vụ đi kèm" size="small">
                            <div className="space-y-4">
                                {selectedBooking.guide && (
                                    <div className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Title level={5} className="mb-0">Hướng dẫn viên</Title>
                                            <Tag color="green">HDV</Tag>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div><strong>Tên:</strong> {selectedBooking.guide.name}</div>
                                            <div><strong>Ngôn ngữ:</strong> {selectedBooking.guide.language}</div>
                                            <div><strong>Kinh nghiệm:</strong> {selectedBooking.guide.experience_years} năm</div>
                                            <div><strong>Giá/ngày:</strong> {parseInt(selectedBooking.guide.price_per_day).toLocaleString("vi-VN")} VNĐ</div>
                                            <div><strong>Email:</strong> {selectedBooking.guide.email}</div>
                                            <div><strong>SĐT:</strong> {selectedBooking.guide.phone}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedBooking.hotel && (
                                    <div className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Title level={5} className="mb-0">Khách sạn</Title>
                                            <Tag color="purple">KS</Tag>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div><strong>Tên:</strong> {selectedBooking.hotel.name}</div>
                                            <div><strong>Địa điểm:</strong> {selectedBooking.hotel.location}</div>
                                            <div><strong>Loại phòng:</strong> {selectedBooking.hotel.room_type}</div>
                                            <div><strong>Giá:</strong> {parseInt(selectedBooking.hotel.price).toLocaleString("vi-VN")} VNĐ</div>
                                            <div><strong>Sức chứa:</strong> {selectedBooking.hotel.max_guests} người</div>
                                            <div><strong>SĐT:</strong> {selectedBooking.hotel.contact_phone}</div>
                                            <div><strong>Email:</strong> {selectedBooking.hotel.contact_email}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {!selectedBooking.guide && !selectedBooking.hotel && (
                                    <div className="text-center text-gray-500 py-4">
                                        Không có dịch vụ đi kèm
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </Drawer>

            {/* Status Update Modal */}
            <Modal
                title="Cập nhật trạng thái"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                {selectedBooking && (
                    <div className="space-y-4">
                        <div>
                            <Text>Booking #{selectedBooking.booking_id}</Text>
                            <br />
                            <Text type="secondary">
                                Khách hàng: {selectedBooking.user.full_name}
                            </Text>
                        </div>
                        
                        <div>
                            <Text strong>Trạng thái hiện tại: </Text>
                            <Tag color={statusColors[selectedBooking.status]}>
                                {statusLabels[selectedBooking.status]}
                            </Tag>
                        </div>
                        
                        <div>
                            <Text strong>Cập nhật thành: </Text>
                            <div className="mt-2 space-x-2 gap-2">
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <Button
                                    style={{
                                        margin: "0 4px"
                                    }}
                                        key={key}
                                        type={selectedBooking.status === key ? "primary" : "default"}
                                        onClick={() => {
                                            handleStatusUpdate(selectedBooking.booking_id, key);
                                            setModalVisible(false);
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}