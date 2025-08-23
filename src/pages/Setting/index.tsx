import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import {
    DeleteOutlined,
    EditOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Table,
    Tag,
} from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

interface CompanyContact {
    id: number;
    address: string;
    hotline: string;
    email: string;
    website: string;
    is_deleted: string;
    created_at: string;
    updated_at: string;
}

const SettingPage = () => {
    const [contacts, setContacts] = useState<CompanyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<CompanyContact | null>(
        null
    );
    const [form] = Form.useForm();
    const { contextHolder, notifySuccess, notifyError } = useNotifier();

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await API.get("/admin/company-contacts");
            setContacts(response.data);
        } catch (error) {
            notifyError("Không thể tải danh sách thông tin liên hệ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            if (editingContact) {
                await API.put(
                    `/admin/company-contacts/${editingContact.id}`,
                    values
                );
                notifySuccess("Cập nhật thông tin liên hệ thành công");
            } else {
                await API.post("/admin/company-contacts", values);
                notifySuccess("Thêm thông tin liên hệ thành công");
            }

            setModalVisible(false);
            setEditingContact(null);
            form.resetFields();
            fetchContacts();
        } catch (error: any) {
            notifyError(error.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleEdit = (contact: CompanyContact) => {
        setEditingContact(contact);
        form.setFieldsValue({
            address: contact.address || "",
            hotline: contact.hotline || "",
            email: contact.email || "",
            website: contact.website || "",
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await API.delete(`/admin/company-contacts/${id}`);
            notifySuccess("Xóa thông tin liên hệ thành công");
            fetchContacts();
        } catch (error: any) {
            notifyError(error.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const resetForm = () => {
        setEditingContact(null);
        form.resetFields();
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address",
            render: (address: string) => (
                <div className="flex items-center gap-2">
                    <EnvironmentOutlined style={{ color: "#01b9f0" }} />
                    <span>{address || "Chưa có"}</span>
                </div>
            ),
        },
        {
            title: "Hotline",
            dataIndex: "hotline",
            key: "hotline",
            render: (hotline: string) => (
                <div className="flex items-center gap-2">
                    <PhoneOutlined style={{ color: "#01b9f0" }} />
                    <span>{hotline || "Chưa có"}</span>
                </div>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (email: string) => (
                <div className="flex items-center gap-2">
                    <MailOutlined style={{ color: "#01b9f0" }} />
                    <span>{email || "Chưa có"}</span>
                </div>
            ),
        },
        {
            title: "Website",
            dataIndex: "website",
            key: "website",
            render: (website: string) => (
                <div className="flex items-center gap-2">
                    <GlobalOutlined style={{ color: "#01b9f0" }} />
                    <span>{website || "Chưa có"}</span>
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "is_deleted",
            key: "is_deleted",
            render: (status: string) => (
                <Tag color={status === "active" ? "green" : "red"}>
                    {status === "active" ? "Hoạt động" : "Không hoạt động"}
                </Tag>
            ),
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updated_at",
            key: "updated_at",
            render: (date: string) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: CompanyContact) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Chỉnh sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            {contextHolder}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            Quản lý thông tin liên hệ
                        </h1>
                        <p className="text-gray-600">
                            Quản lý thông tin liên hệ của công ty hiển thị trên
                            website
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            resetForm();
                            setModalVisible(true);
                        }}
                    >
                        Thêm thông tin liên hệ
                    </Button>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={contacts}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} bản ghi`,
                    }}
                />
            </Card>

            <Modal
                title={
                    editingContact
                        ? "Chỉnh sửa thông tin liên hệ"
                        : "Thêm thông tin liên hệ mới"
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    resetForm();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        address: "",
                        hotline: "",
                        email: "",
                        website: "",
                    }}
                >
                    <Form.Item
                        label="Địa chỉ"
                        name="address"
                        rules={[
                            {
                                max: 255,
                                message: "Địa chỉ không được quá 255 ký tự",
                            },
                        ]}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Nhập địa chỉ công ty"
                            showCount
                            maxLength={255}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Hotline"
                        name="hotline"
                        rules={[
                            {
                                max: 20,
                                message: "Hotline không được quá 20 ký tự",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Nhập số hotline"
                            prefix={<PhoneOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { type: "email", message: "Email không hợp lệ" },
                            {
                                max: 100,
                                message: "Email không được quá 100 ký tự",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Nhập email"
                            prefix={<MailOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Website"
                        name="website"
                        rules={[
                            { type: "url", message: "Website không hợp lệ" },
                            {
                                max: 255,
                                message: "Website không được quá 255 ký tự",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Nhập website (VD: https://example.com)"
                            prefix={<GlobalOutlined />}
                        />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <div className="flex justify-end space-x-2">
                            <Button
                                onClick={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingContact ? "Cập nhật" : "Thêm"}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SettingPage;
