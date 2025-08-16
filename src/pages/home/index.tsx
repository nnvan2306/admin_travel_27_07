import { useNotifier } from "@/hooks/useNotifier";
import { API as axios } from "@/lib/axios";
import { formatCurrencyVND } from "@/utils/format";
import type { MenuProps, TableProps } from "antd";
import { Alert, Dropdown, Space, Spin, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { LuLayoutList } from "react-icons/lu";
import { MdTour } from "react-icons/md";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import styles from "./style.module.css";

// Interface definitions
interface MetricType {
    key: string;
    title: string;
    value: number;
    icon: JSX.Element;
    increaseLabel: string;
    color: string;
}

interface RevenueType {
    name: string;
    revenue: number;
}

interface BookingTrendType {
    name: string;
    bookings: number;
}

interface BookingByTypeType {
    name: string;
    value: number;
}

interface NottifyDataType {
    id: number;
    title: string;
    type: string;
    created_at: string;
    status: string;
}

interface PromotionDataType {
    code: string;
    discount: string;
    max_uses: number;
    used_count: number;
    valid_from: string;
    valid_to: string;
    status: string;
}

interface CombinedDataType {
    name: string;
    bookings: number;
    revenue: number;
}

// Dropdown menu items
const items: MenuProps["items"] = [
    {
        label: "Xem",
        key: "view",
    },
    {
        label: "Sửa",
        key: "edit",
    },
];

// Table column definitions
const notifyColumns: TableProps<NottifyDataType>["columns"] = [
    {
        title: "STT",
        dataIndex: "id",
        key: "id",
        render: (text, _, index) => index + 1,
    },
    {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
    },
    {
        title: "Loại",
        dataIndex: "type",
        key: "type",
    },
    {
        title: "Thời gian",
        dataIndex: "created_at",
        key: "created_at",
    },
    {
        title: "Trạng thái",
        key: "status",
        dataIndex: "status",
        render: (status) => {
            let color = "default";
            if (status === "pending") color = "warning";
            if (status === "unread" || status === "new") color = "error";
            if (status === "read" || status === "completed") color = "success";
            return <Tag color={color}>{status.toUpperCase()}</Tag>;
        },
    },
    {
        title: "Hành động",
        key: "action",
        render: (_) => (
            <Dropdown menu={{ items }} trigger={["click"]}>
                <a onClick={(e) => e.preventDefault()} className="w-full block">
                    <Space>
                        <div className="w-full flex justify-center px-5">
                            <BsThreeDots />
                        </div>
                    </Space>
                </a>
            </Dropdown>
        ),
    },
];

// Main component
export default function HomePage() {
    const { notifySuccess, notifyError, contextHolder } = useNotifier();

    // State for all dashboard data
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for each section
    const [metrics, setMetrics] = useState<MetricType[]>([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueType[]>([]);
    const [bookingTrend, setBookingTrend] = useState<BookingTrendType[]>([]);
    const [bookingByType, setBookingByType] = useState<BookingByTypeType[]>([]);
    const [recentActivities, setRecentActivities] = useState<NottifyDataType[]>(
        []
    );
    const [activePromotions, setActivePromotions] = useState<
        PromotionDataType[]
    >([]);
    const [combinedData, setCombinedData] = useState<CombinedDataType[]>([]);

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [
                metricsRes,
                weeklyRevenueRes,
                bookingTrendRes,
                bookingByTypeRes,
                recentActivitiesRes,
                combinedDataRes,
            ] = await Promise.all([
                axios.get("/dashboard/metrics"),
                axios.get("/dashboard/weekly-revenue"),
                axios.get("/dashboard/booking-trend"),
                axios.get("/dashboard/booking-by-type"),
                axios.get("/dashboard/recent-activities"),
                axios.get("/dashboard/combined-data"),
            ]);

            // Format metrics data with icons - với kiểm tra cấu trúc dữ liệu
            const metricsData = Array.isArray(metricsRes.data)
                ? metricsRes.data
                : metricsRes.data.data || metricsRes.data.metrics || [];

            const formattedMetrics = metricsData.map((item: any) => {
                let icon = <FaUserFriends size={30} />;
                let color = "#8892d6";

                if (item.key === "booking") {
                    icon = <LuLayoutList size={30} />;
                    color = "#45bbe0";
                } else if (item.key === "revenue") {
                    icon = <FaMoneyBillTrendUp size={30} />;
                    color = "#f06292";
                } else if (item.key === "tour") {
                    icon = <MdTour size={30} />;
                    color = "#78c350";
                }

                return {
                    ...item,
                    icon,
                    color,
                };
            });

            // Tương tự kiểm tra và xử lý cho các API khác
            const weeklyRevenueData = Array.isArray(weeklyRevenueRes.data)
                ? weeklyRevenueRes.data
                : weeklyRevenueRes.data.data || [];

            const bookingTrendData = Array.isArray(bookingTrendRes.data)
                ? bookingTrendRes.data
                : bookingTrendRes.data.data || [];

            const bookingByTypeData = Array.isArray(bookingByTypeRes.data)
                ? bookingByTypeRes.data
                : bookingByTypeRes.data.data || [];

            const recentActivitiesData = Array.isArray(recentActivitiesRes.data)
                ? recentActivitiesRes.data
                : recentActivitiesRes.data.data || [];

            const combinedChartData = Array.isArray(combinedDataRes.data)
                ? combinedDataRes.data
                : combinedDataRes.data.data || [];

            setMetrics(formattedMetrics);
            setWeeklyRevenue(weeklyRevenueData);
            setBookingTrend(bookingTrendData);
            setBookingByType(bookingByTypeData);
            setRecentActivities(recentActivitiesData);
            setCombinedData(combinedChartData);
        } catch (err: any) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");

            // Set default data for demo/development purposes
            setDefaultData();
        } finally {
            setLoading(false);
        }
    };

    // Set default data in case of API failure
    const setDefaultData = () => {
        setMetrics([
            {
                key: "account",
                title: "Tài khoản",
                value: 1218,
                icon: <FaUserFriends size={30} />,
                increaseLabel: "Tăng 9% so với tháng trước",
                color: "#8892d6",
            },
            {
                key: "booking",
                title: "Đơn đặt",
                value: 2321,
                icon: <LuLayoutList size={30} />,
                increaseLabel: "Tăng 12% so với tuần trước",
                color: "#45bbe0",
            },
            {
                key: "revenue",
                title: "Doanh thu",
                value: 87600000,
                icon: <FaMoneyBillTrendUp size={30} />,
                increaseLabel: "Tăng 13% so với tháng trước",
                color: "#f06292",
            },
            {
                key: "tour",
                title: "Tours",
                value: 56,
                icon: <MdTour size={30} />,
                increaseLabel: "Tăng 5% so với tháng trước",
                color: "#78c350",
            },
        ]);

        setWeeklyRevenue([
            { name: "21/6", revenue: 15000000 },
            { name: "22/6", revenue: 12000000 },
            { name: "23/6", revenue: 10000000 },
            { name: "24/6", revenue: 14000000 },
            { name: "25/6", revenue: 11000000 },
            { name: "26/6", revenue: 13000000 },
            { name: "27/6", revenue: 12600000 },
        ]);

        setBookingTrend([
            { name: "Jan 2025", bookings: 90 },
            { name: "Feb 2025", bookings: 85 },
            { name: "Mar 2025", bookings: 100 },
            { name: "Apr 2025", bookings: 110 },
            { name: "May 2025", bookings: 130 },
            { name: "Jun 2025", bookings: 160 },
            { name: "Jul 2025", bookings: 180 },
            { name: "Aug 2025", bookings: 200 },
            { name: "Sep 2025", bookings: 140 },
            { name: "Oct 2025", bookings: 120 },
            { name: "Nov 2025", bookings: 100 },
            { name: "Dec 2025", bookings: 180 },
        ]);

        setBookingByType([
            { name: "Tour", value: 818 },
            { name: "Combo", value: 614 },
            { name: "Hotel", value: 409 },
            { name: "Transport", value: 205 },
            { name: "Motorbike", value: 123 },
            { name: "Guide", value: 82 },
            { name: "Bus", value: 70 },
        ]);

        setRecentActivities([
            {
                id: 1,
                title: "Booking #123 đã được đặt",
                type: "booking",
                created_at: "2025-06-21 18:00",
                status: "pending",
            },
            {
                id: 2,
                title: "Tin nhắn mới từ user A",
                type: "chat",
                created_at: "2025-06-21 17:30",
                status: "unread",
            },
            {
                id: 3,
                title: "Liên hệ từ Nguyen Van B",
                type: "contact",
                created_at: "2025-06-21 16:45",
                status: "new",
            },
            {
                id: 4,
                title: "Đánh giá mới cho Tour #45",
                type: "review",
                created_at: "2025-06-21 15:20",
                status: "read",
            },
            {
                id: 5,
                title: "Booking #124 đã hoàn thành",
                type: "booking",
                created_at: "2025-06-21 14:10",
                status: "completed",
            },
        ]);

        setActivePromotions([
            {
                code: "SUMMER25",
                discount: "20%",
                max_uses: 100,
                used_count: 45,
                valid_from: "2025-06-01",
                valid_to: "2025-06-30",
                status: "Expired",
            },
            {
                code: "TOUR10",
                discount: "10%",
                max_uses: 50,
                used_count: 20,
                valid_from: "2025-06-15",
                valid_to: "2025-07-15",
                status: "Exhausted",
            },
            {
                code: "VTRAVEL7",
                discount: "5%",
                max_uses: 50,
                used_count: 18,
                valid_from: "2025-06-15",
                valid_to: "2025-07-15",
                status: "Active",
            },
            {
                code: "QUOCKHANH",
                discount: "15%",
                max_uses: 30,
                used_count: 20,
                valid_from: "2025-06-15",
                valid_to: "2025-07-15",
                status: "Upcoming",
            },
        ]);

        setCombinedData([
            { name: "Jan 2025", bookings: 90, revenue: 15000000 },
            { name: "Feb 2025", bookings: 85, revenue: 12000000 },
            { name: "Mar 2025", bookings: 100, revenue: 18000000 },
            { name: "Apr 2025", bookings: 110, revenue: 20000000 },
            { name: "May 2025", bookings: 130, revenue: 22000000 },
            { name: "Jun 2025", bookings: 160, revenue: 28000000 },
            { name: "Jul 2025", bookings: 180, revenue: 32000000 },
            { name: "Aug 2025", bookings: 200, revenue: 35000000 },
            { name: "Sep 2025", bookings: 140, revenue: 25000000 },
            { name: "Oct 2025", bookings: 120, revenue: 21000000 },
            { name: "Nov 2025", bookings: 100, revenue: 18000000 },
            { name: "Dec 2025", bookings: 180, revenue: 30000000 },
        ]);
    };

    useEffect(() => {
        const isLogin = localStorage.getItem("isLogin");

        if (isLogin) {
            notifySuccess("Đăng nhập thành công");
            localStorage.removeItem("isLogin");
        }

        fetchDashboardData();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    const COLORS = [
        "#007BFF",
        "#DC3545",
        "#28A745",
        "#FFC107",
        "#6F42C1",
        "#FD7E14",
        "#6C757D",
    ];

    return (
        <>
            {contextHolder}

            {error && (
                <Alert
                    message="Lỗi tải dữ liệu"
                    description={error}
                    type="error"
                    showIcon
                    className="mb-5"
                    action={
                        <button
                            onClick={fetchDashboardData}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md"
                        >
                            Thử lại
                        </button>
                    }
                />
            )}

            <section>
                <div className="flex gap-5">
                    {metrics.map((item, index) => (
                        <div
                            className="w-1/4 py-8 px-6 flex items-center justify-between rounded-[8px] text-[#fff]"
                            key={index}
                            style={{ backgroundColor: item.color }}
                        >
                            <div className="flex flex-col justify-center gap-3">
                                <span className="text-[18px]">
                                    {item.title}
                                </span>
                                <span className="text-3xl inline-block font-bold">
                                    {item.key === "revenue"
                                        ? formatCurrencyVND(item.value)
                                        : item.value}
                                </span>
                                <span className="text-[13px]">
                                    {item.increaseLabel}
                                </span>
                            </div>
                            <div className="h-[70px] w-[70px] flex items-center justify-center rounded-[50%] bg-[#ffffff31]">
                                {item.icon}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className={`${styles.spacing}`}></div>

            <section className="w-full h-[450px] flex gap-5">
                <div className="w-1/2 h-full bg-[#fff] flex flex-col rounded-[8px]">
                    <span className={`${styles.subTitle}`}>
                        Doanh thu theo tuần
                    </span>
                    <div className="w-full h-full flex-1">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            className="py-5 px-5"
                        >
                            <AreaChart
                                className="w-full h-full"
                                data={weeklyRevenue}
                                margin={{
                                    top: 0,
                                    right: 10,
                                    left: 10,
                                    bottom: 20,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorRevenue"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#5663d9"
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#AABBCC"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    className="text-[13px]"
                                    label={{
                                        value: "Ngày",
                                        position: "insideBottomRight",
                                        offset: -5,
                                    }}
                                />
                                <YAxis
                                    className="text-[13px]"
                                    label={{
                                        value: "Doanh thu (VNĐ)",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                    tickFormatter={(value) =>
                                        `${value / 1000000}M`
                                    }
                                />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip
                                    formatter={(value) =>
                                        `${value.toLocaleString()} VNĐ`
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f06292"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex-1 h-full bg-[#fff] flex flex-col rounded-[8px]">
                    <span className={`${styles.subTitle}`}>
                        Booking theo loại dịch vụ
                    </span>
                    <div className="w-full h-full flex-1">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            className="py-5 px-5"
                        >
                            <PieChart
                                margin={{
                                    top: 0,
                                    right: 100,
                                    bottom: 0,
                                    left: 0,
                                }}
                            >
                                <Pie
                                    data={bookingByType}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, value }) =>
                                        `${name}: ${value}`
                                    }
                                >
                                    {bookingByType.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${value} bookings`}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{
                                        paddingLeft: 20,
                                        lineHeight: "40px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <div className={`${styles.spacing}`}></div>

            <section className="bg-[#fff] rounded-[8px]">
                <div className="py-3">
                    <span className={`${styles.subTitle}`}>
                        Thông báo và hoạt động gần đây
                    </span>
                </div>
                <Table<NottifyDataType>
                    columns={notifyColumns}
                    dataSource={recentActivities}
                    pagination={{ pageSize: 5 }}
                    className="rounded-2xl"
                    rowKey="id"
                />
            </section>

            <div className={`${styles.spacing}`}></div>

            <section className="w-full bg-[#fff] h-[600px] rounded-[8px] flex flex-col">
                <div className="py-2">
                    <span className={`${styles.subTitle}`}>
                        Xu hướng booking theo tháng
                    </span>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        className="py-5 px-5"
                    >
                        <BarChart
                            className="w-full h-full"
                            data={bookingTrend}
                            margin={{ top: 0, right: 10, left: 10, bottom: 70 }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorBookingTrend"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#1E90FF"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4682B4"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                className="text-[13px]"
                                label={{
                                    value: "Tháng",
                                    position: "insideBottomRight",
                                    offset: -5,
                                }}
                            />
                            <YAxis
                                className="text-[13px]"
                                label={{
                                    value: "Số lượng booking",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                                tickFormatter={(value) =>
                                    Math.round(value).toString()
                                }
                            />
                            <Tooltip
                                formatter={(value: number) => Math.round(value)}
                            />
                            <Bar
                                dataKey="bookings"
                                fill="url(#colorBookingTrend)"
                                barSize={80}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className={`${styles.spacing}`}></div>

            <div className={`${styles.spacing}`}></div>

            <section className="w-full bg-[#fff] h-[600px] rounded-[8px] flex flex-col">
                <div className="py-2">
                    <span className={`${styles.subTitle}`}>
                        So sánh doanh thu và booking
                    </span>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        className="py-5 px-5"
                    >
                        <ComposedChart
                            className="w-full h-full"
                            data={combinedData}
                            margin={{ top: 0, right: 30, left: 20, bottom: 70 }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorBookingTrend"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#1E90FF"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4682B4"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                className="text-[13px]"
                                label={{
                                    value: "Tháng",
                                    position: "insideBottomRight",
                                    offset: -5,
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                className="text-[13px]"
                                label={{
                                    value: "Số lượng booking",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                                tickFormatter={(value) =>
                                    Math.round(value).toString()
                                }
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                className="text-[13px]"
                                label={{
                                    value: "Doanh thu (VND)",
                                    angle: 90,
                                    position: "insideRight",
                                }}
                                tickFormatter={(value) =>
                                    `${(value / 1000000).toFixed(1)}M VND`
                                }
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    name === "revenue"
                                        ? ` ${value.toLocaleString()}`
                                        : ` ${Math.round(value)}`,
                                    name,
                                ]}
                                labelFormatter={(label) => label}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Bar
                                yAxisId="left"
                                dataKey="bookings"
                                fill="url(#colorBookingTrend)"
                                barSize={50}
                                name="Số lượng booking"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#f06292"
                                activeDot={{ r: 8 }}
                                name="Doanh thu"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </>
    );
}
