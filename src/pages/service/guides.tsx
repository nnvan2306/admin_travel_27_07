import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Upload,
  Image,
  Select,
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

interface GuideType {
  guide_id: number;
  name: string;
  gender?: 'male' | 'female';
  language?: string;
  experience_years?: number;
  price_per_day?: number;
  phone?: string;
  email?: string;
  average_rating?: number;
  is_available?: boolean;
  is_deleted: 'active' | 'inactive';
  image?: string;
}

export default function GuidePage() {
  const [data, setData] = useState<GuideType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideType | null>(null);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'enable' | 'force-delete' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'admin' ? '/guides' : '/guides';
      const res = await API.get(endpoint);
      const updated = res.data
        .filter((item: any) => role !== 'staff' || item.is_deleted === 'active')
        .map((item: any) => ({
          guide_id: item.guide_id,
          name: item.name,
          gender: item.gender,
          language: item.language,
          experience_years: item.experience_years,
          price_per_day: item.price_per_day,
          phone: item.phone,
          email: item.email,
          average_rating: item.average_rating,
          is_available: item.is_available,
          is_deleted: item.is_deleted,
          image: item.album?.images?.[0]?.image_url,
        }));
      setData(updated);
    } catch {
      notifyError('Không thể tải danh sách hướng dẫn viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const tableData = data.map((item) => ({
    ...item,
    id: item.guide_id,
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
        'gender',
        'language',
        'experience_years',
        'price_per_day',
        'phone',
        'email',
        'is_available',
      ];
      fieldsToAppend.forEach((key) => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          formData.append(key, String(values[key]));
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingGuide) {
        await API.post(`/guides/${editingGuide.guide_id}?_method=PUT`, formData, config);
        notifySuccess('Cập nhật hướng dẫn viên thành công');
      } else {
        await API.post('/guides', formData, config);
        notifySuccess('Tạo hướng dẫn viên thành công');
      }
      setModalVisible(false);
      setEditingGuide(null);
      form.resetFields();
      fetchGuides();
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
    setLoading(true);
    try {
      if (actionType === 'force-delete') {
        await API.delete(`/guides/${selectedId}`);
        notifySuccess('Xóa vĩnh viễn hướng dẫn viên thành công');
      } else {
        await API.post(`/guides/${selectedId}/toggle-delete`);
        notifySuccess(actionType === 'disable' ? 'Đã ẩn hướng dẫn viên' : 'Đã khôi phục hướng dẫn viên');
      }
      fetchGuides();
    } catch {
      notifyError('Thao tác thất bại');
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedId(null);
      setActionType(null);
    }
  };

  const handleEdit = (record: GuideType) => {
    if (record.is_deleted === 'inactive') {
      notifyError('Hướng dẫn viên đang bị ẩn, không thể chỉnh sửa.');
      return;
    }
    setEditingGuide(record);
    form.setFieldsValue({
      name: record.name || '',
      gender: record.gender || undefined,
      language: record.language || '',
      experience_years: record.experience_years || 0,
      price_per_day: record.price_per_day || 0,
      phone: record.phone || '',
      email: record.email || '',
      is_available: record.is_available || false,
      image: record.image ? [{ uid: '-1', name: 'image', status: 'done', url: record.image }] : [],
    });
    setModalVisible(true);
  };

  const columns: ColumnsType<GuideType> = [
    { title: 'ID', dataIndex: 'guide_id' },
    { title: 'Tên', dataIndex: 'name' },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      render: (gender) => (gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Không xác định'),
    },
    { title: 'Ngôn ngữ', dataIndex: 'language' },
    { title: 'Kinh nghiệm (năm)', dataIndex: 'experience_years' },
    { title: 'Giá/ngày', dataIndex: 'price_per_day', render: (price) => (price ? `${price.toLocaleString()} VNĐ` : 'Chưa xác định') },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      render: (image: string) =>
        image ? (
          <Image src={image} alt="Hình ảnh hướng dẫn viên" width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <span>Không có hình ảnh</span>
        ),
    },
    {
      title: 'Đánh giá TB',
      dataIndex: 'average_rating',
      render: (rating) => (rating ? `${rating.toFixed(1)}/5` : 'Chưa có'),
    },
    {
      title: 'Trạng thái sẵn sàng',
      dataIndex: 'is_available',
      render: (available) => (available ? 'Sẵn sàng' : 'Không sẵn sàng'),
    },
    ...(role === 'admin' ? [{
      title: 'Trạng thái',
      dataIndex: 'is_deleted',
      render: (val: 'active' | 'inactive') => (
        <span className={val === 'active' ? 'active' : 'inactive'}>
          {val === 'active' ? 'Hoạt động' : 'Đã ẩn'}
        </span>
      ),
    }] : []),
  ];

  const getActions = (record: GuideType): TableAction[] => {
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
          setSelectedId(record.guide_id);
          setActionType(record.is_deleted === 'active' ? 'disable' : 'enable');
          setShowConfirm(true);
        },
      });
      actions.push({
        key: 'force-delete',
        label: <span style={{ color: 'red' }}>Xóa vĩnh viễn</span>,
        danger: true,
        onClick: () => {
          setSelectedId(record.guide_id);
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
            await API.post(`/guides/${record.guide_id}/toggle-delete`);
            notifySuccess('Ẩn hướng dẫn viên thành công');
            fetchGuides();
          } catch {
            notifyError('Thao tác thất bại');
          }
        },
      });
    }

    return actions;
  };

  const handleOpenCreateModal = () => {
    setEditingGuide(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      gender: undefined,
      language: '',
      experience_years: 0,
      price_per_day: 0,
      phone: '',
      email: '',
      is_available: false,
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
          Thêm hướng dẫn viên
        </Button>
      </div>

      <TableGeneric<GuideType & { id: number }>
        data={tableData}
        columns={columns as ColumnsType<GuideType & { id: number }>}
        loading={loading}
        rowKey="id"
        getActions={getActions}
      />

      <Modal
        forceRender
        title={editingGuide ? 'Cập nhật hướng dẫn viên' : 'Thêm hướng dẫn viên mới'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateOrUpdate}
        okText={editingGuide ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form} initialValues={{
          name: '',
          gender: undefined,
          language: '',
          experience_years: 0,
          price_per_day: 0,
          phone: '',
          email: '',
          is_available: false,
          image: [],
        }}>
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }, { max: 100, message: 'Tên không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập tên hướng dẫn viên" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: false }]}
          >
            <Select placeholder="Chọn giới tính" allowClear>
              <Select.Option value="male">Nam</Select.Option>
              <Select.Option value="female">Nữ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="language"
            label="Ngôn ngữ"
            rules={[{ required: false }, { max: 50, message: 'Ngôn ngữ không được vượt quá 50 ký tự' }]}
          >
            <Input placeholder="Nhập ngôn ngữ" />
          </Form.Item>
          <Form.Item
            name="experience_years"
            label="Số năm kinh nghiệm"
            rules={[{ required: false }, { type: 'number', min: 0, message: 'Kinh nghiệm phải lớn hơn hoặc bằng 0' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số năm kinh nghiệm" />
          </Form.Item>
          <Form.Item
            name="price_per_day"
            label="Giá mỗi ngày"
            rules={[{ required: false }, { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập giá mỗi ngày" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: false }, { max: 20, message: 'Số điện thoại không được vượt quá 20 ký tự' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: false }, { type: 'email', message: 'Email không hợp lệ' }, { max: 100, message: 'Email không được vượt quá 100 ký tự' }]}
          >
            <Input placeholder="Nhập email" />
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
                  form.setFieldsValue({ image: [{ originFileObj: file, uid: file.uid, name: file.name, status: 'done' }] });
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
            ? 'Xác nhận ẩn hướng dẫn viên'
            : actionType === 'enable'
              ? 'Xác nhận khôi phục hướng dẫn viên'
              : 'Xác nhận xóa vĩnh viễn hướng dẫn viên'
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
            ? 'Bạn có chắc chắn muốn ẩn hướng dẫn viên này không?'
            : actionType === 'enable'
              ? 'Bạn có chắc chắn muốn khôi phục hướng dẫn viên này không?'
              : 'Bạn có chắc chắn muốn xóa vĩnh viễn hướng dẫn viên này? Hành động này không thể hoàn tác.'}
        </p>
      </Modal>
    </>
  );
}