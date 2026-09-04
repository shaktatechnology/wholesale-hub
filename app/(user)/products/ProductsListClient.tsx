"use client";
import { useState, useMemo } from "react";
import ProductCard from "../../components/ProductCard";

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string;
    price: any;
    discount: any;
    stock: number;
    description: string;
    tiktokUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
};

type Props = {
    initialProducts: Product[];
    showSocialVideoLinks?: boolean;
};

export default function ProductsListClient({ initialProducts, showSocialVideoLinks = true }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [stockFilter, setStockFilter] = useState("all"); // "all" | "instock"
    const [saleFilter, setSaleFilter] = useState("all"); // "all" | "sale"

    const filteredAndSortedProducts = useMemo(() => {
        return initialProducts
            .filter((product) => {
                const matchesSearch =
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

                const matchesStock =
                    stockFilter === "all" ||
                    (stockFilter === "instock" && product.stock > 0);

                const matchesSale =
                    saleFilter === "all" ||
                    (saleFilter === "sale" && Number(product.discount) > 0);

                return matchesSearch && matchesStock && matchesSale;
            })
            .sort((a, b) => {
                const priceA = Number(a.price) - Number(a.discount || 0);
                const priceB = Number(b.price) - Number(b.discount || 0);

                if (sortOption === "price-asc") {
                    return priceA - priceB;
                }
                if (sortOption === "price-desc") {
                    return priceB - priceA;
                }
                if (sortOption === "name-asc") {
                    return a.name.localeCompare(b.name);
                }
                // Default: newest first (assuming larger id means newer)
                return b.id - a.id;
            });
    }, [initialProducts, searchTerm, sortOption, stockFilter, saleFilter]);

    function resetFilters() {
        setSearchTerm("");
        setSortOption("newest");
        setStockFilter("all");
        setSaleFilter("all");
    }

    return (
        <div>
            {/* Filter controls bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Input */}
                <div className="flex-1 max-w-md relative">
                    <input
                        type="text"
                        placeholder="Search our collections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-full px-5 py-2 pl-11 pr-10 text-sm outline-none focus:border-black transition bg-white"
                    />
                    <svg
                        className="absolute left-4 top-2.5 h-4.5 w-4.5 text-gray-400"
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
                            className="absolute right-4 top-2 text-gray-400 hover:text-black text-xs font-semibold"
                        >
                            CLEAR
                        </button>
                    )}
                </div>

                {/* Dropdown controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Stock filter */}
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="border border-gray-300 rounded-full px-4 py-2 text-xs font-semibold outline-none bg-white focus:border-black cursor-pointer hover:border-gray-400 transition"
                    >
                        <option value="all">Availability: All</option>
                        <option value="instock">In Stock Only</option>
                    </select>

                    {/* Sale Filter */}
                    <select
                        value={saleFilter}
                        onChange={(e) => setSaleFilter(e.target.value)}
                        className="border border-gray-300 rounded-full px-4 py-2 text-xs font-semibold outline-none bg-white focus:border-black cursor-pointer hover:border-gray-400 transition"
                    >
                        <option value="all">Offer: All Items</option>
                        <option value="sale">On Sale / Discounted</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border border-gray-300 rounded-full px-4 py-2 text-xs font-semibold outline-none bg-white focus:border-black cursor-pointer hover:border-gray-400 transition"
                    >
                        <option value="newest">Sort: New In</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name: A to Z</option>
                    </select>
                </div>
            </div>

            {/* Results Header Info */}
            <div className="mb-6 flex justify-between items-center text-xs text-gray-500">
                <p>
                    Showing {filteredAndSortedProducts.length} of {initialProducts.length}{" "}
                    {initialProducts.length === 1 ? "product" : "products"}
                </p>
                {(searchTerm || stockFilter !== "all" || saleFilter !== "all") && (
                    <button
                        onClick={resetFilters}
                        className="text-black font-semibold hover:underline"
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            {/* Products Grid */}
            {filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAndSortedProducts.map((product, i) => (
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
                            reviewCount={100 + i * 12 + 3}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-400 text-sm mb-4">No products match your active search or filters.</p>
                    <button
                        onClick={resetFilters}
                        className="text-xs bg-black text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
}
