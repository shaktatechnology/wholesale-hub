"use client";
import { useState, useRef, useEffect } from "react";
import { createProduct, updateProduct } from "../../actions/product";
import { compressImage } from "@/app/lib/compressImage";
import { useToast } from "@/app/components/Toast";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "@/app/components/SocialIcons";

type Color = {
    id: number;
    name: string;
    hexCode: string;
};

type Size = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string;
    images?: string | null;
    price: unknown;
    discount: unknown;
    stock: number;
    status: boolean;
    description: string;
    tiktokUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    productColors?: {
        id: number;
        productId: number;
        colorId: number;
        color: Color;
    }[];
    productSizes?: {
        id: number;
        productId: number;
        sizeId: number;
        size: Size;
    }[];
};

type ImageItem = {
    id: string;
    url?: string;
    file?: File;
    preview: string;
    isCover: boolean;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (product: Product, isEdit: boolean) => void;
    product: Product | null;
    colors: Color[];
    sizes: Size[];
};

export default function ProductFormModal({ isOpen, onClose, onSaved, product, colors, sizes }: Props) {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        price: "",
        discount: "",
        stock: "",
        status: true,
        tiktokUrl: "",
        facebookUrl: "",
        instagramUrl: "",
    });

    const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
    const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);

    const [imagesList, setImagesList] = useState<ImageItem[]>([]);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const nameRef = useRef<HTMLTextAreaElement>(null);
    const slugRef = useRef<HTMLTextAreaElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand Name, Slug, and Description textarea height as content grows
    useEffect(() => {
        if (nameRef.current) {
            nameRef.current.style.height = "auto";
            nameRef.current.style.height = `${Math.max(38, nameRef.current.scrollHeight)}px`;
        }
    }, [form.name, isOpen]);

    useEffect(() => {
        if (slugRef.current) {
            slugRef.current.style.height = "auto";
            slugRef.current.style.height = `${Math.max(38, slugRef.current.scrollHeight)}px`;
        }
    }, [form.slug, isOpen]);

    useEffect(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = "auto";
            descriptionRef.current.style.height = `${Math.max(80, descriptionRef.current.scrollHeight)}px`;
        }
    }, [form.description, isOpen]);

    // Reset or load product on open/change
    useEffect(() => {
        if (isOpen) {
            setError("");
            setUploadError("");
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (product) {
                setForm({
                    name: product.name,
                    slug: product.slug,
                    description: product.description || "",
                    price: String(product.price),
                    discount: String(product.discount || 0),
                    stock: String(product.stock),
                    status: product.status,
                    tiktokUrl: product.tiktokUrl || "",
                    facebookUrl: product.facebookUrl || "",
                    instagramUrl: product.instagramUrl || "",
                });

                // Load images
                let initialImages: string[] = [];
                if (product.images) {
                    try {
                        const parsed = JSON.parse(product.images);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            initialImages = parsed;
                        }
                    } catch (e) {
                        console.error("Failed to parse product.images JSON:", e);
                    }
                }
                if (initialImages.length === 0 && product.image) {
                    initialImages = [product.image];
                }

                setImagesList(
                    initialImages.map((url, idx) => ({
                        id: `existing-${idx}-${Date.now()}`,
                        url,
                        preview: url,
                        isCover: idx === 0,
                    }))
                );

                setSelectedColorIds(product.productColors?.map((pc) => pc.colorId) || []);
                setSelectedSizeIds(product.productSizes?.map((ps) => ps.sizeId) || []);
            } else {
                setForm({
                    name: "",
                    slug: "",
                    description: "",
                    price: "",
                    discount: "0",
                    stock: "",
                    status: true,
                    tiktokUrl: "",
                    facebookUrl: "",
                    instagramUrl: "",
                });
                setImagesList([]);
                setSelectedColorIds([]);
                setSelectedSizeIds([]);
            }
        }
    }, [isOpen, product]);

    if (!isOpen) return null;

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "status" ? value === "true" : value,
        }));
    }

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const name = e.target.value;
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
        setForm((prev) => ({ ...prev, name, slug }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFilesToList(Array.from(e.target.files));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            addFilesToList(Array.from(e.dataTransfer.files));
        }
    };

    const addFilesToList = (files: File[]) => {
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            toast("Only image files are allowed.", "error");
            setUploadError("Only image files are allowed.");
            return;
        }

        const newItems: ImageItem[] = imageFiles.map((file, idx) => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}`,
            file,
            preview: URL.createObjectURL(file),
            isCover: imagesList.length === 0 && idx === 0,
        }));

        setImagesList((prev) => [...prev, ...newItems]);
        setUploadError("");
    };

    const handleRemoveImage = (id: string) => {
        setImagesList((prev) => {
            const filtered = prev.filter((item) => item.id !== id);
            if (filtered.length > 0 && !filtered.some((item) => item.isCover)) {
                filtered[0].isCover = true;
            }
            return filtered;
        });
    };

    const handleSetCover = (id: string) => {
        setImagesList((prev) =>
            prev.map((item) => ({
                ...item,
                isCover: item.id === id,
            }))
        );
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.slug || !form.price || !form.stock) {
            toast("Please fill in all required fields.", "error");
            setError("Please fill in all required fields.");
            return;
        }

        if (imagesList.length === 0) {
            toast("Please select at least one image.", "error");
            setError("Please select at least one image.");
            return;
        }

        setError("");
        setUploadError("");
        setLoading(true);

        try {
            const uploadedUrls: string[] = [];

            for (const item of imagesList) {
                if (item.file) {
                    const compressed = await compressImage(item.file);
                    const fd = new FormData();
                    fd.append("file", compressed);
                    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
                    const uploadData = await uploadRes.json();

                    if (!uploadRes.ok || !uploadData.url) {
                        const msg = uploadData.error ?? "Image upload failed.";
                        toast(msg, "error");
                        setUploadError(msg);
                        setLoading(false);
                        return;
                    }
                    uploadedUrls.push(uploadData.url);
                } else if (item.url) {
                    uploadedUrls.push(item.url);
                }
            }

            // Determine cover image URL
            const coverIndex = imagesList.findIndex((item) => item.isCover);
            const coverUrl = coverIndex !== -1 ? uploadedUrls[coverIndex] : uploadedUrls[0];

            const productData: any = {
                name: form.name,
                description: form.description,
                price: parseFloat(form.price),
                discount: parseFloat(form.discount || "0"),
                stock: parseInt(form.stock),
                status: form.status,
                image: coverUrl,
                images: uploadedUrls,
                tiktokUrl: form.tiktokUrl.trim() || null,
                facebookUrl: form.facebookUrl.trim() || null,
                instagramUrl: form.instagramUrl.trim() || null,
                colorIds: selectedColorIds,
                sizeIds: selectedSizeIds,
            };

            if (!product || form.slug !== product.slug) {
                productData.slug = form.slug;
            }

            let savedProduct;
            if (product) {
                savedProduct = await updateProduct(product.id, productData);
            } else {
                savedProduct = await createProduct(productData);
            }

            onSaved(savedProduct as any, !!product);
        } catch (err: any) {
            console.error("Error saving product:", err);
            const msg = err?.message || `Failed to ${product ? "update" : "create"} product.`;
            toast(msg, "error");
            setError(msg);
        }

        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    type="button"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {error && (
                    <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 animate-fadeIn">
                        <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1 text-xs text-red-700 font-semibold leading-relaxed">
                            {error}
                        </div>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-red-400 hover:text-red-600 text-xs font-bold leading-none p-0.5 rounded cursor-pointer"
                            title="Dismiss message"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 block">Name</label>
                            <span className="text-[10px] text-gray-400">{form.name.length} / 100</span>
                        </div>
                        <textarea
                            ref={nameRef}
                            required
                            name="name"
                            rows={1}
                            maxLength={100}
                            value={form.name}
                            onChange={(e) => {
                                handleNameChange(e);
                                if (e.target.value.includes("\n")) {
                                    setForm((prev) => ({ ...prev, name: prev.name.replace(/\n/g, "") }));
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                }
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none overflow-hidden transition-[height] duration-100"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 block">Slug</label>
                            <span className="text-[10px] text-gray-400">{form.slug.length} / 100</span>
                        </div>
                        <textarea
                            ref={slugRef}
                            required
                            name="slug"
                            rows={1}
                            maxLength={100}
                            value={form.slug}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\n/g, "");
                                setForm((p) => ({ ...p, slug: val }));
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                }
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none overflow-hidden transition-[height] duration-100"
                        />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 block">Description</label>
                            <span className="text-[10px] text-gray-400">{form.description.length} / 1000</span>
                        </div>
                        <textarea
                            ref={descriptionRef}
                            required
                            name="description"
                            maxLength={1000}
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black resize-none overflow-hidden transition-[height] duration-100"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Price (Rs.)</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>

                    {/* Discount */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Discount Amount (Rs.)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="discount"
                            value={form.discount}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                        <input
                            required
                            type="number"
                            min="0"
                            name="stock"
                            value={form.stock}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select
                            name="status"
                            value={String(form.status)}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    {/* Color / Number Checklist */}
                    <div className="sm:col-span-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-gray-700 block font-semibold">Available Colors / Numbers</label>
                            <span className="text-[10px] text-gray-400">Select options present in product image</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {colors.map((color) => {
                                const isSelected = selectedColorIds.includes(color.id);
                                return (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedColorIds((prev) => prev.filter((id) => id !== color.id));
                                            } else {
                                                setSelectedColorIds((prev) => [...prev, color.id]);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer select-none ${
                                            isSelected
                                                ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        <span
                                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                            style={{ backgroundColor: color.hexCode || "#000" }}
                                        />
                                        <span>{color.name}</span>
                                        {isSelected && (
                                            <svg className="w-3.5 h-3.5 text-white ml-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                            {colors.length === 0 && (
                                <p className="text-xs text-gray-400">No colors configured yet. Go to Admin Colors dashboard to add numbers (1–10) or colors.</p>
                            )}
                        </div>
                    </div>

                    {/* Size Checklist */}
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-700 mb-2 block font-semibold">Available Sizes</label>
                        <div className="flex flex-wrap gap-2">
                            {sizes.map((size) => {
                                const isSelected = selectedSizeIds.includes(size.id);
                                return (
                                    <button
                                        key={size.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedSizeIds((prev) => prev.filter((id) => id !== size.id));
                                            } else {
                                                setSelectedSizeIds((prev) => [...prev, size.id]);
                                            }
                                        }}
                                        className={`flex items-center justify-center min-w-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none ${
                                            isSelected
                                                ? "border-black bg-black text-white"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        <span>{size.name}</span>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white ml-1.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                            {sizes.length === 0 && (
                                <p className="text-xs text-gray-400">No sizes configured yet. Create some in the Sizes dashboard.</p>
                            )}
                        </div>
                    </div>

                    {/* Social Media Video Links */}
                    <div className="sm:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <label className="text-xs font-semibold text-gray-800 block">
                            Product Video Links <span className="text-gray-400 font-normal">(Optional video URLs for TikTok, Facebook & Instagram)</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <TikTokIcon className="w-3.5 h-3.5 text-black" />
                                    <span className="text-[11px] font-medium text-gray-600">TikTok Link</span>
                                </div>
                                <input
                                    type="url"
                                    name="tiktokUrl"
                                    value={form.tiktokUrl}
                                    onChange={handleChange}
                                    placeholder="https://www.tiktok.com/@..."
                                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-black bg-white"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[11px] font-medium text-gray-600">Facebook Link</span>
                                </div>
                                <input
                                    type="url"
                                    name="facebookUrl"
                                    value={form.facebookUrl}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/..."
                                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-black bg-white"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                                    <span className="text-[11px] font-medium text-gray-600">Instagram Reel Link</span>
                                </div>
                                <input
                                    type="url"
                                    name="instagramUrl"
                                    value={form.instagramUrl}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/reel/..."
                                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-black bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Multi-Image Upload */}
                    <div className="sm:col-span-2 space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-700 block">
                                Product Images <span className="text-gray-400 font-normal">(Select multiple files or drag & drop)</span>
                            </label>
                            <span className="text-xs text-gray-500 font-medium">
                                {imagesList.length} {imagesList.length === 1 ? "image" : "images"} uploaded
                            </span>
                        </div>

                        {/* Thumbnail Grid */}
                        {imagesList.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                {imagesList.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`relative group rounded-lg overflow-hidden border-2 transition bg-white aspect-square ${
                                            item.isCover ? "border-rose-600 ring-2 ring-rose-100" : "border-gray-200"
                                        }`}
                                    >
                                        <img
                                            src={item.preview}
                                            alt="Product thumbnail"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Cover badge */}
                                        {item.isCover && (
                                            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                                COVER
                                            </span>
                                        )}

                                        {/* Action Overlays */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1">
                                            {!item.isCover && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetCover(item.id)}
                                                    className="bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-1 rounded hover:bg-white transition"
                                                >
                                                    Set Cover
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(item.id)}
                                                className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-700 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* File Upload Dropzone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-gray-300 hover:border-black rounded-xl p-5 text-center cursor-pointer bg-gray-50 hover:bg-white transition flex flex-col items-center justify-center gap-2"
                        >
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <div>
                                <p className="text-xs font-semibold text-gray-700">
                                    Click or drag & drop to add images
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP — up to 20 MB each (Select multiple files at once)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {uploadError && (
                            <p className="text-red-500 text-xs mt-1">{uploadError}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="border border-gray-300 text-gray-700 px-5 py-2 rounded text-sm hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
