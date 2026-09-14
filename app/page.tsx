import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeCollections from "./components/HomeCollections";
import { getProducts } from "./actions/product";
import { getHomepageSettings, getSettings } from "./actions/settings";
import { getCategories } from "./actions/category";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Wholesale Hub — Premium Wholesale Products",
    description: "Discover high-quality wholesale sarees and clothing at competitive prices. Supply retailers, boutiques and distributors.",
};

export default async function HomePage() {
    const [products, hero, settings, categories] = await Promise.all([
        getProducts(),
        getHomepageSettings(),
        getSettings(),
        getCategories(),
    ]);

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Navbar />

            {/* ── Hero Section ─────────────────────────────────────── */}
            <section
                className="relative text-white flex items-center justify-center text-center bg-gray-800 bg-cover bg-center min-h-[35dvh] sm:min-h-[calc(100dvh-3.5rem)] touch-pan-y overscroll-x-none"
                style={{
                    backgroundImage: hero?.image ? `url(${hero.image})` : undefined,
                }}
            >
                {/* Premium Dark Overlay Scrim with slight blur to pop the text */}
                <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />

                <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:px-6 sm:py-24 flex flex-col items-center">
                    <h1 className="text-xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-2 sm:mb-6 drop-shadow-md whitespace-pre-line">
                        {hero?.title ?? "Premium Wholesale Products\nfor Retailers & Businesses"}
                    </h1>
                    <p className="text-xs sm:text-lg md:text-xl text-white/90 mb-4 sm:mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-sm font-light line-clamp-2 sm:line-clamp-none">
                        {hero?.subtitle ??
                            "Discover a wide collection of high-quality sarees at competitive wholesale prices. From traditional elegance to modern trends, we supply retailers, boutiques, and distributors with designs customers love."}
                    </p>
                    <div className="flex gap-2.5 sm:gap-4 justify-center flex-wrap">
                        <a
                            href="#collections"
                            className="bg-white text-gray-950 text-xs sm:text-base font-semibold px-4 py-2 sm:px-7 sm:py-3 rounded-full hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md whitespace-nowrap cursor-pointer"
                        >
                            {hero?.buttonText ?? "Explore Collection"}
                        </a>
                        <a
                            href="/wholesale-partner"
                            className="border border-white/80 text-white text-xs sm:text-base font-semibold px-4 py-2 sm:px-7 sm:py-3 rounded-full hover:bg-white hover:text-gray-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 backdrop-blur-xs whitespace-nowrap cursor-pointer"
                        >
                            Become a Wholesale Partner
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Our Collections ──────────────────────────────────── */}
            <HomeCollections
                products={products}
                categories={categories}
                showSocialVideoLinks={settings?.showSocialVideoLinks ?? true}
            />

            {/* ── Features ─────────────────────────────────────────── */}
            <section className="bg-gray-50 py-14 mt-auto">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        {
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            ),
                            title: "Quality Assurance",
                            desc: "Selected fabrics and finishing standards.",
                        },
                        {
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                            ),
                            title: "Bulk Order Support",
                            desc: "Flexible ordering options for growing businesses.",
                        },
                        {
                            icon: (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                </svg>
                            ),
                            title: "Reliable Delivery",
                            desc: "Fast and dependable order processing.",
                        },
                    ].map((f) => (
                        <div
                            key={f.title}
                            className="border border-gray-200 rounded-lg p-6 text-center bg-white"
                        >
                            <div className="mb-3">{f.icon}</div>
                            <h3 className="font-semibold text-sm text-gray-900 mb-1">{f.title}</h3>
                            <p className="text-xs text-gray-500">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            
            <section className="bg-gray-950 text-white py-20 relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(156,163,175,0.08),transparent)] pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-gray-800/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Ready to Stock Your Store?
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                        Partner with us for quality wholesale sarees and effortless ordering
                    </p>
                    <Link
                        href="/#collections"
                        className="group inline-flex items-center justify-center bg-white text-gray-900 text-sm font-medium px-8 py-3 rounded-full hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg gap-2"
                    >
                        <span>Place Wholesale Order</span>
                        <svg
                            className="w-4 h-4 text-gray-900 group-hover:translate-x-1 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
