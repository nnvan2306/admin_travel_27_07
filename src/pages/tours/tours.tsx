import { useEffect, useState } from 'react';
import { Table, Button, Dropdown, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { API } from '@/lib/axios';
import { useNotifier } from '@/hooks/useNotifier';
import { useNavigate } from 'react-router-dom';

interface TourType {
  tour_id: number;
  tour_name: string;
  image: string | null;
  category: {
    category_name: string;
  } | null;
  is_deleted: 'active' | 'inactive';
}

export default function Tours() {
  const [data, setData] = useState<TourType[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmToggleVisible, setConfirmToggleVisible] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [targetToggleStatus, setTargetToggleStatus] = useState<'active' | 'inactive' | null>(null);

  const role = useSelector((state: any) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();
  const navigate = useNavigate();

  const BASE_IMG_URL = `${import.meta.env.VITE_BACKEND_URL}storage/`; // sửa theo backend của bạn

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await API.get('/tours');
      // Nếu cần lọc theo role giống destination thì filter ở đây
      const tours: TourType[] = res.data
        .filter((tour: TourType) => role === 'admin' || tour.is_deleted === 'active');
      setData(tours);
    } catch {
      notifyError('Không thể tải danh sách tour');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const confirmToggleStatus = (id: number, currentStatus: 'active' | 'inactive') => {
    setTargetId(id);
    setTargetToggleStatus(currentStatus);
    setConfirmToggleVisible(true);
  };

  const handleToggleStatus = async () => {
    if (targetId === null) return;
    setLoading(true);
    try {
      await API.post(`/tours/${targetId}/toggle`); // gọi softDelete API
      notifySuccess('Cập nhật trạng thái thành công');
      fetchTours();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setLoading(false);
      setConfirmToggleVisible(false);
      setTargetId(null);
      setTargetToggleStatus(null);
    }
  };

  const confirmDelete = (id: number) => {
    setTargetId(id);
    setConfirmDeleteVisible(true);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await API.delete(`/tours/${id}`);
      notifySuccess('Xóa vĩnh viễn thành công');
      fetchTours();
    } catch {
      notifyError('Xóa thất bại');
    } finally {
      setLoading(false);
      setConfirmDeleteVisible(false);
      setTargetId(null);
    }
  };

  const columns: ColumnsType<TourType> = [
    {
      title: 'ID',
      dataIndex: 'tour_id',
      width: 80,
    },
    {
      title: 'Tên tour',
      dataIndex: 'tour_name',
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      width: 120,
      render: (img) =>
        img ? (
          <img
            src={`${BASE_IMG_URL}${img}`}
            alt="Hình ảnh tour"
            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          'Không có'
        ),
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'category_name'],
      width: 150,
      render: (text) => text || 'Không có',
    },
  ];

  if (role === 'admin') {
    columns.push({
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      width: 120,
      render: (val) =>
        val === 'active' ? (
          <span style={{ color: 'green', fontWeight: '600' }}>Đang hoạt động</span>
        ) : (
          <span style={{ color: 'red', fontWeight: '600' }}>Ngưng hoạt động</span>
        ),
    });
  }

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
            label: record.is_deleted === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
          },
          {
            key: 'force-delete',
            label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
          }
        );
      } else if (role === 'staff') {
        items.push({
          key: 'soft-delete',
          label: <span style={{ color: 'red' }}>Xóa</span>,
        });
      }

      const handleMenuClick = ({ key }: { key: string }) => {
        if (key === 'view') {
          navigate(`/tour/${record.tour_id}`);
        } else if (key === 'edit') {
          navigate(`/tour/edit/${record.tour_id}`);
        } else if (key === 'toggle-status') {
          confirmToggleStatus(record.tour_id, record.is_deleted);
        } else if (key === 'force-delete') {
          confirmDelete(record.tour_id);
        } else if (key === 'soft-delete') {
          confirmToggleStatus(record.tour_id, record.is_deleted);
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

      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/tour/create')}
      >
        Thêm tour mới
      </Button>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="tour_id"
      />

      {/* Modal xác nhận toggle trạng thái */}
      <Modal
        open={confirmToggleVisible}
        title={targetToggleStatus === 'active' ? 'Xác nhận vô hiệu hóa' : 'Xác nhận kích hoạt'}
        onCancel={() => setConfirmToggleVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmToggleVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleToggleStatus}
            loading={loading}
          >
            {targetToggleStatus === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn {targetToggleStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} tour này không?
        </p>
      </Modal>

      {/* Modal xác nhận xóa vĩnh viễn */}
      <Modal
        open={confirmDeleteVisible}
        title="Xác nhận xóa vĩnh viễn"
        onCancel={() => setConfirmDeleteVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmDeleteVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={() => targetId !== null && handleDelete(targetId)}
            loading={loading}
          >
            Xóa
          </Button>,
        ]}
      >
        <p>Bạn chắc chắn muốn xóa vĩnh viễn tour này?</p>
      </Modal>
    </>
  );
}
