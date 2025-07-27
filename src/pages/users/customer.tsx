import { Tag, Modal, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useNotifier } from '@/hooks/useNotifier';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import TableGeneric from '@/components/TableGeneric';
import type { TableAction } from '@/components/TableGeneric';
import { API } from '@/lib/axios';
import CustomButton from '@/components/CustomButton';
import {
  PlusOutlined
} from '@ant-design/icons';

interface DataType {
  id: number;
  avatar: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
  is_verified: boolean;
  is_deleted: string;
}

type ActionType = 'disable' | 'enable' | 'force-delete';

export default function Customer() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<ActionType>('disable');
  const [showConfirm, setShowConfirm] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const { notifySuccess, notifyError, contextHolder } = useNotifier();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get("/users");
      let customerUsers = response.data.filter((u: DataType) => u.role === 'customer');
      if (user?.role === 'staff') {
        customerUsers = customerUsers.filter((u: DataType) => u.is_deleted === 'active');
      }
      setData(customerUsers);
    } catch (error) {
      notifyError('Lấy danh sách người dùng thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.role]);

  const handleAction = (id: number, type: ActionType) => {
    setSelectedId(id);
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (selectedId == null) return;
    try {
      if (actionType === 'force-delete') {
        await API.delete(`/user/${selectedId}`);
        notifySuccess('Đã xóa tài khoản vĩnh viễn');
        setData(prev => prev.filter(u => u.id !== selectedId));
      } else {
        await API.put(`/user/${selectedId}/soft-delete`, null);
        const newStatus = actionType === 'disable' ? 'inactive' : 'active';
        notifySuccess(`Đã ${actionType === 'disable' ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản`);
        setData(prev =>
          prev.map(u => (u.id === selectedId ? { ...u, is_deleted: newStatus } : u))
        );
      }
      await fetchUsers();
    } catch (error) {
      notifyError('Thao tác thất bại');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
    }
  };

  const baseColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: 'Ảnh đại diện',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (_: any, record: DataType) =>
        record.avatar_url ? (
          <img src={record.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: "cover" }} />
        ) : (
          <img src="/images/avatar-default.png" alt="default avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        ),
    },
    { title: 'Họ và tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Quyền',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={role === 'staff' ? 'success' : 'default'}>{role}</Tag>,
    },
    {
      title: 'Xác thực',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (is_verified: boolean) => (
        <span className={`${is_verified === true ? 'active' : 'inactive'}`}>
          {is_verified === true ? 'Đã xác thực' : 'Chưa xác thực'}
        </span>
      ),
    },
  ];
  if (user?.role === 'admin') {
    baseColumns.push({
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      render: (isDeleted: string) => (
        <span className={`${isDeleted === 'active' ? 'active' : 'inactive'}`}>
          {isDeleted === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </span>
      ),
    });
  }

  const getActions: (record: DataType) => TableAction[] = (record) => {
    const actions: TableAction[] = [
      {
        key: 'edit',
        label: 'Sửa',
        onClick: () => {
          if (record.is_deleted === 'inactive') {
            notifyError('Tài khoản này đang bị vô hiệu hóa, không thể chỉnh sửa.');
          } else {
            navigate(`/user/update/${record.id}`);
          }
        },
      },
    ];

    if (user?.role === 'admin') {
      actions.push(
        record.is_deleted === 'active'
          ? {
            key: 'disable',
            label: 'Vô hiệu hóa',
            onClick: () => handleAction(record.id, 'disable'),
          }
          : {
            key: 'enable',
            label: 'Kích ',
            onClick: () => handleAction(record.id, 'enable'),
          },
        {
          key: 'delete',
          label: 'Xóa vĩnh viễn',
          onClick: () => handleAction(record.id, 'force-delete'),
          danger: true,
        }
      );
    } else if (user?.role === 'staff') {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        onClick: () => handleAction(record.id, 'disable'),
        danger: true,
        disabled: record.is_deleted === 'inactive',
      });
    }

    return actions;
  };

  return (
    <>
      {contextHolder}
      <div className='mb-2'>
        <Button
          type="primary"
          icon={< PlusOutlined />}
          onClick={() => {
            navigate('/user/create', { state: { role: 'customer' } })
          }}
        >
          Thêm tài khoản
        </ Button>
      </div>
      <TableGeneric<DataType>
        data={data}
        columns={baseColumns}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />
      <Modal
        open={showConfirm}
        title={
          actionType === 'disable'
            ? user?.role === 'staff'
              ? 'Xác nhận xóa tài khoản'
              : 'Xác nhận vô hiệu hóa tài khoản'
            : actionType === 'enable'
              ? 'Xác nhận kích hoạt tài khoản'
              : 'Xác nhận xóa vĩnh viễn tài khoản'
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
              actionType === 'disable'
                ? user?.role === 'staff'
                  ? 'Xóa'
                  : 'Vô hiệu hóa'
                : actionType === 'enable'
                  ? 'Kích hoạt'
                  : 'Xóa'
            }
            customType={
              actionType === 'disable'
                ? user?.role === 'staff'
                  ? 'delete'
                  : 'disable'
                : actionType === 'enable'
                  ? 'enable'
                  : 'forceDelete'
            }
            loading={loading}
            onClick={handleConfirm}
          />,
        ]}
      >
        {
          actionType === 'disable'
            ? user?.role === 'staff'
              ? 'Bạn có chắc chắn muốn xóa tài khoản này không?'
              : 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn kích hoạt lại tài khoản này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác.'
        }
      </Modal>
    </>
  );
}
