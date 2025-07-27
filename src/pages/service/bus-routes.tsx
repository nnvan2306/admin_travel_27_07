import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  Image, // Thêm Image từ antd để hiển thị hình ảnh
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

interface BusRouteType {
  bus_route_id: number;
  route_name: string;
  seats: number;
  license_plate: string;
  rental_status: 'available' | 'rented';
  is_deleted: 'active' | 'inactive';
  vehicle_type?: string;
  price?: number;
  description?: string;
  image?: string; // Đường dẫn đầy đủ của hình ảnh
}

export default function BusRoutePage() {
  const [data, setData] = useState<BusRouteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRouteType | null>(null);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'enable' | 'force-delete' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/bus-routes');
      const updated = res.data
        .filter((item: any) => role !== 'staff' || item.is_deleted === 'active')
        .map((item: any) => ({
          bus_route_id: item.bus_route_id,
          route_name: item.route_name,
          seats: item.seats,
          license_plate: item.license_plate,
          rental_status: item.rental_status,
          is_deleted: item.is_deleted,
          vehicle_type: item.vehicle_type,
          price: item.price,
          description: item.description,
          image: item.album?.images?.[0]?.image_url, // Đường dẫn đầy đủ từ API
        }));
      setData(updated);
    } catch {
      notifyError('Không thể tải danh sách tuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const tableData = data.map((item) => ({
    ...item,
    id: item.bus_route_id,
  }));

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      // Append image if available
      if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
        formData.append('image', values.image[0].originFileObj);
      }

      // Append other fields, handling price explicitly
      const fieldsToAppend = ['route_name', 'vehicle_type', 'price', 'seats', 'license_plate', 'description'];
      fieldsToAppend.forEach((key) => {
        if (key === 'price') {
          formData.append(key, values[key] != null ? String(Number(values[key])) : String(editingRoute?.price || 0));
        } else if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, String(values[key]));
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingRoute) {
        await API.post(`/bus-routes/${editingRoute.bus_route_id}?_method=PUT`, formData, config);
        notifySuccess('Cập nhật tuyến xe thành công');
      } else {
        await API.post('/bus-routes', formData, config);
        notifySuccess('Tạo tuyến xe thành công');
      }
      setModalVisible(false);
      setEditingRoute(null);
      form.resetFields();
      fetchRoutes();
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
        await API.delete(`/bus-routes/${selectedId}`);
        notifySuccess('Xóa vĩnh viễn tuyến xe thành công');
      } else {
        await API.post(`/bus-routes/${selectedId}/soft-delete`);
        notifySuccess(actionType === 'disable' ? 'Đã ẩn tuyến xe' : 'Đã khôi phục tuyến xe');
      }
      fetchRoutes();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
      setActionType(null);
    }
  };

  const handleEdit = (record: BusRouteType) => {
    if (record.is_deleted === 'inactive') {
      notifyError('Tuyến xe đang bị ẩn, không thể chỉnh sửa.');
      return;
    }
    setEditingRoute(record);
    form.setFieldsValue({
      route_name: record.route_name || '',
      vehicle_type: record.vehicle_type || '',
      price: Number(record.price) || 0,
      seats: record.seats || 1,
      license_plate: record.license_plate || '',
      description: record.description || '',
      image: record.image ? [{ uid: '-1', name: 'image', status: 'done', url: record.image }] : [],
    });
    setModalVisible(true);
  };

  const columns: ColumnsType<BusRouteType> = [
    { title: 'ID', dataIndex: 'bus_route_id' },
    { title: 'Tên tuyến', dataIndex: 'route_name' },
    { title: 'Số ghế', dataIndex: 'seats' },
    { title: 'Biển số', dataIndex: 'license_plate' },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      render: (image: string) =>
        image ? (
          <Image src={image} alt="Hình ảnh tuyến xe" width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <span>Không có hình ảnh</span>
        ),
    },
    {
      title: 'Trạng thái thuê',
      dataIndex: 'rental_status',
      render: (status) => (status === 'available' ? 'Còn trống' : 'Đã thuê'),
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

  const getActions = (record: BusRouteType): TableAction[] => {
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
          setSelectedId(record.bus_route_id);
          setActionType(record.is_deleted === 'active' ? 'disable' : 'enable');
          setShowConfirm(true);
        },
      });
      actions.push({
        key: 'force-delete',
        label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
        danger: true,
        onClick: () => {
          setSelectedId(record.bus_route_id);
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
            await API.post(`/bus-routes/${record.bus_route_id}/soft-delete`);
            notifySuccess('Ẩn tuyến xe thành công');
            fetchRoutes();
          } catch {
            notifyError('Thao tác thất bại');
          }
        },
      });
    }

    return actions;
  };

  const handleOpenCreateModal = () => {
    setEditingRoute(null);
    form.resetFields();
    form.setFieldsValue({
      route_name: '',
      vehicle_type: '',
      price: 0,
      seats: 1,
      license_plate: '',
      description: '',
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
          Thêm tuyến xe
        </Button>
      </div>

      <TableGeneric<BusRouteType & { id: number }>
        data={tableData}
        columns={columns as ColumnsType<BusRouteType & { id: number }>}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />

      <Modal
        forceRender
        title={editingRoute ? 'Cập nhật tuyến xe' : 'Thêm tuyến xe mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateOrUpdate}
        okText={editingRoute ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form} initialValues={{
          route_name: '',
          vehicle_type: '',
          price: 0,
          seats: 1,
          license_plate: '',
          description: '',
          image: [],
        }}>
          <Form.Item
            name="route_name"
            label="Tên tuyến"
            rules={[{ required: true, message: 'Vui lòng nhập tên tuyến' }]}
          >
            <Input placeholder="Nhập tên tuyến" />
          </Form.Item>
          <Form.Item
            name="vehicle_type"
            label="Loại xe"
            rules={[{ required: true, message: 'Vui lòng nhập loại xe' }]}
          >
            <Input placeholder="Nhập loại xe" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Giá"
            rules={[
              { required: true, message: 'Vui lòng nhập giá' },
              { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' },
              { type: 'number', max: 99999999.99, message: 'Giá không được vượt quá 99,999,999.99' },
            ]}
            normalize={(value) => (value != null ? Number(value) : (editingRoute?.price || 0))}
          >
            <InputNumber min={0} max={99999999.99} style={{ width: '100%' }} placeholder="Nhập giá" />
          </Form.Item>
          <Form.Item
            name="seats"
            label="Số ghế"
            rules={[
              { required: true, message: 'Vui lòng nhập số ghế' },
              { type: 'number', min: 1, message: 'Số ghế phải lớn hơn 0' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập số ghế" />
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
            ? 'Xác nhận ẩn tuyến xe'
            : actionType === 'enable'
              ? 'Xác nhận khôi phục tuyến xe'
              : 'Xác nhận xóa vĩnh viễn tuyến xe'
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
            ? 'Bạn có chắc chắn muốn ẩn tuyến xe này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn khôi phục tuyến xe này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn tuyến xe này? Hành động này không thể hoàn tác.'}
        </p>
      </Modal>
    </>
  );
}