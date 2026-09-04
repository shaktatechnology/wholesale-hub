"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type ToastMessage = {
    id: string;
    type: "success" | "error" | "info";
    message: string;
};

type ToastContextType = {
    toast: (message: string, type?: "success" | "error" | "info") => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 bg-white ${
                            t.type === "success"
                                ? "border-emerald-200 text-emerald-950 shadow-emerald-900/10"
                                : t.type === "error"
                                ? "border-rose-200 text-rose-950 shadow-rose-900/10"
                                : "border-gray-200 text-gray-900"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {t.type === "success" && (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                            )}
                            {t.type === "error" && (
                                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            )}
                            <span>{t.message}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeToast(t.id)}
                            className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded transition"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            toast: (msg: string) => console.log("Toast:", msg),
        };
    }
    return context;
}
