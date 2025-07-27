import { useEffect, useState } from "react";
import { API } from "@/lib/axios";
import { Button, Form, Input, Select, Upload } from 'antd';

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  is_verified: boolean;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin profile", err);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return <div className="text-center mt-10">Đang tải thông tin...</div>;

  return (
    <Form className="flex">
      <div className="text-center">
        <img src={
          profile.avatar
            ? `${import.meta.env.VITE_BACKEND_URL}/storage/${profile.avatar}`
            : "/images/avatar-default.png"
        } alt="avatar" className="w-[250px] h-[250px] rounded-[50%] object-cover mb-5" />
        <h2 className="text-[24px] py-1 text-[#fff] bg-blue-700 rounded-[9px]">{profile.full_name}</h2>
        <p className="text-[#696969] font-bold pt-3">{profile.role === "admin" ? "Quản trị viên" : "Nhân viên"}</p>
      </div>
      <div className="flex-1">

      </div>
    </Form>
  )
}
