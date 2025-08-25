"use client";

import React, { useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Button, Space, Card, message, Row, Col, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { API } from '@/lib/axios';

const { Title, Text } = Typography;

interface TourDepartureCreatorProps {
    tourId?: number;
    onDeparturesCreated?: () => void;
}

interface DepartureFormData {
    departure_date: dayjs.Dayjs;
    price: number;
    max_capacity: number;
    notes?: string;
}

const TourDepartureCreator: React.FC<TourDepartureCreatorProps> = ({ 
    tourId, 
    onDeparturesCreated 
}) => {
    const [form] = Form.useForm();
    const [departures, setDepartures] = useState<DepartureFormData[]>([]);
    const [loading, setLoading] = useState(false);

    const addDeparture = () => {
        const newDeparture: DepartureFormData = {
            departure_date: dayjs().add(1, 'day'),
            price: 0,
            max_capacity: 30,
            notes: '',
        };
        setDepartures([...departures, newDeparture]);
    };

    const removeDeparture = (index: number) => {
        const newDepartures = departures.filter((_, i) => i !== index);
        setDepartures(newDepartures);
    };

    const updateDeparture = (index: number, field: keyof DepartureFormData, value: any) => {
        const newDepartures = [...departures];
        newDepartures[index] = { ...newDepartures[index], [field]: value };
        setDepartures(newDepartures);
    };

    const handleSaveAll = async () => {
        if (!tourId) {
            message.error('Vui lòng tạo tour trước khi thêm ngày khởi hành');
            return;
        }

        if (departures.length === 0) {
            message.error('Vui lòng thêm ít nhất một ngày khởi hành');
            return;
        }

        // Validate departures
        for (let i = 0; i < departures.length; i++) {
            const dep = departures[i];
            if (!dep.departure_date) {
                message.error(`Ngày khởi hành ${i + 1} không được để trống`);
                return;
            }
            if (dep.price <= 0) {
                message.error(`Giá ngày khởi hành ${i + 1} phải lớn hơn 0`);
                return;
            }
            if (dep.max_capacity <= 0) {
                message.error(`Sức chứa ngày khởi hành ${i + 1} phải lớn hơn 0`);
                return;
            }
        }

        setLoading(true);
        try {
            // Tạo tất cả departures
            const promises = departures.map(dep => 
                API.post('/tour-departures', {
                    tour_id: tourId,
                    departure_date: dep.departure_date.format('YYYY-MM-DD'),
                    price: dep.price,
                    max_capacity: dep.max_capacity,
                    notes: dep.notes || '',
                })
            );

            await Promise.all(promises);
            message.success(`Đã tạo thành công ${departures.length} ngày khởi hành`);
            
            // Reset form
            setDepartures([]);
            form.resetFields();
            
            // Callback để refresh data
            if (onDeparturesCreated) {
                onDeparturesCreated();
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo ngày khởi hành');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndContinue = async () => {
        await handleSaveAll();
        // Thêm departure mới để tiếp tục
        addDeparture();
    };

    return (
        <div className="tour-departure-creator">
            <div className="mb-6">
                <Title level={4}>Tạo ngày khởi hành cố định</Title>
                <Text type="secondary">
                    Tạo các ngày khởi hành cố định cho tour này. Khách hàng sẽ chọn từ các ngày có sẵn.
                </Text>
            </div>

            {/* Form tạo departure */}
            <Card title="Thêm ngày khởi hành mới" className="mb-4">
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Ngày khởi hành" required>
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                                    onChange={(date) => {
                                        if (departures.length > 0) {
                                            updateDeparture(departures.length - 1, 'departure_date', date);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giá (VNĐ)" required>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                    onChange={(value) => {
                                        if (departures.length > 0) {
                                            updateDeparture(departures.length - 1, 'price', value);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Sức chứa" required>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={1}
                                    max={100}
                                    onChange={(value) => {
                                        if (departures.length > 0) {
                                            updateDeparture(departures.length - 1, 'max_capacity', value);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item label="Ghi chú">
                        <Input.TextArea
                            rows={2}
                            placeholder="Ghi chú về ngày khởi hành này..."
                            onChange={(e) => {
                                if (departures.length > 0) {
                                    updateDeparture(departures.length - 1, 'notes', e.target.value);
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={addDeparture}
                            style={{ width: '100%' }}
                        >
                            Thêm ngày khởi hành
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Danh sách departures đã thêm */}
            {departures.length > 0 && (
                <Card title={`Danh sách ngày khởi hành (${departures.length})`} className="mb-4">
                    {departures.map((dep, index) => (
                        <Card
                            key={index}
                            type="inner"
                            title={`Ngày khởi hành ${index + 1}`}
                            style={{ marginBottom: 8 }}
                            extra={
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeDeparture(index)}
                                >
                                    Xóa
                                </Button>
                            }
                        >
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Text strong>Ngày:</Text>
                                    <br />
                                    <Text>{dep.departure_date?.format('DD/MM/YYYY')}</Text>
                                </Col>
                                <Col span={6}>
                                    <Text strong>Giá:</Text>
                                    <br />
                                    <Text>{dep.price?.toLocaleString('vi-VN')} VNĐ</Text>
                                </Col>
                                <Col span={6}>
                                    <Text strong>Sức chứa:</Text>
                                    <br />
                                    <Text>{dep.max_capacity} người</Text>
                                </Col>
                                <Col span={6}>
                                    <Text strong>Ghi chú:</Text>
                                    <br />
                                    <Text>{dep.notes || '-'}</Text>
                                </Col>
                            </Row>
                        </Card>
                    ))}

                    <div className="mt-4 text-center">
                        <Space>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSaveAll}
                                loading={loading}
                                disabled={!tourId}
                            >
                                Lưu tất cả
                            </Button>
                            <Button
                                type="default"
                                icon={<PlusOutlined />}
                                onClick={handleSaveAndContinue}
                                loading={loading}
                                disabled={!tourId}
                            >
                                Lưu và tiếp tục
                            </Button>
                        </Space>
                    </div>
                </Card>
            )}

            {/* Hướng dẫn */}
            {departures.length === 0 && (
                <Card className="bg-blue-50 border-blue-200">
                    <div className="text-center">
                        <Text className="text-blue-700">
                            💡 <strong>Hướng dẫn:</strong> Click "Thêm ngày khởi hành" để bắt đầu tạo các ngày khởi hành cố định cho tour
                        </Text>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TourDepartureCreator;
