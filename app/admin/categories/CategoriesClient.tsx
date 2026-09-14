"use client";

import { useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
import {
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoriesOrder,
} from "../../actions/category";
import { useToast } from "@/app/components/Toast";

type Category = {
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
    _count?: {
        products: number;
    };
};

export default function CategoriesClient({
    initialCategories,
}: {
    initialCategories: Category[];
}) {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [name, setName] = useState("");
    const [sortOrder, setSortOrder] = useState<number>(
        initialCategories.length > 0
            ? Math.max(...initialCategories.map((c) => c.sortOrder ?? 0)) + 1
            : 1
    );
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [pending, startTransition] = useTransition();

    // Drag-and-drop reordering state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            toast("Category name is required.", "error");
            return;
        }

        setLoading(true);
        try {
            if (editingCategory) {
                const updated = await updateCategory(editingCategory.id, {
                    name,
                    sortOrder,
                });
                setCategories((prev) => {
                    const next = prev.map((c) =>
                        c.id === editingCategory.id
                            ? { ...updated, _count: c._count }
                            : c
                    );
                    return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                });
                setEditingCategory(null);
                toast("Category updated successfully!", "success");
            } else {
                const newCat = await createCategory({ name, sortOrder });
                setCategories((prev) => {
                    const next = [...prev, { ...newCat, _count: { products: 0 } }];
                    return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                });
                toast("Category created successfully!", "success");
            }

            setName("");
            setSortOrder(
                categories.length > 0
                    ? Math.max(...categories.map((c) => c.sortOrder ?? 0)) + 2
                    : 1
            );
        } catch (err: any) {
            console.error("Failed to save category:", err);
            toast(err?.message || "Error saving category.", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(category: Category) {
        setEditingCategory(category);
        setName(category.name);
        setSortOrder(category.sortOrder ?? 1);
    }

    function handleCancel() {
        setEditingCategory(null);
        setName("");
        setSortOrder(
            categories.length > 0
                ? Math.max(...categories.map((c) => c.sortOrder ?? 0)) + 1
                : 1
        );
    }

    function handleDelete(category: Category) {
        const productCount = category._count?.products ?? 0;
        if (productCount > 0) {
            toast(
                `Cannot delete "${category.name}": ${productCount} product${
                    productCount > 1 ? "s are" : " is"
                } currently assigned to this category.`,
                "error"
            );
            return;
        }

        if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            return;
        }

        startTransition(async () => {
            const result = await deleteCategory(category.id);
            if (!result.success) {
                toast(result.error || "Failed to delete category.", "error");
                return;
            }

            setCategories((prev) => prev.filter((c) => c.id !== category.id));
            toast(`Category "${category.name}" deleted successfully!`, "info");
            if (editingCategory?.id === category.id) {
                handleCancel();
            }
        });
    }

    // Drag-and-drop reordering handlers
    function handleDragStart(e: React.DragEvent, index: number) {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${index}`);
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    }

    function handleDrop(e: React.DragEvent, targetIndex: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newCats = [...categories];
        const [moved] = newCats.splice(draggedIndex, 1);
        newCats.splice(targetIndex, 0, moved);

        const updated = newCats.map((cat, i) => ({
            ...cat,
            sortOrder: i + 1,
        }));

        setCategories(updated);
        setDraggedIndex(null);
        setDragOverIndex(null);

        startTransition(async () => {
            await updateCategoriesOrder(
                updated.map((c) => ({ id: c.id, sortOrder: c.sortOrder }))
            );
            toast(`"${moved.name}" moved to #${targetIndex + 1}! Order updated.`, "success");
        });
    }

    function handleDragEnd() {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form: Add / Edit Category */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sticky top-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Category Name *
                                </label>
                                <span className="text-[10px] text-gray-400">
                                    {name.length} / 50
                                </span>
                            </div>
                            <input
                                required
                                maxLength={50}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sarees, Lehengas, Kurtis"
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Display Priority (Order)
                                </label>
                                <span className="text-[10px] text-gray-400">
                                    Lower number = appears first
                                </span>
                            </div>
                            <input
                                type="number"
                                min={1}
                                value={sortOrder}
                                onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                The category with the lowest number (e.g. 1) will show up
                                first on the homepage.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-black text-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer font-medium shadow-xs"
                            >
                                {loading
                                    ? "Saving..."
                                    : editingCategory
                                    ? "Update Category"
                                    : "Add Category"}
                            </button>
                            {editingCategory && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition cursor-pointer font-medium"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* List: Categories and Reordering */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Categories ({categories.length})
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Drag and drop any row using the grip handle to reorder. Top category appears first on the website.
                            </p>
                        </div>
                    </div>

                    {categories.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 w-32">Order</th>
                                        <th className="text-left px-4 py-3 min-w-[150px]">Category Name</th>
                                        <th className="text-left px-4 py-3">Slug</th>
                                        <th className="text-left px-4 py-3 w-28">Products</th>
                                        <th className="text-right px-4 py-3 w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {categories.map((cat, index) => {
                                        const productCount = cat._count?.products ?? 0;
                                        const isFirst = index === 0;
                                        const isEditing = editingCategory?.id === cat.id;

                                        return (
                                            <tr
                                                key={cat.id}
                                                draggable={!pending}
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDrop={(e) => handleDrop(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`transition duration-150 select-none ${
                                                    draggedIndex === index
                                                        ? "opacity-30 bg-gray-100"
                                                        : dragOverIndex === index
                                                        ? "border-t-2 border-black bg-blue-50/60"
                                                        : isEditing
                                                        ? "bg-amber-50/60 font-medium"
                                                        : "hover:bg-gray-50/70"
                                                }`}
                                            >
                                                {/* Drag handle & Order Rank */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded transition"
                                                            title="Drag to reorder"
                                                        >
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <span
                                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                                isFirst
                                                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >
                                                            {isFirst ? "1st (First)" : `#${index + 1}`}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Category Name */}
                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <span>{cat.name}</span>
                                                        {isEditing && (
                                                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase">
                                                                Editing
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Slug */}
                                                <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                                                    {cat.slug}
                                                </td>

                                                {/* Product count */}
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                                                            productCount > 0
                                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        {productCount} {productCount === 1 ? "Product" : "Products"}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(cat)}
                                                            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                                                        >
                                                            Edit
                                                        </button>
                                                        <span className="text-gray-200">|</span>
                                                        <button
                                                            onClick={() => handleDelete(cat)}
                                                            disabled={pending}
                                                            title={
                                                                productCount > 0
                                                                    ? `Cannot delete: ${productCount} product(s) assigned`
                                                                    : "Delete category"
                                                            }
                                                            className={`text-xs font-semibold cursor-pointer transition ${
                                                                productCount > 0
                                                                    ? "text-gray-300 hover:text-gray-400 cursor-not-allowed"
                                                                    : "text-red-500 hover:text-red-700 hover:underline"
                                                            }`}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <p className="text-gray-400 text-sm mb-2">No categories yet.</p>
                            <p className="text-xs text-gray-400">
                                Create your first category using the form on the left.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
