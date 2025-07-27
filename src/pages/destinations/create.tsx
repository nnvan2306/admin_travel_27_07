/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
    Button,
    Form,
    Input,
    Upload,
    Space,
    Select,
    Divider,
    Collapse,
} from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useNotifier } from "@/hooks/useNotifier";
import { API } from "@/lib/axios";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile } from "antd/es/upload";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import { useNavigate } from "react-router-dom";

const { Panel } = Collapse;

interface CategoryType {
    category_id: number;
    category_name: string;
    thumbnail_url: string;
    is_deleted: "active" | "inactive";
}

export default function CreateDestination() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [bannerFile, setBannerFile] = useState<UploadFile[]>([]);
    const { contextHolder, notifySuccess, notifyError } = useNotifier();

    const [intro, setIntro] = useState("");
    const [highlight, setHighlight] = useState([
        { title: "", description: "" },
    ]);
    const [gallery, setGallery] = useState<UploadFile[]>([]);
    const [delicaciesIntro, setDelicaciesIntro] = useState("");
    const [delicaciesDishes, setDelicaciesDishes] = useState([
        { name: "", image: "" },
    ]);
    const [delicaciesImageFiles, setDelicaciesImageFiles] = useState<
        UploadFile[][]
    >([[]]);
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [experience, setExperience] = useState("");
    const [lastImageFile, setLastImageFile] = useState<UploadFile[]>([]);
    const [introTitle, setIntroTitle] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await API.get("/destination-categories");
                setCategories(res.data);
            } catch {
                notifyError("Không thể tải danh mục điểm đến");
            }
        };
        fetchCategories();
    }, []);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("description", values.description);
            formData.append("area", values.area);
            formData.append("category_id", values.category_id);

            if (bannerFile.length > 0) {
                formData.append(
                    "imgBanner",
                    bannerFile[0].originFileObj as RcFile
                );
            }

            const sections = [];

            if (intro) {
                sections.push({
                    type: "intro",
                    title: introTitle || "Giới thiệu",
                    content: intro,
                });
            }

            const validHighlights = highlight.filter(
                (item) => item.title && item.description
            );
            if (validHighlights.length > 0) {
                sections.push({
                    type: "highlight",
                    content: validHighlights,
                });
            }

            if (gallery.length > 0) {
                const galleryFileNames = gallery.map((f) => {
                    const file = f.originFileObj as RcFile;
                    formData.append(`galleryImages[]`, file);
                    return file.name;
                });
                sections.push({
                    type: "gallery",
                    content: galleryFileNames,
                });
            }
            if (experience) {
                sections.push({
                    type: "experience",
                    content: experience,
                });
            }
            if (lastImageFile.length > 0) {
                const file = lastImageFile[0].originFileObj as RcFile;
                formData.append("lastImage", file);
                sections.push({
                    type: "lastImage",
                    content: file.name,
                });
            }

            const dishesWithFiles = delicaciesDishes.map((dish, idx) => {
                const fileObj = delicaciesImageFiles[idx]?.[0]
                    ?.originFileObj as RcFile;
                const fileName = fileObj?.name || `image_${idx}`;
                if (fileObj) {
                    formData.append(`delicacyImages[]`, fileObj);
                }
                return { name: dish.name, image: fileName };
            });

            if (delicaciesIntro || dishesWithFiles.length > 0) {
                sections.push({
                    type: "regionalDelicacies",
                    content: {
                        intro: delicaciesIntro,
                        dishes: dishesWithFiles,
                    },
                });
            }

            formData.append("sections", JSON.stringify(sections));

            const res = await API.post("/destinations", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            notifySuccess(res.data.message || "Tạo điểm đến thành công!");
            form.resetFields();
            setBannerFile([]);
            setIntro("");
            setHighlight([{ title: "", description: "" }]);
            setGallery([]);
            setDelicaciesIntro("");
            setDelicaciesDishes([{ name: "", image: "" }]);
            setDelicaciesImageFiles([[]]);
            navigate("/destinations");
        } catch (error: any) {
            notifyError(
                error?.response?.data?.message || "Tạo điểm đến thất bại!"
            );
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="w-full mx-auto bg-white p-8 shadow-lg rounded-[8px]">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Thêm điểm đến mới
                    </h1>
                    <span className="mt-2 text-gray-500 text-sm">
                        Điền đầy đủ thông tin để tạo điểm đến
                    </span>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
                >
                    <Form.Item
                        label="Tên điểm đến"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên điểm đến",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Nhập tên điểm đến"
                            // className="h-[50px]"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Danh mục điểm đến"
                        name="category_id"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn danh mục điểm đến",
                            },
                        ]}
                    >
                        <Select placeholder="Chọn danh mục">
                            {categories
                                .filter((cat) => cat.is_deleted === "active") // nếu muốn lọc active
                                .map((cat) => (
                                    <Select.Option
                                        key={cat.category_id}
                                        value={cat.category_id}
                                    >
                                        {cat.category_name}
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Ảnh banner"
                        name="imgBanner"
                        rules={[
                            {
                                validator: () =>
                                    bannerFile.length > 0
                                        ? Promise.resolve()
                                        : Promise.reject(
                                              "Vui lòng tải lên ảnh banner"
                                          ),
                            },
                        ]}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={bannerFile}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setBannerFile(fileList)}
                            maxCount={1}
                        >
                            {bannerFile.length === 0 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                        className="md:col-span-2"
                        rules={[
                            { required: true, message: "Vui lòng nhập mô tả" },
                        ]}
                    >
                        <MdEditor
                            style={{ height: "300px" }}
                            value={form.getFieldValue("description") || ""}
                            renderHTML={(text) => (
                                <ReactMarkdown>{text}</ReactMarkdown>
                            )}
                            onChange={({ text }) =>
                                form.setFieldsValue({ description: text })
                            }
                        />
                    </Form.Item>

                    <Divider className="md:col-span-2">
                        Nội dung chi tiết
                    </Divider>

                    <Collapse
                        className="md:col-span-2"
                        defaultActiveKey={["intro"]}
                    >
                        <Panel header="Giới thiệu" key="intro">
                            <Input
                                placeholder="Tiêu đề giới thiệu"
                                value={introTitle}
                                onChange={(e) => setIntroTitle(e.target.value)}
                                style={{ marginBottom: "12px" }}
                            />
                            <MdEditor
                                style={{ height: "300px" }}
                                value={intro}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                onChange={(e) => setIntro(e.text)}
                            />
                        </Panel>

                        <Panel header="Điểm nổi bật" key="highlight">
                            {highlight.map((item, idx) => (
                                <div key={idx} style={{ position: "relative" }}>
                                    {idx !== 0 ? (
                                        <Button
                                            type="default"
                                            icon={
                                                <CloseOutlined
                                                    style={{ color: "#ff4d4f" }}
                                                />
                                            }
                                            size="small"
                                            style={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                zIndex: 1,
                                                border: "1.5px solid #ff4d4f",
                                                borderRadius: "50%",
                                                background: "#fff",
                                                color: "#ff4d4f",
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: 0,
                                            }}
                                            onClick={() =>
                                                setHighlight((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== idx
                                                    )
                                                )
                                            }
                                        />
                                    ) : null}
                                    <Space
                                        direction="vertical"
                                        style={{
                                            display: "block",
                                            marginTop: idx !== 0 ? "20px" : "",
                                            background: "#f3f3f3",
                                            padding: "20px",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <Input
                                            placeholder="Tiêu đề"
                                            style={{ marginBottom: "12px" }}
                                            value={item.title}
                                            onChange={(e) =>
                                                setHighlight((prev) =>
                                                    prev.map((h, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...h,
                                                                  title: e
                                                                      .target
                                                                      .value,
                                                              }
                                                            : h
                                                    )
                                                )
                                            }
                                        />
                                        <MdEditor
                                            style={{ height: "300px" }}
                                            value={item.description}
                                            renderHTML={(text) => (
                                                <ReactMarkdown>
                                                    {text}
                                                </ReactMarkdown>
                                            )}
                                            onChange={(e) =>
                                                setHighlight((prev) =>
                                                    prev.map((h, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...h,
                                                                  description:
                                                                      e.text,
                                                              }
                                                            : h
                                                    )
                                                )
                                            }
                                        />
                                    </Space>
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                className="mt-2"
                                style={{ marginTop: "8px" }}
                                onClick={() =>
                                    setHighlight((prev) => [
                                        ...prev,
                                        { title: "", description: "" },
                                    ])
                                }
                            >
                                Thêm điểm nổi bật
                            </Button>
                        </Panel>
                        <Panel header="Trải nghiệm" key="experience">
                            <MdEditor
                                placeholder="Nội dung trải nghiệm"
                                style={{ height: "300px" }}
                                value={experience}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                onChange={(e) => setExperience(e.text)}
                            />
                        </Panel>

                        <Panel header="Thư viện ảnh" key="gallery">
                            <Upload
                                listType="picture-card"
                                fileList={gallery}
                                beforeUpload={() => false}
                                onChange={({ fileList }) =>
                                    setGallery(fileList)
                                }
                                multiple
                            >
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            </Upload>
                        </Panel>

                        <Panel header="Ẩm thực địa phương" key="delicacies">
                            <MdEditor
                                placeholder="Giới thiệu ẩm thực"
                                style={{
                                    height: "300px",
                                    marginBottom: "12px",
                                }}
                                value={delicaciesIntro}
                                onChange={(e) => setDelicaciesIntro(e.text)}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                            />
                            {delicaciesDishes.map((dish, idx) => (
                                <div key={idx} style={{ position: "relative" }}>
                                    {idx !== 0 ? (
                                        <Button
                                            type="default"
                                            icon={
                                                <CloseOutlined
                                                    style={{ color: "#ff4d4f" }}
                                                />
                                            }
                                            size="small"
                                            style={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                zIndex: 1,
                                                border: "1.5px solid #ff4d4f",
                                                borderRadius: "50%",
                                                background: "#fff",
                                                color: "#ff4d4f",
                                                width: 24,
                                                height: 24,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: 0,
                                            }}
                                            onClick={() => {
                                                setDelicaciesDishes((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== idx
                                                    )
                                                );
                                                setDelicaciesImageFiles(
                                                    (prev) =>
                                                        prev.filter(
                                                            (_, i) => i !== idx
                                                        )
                                                );
                                            }}
                                        />
                                    ) : null}
                                    <Space
                                        direction="vertical"
                                        style={{
                                            display: "block",
                                            marginTop: idx !== 0 ? "20px" : "",
                                            background: "#f3f3f3",
                                            padding: "20px",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <Input
                                            placeholder="Tên món"
                                            style={{
                                                marginBottom: "12px",
                                            }}
                                            value={dish.name}
                                            onChange={(e) =>
                                                setDelicaciesDishes((prev) =>
                                                    prev.map((d, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...d,
                                                                  name: e.target
                                                                      .value,
                                                              }
                                                            : d
                                                    )
                                                )
                                            }
                                        />
                                        <Upload
                                            listType="picture"
                                            fileList={delicaciesImageFiles[idx]}
                                            beforeUpload={() => false}
                                            onChange={({ fileList }) =>
                                                setDelicaciesImageFiles(
                                                    (prev) =>
                                                        prev.map((files, i) =>
                                                            i === idx
                                                                ? fileList
                                                                : files
                                                        )
                                                )
                                            }
                                            maxCount={1}
                                        >
                                            <Button icon={<PlusOutlined />}>
                                                Upload ảnh món ăn
                                            </Button>
                                        </Upload>
                                    </Space>
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                style={{
                                    marginTop: "20px",
                                }}
                                onClick={() => {
                                    setDelicaciesDishes((prev) => [
                                        ...prev,
                                        { name: "", image: "" },
                                    ]);
                                    setDelicaciesImageFiles((prev) => [
                                        ...prev,
                                        [],
                                    ]);
                                }}
                            >
                                Thêm món ăn
                            </Button>
                        </Panel>
                        <Panel header="Ảnh kết thúc" key="lastImage">
                            <Upload
                                listType="picture-card"
                                fileList={lastImageFile}
                                beforeUpload={() => false}
                                onChange={({ fileList }) =>
                                    setLastImageFile(fileList)
                                }
                                maxCount={1}
                            >
                                {lastImageFile.length === 0 && (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>
                                            Upload
                                        </div>
                                    </div>
                                )}
                            </Upload>
                        </Panel>
                    </Collapse>

                    <Form.Item className="md:col-span-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Tạo điểm đến
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
}
