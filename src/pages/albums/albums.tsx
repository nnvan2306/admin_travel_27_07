import { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { API } from '@/lib/axios';
import TableGeneric from '@/components/TableGeneric';
import type { ColumnsType } from 'antd/es/table';
import type { TableAction } from '@/components/TableGeneric';
import { useNotifier } from '@/hooks/useNotifier';
import CustomButton from '@/components/CustomButton';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface AlbumType {
  album_id: number;
  id: number;
  title: string;
  is_deleted: 'active' | 'inactive';
}

type ActionType = 'disable' | 'enable' | 'force-delete';

export default function Albums() {
  const [data, setData] = useState<AlbumType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumType | null>(null);
  const [form] = Form.useForm();
  const role = useSelector((state: RootState) => state.auth.user?.role);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<ActionType>('disable');
  const [showConfirm, setShowConfirm] = useState(false);

  const [viewingAlbum, setViewingAlbum] = useState<AlbumType | null>(null);
  const [albumImages, setAlbumImages] = useState<{ image_id: number; image_url: string; caption?: string; image_url_full: string }[]>([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);


  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await API.get('/albums');
      const albums = res.data.map((item: AlbumType) => ({
        ...item,
        id: item.album_id,
      }));
      setData(albums);
    } catch {
      notifyError('Không thể tải danh sách album');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbumImages = async (albumId: number) => {
    try {
      const res = await API.get(`/albums/${albumId}/images`);
      console.log(res.data);
      setAlbumImages(res.data);
    } catch {
      notifyError('Không thể tải ảnh của album');
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      if (editingAlbum) {
        await API.put(`/albums/${editingAlbum.id}`, values);
        notifySuccess('Cập nhật album thành công');
      } else {
        await API.post('/albums', values);
        notifySuccess('Tạo album thành công');
      }
      setModalVisible(false);
      setEditingAlbum(null);
      form.resetFields();
      fetchAlbums();
    } catch {
      notifyError('Thao tác thất bại');
    }
  };

  const handleEdit = (record: AlbumType) => {
    if (record.is_deleted === 'inactive') {
      notifyError('Album này đang bị vô hiệu hóa, không thể chỉnh sửa.');
      return;
    }
    setEditingAlbum(record);
    form.setFieldsValue({ title: record.title });
    setModalVisible(true);
  };


  const handleAction = (id: number, type: ActionType) => {
    setSelectedId(id);
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (selectedId == null) return;
    try {
      if (actionType === 'force-delete') {
        await API.delete(`/albums/${selectedId}`);
        notifySuccess('Đã xóa album vĩnh viễn');
      } else {
        const newStatus = actionType === 'disable' ? 'inactive' : 'active';
        await API.post(`/albums/${selectedId}/soft-delete`, {
          is_deleted: newStatus,
        });
        notifySuccess(`Đã ${newStatus === 'inactive' ? 'vô hiệu hóa' : 'kích hoạt'} album`);
      }
      fetchAlbums();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
    }
  };

  const columns: ColumnsType<AlbumType> = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
    },
  ];

  if (role === 'admin') {
    columns.push({
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      render: (val: 'active' | 'inactive') =>
        val === 'active' ? (
          <span className="active">Đang hoạt động</span>
        ) : (
          <span className="inactive">Ngưng hoạt động</span>
        ),
    });
  }

  const getActions = (record: AlbumType): TableAction[] => {
    const actions: TableAction[] = [
      {
        key: `view-${record.id}`,
        label: 'Xem',
        onClick: () => {
          if (record.is_deleted === 'inactive') {
            notifyError('Album này đang bị vô hiệu hóa, không thể xem ảnh.');
            return;
          }
          setViewingAlbum(record);
          fetchAlbumImages(record.id);
          setViewModalVisible(true);
        },
      },

      {
        key: `edit-${record.id}`,
        label: 'Sửa',
        onClick: () => handleEdit(record),
      },
    ];

    if (role === 'admin') {
      actions.push(
        {
          key: `${record.is_deleted === 'active' ? 'disable' : 'enable'}-${record.id}`,
          label: record.is_deleted === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
          onClick: () =>
            handleAction(record.id, record.is_deleted === 'active' ? 'disable' : 'enable'),
        },
        {
          key: `force-delete-${record.id}`,
          label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
          danger: true,
          onClick: () => handleAction(record.id, 'force-delete'),
        }
      );
    } else if (role === 'staff') {
      actions.push({
        key: `soft-delete-${record.id}`,
        label: <span style={{ color: 'red' }}>Xóa</span>,
        danger: true,
        onClick: () => handleAction(record.id, 'disable'),
        disabled: record.is_deleted === 'inactive',
      });
    }

    return actions;
  };

  return (
    <>
      {contextHolder}
      <div className="mb-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAlbum(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Thêm album
        </Button>
      </div>

      <TableGeneric<AlbumType>
        data={data}
        columns={columns}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />

      <Modal
        title={editingAlbum ? 'Cập nhật album' : 'Thêm album mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingAlbum(null);
        }}
        onOk={handleCreateOrUpdate}
        okText={editingAlbum ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề album' }]}
          >
            <Input placeholder="Nhập tiêu đề album" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showConfirm}
        title={
          actionType === 'disable'
            ? role === 'staff'
              ? 'Xác nhận xóa album'
              : 'Xác nhận vô hiệu hóa album'
            : actionType === 'enable'
              ? 'Xác nhận kích hoạt album'
              : 'Xác nhận xóa vĩnh viễn album'
        }
        onCancel={() => {
          setShowConfirm(false);
          setSelectedId(null);
        }}
        footer={[
          <CustomButton key="cancel" text="Hủy" customType="cancel" onClick={() => {
            setShowConfirm(false);
            setSelectedId(null);
          }} />,
          <CustomButton
            key="confirm"
            text={
              actionType === 'disable'
                ? role === 'staff'
                  ? 'Xóa'
                  : 'Vô hiệu hóa'
                : actionType === 'enable'
                  ? 'Kích hoạt'
                  : 'Xóa'
            }
            customType={
              actionType === 'disable'
                ? role === 'staff'
                  ? 'delete'
                  : 'disable'
                : actionType === 'enable'
                  ? 'enable'
                  : 'forceDelete'
            }
            loading={loading}
            onClick={handleConfirm}
          />
        ]}
      >
        {
          actionType === 'disable'
            ? role === 'staff'
              ? 'Bạn có chắc chắn muốn xóa album này không?'
              : 'Bạn có chắc chắn muốn vô hiệu hóa album này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn kích hoạt lại album này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn album này? Hành động này không thể hoàn tác.'
        }
      </Modal>

      <Modal
        title={`Ảnh trong album: ${viewingAlbum?.title}`}
        open={viewModalVisible}
        onCancel={() => {
          setViewingAlbum(null);
          setViewModalVisible(false);
        }}
        footer={null}
        width={800}
      >
        <div className="grid grid-cols-3 gap-4">
          {albumImages.length > 0 ? (
            albumImages.map((img) => (
              <div key={img.image_id} className="border rounded-md p-2">
                <img src={img.image_url_full} alt={img.caption || 'Ảnh'} className="w-full h-40 object-cover rounded" />
                {img.caption && <p className="text-center mt-1 text-sm">{img.caption}</p>}
              </div>
            ))
          ) : (
            <p>Không có ảnh nào trong album này.</p>
          )}
        </div>
      </Modal>


    </>
  );
}
