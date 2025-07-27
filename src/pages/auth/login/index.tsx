import { useNavigate } from 'react-router-dom';
import type { FormProps } from 'antd';
import { Button, Checkbox, Form, Input } from 'antd';
import { useNotifier } from '@/hooks/useNotifier';
import { API } from "@/lib/axios";
import { validateInfo, validatePassword } from "@/validators/validationRules";
import axios from 'axios';
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchUser } from "@/store/authSlice";
import styles from './style.module.css';

type FieldType = {
  info?: string;
  password?: string;
  remember?: boolean;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { notifyLoading, notifyError, contextHolder } = useNotifier();

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const { info, password } = values;
    const payload = { login: info, password };

    try {
      const res = await API.post(`/login`, payload);
      const data = res.data;

      console.log(data)

      if (data && data.user && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        API.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;

        if (data.user.role === "admin" || data.user.role === "staff") {
          const result = await dispatch(fetchUser());

          if (fetchUser.fulfilled.match(result)) {
            notifyLoading("Đang đăng nhập...");
            navigate("/");
          } else {
            notifyError("Không lấy được thông tin người dùng.");
          }
        } else {
          notifyError("Không có quyền truy cập.");
        }
      } else {
        notifyError("Đăng nhập không thành công.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { response } = error;
        if (response?.status === 422) {
          notifyError(response.data.message || 'Dữ liệu không hợp lệ');
        } else if (response?.status === 401 || response?.status === 403) {
          notifyError(response.data.message);
        } else {
          notifyError("Lỗi không xác định");
        }
      } else {
        notifyError("Đã xảy ra lỗi bất ngờ.");
      }
    }
  };


  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      {contextHolder}
      <div className={`${styles.loginForm}`}>
        <div className={`${styles.form} w-[400px]`}>
          <Form
            name="basic"
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item<FieldType>
              label="Email/Số điện thoại"
              name="info"
              rules={[validateInfo]}
              className='flex flex-col'
            >
              <Input />
            </Form.Item>

            <Form.Item<FieldType>
              label="Mật khẩu"
              name="password"
              rules={[validatePassword]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item label={null}>
              <Button type="primary" htmlType="submit" className='w-full'>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}
