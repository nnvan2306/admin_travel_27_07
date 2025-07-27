import { useLocation, useNavigate } from "react-router-dom";
import { FaChartPie, FaGift, FaRegEnvelopeOpen, FaUser } from "react-icons/fa";
import { MdPayments, MdTour } from "react-icons/md";
import { FaLocationDot, FaRegComments, FaRegEnvelope } from "react-icons/fa6";
import { MdSecurity } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { VscExtensions } from "react-icons/vsc";
import type { MenuProps } from 'antd';
import { BiSolidPhotoAlbum } from "react-icons/bi";
import { Menu } from 'antd';
import { PiFlagBannerFill } from "react-icons/pi";
import { useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { setTitle } from "@/store/pageSlice";

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  { key: '/', icon: <FaChartPie />, label: 'Thống kê' },

  {
    key: 'user',
    label: 'Tài khoản',
    icon: <FaUser />,
    children: [
      { key: '/user/employee', label: 'Quản lý nhân sự' },
      { key: '/user/customer', label: 'Quản lý khách hàng' },
    ],
  },
  {
    key: 'authorization',
    label: 'Phân quyền',
    icon: <MdSecurity />,
    children: [
      { key: '/authorization', label: 'Phân quyền tài khoản' }
    ],
  },

  {
    key: 'tour',
    label: 'Quản lý Tours',
    icon: <MdTour />,
    children: [
      { key: '/tours/category', label: 'Danh mục Tours' },
      { key: '/tours', label: 'Tất cả Tours' },
      { key: '/tours/book', label: 'Đặt Tour' },
    ],
  },

  {
    key: 'destination',
    label: 'Quản lý Điểm đến',
    icon: <FaLocationDot />,
    children: [
      { key: '/destination/category', label: 'Danh mục điểm đến' },
      { key: '/destinations', label: 'Tất cả điểm đến' },
    ],
  },

  {
    key: 'albums',
    label: 'Albums ảnh',
    icon: <BiSolidPhotoAlbum />,
    children: [
      { key: '/albums', label: 'Danh sách albums' },
      { key: '/album-images', label: 'Tất cả ảnh' },
    ],
  },

  {
    key: 'service',
    label: 'Dịch vụ mở rộng',
    icon: <VscExtensions />,
    children: [
      { key: '/guides', label: 'Thuê hướng dẫn viên' },
      { key: '/motorbikes', label: 'Thuê xe máy' },
      { key: '/bus-routes', label: 'Tuyến xe khách' },
      { key: '/hotels', label: 'Đặt phòng khách sạn' },
    ],
  },

  {
    key: 'combo',
    label: 'Combo',
    icon: <FaGift />,
    children: [
      { key: '/combos', label: 'Danh sách combo' },
      { key: '/combos/add', label: 'Tạo combo mới' },
    ],
  },

  {
    key: 'booking',
    label: 'Quản lý đặt chỗ',
    icon: <FaRegEnvelopeOpen />,
    children: [
      { key: '/bookings', label: 'Tất cả đặt chỗ' },
      { key: '/custom-tours', label: 'Tour linh hoạt' },
    ],
  },

  {
    key: 'review',
    label: 'Đánh giá & Phản hồi',
    icon: <FaRegComments />,
    children: [
      { key: '/reviews', label: 'Đánh giá tour' },
      { key: '/feedbacks', label: 'Phản hồi người dùng' },
    ],
  },

  {
    key: 'payment',
    label: 'Thanh toán',
    icon: <MdPayments />,
    children: [
      { key: '/payments', label: 'Giao dịch thanh toán' },
      { key: '/payment-methods', label: 'Phương thức thanh toán' },
    ],
  },

  {
    key: 'promotion',
    label: 'Khuyến mãi',
    icon: <FaGift />,
    children: [
      { key: '/promotions', label: 'Mã khuyến mãi' },
    ],
  },

  {
    key: 'notification',
    label: 'Thông báo',
    icon: <PiFlagBannerFill />,
    children: [
      { key: '/notifications', label: 'Danh sách thông báo' },
    ],
  },

  {
    key: 'contact',
    label: 'Liên hệ & Hỗ trợ',
    icon: <FaRegEnvelope />,
    children: [
      { key: '/contacts', label: 'Yêu cầu hỗ trợ' },
      { key: '/chats', label: 'Chat trực tuyến' },
    ],
  },
  {
    key: 'setting',
    label: 'Cấu hình hệ thống',
    icon: <IoSettings />,
    children: [
      { key: '/system/contact-infomation', label: 'Thông tin liên hệ' }
    ],
  },
];

const findLabelByKey = (key: string, items: MenuItem[]): string | undefined => {
  for (const item of items) {
    if (!item) continue;
    if ('key' in item && item.key === key && 'label' in item && item.label) {
      return String(item.label);
    }

    if ('children' in item && Array.isArray(item.children)) {
      const found = findLabelByKey(key, item.children as MenuItem[]);
      if (found) return found;
    }
  }
  return undefined;
};

const filterMenuItemsByRole = (items: MenuItem[], role: string | undefined): MenuItem[] => {
  if (role === 'admin') return items;

  if (role === 'staff') {
    return items
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        if ("key" in item && item.key === "authorization") {
          return null;
        }

        if ("key" in item && item.key === "user" && "children" in item && Array.isArray(item.children)) {
          const filteredChildren = item.children.filter(
            (child) => child && "key" in child && child.key !== "/user/employee"
          );

          if (filteredChildren.length === 0) return null;

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  return [];
};


export default function Dashboard() {
  // const { collapsed } = useLayout();
  const navigate = useNavigate();
  // const { setTitle } = usePageTitle();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const collapsed = useSelector((state: RootState) => state.layout.collapsed);
  const user = useSelector((state: RootState) => state.auth.user);
  // const { user } = useAuth(); 

  const filteredItems = filterMenuItemsByRole(items, user?.role);

  useEffect(() => {
    const path = location.pathname;
    const label = findLabelByKey(path, filteredItems);
    if (label) dispatch(setTitle(label));
  }, [location.pathname, filteredItems]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const route = e.key;
    navigate(route);

    const label = findLabelByKey(route, filteredItems);
    if (label) dispatch(setTitle(label));;
  };


  return (
    <div
      className={`fixed z-1 top-[70px] left-0 h-[calc(100vh-70px)] min-h-[calc(100vh-70px)]  transition-all duration-300 overflow-hidden ${collapsed ? 'w-[80px]' : 'w-[250px]'}`}
    >
      <div className='flex flex-col h-full '>
        <Menu
          selectedKeys={[location.pathname]}
          defaultOpenKeys={[]}
          mode="inline"
          theme="light"
          inlineCollapsed={collapsed}
          items={filteredItems}
          onClick={handleMenuClick}
          className="flex-1 overflow-auto"
        />
      </div>
    </div>
  );
};
