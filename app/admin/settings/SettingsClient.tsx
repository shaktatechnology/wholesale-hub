"use client";
import { useState, useRef } from "react";
import { saveSettings, saveHomepageSettings } from "../../actions/settings";
import { compressImage } from "@/app/lib/compressImage";
import { TikTokIcon, FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/app/components/SocialIcons";

type Setting = {
    id: number;
    siteName: string;
    email: string;
    phone: string;
    address: string;
    shippingCharge: unknown;
    advancePayment?: unknown;
    logo?: string | null;
    favicon?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    showSocialVideoLinks?: boolean;
    enableLowStockAlert?: boolean;
    lowStockThreshold?: number;
    allowOutOfStockOrders?: boolean;
    qrImage?: string | null;
    whatsapp?: string | null;
} | null;

type HomepageSetting = {
    id: number;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    image: string;
} | null;

/* ─── Reusable mini image-upload picker ─────────────────────────────── */
type ImagePickerProps = {
    label: string;
    /** Current value (an existing URL or empty string) */
    currentUrl: string;
    /** Called with the new public URL after a successful upload */
    onUploaded: (url: string) => void;
    /** Called when the user removes the current image */
    onCleared?: () => void;
    /** Hint shown below the label */
    hint?: string;
    /** Max width for the preview thumbnail */
    previewClass?: string;
};

function ImagePicker({ label, currentUrl, onUploaded, onCleared, hint, previewClass = "h-16 w-16" }: ImagePickerProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const ref = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setError("");
        if (!file.type.startsWith("image/")) { setError("Images only."); return; }
        if (file.size > 20 * 1024 * 1024) { setError("Max 20 MB."); return; }

        setUploading(true);
        try {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append("file", compressed);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            setUploading(false);

            if (!res.ok || !data.url) { setError(data.error ?? "Upload failed."); return; }
            onUploaded(data.url);
        } catch (err) {
            setUploading(false);
            setError("Failed to compress image before upload.");
        }
    }

    return (
        <div>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            {hint && <p className="text-[11px] text-gray-400 mb-1">{hint}</p>}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Thumbnail preview */}
                {currentUrl ? (
                    <img
                        src={currentUrl}
                        alt={label}
                        className={`${previewClass} object-cover rounded border border-gray-200 shrink-0`}
                    />
                ) : (
                    <div className={`${previewClass} rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0`}>
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3M12 9.75h.008v.008H12V9.75z" />
                        </svg>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Upload + Remove buttons row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Upload button */}
                        <button
                            type="button"
                            onClick={() => ref.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                        >
                            {uploading ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    {currentUrl ? "Change image" : "Upload image"}
                                </>
                            )}
                        </button>

                        {/* Remove button — only shown when image is set */}
                        {currentUrl && onCleared && (
                            <button
                                type="button"
                                onClick={onCleared}
                                className="inline-flex items-center gap-1 border border-red-200 rounded px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 hover:border-red-300 transition"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Remove
                            </button>
                        )}
                    </div>

                    {/* Current path pill */}
                    {currentUrl && (
                        <p className="text-[11px] text-gray-400 mt-1 truncate">{currentUrl}</p>
                    )}

                    {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
                </div>
            </div>

            {/* Hidden real input */}
            <input
                ref={ref}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
        </div>
    );
}

/* ─── Main settings form ────────────────────────────────────────────── */
import { useToast } from "@/app/components/Toast";

export default function SettingsClient({
    settings,
    homepage,
}: {
    settings: Setting;
    homepage: HomepageSetting;
}) {
    const { toast } = useToast();
    const [siteForm, setSiteForm] = useState({
        siteName: settings?.siteName ?? "",
        email: settings?.email ?? "",
        phone: settings?.phone ?? "",
        address: settings?.address ?? "",
        shippingCharge: String(settings?.shippingCharge ?? "0"),
        advancePayment: String(settings?.advancePayment ?? "300"),
        logo: settings?.logo ?? "",
        favicon: settings?.favicon ?? "",
        facebook: settings?.facebook ?? "",
        instagram: settings?.instagram ?? "",
        tiktok: settings?.tiktok ?? "",
        showSocialVideoLinks: settings?.showSocialVideoLinks ?? true,
        enableLowStockAlert: settings?.enableLowStockAlert ?? true,
        lowStockThreshold: String(settings?.lowStockThreshold ?? "5"),
        allowOutOfStockOrders: settings?.allowOutOfStockOrders ?? false,
        qrImage: settings?.qrImage ?? "",
        whatsapp: settings?.whatsapp ?? "",
    });

    const [heroForm, setHeroForm] = useState({
        title: homepage?.title ?? "",
        subtitle: homepage?.subtitle ?? "",
        buttonText: homepage?.buttonText ?? "",
        buttonLink: homepage?.buttonLink ?? "",
        image: homepage?.image ?? "",
    });

    const [siteLoading, setSiteLoading] = useState(false);
    const [heroLoading, setHeroLoading] = useState(false);

    async function handleToggleChange(
        key: "showSocialVideoLinks" | "enableLowStockAlert" | "allowOutOfStockOrders",
        newValue: boolean,
        label: string
    ) {
        const updatedForm = { ...siteForm, [key]: newValue };
        setSiteForm(updatedForm);

        try {
            await saveSettings({
                ...updatedForm,
                shippingCharge: parseFloat(updatedForm.shippingCharge) || 0,
                advancePayment: parseFloat(updatedForm.advancePayment) || 0,
                lowStockThreshold: parseInt(updatedForm.lowStockThreshold, 10) || 5,
            });
            toast(`${label} preference saved!`, "success");
        } catch (err) {
            console.error("Failed to save toggle preference:", err);
            setSiteForm((p) => ({ ...p, [key]: !newValue }));
            toast("Failed to save preference.", "error");
        }
    }

    async function handleSiteSave(e: React.FormEvent) {
        e.preventDefault();
        setSiteLoading(true);
        await saveSettings({
            ...siteForm,
            shippingCharge: parseFloat(siteForm.shippingCharge) || 0,
            advancePayment: parseFloat(siteForm.advancePayment) || 0,
            lowStockThreshold: parseInt(siteForm.lowStockThreshold, 10) || 5,
        });
        setSiteLoading(false);
        toast("Site settings saved successfully!", "success");
    }

    async function handleHeroSave(e: React.FormEvent) {
        e.preventDefault();
        setHeroLoading(true);
        await saveHomepageSettings(heroForm);
        setHeroLoading(false);
        toast("Homepage settings saved successfully!", "success");
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── Site Settings ───────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Site Settings</h2>

                <form onSubmit={handleSiteSave} className="space-y-4">

                    {/* Social Media Video Display Toggle */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 block">Show Social Video Icons on Product Cards</label>
                            <p className="text-xs text-gray-500">Display TikTok, Facebook & Instagram video icons next to "Shop Now" on product grid cards.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                handleToggleChange(
                                    "showSocialVideoLinks",
                                    !siteForm.showSocialVideoLinks,
                                    "Social video icons"
                                )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                siteForm.showSocialVideoLinks ? "bg-black" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    siteForm.showSocialVideoLinks ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Low Stock Warning Alert Settings */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-semibold text-gray-900 block">Enable Low Stock Warning Alert</label>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Normal "In Stock" badge is hidden. Show a warning badge when stock drops to or below threshold.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    handleToggleChange(
                                        "enableLowStockAlert",
                                        !siteForm.enableLowStockAlert,
                                        "Low stock warning"
                                    )
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    siteForm.enableLowStockAlert ? "bg-amber-600" : "bg-gray-300"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        siteForm.enableLowStockAlert ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        {siteForm.enableLowStockAlert && (
                            <div className="pt-2 border-t border-amber-200/60">
                                <label className="text-xs text-gray-700 font-semibold block mb-1">
                                    Show "Low Stock" Warning when Quantity is at or below:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={siteForm.lowStockThreshold}
                                        onChange={(e) => setSiteForm((p) => ({ ...p, lowStockThreshold: e.target.value }))}
                                        onBlur={async () => {
                                            const threshold = parseInt(siteForm.lowStockThreshold, 10) || 5;
                                            await saveSettings({
                                                ...siteForm,
                                                shippingCharge: parseFloat(siteForm.shippingCharge) || 0,
                                                advancePayment: parseFloat(siteForm.advancePayment) || 0,
                                                lowStockThreshold: threshold,
                                            });
                                            toast("Low stock threshold updated!", "success");
                                        }}
                                        className="w-24 border border-gray-300 rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-black"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">units left</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Allow Out of Stock Orders Toggle */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 block">Allow Ordering Out of Stock Products</label>
                            <p className="text-xs text-gray-500">If enabled, customers can still place orders even when product stock reaches 0.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                handleToggleChange(
                                    "allowOutOfStockOrders",
                                    !siteForm.allowOutOfStockOrders,
                                    "Out of stock ordering"
                                )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                siteForm.allowOutOfStockOrders ? "bg-black" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    siteForm.allowOutOfStockOrders ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Text fields */}
                    {[
                        { label: "Site Name", key: "siteName", max: 100 },
                        { label: "Shipping Charge (Rs.)", key: "shippingCharge", type: "number" },
                        { label: "Advance Payment Per Piece (Rs.)", key: "advancePayment", type: "number", hint: "default advance payment required per piece" },
                        { label: "WhatsApp Number", key: "whatsapp", max: 20, hint: "with country code, e.g. 97798xxxxxxxx", icon: <WhatsAppIcon className="w-4 h-4 text-emerald-600" /> },
                        { label: "Facebook URL", key: "facebook", max: 255, icon: <FacebookIcon className="w-4 h-4 text-blue-600" /> },
                        { label: "Instagram URL", key: "instagram", max: 255, icon: <InstagramIcon className="w-4 h-4 text-pink-600" /> },
                        { label: "TikTok URL", key: "tiktok", max: 255, icon: <TikTokIcon className="w-4 h-4 text-black" /> },
                    ].map((f) => {
                        const val = String(siteForm[f.key as keyof typeof siteForm] || "");
                        return (
                            <div key={f.key}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        {f.icon}
                                        <label className="text-xs text-gray-500 block font-medium">{f.label}</label>
                                        {'hint' in f && (
                                            <span className="text-[10px] text-gray-400 italic">
                                                ({f.hint})
                                            </span>
                                        )}
                                    </div>
                                    {f.max && (
                                        <span className="text-[10px] text-gray-400">
                                            {val.length} / {f.max}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type={f.type || "text"}
                                    maxLength={f.max}
                                    value={val}
                                    onChange={(e) =>
                                        setSiteForm((p) => ({ ...p, [f.key]: e.target.value }))
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                                />
                            </div>
                        );
                    })}

                    {/* Logo upload */}
                    <ImagePicker
                        label="Logo"
                        hint="Displayed in the navbar and footer"
                        currentUrl={siteForm.logo}
                        onUploaded={(url) => setSiteForm((p) => ({ ...p, logo: url }))}
                        onCleared={() => setSiteForm((p) => ({ ...p, logo: "" }))}
                        previewClass="h-12 w-24 object-contain"
                    />

                    {/* Favicon upload */}
                    <ImagePicker
                        label="Favicon"
                        hint="Square icon shown in browser tabs (PNG/ICO, 32×32 recommended)"
                        currentUrl={siteForm.favicon}
                        onUploaded={(url) => setSiteForm((p) => ({ ...p, favicon: url }))}
                        onCleared={() => setSiteForm((p) => ({ ...p, favicon: "" }))}
                        previewClass="h-10 w-10"
                    />

                    {/* QR Image upload */}
                    <ImagePicker
                        label="QR Payment Image"
                        hint="Scan-to-pay QR code shown to customers at checkout. Leave empty to hide QR payment option."
                        currentUrl={siteForm.qrImage}
                        onUploaded={(url) => setSiteForm((p) => ({ ...p, qrImage: url }))}
                        onCleared={() => setSiteForm((p) => ({ ...p, qrImage: "" }))}
                        previewClass="h-32 w-32"
                    />

                    <button
                        type="submit"
                        disabled={siteLoading}
                        className="bg-black text-white px-5 py-2 rounded text-sm hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {siteLoading ? "Saving…" : "Save Site Settings"}
                    </button>
                </form>
            </div>

            {/* ── Homepage Hero Settings ───────────────────── */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Homepage Hero Settings</h2>

                <form onSubmit={handleHeroSave} className="space-y-4">

                    {/* Text fields */}
                    {[
                        { label: "Hero Title", key: "title", max: 100 },
                        { label: "Subtitle", key: "subtitle", max: 300 },
                        { label: "Button Text", key: "buttonText", max: 30 }
                    ].map((f) => {
                        const val = String(heroForm[f.key as keyof typeof heroForm] || "");
                        return (
                            <div key={f.key}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-gray-500 block">{f.label}</label>
                                    {f.max && (
                                        <span className="text-[10px] text-gray-400">
                                            {val.length} / {f.max}
                                        </span>
                                    )}
                                </div>
                                <input
                                    maxLength={f.max}
                                    value={val}
                                    onChange={(e) =>
                                        setHeroForm((p) => ({ ...p, [f.key]: e.target.value }))
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-black"
                                />
                            </div>
                        );
                    })}

                    {/* Background image upload */}
                    <ImagePicker
                        label="Background Image"
                        hint="Full-width hero banner image"
                        currentUrl={heroForm.image}
                        onUploaded={(url) => setHeroForm((p) => ({ ...p, image: url }))}
                        previewClass="h-20 w-36 object-cover"
                    />

                    <button
                        type="submit"
                        disabled={heroLoading}
                        className="bg-black text-white px-5 py-2 rounded text-sm hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {heroLoading ? "Saving…" : "Save Homepage Settings"}
                    </button>
                </form>
            </div>
        </div>
    );
}
