import { useEffect, useState } from 'react';
import {
  Card, Select, Spin, Image, Row, Col, Empty, Upload, Button, Form, Input, Modal, Popconfirm
} from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { API } from '@/lib/axios';
import { useNotifier } from '@/hooks/useNotifier';

const { Option } = Select;

interface Album {
  album_id: number;
  title: string;
}

interface AlbumImage {
  image_id: number;
  album_id: number;
  image_url: string;
  image_url_full: string;
  caption: string;
  uploaded_at: string;
}

export default function AlbumImages() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const { contextHolder, notifyError, notifySuccess } = useNotifier();

  const fetchAlbums = async () => {
    try {
      const res = await API.get('/albums');
      setAlbums(res.data);
    } catch {
      notifyError('Không thể tải danh sách album');
    }
  };

  const fetchImages = async (albumId?: number) => {
    setLoading(true);
    try {
      const res = albumId
        ? await API.get(`/albums/${albumId}/images`)
        : await API.get('/albums/images/all');

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.images)
          ? res.data.images
          : [];

      console.log('Fetched images:', data);
      setImages(data);
    } catch {
      notifyError('Không thể tải ảnh');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!file || selectedAlbumId === null) return notifyError('Vui lòng chọn ảnh');

      const formData = new FormData();
      formData.append('images[]', file);
      formData.append('caption', values.caption);

      await API.post(`/albums/${selectedAlbumId.toString()}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      notifySuccess('Tải ảnh thành công');
      setUploadModalVisible(false);
      form.resetFields();
      setFile(null);
      fetchImages(selectedAlbumId);
    } catch {
      notifyError('Tải ảnh thất bại');
    }
  };

  const handleDelete = async (imageId: number) => {
    try {
      await API.delete(`/images/${imageId}`);
      notifySuccess('Đã xóa ảnh');

      if (selectedAlbumId === 0) {
        fetchImages();
      } else if (selectedAlbumId !== null) {
        fetchImages(selectedAlbumId);
      }
    } catch {
      notifyError('Xóa ảnh thất bại');
    }
  };


  useEffect(() => {
    fetchAlbums();
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedAlbumId === 0) {
      fetchImages();
    } else if (selectedAlbumId !== null) {
      fetchImages(selectedAlbumId);
    }
  }, [selectedAlbumId]);


  return (
    <div>
      {contextHolder}
      <h2 className="text-lg font-semibold mb-3">Chọn Album</h2>

      <Select
        placeholder="Chọn một album"
        allowClear
        style={{ width: 300, marginBottom: 24 }}
        onChange={(value) => {
          if (value === 0) {
            setSelectedAlbumId(0);
            fetchImages();
          } else {
            setSelectedAlbumId(value);
            fetchImages(value);
          }
        }}
        value={selectedAlbumId ?? undefined}
      >
        <Option value={0}>Tất cả</Option>
        {albums.map(album => (
          <Option key={album.album_id} value={album.album_id}>
            {album.title}
          </Option>
        ))}
      </Select>


      {selectedAlbumId !== null && (
        <Button
          icon={<UploadOutlined />}
          className="ml-4"
          onClick={() => setUploadModalVisible(true)}
        >
          Thêm ảnh vào album
        </Button>
      )}

      <div className="mt-4">
        {loading ? (
          <Spin />
        ) : Array.isArray(images) && images.length > 0 ? (
          <Row gutter={[16, 16]}>
            {images.map(img => (
              <Col key={img.image_id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <Image
                      alt={img.caption}
                      src={img.image_url_full}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Bạn chắc chắn muốn xóa ảnh này?"
                      onConfirm={() => handleDelete(img.image_id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <DeleteOutlined style={{ color: 'red' }} />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={img.caption}
                    description={new Date(img.uploaded_at).toLocaleString()}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Không có ảnh trong album" />
        )}
      </div>


      <Modal
        title="Tải ảnh lên album"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
          setFile(null);
        }}
        onOk={handleUpload}
        okText="Tải lên"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Chú thích ảnh"
            name="caption"
            rules={[{ required: true, message: 'Vui lòng nhập chú thích ảnh' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Chọn ảnh">
            <Upload
              beforeUpload={f => {
                setFile(f);
                return false;
              }}
              fileList={file ? [{
                uid: '-1',
                name: file.name,
                status: 'done',
              }] : []}
              onRemove={() => setFile(null)}
              showUploadList={{ showRemoveIcon: true }}
            >
              <Button icon={<PlusOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
}
