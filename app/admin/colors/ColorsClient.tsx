"use client";
import { useState, useTransition } from "react";
import { createColor, deleteColor, updateColor, createNumberColors } from "../../actions/color";
import { useToast } from "@/app/components/Toast";

type Color = { id: number; name: string; hexCode: string };

export default function ColorsClient({ initialColors }: { initialColors: Color[] }) {
    const { toast } = useToast();
    const [colors, setColors] = useState(initialColors);
    const [name, setName] = useState("");
    const [hexCode, setHexCode] = useState("#000000");
    const [editingColor, setEditingColor] = useState<Color | null>(null);
    const [loading, setLoading] = useState(false);
    const [generatingNumbers, setGeneratingNumbers] = useState(false);
    const [pending, startTransition] = useTransition();

    async function handleQuickAddNumbers() {
        setGeneratingNumbers(true);
        try {
            const added = await createNumberColors(1, 10);
            if (added.length > 0) {
                setColors((prev) => [...added, ...prev]);
                toast("Numbers 1-10 created successfully!", "success");
            }
        } catch (err) {
            console.error("Failed to generate number options:", err);
            toast("Failed to generate number options.", "error");
        } finally {
            setGeneratingNumbers(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingColor) {
                const updated = await updateColor(editingColor.id, { name, hexCode });
                setColors((prev) =>
                    prev.map((c) => (c.id === editingColor.id ? updated : c))
                );
                setEditingColor(null);
                toast("Color updated successfully!", "success");
            } else {
                const newColor = await createColor({ name, hexCode });
                setColors((prev) => [newColor, ...prev]);
                toast("Color created successfully!", "success");
            }
            setName("");
            setHexCode("#000000");
        } catch (err) {
            console.error("Failed to save color:", err);
            toast("Error saving color. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleEdit(color: Color) {
        setEditingColor(color);
        setName(color.name);
        setHexCode(color.hexCode);
    }

    function handleCancel() {
        setEditingColor(null);
        setName("");
        setHexCode("#000000");
    }

    function handleDelete(id: number) {
        if (!confirm("Delete this color?")) return;
        startTransition(async () => {
            await deleteColor(id);
            setColors((prev) => prev.filter((c) => c.id !== id));
            toast("Color deleted successfully!", "info");
            if (editingColor?.id === id) {
                handleCancel();
            }
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add / Edit Color Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                    {editingColor ? "Edit Color" : "Add Color"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 block">Color Name</label>
                            <span className="text-[10px] text-gray-400">{name.length} / 50</span>
                        </div>
                        <input
                            required
                            maxLength={50}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Royal Blue"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Hex Code</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                value={hexCode}
                                onChange={(e) => setHexCode(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-300 animate-fade-in"
                            />
                            <input
                                required
                                value={hexCode}
                                onChange={(e) => setHexCode(e.target.value)}
                                placeholder="#000000"
                                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-5 py-2 rounded text-sm hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer font-medium"
                        >
                            {loading ? "Saving..." : editingColor ? "Update Color" : "Add Color"}
                        </button>
                        {editingColor && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="border border-gray-300 text-gray-700 px-5 py-2 rounded text-sm hover:bg-gray-50 transition cursor-pointer font-medium"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Colors List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">All Colors / Numbers</h2>
                    <button
                        type="button"
                        onClick={handleQuickAddNumbers}
                        disabled={generatingNumbers}
                        className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
                    >
                        {generatingNumbers ? "Generating..." : "+ Quick Add Numbers (1–10)"}
                    </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {colors.map((color) => (
                        <div
                            key={color.id}
                            className="flex items-center justify-between border border-gray-100 rounded p-3 hover:bg-gray-50/50 transition duration-150"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-6 h-6 rounded-full border border-gray-200"
                                    style={{ backgroundColor: color.hexCode }}
                                />
                                <span className="text-sm font-medium">{color.name}</span>
                                <span className="text-xs text-gray-400">{color.hexCode}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEdit(color)}
                                    className="text-blue-600 text-xs hover:underline cursor-pointer font-medium"
                                >
                                    Edit
                                </button>
                                <span className="text-gray-250 font-light">|</span>
                                <button
                                    onClick={() => handleDelete(color.id)}
                                    disabled={pending}
                                    className="text-red-500 text-xs hover:underline disabled:opacity-50 cursor-pointer font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {colors.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-4">No colors yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
