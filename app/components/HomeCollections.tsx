"use client";

import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";

type Category = {
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
    _count?: {
        products: number;
    };
};

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string;
    price: any;
    discount?: any;
    stock: number;
    categoryId?: number | null;
    category?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    tiktokUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
};

type Props = {
    products: Product[];
    categories?: Category[];
    showSocialVideoLinks?: boolean;
};

export default function HomeCollections({
    products,
    categories = [],
    showSocialVideoLinks = true,
}: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

    // Filter products reactively by both category and search query
    const filteredProducts = useMemo(() => {
        let list = products;

        // 1. Filter by selected category
        if (selectedCategoryId !== "all") {
            list = list.filter((p) => p.categoryId === selectedCategoryId);
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }

        return list;
    }, [products, selectedCategoryId, searchQuery]);

    // Only show categories that have at least one active product in collections
    const visibleCategories = useMemo(() => {
        return categories.filter((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return count > 0;
        });
    }, [categories, products]);

    // Active category name for empty state messaging
    const activeCategory = useMemo(() => {
        if (selectedCategoryId === "all") return null;
        return categories.find((c) => c.id === selectedCategoryId);
    }, [categories, selectedCategoryId]);

    return (
        <section id="collections" className="max-w-6xl mx-auto px-4 py-14 w-full scroll-mt-20">
            {/* Header: Title on left, Search bar on right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Our Collections
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Explore our curated selection of wholesale clothing and sarees.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search products in collection..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 pr-9 text-sm outline-none focus:border-black transition bg-gray-50 focus:bg-white"
                    />
                    <svg
                        className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold leading-none focus:outline-none cursor-pointer"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter Bar — displayed directly beneath Our Collections */}
            {visibleCategories.length > 0 && (
                <div className="mb-8">
                    {/* Responsive Container: Horizontal swipe scroll on Mobile, Wrapped flex on Desktop */}
                    <div
                        className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none overscroll-x-contain touch-pan-x"
                        style={{
                            overscrollBehaviorX: "contain",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {/* "All" Button */}
                        <button
                            type="button"
                            onClick={() => setSelectedCategoryId("all")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none shrink-0 ${
                                selectedCategoryId === "all"
                                    ? "bg-rose-600 text-white shadow-md shadow-rose-100 border border-rose-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-transparent"
                            }`}
                        >
                            <span>All Products</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    selectedCategoryId === "all"
                                        ? "bg-white/25 text-white"
                                        : "bg-gray-200 text-gray-600"
                                }`}
                            >
                                {products.length}
                            </span>
                        </button>

                        {/* Category Buttons in Admin-Defined Sort Order (Only with products > 0) */}
                        {visibleCategories.map((cat) => {
                            const isSelected = selectedCategoryId === cat.id;
                            const count = products.filter((p) => p.categoryId === cat.id).length;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none shrink-0 ${
                                        isSelected
                                            ? "bg-rose-600 text-white shadow-md shadow-rose-100 border border-rose-600"
                                            : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-transparent"
                                    }`}
                                >
                                    <span>{cat.name}</span>
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isSelected
                                                ? "bg-white/25 text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product, i) => (
                        <ProductCard
                            key={product.id}
                            name={product.name}
                            slug={product.slug}
                            image={product.image}
                            price={product.price.toString()}
                            discount={product.discount?.toString() ?? "0"}
                            stock={product.stock}
                            tiktokUrl={product.tiktokUrl}
                            facebookUrl={product.facebookUrl}
                            instagramUrl={product.instagramUrl}
                            showSocialVideoLinks={showSocialVideoLinks}
                            aspectRatio="1/1"
                            rating={i % 3 === 1 ? 5 : 4}
                            reviewCount={100 + i * 10 + 2}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-gray-600 text-sm mb-1 font-medium">
                        No products found
                        {activeCategory ? ` in "${activeCategory.name}"` : ""}
                        {searchQuery ? ` matching "${searchQuery}"` : ""}.
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                        Try choosing another category or clearing your search.
                    </p>
                    <div className="flex gap-2 justify-center">
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="text-xs bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-gray-300 transition cursor-pointer"
                            >
                                Clear Search
                            </button>
                        )}
                        {selectedCategoryId !== "all" && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryId("all")}
                                className="text-xs bg-black text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition cursor-pointer"
                            >
                                Show All Categories
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
