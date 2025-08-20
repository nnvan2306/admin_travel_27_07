/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EditOutlined, FilterOutlined, PlusOutlined } from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
} from "antd";
import locale from "antd/lib/date-picker/locale/vi_VN";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Promotion {
    id: number;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    start_date: string;
    end_date: string;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    description: string | null;
}

interface PromotionPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const defaultPromotion: Promotion = {
    id: 0,
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().add(1, "month").format("YYYY-MM-DD"),
    max_uses: null,
    current_uses: 0,
    is_active: true,
    description: "",
};

export default function Bonnus() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPromotion, setCurrentPromotion] =
        useState<Promotion>(defaultPromotion);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState<PromotionPagination>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchPromotions = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const params: any = {
                page: page,
                per_page: pageSize,
            };

            // Thêm các tham số lọc nếu có
            if (filterStatus !== "all") {
                params.status = filterStatus;
            }

            if (startDate) {
                params.start_date = startDate.format("YYYY-MM-DD");
            }

            if (endDate) {
                params.end_date = endDate.format("YYYY-MM-DD");
            }

            const response = await axios.get(`${API_URL}/promotions`, {
                params,
            });

            if (response.data.success) {
                setPromotions(response.data.data);
                setPagination({
                    current_page: response.data.meta.current_page,
                    last_page: response.data.meta.last_page,
                    per_page: response.data.meta.per_page,
                    total: response.data.meta.total,
                });
            } else {
                message.error("Lỗi khi tải danh sách mã khuyến mãi");
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
            message.error("Không thể tải danh sách mã khuyến mãi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions(currentPage, pageSize);
    }, [currentPage, pageSize, filterStatus, startDate, endDate]);

    const handleOpenModal = () => {
        form.resetFields();
        setCurrentPromotion(defaultPromotion);
        setIsEditing(false);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleEdit = (promotion: Promotion) => {
        setCurrentPromotion(promotion);
        setIsEditing(true);

        form.setFieldsValue({
            ...promotion,
            start_date: dayjs(promotion.start_date),
            end_date: dayjs(promotion.end_date),
            max_uses:
                promotion.max_uses === null ? undefined : promotion.max_uses,
        });

        setModalVisible(true);
    };

    // const handleDelete = async (id: number) => {
    //     Modal.confirm({
    //         title: "Xác nhận xóa",
    //         content: "Bạn có chắc chắn muốn xóa mã khuyến mãi này không?",
    //         okText: "Xóa",
    //         okType: "danger",
    //         cancelText: "Hủy",
    //         onOk: async () => {
    //             try {
    //                 const response = await axios.delete(
    //                     `${API_URL}/promotions/${id}`
    //                 );

    //                 if (response.data.success) {
    //                     setPromotions(
    //                         promotions.filter((promo) => promo.id !== id)
    //                     );
    //                     message.success(
    //                         response.data.message ||
    //                             "Xóa mã khuyến mãi thành công"
    //                     );
    //                 } else {
    //                     message.error(
    //                         response.data.message ||
    //                             "Không thể xóa mã khuyến mãi"
    //                     );
    //                 }
    //             } catch (error) {
    //                 console.error("Error deleting promotion:", error);
    //                 message.error("Không thể xóa mã khuyến mãi");
    //             }
    //         },
    //     });
    // };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const response = await axios.patch(`${API_URL}/promotions/${id}`, {
                is_active: !currentStatus,
            });

            if (response.data.success) {
                setPromotions(
                    promotions.map((promo) =>
                        promo.id === id
                            ? { ...promo, is_active: !currentStatus }
                            : promo
                    )
                );

                message.success(
                    response.data.message ||
                        `Mã khuyến mãi đã được ${
                            !currentStatus ? "kích hoạt" : "vô hiệu hóa"
                        }`
                );
            } else {
                message.error(
                    response.data.message ||
                        "Không thể cập nhật trạng thái mã khuyến mãi"
                );
            }
        } catch (error) {
            console.error("Error updating promotion status:", error);
            message.error("Không thể cập nhật trạng thái mã khuyến mãi");
        }
    };

    const handleSubmit = async (values: any) => {
        // Format dữ liệu trước khi gửi đi
        const promotionData = {
            ...values,
            start_date: values.start_date.format("YYYY-MM-DD"),
            end_date: values.end_date.format("YYYY-MM-DD"),
            max_uses: values.max_uses || null,
        };

        console.log("check currentPromotion: ", currentPromotion);

        try {
            let response;
            if (isEditing) {
                response = await axios.put(
                    `${API_URL}/promotions/${currentPromotion.id}`,
                    promotionData
                );
            } else {
                response = await axios.post(
                    `${API_URL}/promotions`,
                    promotionData
                );
            }

            if (response.data.success) {
                if (isEditing) {
                    setPromotions(
                        promotions.map((promo) =>
                            promo.id === currentPromotion.id
                                ? response.data.data
                                : promo
                        )
                    );
                } else {
                    setPromotions([...promotions, response.data.data]);
                }

                message.success(
                    response.data.message ||
                        `${
                            isEditing ? "Cập nhật" : "Tạo"
                        } mã khuyến mãi thành công`
                );
                handleCloseModal();
                // Tải lại danh sách để đảm bảo dữ liệu được cập nhật
                fetchPromotions(currentPage, pageSize);
            } else {
                message.error(
                    response.data.message ||
                        `Không thể ${
                            isEditing ? "cập nhật" : "tạo"
                        } mã khuyến mãi`
                );
            }
        } catch (error: any) {
            console.error("Error saving promotion:", error);

            // Xử lý lỗi validation từ backend
            if (
                error.response &&
                error.response.data &&
                error.response.data.errors
            ) {
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach((errorMsg: any) => {
                    message.error(errorMsg);
                });
            } else {
                message.error(
                    `Không thể ${isEditing ? "cập nhật" : "tạo"} mã khuyến mãi`
                );
            }
        }
    };

    // Tạo mã ngẫu nhiên
    const generateRandomCode = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        form.setFieldValue("code", result);
    };

    const isExpired = (endDate: string) => {
        return dayjs(endDate).isBefore(dayjs());
    };

    const getStatusTag = (promo: Promotion) => {
        if (!promo.is_active) {
            return <Tag color="default">Vô hiệu hóa</Tag>;
        } else if (isExpired(promo.end_date)) {
            return <Tag color="error">Hết hạn</Tag>;
        } else if (
            promo.max_uses !== null &&
            promo.current_uses >= promo.max_uses
        ) {
            return <Tag color="warning">Đã dùng hết</Tag>;
        } else {
            return <Tag color="success">Đang hoạt động</Tag>;
        }
    };

    // Xử lý thay đổi trang và kích thước trang
    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    // Xử lý xóa bộ lọc
    const handleClearFilters = () => {
        setFilterStatus("all");
        setStartDate(null);
        setEndDate(null);
        fetchPromotions(1, pageSize);
    };

    const columns = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            render: (text: string, record: Promotion) => (
                <div>
                    <div className="font-bold">{text}</div>
                    {record.description && (
                        <div className="text-xs text-gray-500">
                            {record.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Loại giảm giá",
            dataIndex: "discount_type",
            key: "discount_type",
            render: (type: string) =>
                type === "percentage" ? "Phần trăm" : "Số tiền cố định",
        },
        {
            title: "Giá trị",
            dataIndex: "discount_value",
            key: "discount_value",
            render: (value: number, record: Promotion) =>
                record.discount_type === "percentage"
                    ? `${value}%`
                    : new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                      }).format(value),
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "start_date",
            key: "start_date",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Ngày kết thúc",
            dataIndex: "end_date",
            key: "end_date",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Trạng thái",
            key: "status",
            render: (_: any, record: Promotion) => getStatusTag(record),
        },
        {
            title: "Kích hoạt",
            key: "active",
            render: (_: any, record: Promotion) => (
                <Switch
                    checked={record.is_active}
                    onChange={() =>
                        handleToggleStatus(record.id, record.is_active)
                    }
                />
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_: any, record: Promotion) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                        className="bg-blue-500"
                    />
                    {/* <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(record.id)}
                    /> */}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={4}>Quản lý mã khuyến mãi</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenModal}
                    className="bg-blue-500"
                >
                    Tạo mã khuyến mãi
                </Button>
            </div>

            {/* Bộ lọc */}
            <Card className="mb-6">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={6}>
                        <Select
                            placeholder="Trạng thái"
                            className="w-full"
                            value={filterStatus}
                            onChange={(value) => setFilterStatus(value)}
                        >
                            <Option value="all">Tất cả</Option>
                            <Option value="active">Đang hoạt động</Option>
                            <Option value="inactive">Vô hiệu hóa</Option>
                        </Select>
                    </Col>
                    <Col xs={24} md={6}>
                        <DatePicker
                            placeholder="Từ ngày"
                            locale={locale}
                            value={startDate}
                            onChange={(date) => setStartDate(date)}
                            className="w-full"
                            format="DD/MM/YYYY"
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <DatePicker
                            placeholder="Đến ngày"
                            locale={locale}
                            value={endDate}
                            onChange={(date) => setEndDate(date)}
                            className="w-full"
                            format="DD/MM/YYYY"
                        />
                    </Col>
                    <Col xs={24} md={6} className="text-right">
                        <Button
                            icon={<FilterOutlined />}
                            onClick={handleClearFilters}
                        >
                            Xóa bộ lọc
                        </Button>
                    </Col>
                </Row>
            </Card>

            <br />
            {/* Bảng danh sách */}
            <Table
                columns={columns}
                dataSource={promotions}
                rowKey="id" // Sửa thành id để phù hợp với cấu trúc dữ liệu
                loading={loading}
                pagination={{
                    current: pagination.current_page,
                    pageSize: pagination.per_page,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} của ${total} mã`,
                }}
                onChange={handleTableChange}
            />

            {/* Modal thêm/sửa */}
            <Modal
                title={
                    isEditing
                        ? "Chỉnh sửa mã khuyến mãi"
                        : "Tạo mã khuyến mãi mới"
                }
                open={modalVisible}
                onCancel={handleCloseModal}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        ...defaultPromotion,
                        start_date: dayjs(defaultPromotion.start_date),
                        end_date: dayjs(defaultPromotion.end_date),
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã khuyến mãi"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mã khuyến mãi",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Nhập mã khuyến mãi"
                                    suffix={
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={generateRandomCode}
                                        >
                                            Tạo mã
                                        </Button>
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="discount_type"
                                label="Loại giảm giá"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn loại giảm giá",
                                    },
                                ]}
                            >
                                <Select placeholder="Chọn loại giảm giá">
                                    <Option value="percentage">
                                        Phần trăm (%)
                                    </Option>
                                    <Option value="fixed">
                                        Số tiền cố định (VNĐ)
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="discount_value"
                                label="Giá trị giảm giá"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Vui lòng nhập giá trị giảm giá",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || value <= 0) {
                                                return Promise.reject(
                                                    "Giá trị phải lớn hơn 0"
                                                );
                                            }
                                            if (
                                                getFieldValue(
                                                    "discount_type"
                                                ) === "percentage" &&
                                                value > 100
                                            ) {
                                                return Promise.reject(
                                                    "Phần trăm không thể vượt quá 100%"
                                                );
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <InputNumber
                                    className="w-full"
                                    placeholder="Nhập giá trị giảm giá"
                                    formatter={(value) =>
                                        form.getFieldValue("discount_type") ===
                                        "percentage"
                                            ? `${value}%`
                                            : `${value}`.replace(
                                                  /\B(?=(\d{3})+(?!\d))/g,
                                                  ","
                                              )
                                    }
                                    parser={(value) =>
                                        value!
                                            .replace(/\$\s?|(,*)/g, "")
                                            .replace("%", "")
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="start_date"
                                label="Ngày bắt đầu"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn ngày bắt đầu",
                                    },
                                ]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="DD/MM/YYYY"
                                    locale={locale}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="end_date"
                                label="Ngày kết thúc"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn ngày kết thúc",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (
                                                !value ||
                                                !getFieldValue("start_date")
                                            ) {
                                                return Promise.resolve();
                                            }

                                            // Chuyển đổi thành timestamp để so sánh đơn giản
                                            const endTimestamp =
                                                value.valueOf();
                                            const startTimestamp =
                                                getFieldValue(
                                                    "start_date"
                                                ).valueOf();

                                            if (
                                                endTimestamp >= startTimestamp
                                            ) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                "Ngày kết thúc phải sau ngày bắt đầu"
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="DD/MM/YYYY"
                                    locale={locale}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả">
                                <TextArea
                                    rows={3}
                                    placeholder="Nhập mô tả cho mã khuyến mãi"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="is_active" valuePropName="checked">
                                <Switch
                                    checkedChildren="Kích hoạt"
                                    unCheckedChildren="Vô hiệu"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider />
                    <div className="flex justify-end">
                        <Button className="mr-2" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="bg-blue-500"
                        >
                            {isEditing ? "Cập nhật" : "Tạo mã"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
