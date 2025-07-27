import { Button, Form, Input, Select, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useParams } from 'react-router-dom';
import {
  validateFullName,
  validateEmail,
  validatePhone,
} from '@/validators/validationRules';
import { useNotifier } from '@/hooks/useNotifier';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { API } from "@/lib/axios";
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/authSlice';

const { Option } = Select;

export default function UpdateUser() {
  const [form] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { contextHolder, notifySuccess, notifyError } = useNotifier();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const { id } = useParams();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get(`/user/${id}`);
        const user = res.data;
        form.setFieldsValue(user);
        if (user.avatar_url) {
          setAvatarPreview(user.avatar);
          setFileList([
            {
              uid: '-1',
              name: 'avatar.jpg',
              status: 'done',
              url: user.avatar_url,
            } as UploadFile,
          ]);
        }
      } catch (error) {
        notifyError('Không thể tải thông tin người dùng');
      }
    };

    if (id) fetchUser();
  }, [id]);

  const onFinish = async (values: any) => {
    const formData = new FormData();
    formData.append('full_name', values.full_name);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    if (values.password?.trim()) {
      formData.append('password', values.password);
    }
    if (isAdmin && values.role) formData.append('role', values.role);
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('avatar', fileList[0].originFileObj);
    }

    try {
      setLoading(true);
      await API.post(`/user/${id}?_method=PUT`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      notifySuccess('Cập nhật thành công');
      const res = await API.get('/me');
      dispatch(setUser(res.data.user));
    } catch (error: any) {
      notifyError('Lỗi cập nhật: ' + (error.response?.data?.message || 'Không xác định'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="w-full mx-auto bg-white rounded-[8px] shadow-md p-6">
        <div className='mb-10 text-center'>
          <h2 className="text-2xl font-semibold mb-6 text-center">Cập nhật thông tin</h2>
          <span className="mt-2 text-gray-500 text-sm">
            Cập nhật thông tin tài khoản hệ thống
          </span>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
        >
          <Form.Item label="Họ và tên" name="full_name" rules={[validateFullName]}>
            <Input className="h-[50px]" />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[validateEmail]}>
            <Input className="h-[50px]" />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone" rules={[validatePhone]}>
            <Input className="h-[50px]" />
          </Form.Item>

          <Form.Item label="Mật khẩu mới" name="password" rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (value.length >= 6) return Promise.resolve();
                return Promise.reject('Mật khẩu phải có ít nhất 6 ký tự');
              },
            },
          ]}>
            <Input.Password className="h-[50px]" />
          </Form.Item>

          {isAdmin && (
            <Form.Item label="Quyền hệ thống" name="role">
              <Select placeholder="Chọn quyền (mặc định là customer)" allowClear className='custom-select-height'>
                <Option value="customer">Customer</Option>
                <Option value="staff">Staff</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Ảnh đại diện (tuỳ chọn)" name="avatar">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Upload
                listType="picture-card"
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => {
                  setFileList(fileList);
                  if (fileList[0]?.originFileObj) {
                    const url = URL.createObjectURL(fileList[0].originFileObj);
                    setAvatarPreview(url);
                  }
                }}
                maxCount={1}
              >
                {fileList.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Tải lên</div>
                  </div>
                )}
              </Upload>
            </div>
          </Form.Item>


          <Form.Item className="col-span-1 md:col-span-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="mt-2"
              size="large"
            >
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
