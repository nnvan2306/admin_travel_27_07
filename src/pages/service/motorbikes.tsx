import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  Select,
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { API } from '@/lib/axios';
import TableGeneric from '@/components/TableGeneric';
import type { ColumnsType } from 'antd/es/table';
import type { TableAction } from '@/components/TableGeneric';
import { useNotifier } from '@/hooks/useNotifier';
import CustomButton from '@/components/CustomButton';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface MotorbikeType {
  motorbike_id: number;
  bike_type: string;
  price_per_day: number;
  location: string;
  license_plate: string;
  rental_status: 'available' | 'rented' | 'maintenance';
  is_deleted: 'active' | 'inactive';
  description?: string;
  image?: string;
}

export default function MotorbikesPage() {
  const [data, setData] = useState<MotorbikeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMotorbike, setEditingMotorbike] = useState<MotorbikeType | null>(null);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'enable' | 'force-delete' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchMotorbikes = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'admin' ? '/motorbikes/trashed' : '/motorbikes';
      const res = await API.get(endpoint);
      const updated = res.data
        .filter((item: any) => role !== 'staff' || item.is_deleted === 'active')
        .map((item: any) => ({
          motorbike_id: item.motorbike_id,
          bike_type: item.bike_type,
          price_per_day: item.price_per_day,
          location: item.location,
          license_plate: item.license_plate,
          rental_status: item.rental_status,
          is_deleted: item.is_deleted,
          description: item.description,
          image: item.album?.images?.[0]?.image_url,
        }));
      setData(updated);
    } catch {
      notifyError('Không thể tải danh sách xe máy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorbikes();
  }, [role]);

  const tableData = data.map((item) => ({
    ...item,
    id: item.motorbike_id,
  }));

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      // Append image if available
      if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
        formData.append('image', values.image[0].originFileObj);
      }

      // Append other fields
      const fieldsToAppend = ['bike_type', 'price_per_day', 'location', 'license_plate', 'description', 'rental_status'];
      fieldsToAppend.forEach((key) => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, String(values[key]));
        }
      });

      // Log FormData để kiểm tra
      for (let pair of formData.entries()) {
        console.log(`FormData: ${pair[0]} = ${pair[1]}`);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingMotorbike) {
        await API.post(`/motorbikes/${editingMotorbike.motorbike_id}?_method=PUT`, formData, config);
        notifySuccess('Cập nhật xe máy thành công');
      } else {
        await API.post('/motorbikes', formData, config);
        notifySuccess('Tạo xe máy thành công');
      }
      setModalVisible(false);
      setEditingMotorbike(null);
      form.resetFields();
      fetchMotorbikes();
    } catch (error) {
      const formError = error as { errorFields?: Array<{ name: string[]; errors: string[] }> };
      console.error('Lỗi:', error);
      if (formError.errorFields) {
        const errorMessages = formError.errorFields
          .map((field: { errors: string[] }) => field.errors.join(', '))
          .join('; ');
        notifyError(`Vui lòng kiểm tra lại: ${errorMessages}`);
      } else {
        notifyError('Vui lòng kiểm tra lại các trường thông tin');
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedId || !actionType) return;
    try {
      if (actionType === 'force-delete') {
        await API.delete(`/motorbikes/${selectedId}`);
        notifySuccess('Xóa vĩnh viễn xe máy thành công');
      } else {
        await API.post(`/motorbikes/${selectedId}/soft-delete`);
        notifySuccess(actionType === 'disable' ? 'Đã ẩn xe máy' : 'Đã khôi phục xe máy');
      }
      fetchMotorbikes();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
      setActionType(null);
    }
  };

  const handleEdit = (record: MotorbikeType) => {
    if (record.is_deleted === 'inactive') {
      notifyError('Xe máy đang bị ẩn, không thể chỉnh sửa.');
      return;
    }
    setEditingMotorbike(record);
    form.setFieldsValue({
      bike_type: record.bike_type || '',
      price_per_day: Number(record.price_per_day) || 0,
      location: record.location || '',
      license_plate: record.license_plate || '',
      description: record.description || '',
      rental_status: record.rental_status || 'available',
      image: record.image ? [{ uid: '-1', name: 'image', status: 'done', url: record.image }] : [],
    });
    setModalVisible(true);
  };

  const columns: ColumnsType<MotorbikeType> = [
    { title: 'ID', dataIndex: 'motorbike_id' },
    { title: 'Loại xe', dataIndex: 'bike_type' },
    { title: 'Giá mỗi ngày', dataIndex: 'price_per_day', render: (value) => `${value.toLocaleString()} VNĐ` },
    { title: 'Vị trí', dataIndex: 'location' },
    { title: 'Biển số', dataIndex: 'license_plate' },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      render: (image: string | undefined) => (
        image ? (
          <img
            src={image}
            alt="Motorbike"
            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
          />
        ) : (
          <span>Không có</span>
        )
      ),
    },
    {
      title: 'Trạng thái thuê',
      dataIndex: 'rental_status',
      render: (status) => {
        switch (status) {
          case 'available':
            return 'Còn trống';
          case 'rented':
            return 'Đã thuê';
          case 'maintenance':
            return 'Bảo trì';
          default:
            return status;
        }
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      render: (val) => (
        <span className={val === 'active' ? 'active' : 'inactive'}>
          {val === 'active' ? 'Hoạt động' : 'Đã ẩn'}
        </span>
      ),
    },
  ];

  const getActions = (record: MotorbikeType): TableAction[] => {
    const actions: TableAction[] = [
      {
        key: 'edit',
        label: 'Sửa',
        onClick: () => handleEdit(record),
      },
    ];

    if (role === 'admin') {
      actions.push({
        key: record.is_deleted === 'active' ? 'disable' : 'enable',
        label: record.is_deleted === 'active' ? 'Ẩn' : 'Khôi phục',
        onClick: () => {
          setSelectedId(record.motorbike_id);
          setActionType(record.is_deleted === 'active' ? 'disable' : 'enable');
          setShowConfirm(true);
        },
      });
      actions.push({
        key: 'force-delete',
        label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
        danger: true,
        onClick: () => {
          setSelectedId(record.motorbike_id);
          setActionType('force-delete');
          setShowConfirm(true);
        },
      });
    } else if (role === 'staff') {
      actions.push({
        key: 'soft-delete',
        label: <span style={{ color: 'red' }}>Ẩn</span>,
        danger: true,
        onClick: async () => {
          try {
            await API.post(`/motorbikes/${record.motorbike_id}/soft-delete`);
            notifySuccess('Ẩn xe máy thành công');
            fetchMotorbikes();
          } catch {
            notifyError('Thao tác thất bại');
          }
        },
      });
    }

    return actions;
  };

  const handleOpenCreateModal = () => {
    setEditingMotorbike(null);
    form.resetFields();
    form.setFieldsValue({
      bike_type: '',
      price_per_day: 0,
      location: '',
      license_plate: '',
      description: '',
      rental_status: 'available',
      image: [],
    });
    setModalVisible(true);
  };

  return (
    <>
      {contextHolder}
      <div className="mb-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
        >
          Thêm xe máy
        </Button>
      </div>

      <TableGeneric<MotorbikeType & { id: number }>
        data={tableData}
        columns={columns as ColumnsType<MotorbikeType & { id: number }>}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />

      <Modal
        forceRender
        title={editingMotorbike ? 'Cập nhật xe máy' : 'Thêm xe máy mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateOrUpdate}
        okText={editingMotorbike ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            bike_type: '',
            price_per_day: 0,
            location: '',
            license_plate: '',
            description: '',
            rental_status: 'available',
            image: [],
          }}
        >
          <Form.Item
            name="bike_type"
            label="Loại xe"
            rules={[{ required: true, message: 'Vui lòng nhập loại xe' }, { max: 100, message: 'Loại xe không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập loại xe" />
          </Form.Item>
          <Form.Item
            name="price_per_day"
            label="Giá mỗi ngày"
            rules={[
              { required: true, message: 'Vui lòng nhập giá' },
              { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' },
              { type: 'number', max: 99999999.99, message: 'Giá không được vượt quá 99,999,999.99' },
            ]}
          >
            <InputNumber min={0} max={99999999.99} style={{ width: '100%' }} placeholder="Nhập giá mỗi ngày" />
          </Form.Item>
          <Form.Item
            name="location"
            label="Vị trí"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí' }, { max: 255, message: 'Vị trí không được vượt quá 255 ký tự' }]}
          >
            <Input placeholder="Nhập vị trí" />
          </Form.Item>
          <Form.Item
            name="license_plate"
            label="Biển số"
            rules={[{ required: false }, { max: 20, message: 'Biển số không được vượt quá 20 ký tự' }]}
          >
            <Input placeholder="Nhập biển số" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: false }]}
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>
          <Form.Item
            name="rental_status"
            label="Trạng thái thuê"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái thuê' }]}
          >
            <Select placeholder="Chọn trạng thái thuê">
              <Select.Option value="available">Còn trống</Select.Option>
              <Select.Option value="rented">Đã thuê</Select.Option>
              <Select.Option value="maintenance">Bảo trì</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Ảnh đại diện">
            <Form.Item
              name="image"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              noStyle
              rules={[{ required: false, message: 'Vui lòng chọn ảnh' }]}
            >
              <Upload
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    notifyError('Vui lòng chọn một tệp hình ảnh hợp lệ (JPEG, PNG, GIF, v.v.)');
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    notifyError('Hình ảnh phải nhỏ hơn 2MB!');
                    return false;
                  }
                  return false; // Prevent automatic upload
                }}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showConfirm}
        title={
          actionType === 'disable'
            ? 'Xác nhận ẩn xe máy'
            : actionType === 'enable'
              ? 'Xác nhận khôi phục xe máy'
              : 'Xác nhận xóa vĩnh viễn xe máy'
        }
        onCancel={() => setShowConfirm(false)}
        footer={[
          <CustomButton key="cancel" text="Hủy" customType="cancel" onClick={() => setShowConfirm(false)} />,
          <CustomButton
            key="confirm"
            text={actionType === 'disable' ? 'Ẩn' : actionType === 'enable' ? 'Khôi phục' : 'Xóa'}
            customType={actionType === 'disable' ? 'disable' : actionType === 'enable' ? 'enable' : 'forceDelete'}
            loading={loading}
            onClick={handleConfirmAction}
          />,
        ]}
      >
        <p>
          {actionType === 'disable'
            ? 'Bạn có chắc chắn muốn ẩn xe máy này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn khôi phục xe máy này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn xe máy này? Hành động này không thể hoàn tác.'}
        </p>
      </Modal>
    </>
  );
}