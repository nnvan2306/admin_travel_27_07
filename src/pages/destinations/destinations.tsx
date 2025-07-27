import { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Dropdown,
} from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { API } from '@/lib/axios';
import TableGeneric from '@/components/TableGeneric';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useNotifier } from '@/hooks/useNotifier';
import CustomButton from '@/components/CustomButton';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from "react-icons/fa6";

interface DestinationType {
  id: number;
  name: string;
  area: string;
  image: string | null;
  image_url: string | null;
  is_deleted: 'active' | 'inactive';
  category_id: number;
  category_name: string;
}

export default function Destinations() {
  const [data, setData] = useState<DestinationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmToggleVisible, setConfirmToggleVisible] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [targetToggleStatus, setTargetToggleStatus] = useState<'active' | 'inactive' | null>(null);

  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();
  const navigate = useNavigate();

  // Fetch dữ liệu theo role: admin xem tất cả, staff xem active
  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const [destRes, catRes] = await Promise.all([
        API.get('/destinations'),
        API.get('/destination-categories'),
      ]);

      const categoryMap: Record<number, string> = {};
      catRes.data.forEach((cat: any) => {
        categoryMap[cat.category_id] = cat.category_name;
      });

      const filtered = destRes.data
        .map((item: any) => ({
          id: item.destination_id,
          name: item.name,
          image: item.img_banner,
          image_url: item.img_banner_url,
          is_deleted: item.is_deleted,
          category_id: item.category_id,
          category_name: categoryMap[item.category_id] || 'Không xác định',
        }))
        .filter((item: DestinationType) => role === 'admin' || item.is_deleted === 'active');

      setData(filtered);
    } catch {
      notifyError('Không thể tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleEdit = (record: DestinationType) => {
    navigate(`/destination/edit/${record.id}`);
  };


  // Mở modal xác nhận toggle trạng thái
  const confirmToggleStatus = (id: number, currentStatus: 'active' | 'inactive') => {
    setTargetId(id);
    setTargetToggleStatus(currentStatus);
    setConfirmToggleVisible(true);
  };

  // Xử lý toggle trạng thái (vô hiệu hóa/kích hoạt)
  const handleToggleStatus = async () => {
    if (targetId === null) return;
    setLoading(true);
    try {
      await API.post(`/destinations/${targetId}/toggle`);
      notifySuccess('Cập nhật trạng thái thành công');
      fetchDestinations();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setLoading(false);
      setConfirmToggleVisible(false);
      setTargetId(null);
      setTargetToggleStatus(null);
    }
  };

  // Xóa vĩnh viễn
  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await API.delete(`/destinations/${id}`);
      notifySuccess('Xóa vĩnh viễn thành công');
      fetchDestinations();
    } catch {
      notifyError('Xóa thất bại');
    } finally {
      setLoading(false);
      setConfirmDeleteVisible(false);
      setTargetId(null);
    }
  };

  // Modal xác nhận xóa vĩnh viễn
  const confirmDelete = (id: number) => {
    setTargetId(id);
    setConfirmDeleteVisible(true);
  };

  // Các cột bảng
  const columns: ColumnsType<DestinationType> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Tên địa điểm', dataIndex: 'name' },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_url',
      width: 400,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt="Hình ảnh"
            className="w-12 h-12 rounded-md object-cover"
          />
        ) : (
          'Không có'
        ),
    },
    { title: 'Danh mục', dataIndex: 'category_name' },
  ];

  // Cột trạng thái chỉ admin mới thấy
  if (role === 'admin') {
    columns.push({
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      width: 400,
      render: (val) =>
        val === 'active' ? (
          <span className="active">Đang hoạt động</span>
        ) : (
          <span className="inactive">Ngưng hoạt động</span>
        ),
    });
  }

  // Cột thao tác
  columns.push({
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    render: (_, record) => {
      const items: MenuProps['items'] = [
        { key: 'view', label: 'Xem' },
        { key: 'edit', label: 'Sửa' },
      ];

      if (role === 'admin') {
        items.push(
          {
            key: 'toggle-status',
            label:
              record.is_deleted === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
          },
          {
            key: 'force-delete',
            label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
          }
        );
      } else if (role === 'staff') {
        // staff chỉ xóa mềm (toggle trạng thái)
        items.push({
          key: 'soft-delete',
          label: <span style={{ color: 'red' }}>Xóa</span>,
        });
      }

      const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'view') {
          navigate(`/destination/${record.id}`);
        } else if (key === 'edit') {
          handleEdit(record);
        } else if (key === 'toggle-status') {
          confirmToggleStatus(record.id, record.is_deleted);
        } else if (key === 'force-delete') {
          confirmDelete(record.id);
        } else if (key === 'soft-delete') {
          // staff gọi toggle (xóa mềm)
          confirmToggleStatus(record.id, record.is_deleted);
        }
      };

      return (
        <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
          <Button type="text" icon={<EllipsisOutlined />} />
        </Dropdown>
      );
    },
  });

  return (
    <>
      {contextHolder}

      <div className="mb-4 flex justify-between items-center">
        <Button
          type="primary"
          icon={<FaPlus />}
          onClick={() => navigate('/destination/create')}
        >
          Thêm địa điểm
        </Button>
      </div>

      <TableGeneric<DestinationType>
        data={data}
        columns={columns}
        loading={loading}
        rowKey="id"
      />

      {/* Modal xác nhận xóa vĩnh viễn */}
      <Modal
        open={confirmDeleteVisible}
        title="Xác nhận xóa vĩnh viễn"
        onCancel={() => setConfirmDeleteVisible(false)}
        footer={[
          <CustomButton
            key="cancel"
            text="Hủy"
            customType="cancel"
            onClick={() => setConfirmDeleteVisible(false)}
          />,
          <CustomButton
            key="delete"
            text="Xóa"
            customType="delete"
            onClick={() => targetId !== null && handleDelete(targetId)}
            loading={loading}
          />,
        ]}
      >
        <p>Bạn chắc chắn muốn xóa vĩnh viễn địa điểm này?</p>
      </Modal>

      {/* Modal xác nhận vô hiệu hóa/kích hoạt */}
      <Modal
        open={confirmToggleVisible}
        title={
          targetToggleStatus === 'active'
            ? 'Xác nhận vô hiệu hóa'
            : 'Xác nhận kích hoạt'
        }
        onCancel={() => setConfirmToggleVisible(false)}
        footer={[
          <CustomButton
            key="cancel"
            text="Hủy"
            customType="cancel"
            onClick={() => setConfirmToggleVisible(false)}
          />,
          <CustomButton
            key="confirm"
            text={targetToggleStatus === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
            customType="delete"
            onClick={handleToggleStatus}
            loading={loading}
          />,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn{' '}
          {targetToggleStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} địa điểm
          này không?
        </p>
      </Modal>
    </>
  );
}
