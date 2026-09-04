"use client";

import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string;
    price: any;
    discount?: any;
    stock: number;
    tiktokUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
};

type Props = {
    products: Product[];
    showSocialVideoLinks?: boolean;
};

export default function HomeCollections({ products, showSocialVideoLinks = true }: Props) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const q = searchQuery.toLowerCase().trim();
        return products.filter((p) => p.name.toLowerCase().includes(q));
    }, [products, searchQuery]);

    return (
        <section id="collections" className="max-w-6xl mx-auto px-4 py-14 w-full scroll-mt-20">
            {/* Header: Title on left, Search bar right next to it */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Our Collections
                </h2>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search products..."
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
                            rating={i % 3 === 1 ? 5 : 4}
                            reviewCount={100 + i * 10 + 2}
                        />
                    ))}
                </div>

            ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-gray-500 text-sm mb-3">
                        No products found matching &ldquo;<span className="font-semibold">{searchQuery}</span>&rdquo;.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-xs bg-black text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition cursor-pointer"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </section>
    );
}
