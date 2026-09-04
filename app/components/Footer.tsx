import Link from "next/link";
import { getSettings } from "../actions/settings";
import { TikTokIcon, FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";

function WholesaleHubLogo({ siteName }: { siteName?: string | null }) {
    if (siteName && siteName !== "Wholesale Hub") {
        return <span className="font-bold text-sm">{siteName}</span>;
    }
    return (
        <div className="flex flex-col items-start leading-none select-none">
            <span
                className="text-gray-800 font-semibold"
                style={{ fontSize: "9px", letterSpacing: "0.18em" }}
            >
                WHOLESALE
            </span>
            <div
                className="flex items-center gap-1 bg-gray-900 text-white px-1.5 py-0.5 mt-0.5"
                style={{ fontSize: "10px" }}
            >
                <svg width="11" height="10" viewBox="0 0 11 10" fill="currentColor">
                    <rect x="0" y="5" width="4" height="5" />
                    <rect x="7" y="5" width="4" height="5" />
                    <polygon points="5.5,0 0,5 11,5" />
                    <rect x="4" y="7" width="3" height="3" fill="#fff" opacity="0.3" />
                </svg>
                <span className="font-bold tracking-widest">HUB</span>
            </div>
        </div>
    );
}

export default async function Footer() {
    const settings = await getSettings();

    let whatsappLink = "";
    if (settings?.whatsapp) {
        let cleanNumber = settings.whatsapp.replace(/\D/g, "");
        cleanNumber = cleanNumber.replace(/^0+/, "");
        if (cleanNumber.length === 10 && cleanNumber.startsWith("9")) {
            cleanNumber = "977" + cleanNumber;
        }
        whatsappLink = `https://wa.me/${cleanNumber}`;
    }

    return (
        <>
            <footer className="border-t border-gray-200 bg-white mt-auto">
                <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="block">
                        {settings?.logo ? (
                            <img
                                src={settings.logo}
                                alt={settings.siteName}
                                className="h-9 object-contain"
                            />
                        ) : (
                            <WholesaleHubLogo siteName={settings?.siteName} />
                        )}
                    </Link>

                    {/* Social Icons */}
                    <div className="flex gap-2">
                        {/* WhatsApp */}
                        {whatsappLink && (
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition"
                                aria-label="WhatsApp"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                            </a>
                        )}

                        {/* Facebook */}
                        {settings?.facebook && (
                            <a
                                href={settings.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition"
                                aria-label="Facebook"
                            >
                                <FacebookIcon className="w-4 h-4" />
                            </a>
                        )}

                        {/* Instagram */}
                        {settings?.instagram && (
                            <a
                                href={settings.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-pink-600 hover:border-pink-500 hover:bg-pink-50 transition"
                                aria-label="Instagram"
                            >
                                <InstagramIcon className="w-4 h-4" />
                            </a>
                        )}

                        {/* TikTok */}
                        {settings?.tiktok && (
                            <a
                                href={settings.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-black hover:border-black hover:bg-gray-50 transition"
                                aria-label="TikTok"
                            >
                                <TikTokIcon className="w-4 h-4" />
                            </a>
                        )}
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            {whatsappLink && (
                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:bg-[#128C7E] transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                    aria-label="Chat on WhatsApp"
                >
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs py-1 px-2.5 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        Chat with us
                    </span>
                    <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping -z-10 group-hover:animate-none"></span>
                    <svg className="w-6.5 h-6.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.747 1.451 5.436.002 9.861-4.422 9.864-9.862.002-2.637-1.023-5.115-2.887-6.979-1.864-1.865-4.343-2.89-6.984-2.89-5.441 0-9.866 4.424-9.869 9.864-.001 1.568.452 3.1 1.311 4.545l-.975 3.562 3.659-.96c1.468.802 2.8.204 4.092.81zM17.487 14.41c-.299-.15-1.771-.875-2.04-.972-.269-.099-.463-.148-.658.15-.195.297-.753.949-.922 1.147-.169.197-.338.221-.637.072-1.077-.54-2.22-1.07-3.155-1.879-.884-.765-1.563-1.688-1.854-2.185-.292-.498-.031-.767.218-1.014.224-.223.493-.578.74-.867.247-.289.329-.49.493-.818.164-.329.082-.618-.041-.867-.123-.247-.658-1.637-.922-2.27-.258-.606-.52-.524-.716-.534-.185-.01-.397-.01-.61-.01-.213 0-.56.08-.853.401-.293.321-1.12 1.096-1.12 2.67 0 1.575 1.147 3.094 1.306 3.308.16.213 2.257 3.447 5.467 4.834.763.33 1.358.527 1.821.674.767.244 1.467.21 2.02.128.618-.092 1.77-.723 2.02-1.417.25-.694.25-1.288.175-1.416-.075-.128-.27-.203-.57-.353z" />
                    </svg>
                </a>
            )}
        </>
    );
}
