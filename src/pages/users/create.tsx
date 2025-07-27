import { Button, Form, Input, Select, Upload } from 'antd';
import { useState } from 'react';
import axios from 'axios';
import { useNotifier } from '@/hooks/useNotifier';
import { PlusOutlined } from '@ant-design/icons';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
} from '@/validators/validationRules';
import type { UploadFile } from 'antd/es/upload/interface';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { API } from "@/lib/axios";

const { Option } = Select;

export default function CreateUser() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { contextHolder, notifySuccess, notifyError } = useNotifier();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'admin';

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('full_name', values.full_name);
      formData.append('email', values.email);
      formData.append('phone', values.phone);
      formData.append('password', values.password);

      if (isAdmin && values.role) {
        formData.append('role', values.role);
      }

      if (fileList.length > 0) {
        formData.append('avatar', fileList[0].originFileObj as File);
      }

      const response = await API.post('/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notifySuccess(response.data.message || 'Đăng ký thành công!');
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const { response } = error;
        if (response?.status === 422) {
          const errorData = response.data as {
            message?: string;
            errors?: Record<string, string[]>;
          };
          const firstField = errorData.errors ? Object.keys(errorData.errors)[0] : '';
          const firstMessage = firstField ? errorData.errors?.[firstField]?.[0] : '';
          notifyError(errorData.message || firstMessage || 'Dữ liệu không hợp lệ');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div>
        <div className="w-full mx-auto bg-white p-8 shadow-lg rounded-[8px]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Tạo tài khoản mới</h1>
            <span className="mt-2 text-gray-500 text-sm">
              Điền đầy đủ thông tin để tạo tài khoản hệ thống
            </span>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
          >
            <Form.Item
              label="Họ và tên"
              name="full_name"
              rules={[validateFullName]}
            >
              <Input placeholder="Nguyễn Văn A" className='h-[50px]' />
            </Form.Item>

            <Form.Item label="Email" name="email" rules={[validateEmail]}>
              <Input placeholder="abc@example.com" className='h-[50px]' />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone" rules={[validatePhone]}>
              <Input placeholder="0912345678" className='h-[50px]' />
            </Form.Item>

            <Form.Item label="Mật khẩu" name="password" rules={[validatePassword]}>
              <Input.Password placeholder="••••••" className='h-[50px]' />
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

            <Form.Item
              label="Ảnh đại diện (tuỳ chọn)"
              name="avatar"
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setFileList(fileList)}
                maxCount={1}
              >
                {fileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
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
                Đăng ký
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}
