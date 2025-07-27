import { Tag, Modal, Select, message } from "antd";
import { useEffect, useState } from "react";
import { useNotifier } from "@/hooks/useNotifier";
import { useNavigate } from "react-router-dom";
import TableGeneric from "@/components/TableGeneric";
import { API } from "@/lib/axios";
import CustomButton from "@/components/CustomButton";

interface DataType {
    id: number;
    avatar: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    avatar_url?: string;
    is_verified?: boolean;
    is_deleted?: string;
}

type ActionType = "disable" | "enable" | "force-delete";

export default function Authorization() {
    const [data, setData] = useState<DataType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [actionType, setActionType] = useState<ActionType>("disable");
    const [showConfirm, setShowConfirm] = useState(false);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [newRole, setNewRole] = useState<string>("");
    const [loadingRoleChange, setLoadingRoleChange] = useState(false);
    const navigate = useNavigate();
    const { notifySuccess, notifyError, contextHolder } = useNotifier();

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const response = await API.get("/users");
            setData(response.data);
        } catch (error) {
            notifyError("Lấy danh sách người dùng thất bại");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const handleAction = (id: number, type: ActionType) => {
        setSelectedId(id);
        setActionType(type);
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        if (selectedId == null) return;
        try {
            if (actionType === "force-delete") {
                await API.delete(`/user/${selectedId}`);
                notifySuccess("Đã xóa tài khoản vĩnh viễn");
            } else {
                await API.put(`/user/${selectedId}/soft-delete`, null);
                notifySuccess(
                    actionType === "disable"
                        ? "Đã vô hiệu hóa tài khoản"
                        : "Đã kích hoạt tài khoản"
                );
            }

            await fetchAllUsers();
        } catch (error) {
            notifyError("Thao tác thất bại");
        } finally {
            setShowConfirm(false);
            setSelectedId(null);
        }
    };

    const handleChangeRole = (id: number, currentRole: string) => {
        setSelectedId(id);
        setNewRole(currentRole);
        setRoleModalVisible(true);
    };

    const handleConfirmRoleChange = async () => {
        if (!selectedId || !newRole) return;
        try {
            await API.put(`/user/${selectedId}`, { role: newRole });
            message.success("Cập nhật quyền thành công");
            await fetchAllUsers();
        } catch (err) {
            message.error("Cập nhật quyền thất bại");
        } finally {
            setRoleModalVisible(false);
            setSelectedId(null);
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        {
            title: "Ảnh đại diện",
            dataIndex: "avatar_url",
            key: "avatar_url",
            render: (url: string) => (
                <img
                    src={url || "/images/avatar-default.png"}
                    alt="avatar"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                    }}
                />
            ),
        },
        { title: "Họ và tên", dataIndex: "full_name", key: "full_name" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "SĐT", dataIndex: "phone", key: "phone" },
        {
            title: "Quyền",
            dataIndex: "role",
            key: "role",
            render: (role: string) => (
                <Tag
                    color={
                        role === "admin"
                            ? "red"
                            : role === "staff"
                            ? "blue"
                            : "green"
                    }
                >
                    {role}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "is_deleted",
            key: "is_deleted",
            render: (val: string) => (
                <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        val === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {val === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                </span>
            ),
        },
    ];

    const getActions = (record: DataType) => [
        {
            key: "changeRole",
            label: "Thay đổi quyền",
            onClick: () => handleChangeRole(record.id, record.role),
        },
        {
            key: "edit",
            label: "Sửa",
            onClick: () => navigate(`/user/update/${record.id}`),
        },
        {
            key: "toggle",
            label: record.is_deleted === "active" ? "Vô hiệu hóa" : "Kích hoạt",
            onClick: () =>
                handleAction(
                    record.id,
                    record.is_deleted === "active" ? "disable" : "enable"
                ),
        },
        {
            key: "delete",
            label: <span style={{ color: "red" }}>Xóa vĩnh viễn</span>,
            onClick: () => handleAction(record.id, "force-delete"),
            danger: true,
        },
    ];

    return (
        <>
            {contextHolder}
            <TableGeneric<DataType>
                data={data}
                columns={columns}
                loading={loading}
                rowKey="id"
                getActions={getActions}
            />
            <Modal
                title="Thay đổi quyền người dùng"
                open={roleModalVisible}
                onCancel={() => {
                    setRoleModalVisible(false);
                    setSelectedId(null);
                }}
                footer={[
                    <CustomButton
                        key="cancel"
                        text="Hủy"
                        customType="cancel"
                        onClick={() => {
                            setRoleModalVisible(false);
                            setSelectedId(null);
                        }}
                    />,
                    <CustomButton
                        key="confirm"
                        text="Xác nhận"
                        customType="enable"
                        loading={loadingRoleChange}
                        onClick={handleConfirmRoleChange}
                    />,
                ]}
            >
                <p className="mb-2">Chọn quyền mới cho người dùng:</p>
                <Select
                    value={newRole}
                    onChange={setNewRole}
                    style={{ width: "100%" }}
                    placeholder="Chọn quyền"
                >
                    <Select.Option value="admin">Admin</Select.Option>
                    <Select.Option value="staff">Staff</Select.Option>
                    <Select.Option value="customer">Customer</Select.Option>
                </Select>
            </Modal>
            <Modal
                open={showConfirm}
                title={
                    actionType === "disable"
                        ? "Xác nhận vô hiệu hóa tài khoản"
                        : actionType === "enable"
                        ? "Xác nhận kích hoạt tài khoản"
                        : "Xác nhận xóa vĩnh viễn tài khoản"
                }
                onCancel={() => {
                    setShowConfirm(false);
                    setSelectedId(null);
                }}
                footer={[
                    <CustomButton
                        key="cancel"
                        text="Hủy"
                        customType="cancel"
                        onClick={() => {
                            setShowConfirm(false);
                            setSelectedId(null);
                        }}
                    />,
                    <CustomButton
                        key="confirm"
                        text={
                            actionType === "disable"
                                ? "Vô hiệu hóa"
                                : actionType === "enable"
                                ? "Kích hoạt"
                                : "Xóa vĩnh viễn"
                        }
                        customType={
                            actionType === "disable"
                                ? "disable"
                                : actionType === "enable"
                                ? "enable"
                                : "forceDelete"
                        }
                        loading={loading}
                        onClick={handleConfirm}
                    />,
                ]}
            >
                {actionType === "disable"
                    ? "Bạn có chắc chắn muốn vô hiệu hóa tài khoản này không?"
                    : actionType === "enable"
                    ? "Bạn có chắc chắn muốn kích hoạt lại tài khoản này không?"
                    : "Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác."}
            </Modal>
        </>
    );
}
