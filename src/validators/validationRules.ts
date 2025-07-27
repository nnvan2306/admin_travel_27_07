import type { RuleObject } from "antd/es/form";

export const validateFullName: RuleObject = {
  required: true,
  message: "Vui lòng nhập họ và tên",
};

export const validateEmail: RuleObject = {
  required: true,
  type: "email",
  message: "Email không hợp lệ",
};

export const validatePhone: RuleObject = {
  required: true,
  validator: (_, value) => {
    if (!value) return Promise.reject("Vui lòng nhập số điện thoại");
    const isPhone = /^(0|\+84)[0-9]{9,10}$/.test(value);
    return isPhone
      ? Promise.resolve()
      : Promise.reject("Số điện thoại không hợp lệ");
  },
};

export const validateInfo: RuleObject = {
  required: true,
  validator: (_, value) => {
    if (!value) {
      return Promise.reject("Vui lòng nhập email hoặc số điện thoại");
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^(0|\+84)[0-9]{9,10}$/.test(value);

    if (!isEmail && !isPhone) {
      return Promise.reject("Định dạng không hợp lệ (email hoặc số điện thoại)");
    }

    return Promise.resolve();
  },
};

export const validatePassword: RuleObject = {
  required: true,
  validator: (_, value) => {
    if (!value) {
      return Promise.reject("Vui lòng nhập mật khẩu");
    }
    if (value.length < 6) {
      return Promise.reject("Mật khẩu phải có ít nhất 6 ký tự");
    }
    return Promise.resolve();
  },
};
