"use client";

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Space, message, Select, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, CalendarOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API } from '@/lib/axios';

interface TourDeparture {
    departure_id: number;
    tour_id: number;
    departure_date: string;
    price: number;
    max_capacity: number;
    booked_count: number;
    status: 'available' | 'full' | 'cancelled';
    notes?: string;
    is_deleted: string;
    created_at: string;
    updated_at: string;
}

interface TourDepartureManagerProps {
    tourId: number;
}

const TourDepartureManager: React.FC<TourDepartureManagerProps> = ({ tourId }) => {
    const [departures, setDepartures] = useState<TourDeparture[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDeparture, setEditingDeparture] = useState<TourDeparture | null>(null);
    const [form] = Form.useForm();
    const [stats, setStats] = useState<any>(null);
    const [availableMonths, setAvailableMonths] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const fetchDepartures = async () => {
        setLoading(true);
        try {
            const response = await API.get(`/tour-departures?tour_id=${tourId}`);
            setDepartures(response.data);
        } catch (error) {
            message.error('Không thể tải danh sách ngày khởi hành');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get(`/tour-departures/${tourId}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Không thể tải thống kê');
        }
    };

    const fetchAvailableMonths = async () => {
        try {
            const response = await API.get(`/tour-departures/${tourId}/months`);
            setAvailableMonths(response.data);
        } catch (error) {
            console.error('Không thể tải danh sách tháng');
        }
    };

    useEffect(() => {
        if (tourId) {
            fetchDepartures();
            fetchStats();
            fetchAvailableMonths();
        }
    }, [tourId]);

    const handleAdd = () => {
        setEditingDeparture(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record: TourDeparture) => {
        setEditingDeparture(record);
        form.setFieldsValue({
            departure_date: dayjs(record.departure_date),
            price: record.price,
            max_capacity: record.max_capacity,
            notes: record.notes,
        });
        setModalVisible(true);
    };

    const handleDelete = async (departureId: number) => {
        try {
            await API.delete(`/tour-departures/${departureId}`);
            message.success('Đã xóa ngày khởi hành');
            fetchDepartures();
            fetchStats();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Không thể xóa ngày khởi hành');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData = {
                tour_id: tourId,
                departure_date: values.departure_date.format('YYYY-MM-DD'),
                price: values.price,
                max_capacity: values.max_capacity,
                notes: values.notes,
            };

            if (editingDeparture) {
                await API.put(`/tour-departures/${editingDeparture.departure_id}`, formData);
                message.success('Cập nhật ngày khởi hành thành công');
            } else {
                await API.post('/tour-departures', formData);
                message.success('Thêm ngày khởi hành thành công');
            }

            setModalVisible(false);
            fetchDepartures();
            fetchStats();
            fetchAvailableMonths();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'green';
            case 'full': return 'red';
            case 'cancelled': return 'orange';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available': return 'Có sẵn';
            case 'full': return 'Hết chỗ';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const filteredDepartures = selectedMonth === 'all' 
        ? departures 
        : departures.filter(d => {
            const month = dayjs(d.departure_date).format('M/YYYY');
            return month === selectedMonth;
        });

    const columns = [
        {
            title: 'Ngày khởi hành',
            dataIndex: 'departure_date',
            key: 'departure_date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: TourDeparture, b: TourDeparture) => dayjs(a.departure_date).unix() - dayjs(b.departure_date).unix(),
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => price.toLocaleString('vi-VN'),
            sorter: (a: TourDeparture, b: TourDeparture) => a.price - b.price,
        },
        {
            title: 'Sức chứa',
            dataIndex: 'max_capacity',
            key: 'max_capacity',
            render: (max: number, record: TourDeparture) => `${record.booked_count}/${max}`,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <span style={{ color: getStatusColor(status) }}>
                    {getStatusText(status)}
                </span>
            ),
            filters: [
                { text: 'Có sẵn', value: 'available' },
                { text: 'Hết chỗ', value: 'full' },
                { text: 'Đã hủy', value: 'cancelled' },
            ],
            onFilter: (value: any, record: TourDeparture) => record.status === value,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes: string) => notes || '-',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: TourDeparture) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleEdit(record)}>
                        Sửa
                    </Button>
                    <Button 
                        type="link" 
                        danger 
                        onClick={() => handleDelete(record.departure_id)}
                        disabled={record.booked_count > 0}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="tour-departure-manager">
            {/* Thống kê tổng quan */}
            {stats && (
                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng số chuyến"
                                value={stats.total_departures}
                                prefix={<CalendarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Có sẵn"
                                value={stats.available_departures}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<CalendarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Hết chỗ"
                                value={stats.full_departures}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng khách"
                                value={stats.total_booked}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Lọc theo tháng */}
            <div className="mb-4">
                <Row gutter={16} align="middle">
                    <Col>
                        <span className="mr-2">Lọc theo tháng:</span>
                    </Col>
                    <Col>
                        <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            style={{ width: 150 }}
                            placeholder="Chọn tháng"
                        >
                            <Select.Option value="all">Tất cả tháng</Select.Option>
                            {availableMonths.map((month) => (
                                <Select.Option key={`${month.month}/${month.year}`} value={`${month.month}/${month.year}`}>
                                    {month.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                        >
                            Thêm ngày khởi hành
                        </Button>
                    </Col>
                </Row>
            </div>

            <Table
                columns={columns}
                dataSource={filteredDepartures}
                rowKey="departure_id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                }}
            />

            <Modal
                title={editingDeparture ? 'Sửa ngày khởi hành' : 'Thêm ngày khởi hành'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        max_capacity: 50,
                    }}
                >
                    <Form.Item
                        name="departure_date"
                        label="Ngày khởi hành"
                        rules={[
                            { required: true, message: 'Vui lòng chọn ngày khởi hành' },
                        ]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Giá (VNĐ)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập giá' },
                            { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="max_capacity"
                        label="Sức chứa tối đa"
                        rules={[
                            { required: true, message: 'Vui lòng nhập sức chứa' },
                            { type: 'number', min: 1, message: 'Sức chứa phải lớn hơn 0' },
                        ]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Ghi chú"
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingDeparture ? 'Cập nhật' : 'Thêm'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TourDepartureManager;
