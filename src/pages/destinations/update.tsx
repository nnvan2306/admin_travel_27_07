/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Form,
    Input,
    Upload,
    Button,
    Space,
    Select,
    Divider,
    Collapse,
    Spin,
} from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { API } from "@/lib/axios";
import type { UploadFile, RcFile } from "antd/es/upload/interface";
import { useNotifier } from "@/hooks/useNotifier";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";

const { Panel } = Collapse;

interface CategoryType {
    category_id: number;
    category_name: string;
    is_deleted: "active" | "inactive";
}

export default function EditDestination() {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { contextHolder, notifyError, notifySuccess } = useNotifier();

    const [loading, setLoading] = useState(true);
    const [bannerFile, setBannerFile] = useState<UploadFile[]>([]);
    const [categories, setCategories] = useState<CategoryType[]>([]);

    const [intro, setIntro] = useState("");
    const [introTitle, setIntroTitle] = useState("");
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
    const [experience, setExperience] = useState<any>(null);
    const [lastImageFile, setLastImageFile] = useState<UploadFile<any>[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [destRes, catRes] = await Promise.all([
                    API.get(`/destinations/${id}`),
                    API.get("/destination-categories"),
                ]);

                const dest = destRes?.data;
                form.setFieldsValue({
                    name: dest.name,
                    area: dest.area,
                    description: dest.description,
                    category_id: dest.category_id,
                });

                if (dest.img_banner_url) {
                    setBannerFile([
                        {
                            uid: "-1",
                            name: "banner.jpg",
                            status: "done",
                            url: dest.img_banner_url,
                        },
                    ]);
                }

                const sections = dest.sections || [];
                const introSec = sections.find((s: any) => s.type === "intro");
                const highlightSec = sections.find(
                    (s: any) => s.type === "highlight"
                );
                const gallerySec = sections.find(
                    (s: any) => s.type === "gallery"
                );
                const delicaciesSec = sections.find(
                    (s: any) => s.type === "regionalDelicacies"
                );
                const experienceSec = sections.find(
                    (s: any) => s.type === "experience"
                );
                if (experienceSec)
                    setExperience(experienceSec.description || "");
                const lastImageSec = sections.find(
                    (s: any) => s.type === "lastImage"
                );
                if (lastImageSec && lastImageSec.image) {
                    setLastImageFile([
                        {
                            uid: "-2",
                            name: lastImageSec.image,
                            status: "done",
                            url: lastImageSec.image.includes("http")
                                ? lastImageSec.image
                                : `/storage/${lastImageSec.image}`,
                        },
                    ]);
                }
                if (introSec) {
                    setIntro(introSec.content);
                    setIntroTitle(introSec?.title || "");
                }
                if (highlightSec) setHighlight(highlightSec.content || []);
                if (gallerySec) {
                    const files = (gallerySec.content || []).map(
                        (url: string, idx: number) => ({
                            uid: `${idx}`,
                            name: `gallery-${idx}.jpg`,
                            status: "done",
                            url: url.includes("http") ? url : `/storage/${url}`,
                        })
                    );
                    setGallery(files);
                }
                if (delicaciesSec) {
                    setDelicaciesIntro(delicaciesSec.content?.intro || "");
                    const dishes = delicaciesSec.content?.dishes || [];
                    setDelicaciesDishes(
                        dishes.map((d: any) => ({
                            name: d.name,
                            image:
                                d.image && !d.image.startsWith("http")
                                    ? `/storage/${d.image}`
                                    : d.image,
                        }))
                    );
                    setDelicaciesImageFiles(dishes.map(() => [])); // File ảnh sẽ được upload lại nếu người dùng muốn
                }

                setCategories(catRes.data);
            } catch (error) {
                console.log(error);
                notifyError("Không thể tải dữ liệu điểm đến");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const onFinish = async (values: any) => {
        console.log("Giá trị biểu mẫu:", values);
        try {
            setLoading(true);
            const formData = new FormData();

            formData.append("name", values.name);
            formData.append("description", values.description);
            // formData.append("area", values.area);
            formData.append("category_id", values.category_id);

            for (const [key, value] of formData.entries()) {
                console.log(
                    `FormData - ${key}: ${
                        value instanceof File ? value.name : value
                    }`
                );
            }

            if (bannerFile.length > 0 && bannerFile[0].originFileObj) {
                formData.append(
                    "imgBanner",
                    bannerFile[0].originFileObj as RcFile
                );
            }

            const sections = [];

            // 👉 Section: intro
            if (intro.trim()) {
                sections.push({
                    type: "intro",
                    title: introTitle || "Giới thiệu",
                    content: intro.trim(),
                });
            }

            // 👉 Section: highlight
            const validHighlights = highlight.filter(
                (h) => h.title && h.description
            );
            if (validHighlights.length > 0) {
                sections.push({
                    type: "highlight",
                    content: validHighlights,
                });
            }

            // 👉 Section: experience
            if (experience.trim()) {
                sections.push({
                    type: "experience",
                    content: experience,
                });
            }

            // 👉 Section: gallery
            if (gallery.length > 0) {
                console.log("gallery >>> ", gallery);
                const galleryNames: string[] = [];
                gallery.forEach((file) => {
                    if (file.originFileObj) {
                        const origin = file.originFileObj as RcFile;
                        formData.append("galleryImages[]", origin);
                    } else {
                        // Nếu là ảnh cũ từ server thì có thể push luôn tên
                        if (file?.name) {
                            galleryNames.push(file.name);
                        }
                    }
                });
                sections.push({
                    type: "gallery",
                    content: galleryNames,
                });
            }
            // const galleryNames: string[] = [];
            // gallery.forEach((file) => {
            //     if (file.originFileObj) {
            //         const origin = file.originFileObj as RcFile;
            //         formData.append("galleryImages[]", origin);
            //         galleryNames.push(origin.name);
            //     } else if (file.url) {
            //         const filename = file.url.split("/").pop(); // tách đúng tên từ url
            //         galleryNames.push(filename || "");
            //     }
            // });

            // 👉 Section: lastImage
            // if (lastImageFile.length > 0) {
            //   const lastFile = lastImageFile[0].originFileObj as RcFile;
            //   formData.append('lastImage', lastFile);
            //   sections.push({
            //     type: 'lastImage',
            //     content: lastFile.name,
            //   });
            // }
            if (lastImageFile.length > 0) {
                const file = lastImageFile[0];
                if (file.originFileObj) {
                    const lastFile = file.originFileObj as RcFile;
                    formData.append("lastImage", lastFile);
                    sections.push({
                        type: "lastImage",
                        content: lastFile.name,
                    });
                } else if (file.url) {
                    const filename = file.url.split("/").pop();
                    sections.push({
                        type: "lastImage",
                        content: filename,
                    });
                }
            }

            // 👉 Section: regionalDelicacies
            const dishesWithImages = delicaciesDishes
                .map((dish, idx) => {
                    const imgFile = delicaciesImageFiles[idx]?.[0]
                        ?.originFileObj as RcFile;
                    if (imgFile) {
                        formData.append("delicacyImages[]", imgFile);
                        return {
                            name: dish.name,
                            image: imgFile.name,
                        };
                    }
                    return {
                        name: dish.name,
                        image: dish.name,
                    };
                })
                .filter((d) => d.name); // lọc món ăn hợp lệ

            if (delicaciesIntro.trim() || dishesWithImages.length > 0) {
                sections.push({
                    type: "regionalDelicacies",
                    content: {
                        intro: delicaciesIntro.trim(),
                        dishes: dishesWithImages,
                    },
                });
            }
            // const dishesWithImages = delicaciesDishes
            //     .map((dish, idx) => {
            //         const imgFile = delicaciesImageFiles[idx]?.[0]
            //             ?.originFileObj as RcFile;
            //         if (imgFile) {
            //             formData.append("delicacyImages[]", imgFile);
            //             return {
            //                 name: dish.name,
            //                 image: imgFile.name,
            //             };
            //         } else {
            //             // nếu không chọn ảnh mới thì giữ nguyên image cũ
            //             return {
            //                 name: dish.name,
            //                 image: dish.image || "",
            //             };
            //         }
            //     })
            //     .filter((d) => d.name);

            // ✨ Add final sections JSON
            formData.append("sections", JSON.stringify(sections));

            const res = await API.post(
                `/destinations/${id}?_method=PUT`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            notifySuccess(res.data.message || "Cập nhật điểm đến thành công!");
            form.resetFields();
            setBannerFile([]);
            setIntro("");
            setHighlight([{ title: "", description: "" }]);
            setGallery([]);
            setExperience("");
            setDelicaciesIntro("");
            setDelicaciesDishes([{ name: "", image: "" }]);
            setDelicaciesImageFiles([[]]);
            setLastImageFile([]);
            navigate("/destinations");
        } catch (error: any) {
            notifyError(
                error?.response?.data?.message || "Cập nhật điểm đến thất bại!"
            );
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin className="mt-10 block mx-auto" />;

    return (
        <>
            {contextHolder}
            <div className="mx-auto bg-white p-8 shadow-[8px] rounded-md">
                <h1 className="text-2xl font-bold mb-6">Chỉnh sửa điểm đến</h1>
                <Form
                    layout="vertical"
                    form={form}
                    onFinish={onFinish}
                    onFinishFailed={({ errorFields }) => {
                        console.warn("❌ Form validate lỗi:", errorFields);
                        notifyError(
                            "Vui lòng điền đầy đủ các trường bắt buộc!"
                        );
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
                >
                    <Form.Item
                        label="Tên điểm đến"
                        name="name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item label="Ảnh banner">
                        <Upload
                            listType="picture-card"
                            fileList={bannerFile}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setBannerFile(fileList)}
                            maxCount={1}
                        >
                            {bannerFile.length >= 1 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        label="Danh mục điểm đến"
                        name="category_id"
                        rules={[{ required: true }]}
                    >
                        <Select placeholder="Chọn danh mục">
                            {categories
                                .filter((cat) => cat.is_deleted === "active")
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
                        label="Mô tả"
                        name="description"
                        className="md:col-span-2"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mô tả điểm đến",
                            },
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
                        defaultActiveKey={["intro", "highlight"]}
                    >
                        <Panel header="Giới thiệu" key="intro">
                            <Input
                                placeholder="Tiêu đề giới thiệu"
                                value={introTitle}
                                onChange={(e) => setIntroTitle(e.target.value)}
                                style={{
                                    marginBottom: "12px",
                                }}
                            />
                            <MdEditor
                                style={{ height: "300px" }}
                                value={intro}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                                onChange={({ text }) => setIntro(text)}
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
                                            className="border border-red-500 rounded-full bg-white text-red-500 w-6 h-6 flex items-center justify-center p-0"
                                            style={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                zIndex: 1,
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
                                            boxShadow:
                                                "0 2px 8px 0 rgba(0,0,0,0.06)",
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
                                className="mt-5"
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
                                            className="border border-red-500 rounded-full bg-white text-red-500 w-6 h-6 flex items-center justify-center p-0"
                                            style={{
                                                position: "absolute",
                                                top: -10,
                                                right: -10,
                                                zIndex: 1,
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
                                            boxShadow:
                                                "0 2px 8px 0 rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <Input
                                            placeholder="Tên món"
                                            style={{ marginBottom: "12px" }}
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
                                        {/* Hiển thị ảnh món ăn nếu có */}
                                        {dish.image && (
                                            <img
                                                src={dish.image}
                                                alt={dish.name}
                                                style={{
                                                    maxWidth: 120,
                                                    maxHeight: 120,
                                                    marginBottom: 8,
                                                    borderRadius: 8,
                                                    border: "1px solid #eee",
                                                }}
                                            />
                                        )}
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
                                className="mt-5"
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
                        <Panel header="Trải nghiệm" key="experience">
                            <MdEditor
                                placeholder="Mô tả trải nghiệm"
                                style={{
                                    height: "300px",
                                    marginBottom: "12px",
                                }}
                                value={experience}
                                onChange={(e) => setExperience(e.text)}
                                renderHTML={(text) => (
                                    <ReactMarkdown>{text}</ReactMarkdown>
                                )}
                            />
                        </Panel>

                        <Panel header="Ảnh cuối cùng" key="lastImage">
                            <Upload
                                listType="picture-card"
                                fileList={lastImageFile}
                                beforeUpload={() => false}
                                onChange={({ fileList }) =>
                                    setLastImageFile(fileList)
                                }
                                maxCount={1}
                            >
                                {lastImageFile.length >= 1 ? null : (
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
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                Lưu thay đổi
                            </Button>
                            <Button onClick={() => navigate("/destinations")}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
}
