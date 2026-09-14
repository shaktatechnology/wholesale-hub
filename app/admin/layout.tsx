"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "../actions/auth";
import AdminSessionManager from "@/app/components/AdminSessionManager";
import { ToastProvider } from "@/app/components/Toast";

const navLinks = [
    { label: "Dashboard", href: "/admin" },
    { label: "Products", href: "/admin/product" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Colors", href: "/admin/colors" },
    { label: "Sizes", href: "/admin/sizes" },
    { label: "Contact", href: "/admin/contacts" },
    { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            if (pathname === "/admin") {
                const lastTab = localStorage.getItem("admin_last_tab");
                if (lastTab && lastTab !== "/admin") {
                    router.push(lastTab);
                    return;
                }
            }
        }

        if (pathname.startsWith("/admin")) {
            localStorage.setItem("admin_last_tab", pathname);
        }
    }, [pathname, router]);

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <AdminSessionManager />
            {/* Mobile Header */}
            <header className="md:hidden bg-black text-white h-14 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-1 hover:bg-white/10 rounded transition"
                        aria-label="Open Sidebar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-sm tracking-wide">Admin Panel</span>
                </div>
                
                {/* Quick logout for mobile */}
                <form action={logoutUser}>
                    <button
                        type="submit"
                        className="text-xs text-white/70 hover:text-white font-medium px-2.5 py-1.5 rounded hover:bg-white/10 transition"
                    >
                        Logout
                    </button>
                </form>
            </header>

            {/* Sidebar Scrim (Overlay) for Mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
                />
            )}

            {/* Sidebar (Desktop & Mobile Drawer) */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-black text-white flex flex-col z-50 transform md:transform-none transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:w-56 md:shadow-md ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <span className="font-bold text-sm tracking-wide">Admin Panel</span>
                    {/* Close button for Mobile */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1 hover:bg-white/10 rounded transition text-white"
                        aria-label="Close Sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`text-sm px-4 py-2.5 rounded-lg transition-all duration-150 font-medium ${
                                    isActive
                                        ? "bg-white text-black font-semibold shadow-sm"
                                        : "text-white/85 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <form action={logoutUser} className="p-4 border-t border-white/10">
                    <button
                        type="submit"
                        className="w-full text-sm px-4 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition text-left flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </form>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden min-w-0">
                {children}
            </main>
        </div>
        </ToastProvider>
    );
}
