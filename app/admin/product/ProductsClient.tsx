"use client";
import { useState } from "react";
import ProductTable from "./ProductTable";
import ProductFormModal from "./ProductFormModal";

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
};

type Color = {
    id: number;
    name: string;
    hexCode: string;
};

type Size = {
    id: number;
    name: string;
};

import { useToast } from "@/app/components/Toast";

export default function ProductsClient({
    initialProducts,
    colors,
    sizes,
}: {
    initialProducts: Product[];
    colors: Color[];
    sizes: Size[];
}) {
    const { toast } = useToast();
    const [products, setProducts] = useState(initialProducts);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    function handleDelete(id: number) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast("Product deleted successfully!", "info");
    }

    function handleSaved(savedProduct: Product, isEdit: boolean) {
        if (isEdit) {
            setProducts((prev) =>
                prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
            );
            toast("Product updated successfully!", "success");
        } else {
            setProducts((prev) => [savedProduct, ...prev]);
            toast("Product created successfully!", "success");
        }
        setIsFormOpen(false);
        setEditingProduct(null);
    }

    // Derived Filtered and Sorted Products List
    const filteredProducts = products
        .filter((p) => {
            const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const slugMatch = p.slug.toLowerCase().includes(searchTerm.toLowerCase());
            const descMatch = p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
            const matchesSearch = nameMatch || slugMatch || descMatch;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && p.status) ||
                (statusFilter === "inactive" && !p.status);

            const matchesStock =
                stockFilter === "all" ||
                (stockFilter === "instock" && p.stock > 0) ||
                (stockFilter === "outofstock" && p.stock === 0);

            return matchesSearch && matchesStatus && matchesStock;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "price-asc":
                    return Number(a.price) - Number(b.price);
                case "price-desc":
                    return Number(b.price) - Number(a.price);
                case "stock-asc":
                    return a.stock - b.stock;
                case "stock-desc":
                    return b.stock - a.stock;
                case "newest":
                default:
                    return b.id - a.id;
            }
        });

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                >
                    Add Product
                </button>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1 max-w-md relative">
                    <input
                        type="text"
                        placeholder="Search products by name, slug, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-black transition duration-150"
                    />
                    <svg
                        className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-2 text-gray-400 hover:text-black text-sm font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Filter & Sort Dropdowns */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none bg-white focus:border-black cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Stock Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">Stock:</span>
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none bg-white focus:border-black cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="instock">In Stock</option>
                            <option value="outofstock">Out of Stock</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none bg-white focus:border-black cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="name-asc">Name: A-Z</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="stock-asc">Stock: Low to High</option>
                            <option value="stock-desc">Stock: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results count label */}
            <div className="mb-4 text-xs text-gray-500">
                Found {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                {(searchTerm || statusFilter !== "all" || stockFilter !== "all") && " matching active filters"}
            </div>

            <ProductTable
                key={`${searchTerm}-${statusFilter}-${stockFilter}-${sortBy}`}
                products={filteredProducts}
                onEdit={(p) => {
                    setEditingProduct(p);
                    setIsFormOpen(true);
                }}
                onDelete={handleDelete}
            />

            <ProductFormModal
                isOpen={isFormOpen}
                product={editingProduct}
                colors={colors}
                sizes={sizes}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingProduct(null);
                }}
                onSaved={handleSaved}
            />
        </div>
    );
}
