import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  Image,
  Switch,
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
import type { UploadFile } from 'antd/es/upload/interface';
import { AxiosError } from 'axios';

interface HotelType {
  hotel_id: number;
  name: string;
  location?: string;
  room_type?: string;
  price?: number;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  max_guests?: number;
  facilities?: string;
  bed_type?: string;
  average_rating?: number;
  is_available?: boolean;
  is_deleted: 'active' | 'inactive';
  image?: string;
}

interface FormError {
  errors: string[];
  name: string[];
}

export default function HotelPage() {
  const [data, setData] = useState<HotelType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelType | null>(null);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'enable' | 'force-delete' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'admin' ? '/hotels/trashed' : '/hotels';
      const res = await API.get(endpoint);
      const updated = res.data
        .filter((item: any) => role !== 'staff' || item.is_deleted === 'active')
        .map((item: any) => ({
          hotel_id: item.hotel_id, // Sửa từ item.id thành item.hotel_id
          name: item.name,
          location: item.location,
          room_type: item.room_type,
          price: item.price,
          description: item.description,
          contact_phone: item.contact_phone,
          contact_email: item.contact_email,
          max_guests: item.max_guests,
          facilities: item.facilities,
          bed_type: item.bed_type,
          average_rating: item.average_rating,
          is_available: item.is_available,
          is_deleted: item.is_deleted,
          image: item.album?.images?.[0]?.image_url || item.image,
        }));
      setData(updated);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) {
        notifyError('Bạn cần đăng nhập để xem danh sách khách sạn');
      } else {
        notifyError('Không thể tải danh sách khách sạn');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const tableData = data.map((item) => ({
    ...item,
    id: item.hotel_id,
  }));

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
        formData.append('image', values.image[0].originFileObj);
      }

      const fieldsToAppend = [
        'name',
        'location',
        'room_type',
        'price',
        'description',
        'contact_phone',
        'contact_email',
        'max_guests',
        'facilities',
        'bed_type',
      ];

      fieldsToAppend.forEach((key) => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, String(values[key]));
        }
      });

      if (values.is_available !== undefined && values.is_available !== null) {
        formData.append('is_available', values.is_available ? '1' : '0');
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingHotel) {
        await API.post(`/hotels/${editingHotel.hotel_id}?_method=PUT`, formData, config);
        notifySuccess('Cập nhật khách sạn thành công');
      } else {
        await API.post('/hotels', formData, config);
        notifySuccess('Tạo khách sạn thành công');
      }
      setModalVisible(false);
      setEditingHotel(null);
      form.resetFields();
      fetchHotels();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ errors?: Record<string, string[]> }>;
      if (axiosError.response?.status === 422) {
        const errors = axiosError.response.data.errors;
        const errorMessages = Object.values(errors || {}).flat().join('; ');
        notifyError(`Vui lòng kiểm tra lại: ${errorMessages}`);
      } else if (axiosError.response?.status === 401) {
        notifyError('Bạn cần đăng nhập để thực hiện thao tác này');
      } else if ((error as { errorFields?: FormError[] }).errorFields) {
        const errorMessages = (error as { errorFields: FormError[] }).errorFields
          .map((field: FormError) => field.errors.join(', '))
          .join('; ');
        notifyError(`Vui lòng kiểm tra lại: ${errorMessages}`);
      } else {
        notifyError('Vui lòng kiểm tra lại các trường thông tin');
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedId || !actionType) return;
    setLoading(true);
    try {
      if (actionType === 'force-delete') {
        await API.delete(`/hotels/${selectedId}`);
        notifySuccess('Xóa vĩnh viễn khách sạn thành công');
      } else {
        await API.post(`/hotels/${selectedId}/soft-delete`);
        notifySuccess(actionType === 'disable' ? 'Đã ẩn khách sạn' : 'Đã khôi phục khách sạn');
      }
      fetchHotels();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (axiosError.response?.status === 401) {
        notifyError('Bạn cần đăng nhập để thực hiện thao tác này');
      } else {
        notifyError('Thao tác thất bại');
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedId(null);
      setActionType(null);
    }
  };

  const handleEdit = (record: HotelType) => {
    if (record.is_deleted === 'inactive') {
      notifyError('Khách sạn đang bị ẩn, không thể chỉnh sửa.');
      return;
    }
    setEditingHotel(record);
    form.setFieldsValue({
      name: record.name || '',
      location: record.location || '',
      room_type: record.room_type || '',
      price: record.price || 0,
      description: record.description || '',
      contact_phone: record.contact_phone || '',
      contact_email: record.contact_email || '',
      max_guests: record.max_guests || 1,
      facilities: record.facilities || '',
      bed_type: record.bed_type || '',
      is_available: record.is_available || false,
      image: record.image ? [{ uid: '-1', name: 'image', status: 'done', url: record.image } as UploadFile] : [],
    });
    setModalVisible(true);
  };

  const columns: ColumnsType<HotelType> = [
    { title: 'ID', dataIndex: 'hotel_id', key: 'hotel_id' }, // Thêm key để đảm bảo
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
    { title: 'Loại phòng', dataIndex: 'room_type', key: 'room_type' },
    { title: 'Giá', dataIndex: 'price', key: 'price', render: (price) => (price ? `${price.toLocaleString()} VNĐ` : 'Chưa xác định') },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) =>
        image ? (
          <Image src={image} alt="Hình ảnh khách sạn" width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <span>Không có hình ảnh</span>
        ),
    },
    {
      title: 'Đánh giá TB',
      dataIndex: 'average_rating',
      key: 'average_rating',
      render: (rating) => (rating ? `${rating.toFixed(1)}/5` : 'Chưa có'),
    },
    {
      title: 'Trạng thái sẵn sàng',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (available) => (available ? 'Sẵn sàng' : 'Không sẵn sàng'),
    },
    ...(role === 'admin' ? [{
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      key: 'is_deleted',
      render: (val: 'active' | 'inactive') => (
        <span className={val === 'active' ? 'active' : 'inactive'}>
          {val === 'active' ? 'Hoạt động' : 'Đã ẩn'}
        </span>
      ),
    }] : []),
  ];

  const getActions = (record: HotelType): TableAction[] => {
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
          setSelectedId(record.hotel_id);
          setActionType(record.is_deleted === 'active' ? 'disable' : 'enable');
          setShowConfirm(true);
        },
      });
      actions.push({
        key: 'force-delete',
        label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
        danger: true,
        onClick: () => {
          setSelectedId(record.hotel_id);
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
            await API.post(`/hotels/${record.hotel_id}/soft-delete`);
            notifySuccess('Ẩn khách sạn thành công');
            fetchHotels();
          } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>;
            if (axiosError.response?.status === 401) {
              notifyError('Bạn cần đăng nhập để thực hiện thao tác này');
            } else {
              notifyError('Thao tác thất bại');
            }
          }
        },
      });
    }

    return actions;
  };

  const handleOpenCreateModal = () => {
    setEditingHotel(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      location: '',
      room_type: '',
      price: 0,
      description: '',
      contact_phone: '',
      contact_email: '',
      max_guests: 1,
      facilities: '',
      bed_type: '',
      is_available: true,
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
          Thêm khách sạn
        </Button>
      </div>

      <TableGeneric<HotelType & { id: number }>
        data={tableData}
        columns={columns as ColumnsType<HotelType & { id: number }>}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />

      <Modal
        forceRender
        title={editingHotel ? 'Cập nhật khách sạn' : 'Thêm khách sạn mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateOrUpdate}
        okText={editingHotel ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form} initialValues={{
          name: '',
          location: '',
          room_type: '',
          price: 0,
          description: '',
          contact_phone: '',
          contact_email: '',
          max_guests: 1,
          facilities: '',
          bed_type: '',
          is_available: true,
          image: [],
        }}>
          <Form.Item
            name="name"
            label="Tên khách sạn"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách sạn' }, { max: 255, message: 'Tên không được vượt quá 255 ký tự' }]}
          >
            <Input placeholder="Nhập tên khách sạn" />
          </Form.Item>
          <Form.Item
            name="location"
            label="Địa điểm"
            rules={[{ required: false }, { max: 255, message: 'Địa điểm không được vượt quá 255 ký tự' }]}
          >
            <Input placeholder="Nhập địa điểm" />
          </Form.Item>
          <Form.Item
            name="room_type"
            label="Loại phòng"
            rules={[{ required: false }, { max: 100, message: 'Loại phòng không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập loại phòng" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Giá"
            rules={[{ required: true, message: 'Vui lòng nhập giá' }, { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập giá" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: false }]}
          >
            <Input.TextArea placeholder="Nhập mô tả" />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="Số điện thoại liên hệ"
            rules={[{ required: false }, { max: 50, message: 'Số điện thoại không được vượt quá 50 ký tự' }]}
          >
            <Input placeholder="Nhập số điện thoại liên hệ" />
          </Form.Item>
          <Form.Item
            name="contact_email"
            label="Email liên hệ"
            rules={[{ required: false }, { type: 'email', message: 'Email không hợp lệ' }, { max: 100, message: 'Email không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập email liên hệ" />
          </Form.Item>
          <Form.Item
            name="max_guests"
            label="Số khách tối đa"
            rules={[{ required: false }, { type: 'number', min: 1, message: 'Số khách tối đa phải lớn hơn hoặc bằng 1' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập số khách tối đa" />
          </Form.Item>
          <Form.Item
            name="facilities"
            label="Tiện nghi"
            rules={[{ required: false }]}
          >
            <Input placeholder="Nhập tiện nghi" />
          </Form.Item>
          <Form.Item
            name="bed_type"
            label="Loại giường"
            rules={[{ required: false }, { max: 100, message: 'Loại giường không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập loại giường" />
          </Form.Item>
          <Form.Item
            name="is_available"
            label="Sẵn sàng"
            valuePropName="checked"
          >
            <Switch />
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
                  form.setFieldsValue({ image: [{ originFileObj: file, uid: file.uid, name: file.name, status: 'done' } as UploadFile] });
                  return false;
                }}
                maxCount={1}
                listType="picture"
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
            ? 'Xác nhận ẩn khách sạn'
            : actionType === 'enable'
              ? 'Xác nhận khôi phục khách sạn'
              : 'Xác nhận xóa vĩnh viễn khách sạn'
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
            ? 'Bạn có chắc chắn muốn ẩn khách sạn này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn khôi phục khách sạn này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn khách sạn này? Hành động này không thể hoàn tác.'}
        </p>
      </Modal>
    </>
  );
}