"use client";
import { useState, useTransition } from "react";
import { createSize, deleteSize, updateSize } from "../../actions/size";
import { useToast } from "@/app/components/Toast";

type Size = { id: number; name: string };

export default function SizesClient({ initialSizes }: { initialSizes: Size[] }) {
    const { toast } = useToast();
    const [sizes, setSizes] = useState(initialSizes);
    const [name, setName] = useState("");
    const [editingSize, setEditingSize] = useState<Size | null>(null);
    const [loading, setLoading] = useState(false);
    const [pending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingSize) {
                const updated = await updateSize(editingSize.id, { name });
                setSizes((prev) =>
                    prev.map((s) => (s.id === editingSize.id ? updated : s))
                );
                setEditingSize(null);
                toast("Size updated successfully!", "success");
            } else {
                const newSize = await createSize({ name });
                setSizes((prev) => [newSize, ...prev]);
                toast("Size created successfully!", "success");
            }
            setName("");
        } catch (err) {
            console.error("Failed to save size:", err);
            toast("Error saving size. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(size: Size) {
        setEditingSize(size);
        setName(size.name);
    }

    function handleCancel() {
        setEditingSize(null);
        setName("");
    }

    function handleDelete(id: number) {
        if (!confirm("Delete this size?")) return;
        startTransition(async () => {
            await deleteSize(id);
            setSizes((prev) => prev.filter((s) => s.id !== id));
            toast("Size deleted successfully!", "info");
            if (editingSize?.id === id) {
                handleCancel();
            }
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add / Edit Size Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                    {editingSize ? "Edit Size" : "Add Size"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 block">Size Name</label>
                            <span className="text-[10px] text-gray-400">{name.length} / 50</span>
                        </div>
                        <input
                            required
                            maxLength={50}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. XL, M, 32, 40"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-5 py-2 rounded text-sm hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer font-medium"
                        >
                            {loading ? "Saving..." : editingSize ? "Update Size" : "Add Size"}
                        </button>
                        {editingSize && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="border border-gray-350 text-gray-700 px-5 py-2 rounded text-sm hover:bg-gray-50 transition cursor-pointer font-medium"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Sizes List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">All Sizes</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {sizes.map((size) => (
                        <div
                            key={size.id}
                            className="flex items-center justify-between border border-gray-100 rounded p-3 hover:bg-gray-50/50 transition duration-150"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded text-gray-800 animate-fade-in">
                                    {size.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEdit(size)}
                                    className="text-blue-600 text-xs hover:underline cursor-pointer font-medium"
                                >
                                    Edit
                                </button>
                                <span className="text-gray-250 font-light">|</span>
                                <button
                                    onClick={() => handleDelete(size.id)}
                                    disabled={pending}
                                    className="text-red-500 text-xs hover:underline disabled:opacity-50 cursor-pointer font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {sizes.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-4">No sizes yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
