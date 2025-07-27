import { Tag, Modal, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useNotifier } from '@/hooks/useNotifier';
import { useNavigate } from 'react-router-dom';
import TableGeneric from '@/components/TableGeneric';
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
  is_verified?: boolean;
  is_deleted?: string;
}

type ActionType = 'disable' | 'enable' | 'force-delete';

export default function Employee() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<ActionType>('disable');
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { notifySuccess, notifyError, contextHolder } = useNotifier();

  const fetchStaffUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get("/users");
      const staffUsers = response.data.filter((u: DataType) => u.role === 'staff' || u.role === 'admin');
      setData(staffUsers);
    } catch (error) {
      notifyError('Lấy danh sách nhân viên thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffUsers();
  }, []);

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
      } else {
        await API.put(`/user/${selectedId}/soft-delete`, null);
        notifySuccess(
          actionType === 'disable'
            ? 'Đã vô hiệu hóa tài khoản'
            : 'Đã kích hoạt tài khoản'
        );
      }

      await fetchStaffUsers();
    } catch (error) {
      notifyError('Thao tác thất bại');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
    }
  };

  const columns = [
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
      render: (role: string) => <Tag color={role === 'admin' ? 'magenta' : 'success'}>{role}</Tag>,
    },
    {
      title: 'Xác thực',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (is_verified: boolean) => (
        <span className={`
          ${is_verified ? 'active' : 'inactive'}`}>
          {is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      render: (is_deleted: string) => (
        <span className={`
          ${is_deleted === 'active' ? 'active' : 'inactive'}`}>
          {is_deleted === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </span>
      ),
    },
  ];

  const getActions = (record: DataType) => [
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
    {
      key: 'toggle',
      label: record.is_deleted === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
      onClick: () =>
        handleAction(record.id, record.is_deleted === 'active' ? 'disable' : 'enable'),
    },
    {
      key: 'delete',
      label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
      onClick: () => handleAction(record.id, 'force-delete'),
      danger: true,
    },
  ];

  return (
    <>
      {contextHolder}
      <div className='mb-2'>
        <Button
          type="primary"
          icon={< PlusOutlined />}
          onClick={() => {
            navigate('/user/create', { state: { role: 'employee' } })
          }}
        >
          Thêm tài khoản
        </ Button>
      </div>
      <TableGeneric<DataType>
        data={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />
      <Modal
        open={showConfirm}
        title={
          actionType === 'disable'
            ? 'Xác nhận vô hiệu hóa tài khoản'
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
                ? 'Vô hiệu hóa'
                : actionType === 'enable'
                  ? 'Kích hoạt'
                  : 'Xóa vĩnh viễn'
            }
            customType={
              actionType === 'disable'
                ? 'disable'
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
            ? 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn kích hoạt lại tài khoản này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác.'
        }
      </Modal>
    </>
  );
}
