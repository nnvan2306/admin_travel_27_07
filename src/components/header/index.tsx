import { FaBars } from "react-icons/fa";
import { Dropdown, Space, Button } from "antd";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/authSlice";
import { toggleCollapse } from "@/store/layoutSlice";

export default function Header() {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.auth.user);
  const title = useSelector((state: RootState) => state.page.title);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleToggleSidebar = () => {
    dispatch(toggleCollapse());
  };

  const items: MenuProps["items"] = [
    {
      label: <Link to="/profile">Profile</Link>,
      key: "0",
    },
    {
      label: <Link to="/">Setting</Link>,
      key: "1",
    },
    {
      label: <Button onClick={handleLogout}>Logout</Button>,
      key: "3",
    },
  ];

  return (
    <div className="fixed z-10 bg-[#ffffff] top-0 left-0 right-0 h-[70px] flex items-center px-5">
      <div className="flex justify-between items-center w-[220px]">
        <img
          src="/images/logo.png"
          alt="logo"
          className="h-[45px] w-auto object-cover object-center"
        />
        <button onClick={handleToggleSidebar}>
          <FaBars className="cursor-pointer" />
        </button>
      </div>
      <div className="flex-1 px-5">
        <h1 className="text-xl font-extrabold">{title}</h1>
      </div>
      <div>
        <Dropdown menu={{ items }} trigger={["click"]} className="cursor-pointer">
          <a onClick={(e) => e.preventDefault()}>
            <Space className="flex items-center gap-2">
              <img
                src={
                  user?.avatar
                    ? `${user.avatar_url}`
                    : "/images/avatar-default.png"
                }
                alt="avatar"
                className="w-10 h-10 rounded-[50%] object-cover"
              />
              <div>
                <h3 className="font-bold text-[18px] text-black">{user?.full_name}</h3>
                <span className="text-[14px] text-[#878787] font-[500]">{user?.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span>
              </div>
            </Space>
          </a>
        </Dropdown>
      </div>
    </div>
  );
}
