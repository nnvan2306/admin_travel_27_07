import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import { Button, Form, Modal, Select, Space, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

const { Option } = Select;

interface ContactType {
    id: number;
    service_type: string;
    full_name: string;
    email: string;
    phone: string;
    message: string;
    status: "pending" | "processed" | "completed";
    created_at: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<ContactType | null>(
        null
    );
    const [modalVisible, setModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [form] = Form.useForm();
    const { contextHolder, notifySuccess, notifyError } = useNotifier();

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await API.get("/contacts");
            setContacts(response.data);
        } catch (error) {
            notifyError("Không thể tải danh sách liên hệ");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (contact: ContactType) => {
        setSelectedContact(contact);
        setModalVisible(true);
    };

    const handleStatusChange = (contact: ContactType) => {
        setSelectedContact(contact);
        form.setFieldsValue({ status: contact.status });
        setStatusModalVisible(true);
    };

    const handleStatusSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (selectedContact) {
                await API.put(`/contacts/${selectedContact.id}/status`, values);
                notifySuccess("Cập nhật trạng thái thành công");
                setStatusModalVisible(false);
                fetchContacts();
            }
        } catch (error) {
            notifyError("Cập nhật trạng thái thất bại");
        }
    };

    const getServiceTypeName = (type: string) => {
        const types: Record<string, string> = {
            flight: "Vé máy bay",
            tour: "Du lịch",
            hotel: "Khách sạn",
            visa: "Visa",
            recruitment: "Tuyển dụng",
        };
        return types[type] || type;
    };

    const columns: ColumnsType<ContactType> = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 70,
        },
        {
            title: "Người gửi",
            dataIndex: "full_name",
            key: "full_name",
        },
        {
            title: "Dịch vụ",
            dataIndex: "service_type",
            key: "service_type",
            render: (type) => getServiceTypeName(type),
        },
        {
            title: "Liên hệ",
            key: "contact",
            render: (_, record) => (
                <div>
                    <div>{record.email}</div>
                    <div>{record.phone}</div>
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color = "blue";
                let text = "Đang xử lý";

                if (status === "processed") {
                    color = "orange";
                    text = "Đã xử lý";
                } else if (status === "completed") {
                    color = "green";
                    text = "Hoàn thành";
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: "Ngày gửi",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        onClick={() => handleViewDetails(record)}
                    >
                        Xem chi tiết
                    </Button>
                    <Button
                        type="link"
                        onClick={() => handleStatusChange(record)}
                    >
                        Cập nhật trạng thái
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-6">
            {contextHolder}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Quản lý yêu cầu liên hệ</h1>
                <p className="text-gray-600">
                    Danh sách các yêu cầu liên hệ từ khách hàng
                </p>
            </div>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={contacts}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Spin>

            {/* Modal xem chi tiết */}
            <Modal
                title="Chi tiết yêu cầu liên hệ"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width={700}
            >
                {selectedContact && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-bold">Người gửi:</p>
                                <p>{selectedContact.full_name}</p>
                            </div>
                            <div>
                                <p className="font-bold">Dịch vụ:</p>
                                <p>
                                    {getServiceTypeName(
                                        selectedContact.service_type
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">Email:</p>
                                <p>{selectedContact.email}</p>
                            </div>
                            <div>
                                <p className="font-bold">Số điện thoại:</p>
                                <p>{selectedContact.phone}</p>
                            </div>
                            <div>
                                <p className="font-bold">Ngày gửi:</p>
                                <p>
                                    {new Date(
                                        selectedContact.created_at
                                    ).toLocaleString("vi-VN")}
                                </p>
                            </div>
                            <div>
                                <p className="font-bold">Trạng thái:</p>
                                <p>
                                    <Tag
                                        color={
                                            selectedContact.status === "pending"
                                                ? "blue"
                                                : selectedContact.status ===
                                                  "processed"
                                                ? "orange"
                                                : "green"
                                        }
                                    >
                                        {selectedContact.status === "pending"
                                            ? "Đang xử lý"
                                            : selectedContact.status ===
                                              "processed"
                                            ? "Đã xử lý"
                                            : "Hoàn thành"}
                                    </Tag>
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="font-bold">Nội dung:</p>
                            <div className="p-4 bg-gray-50 rounded-md mt-2 whitespace-pre-line">
                                {selectedContact.message}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal cập nhật trạng thái */}
            <Modal
                title="Cập nhật trạng thái"
                open={statusModalVisible}
                onOk={handleStatusSubmit}
                onCancel={() => setStatusModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="status"
                        label="Trạng thái"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn trạng thái",
                            },
                        ]}
                    >
                        <Select>
                            <Option value="pending">Đang xử lý</Option>
                            <Option value="processed">Đã xử lý</Option>
                            <Option value="completed">Hoàn thành</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
