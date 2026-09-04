import Link from "next/link";
import Image from "next/image";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "./SocialIcons";

type Props = {
  name: string;
  slug: string;
  image: string;
  price: number | string;
  discount?: number | string;
  stock?: number;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  showSocialVideoLinks?: boolean;
  /** Static display rating 1-5, defaults to 4 */
  rating?: number;
  /** Review count shown in parentheses */
  reviewCount?: number;
};

/** Simple star display — purely visual, not interactive */
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={s <= rating ? "#FBBF24" : "none"}
          stroke={s <= rating ? "#FBBF24" : "#D1D5DB"}
          strokeWidth="1.5"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">({count})</span>
    </div>
  );
}

export default function ProductCard({
  name,
  slug,
  image,
  price,
  discount = 0,
  stock,
  tiktokUrl,
  facebookUrl,
  instagramUrl,
  showSocialVideoLinks = true,
  rating = 4,
  reviewCount = 102,
}: Props) {
  const hasVideoLinks = Boolean(tiktokUrl || facebookUrl || instagramUrl);
  const isOutOfStock = stock !== undefined && stock <= 0;

  return (
    <div className="group bg-white rounded overflow-hidden">
      {/* Image — 3:4 portrait ratio */}
      <Link
        href={`/products/${slug}`}
        className="block overflow-hidden bg-gray-100 relative"
        style={{ aspectRatio: "3/4" }}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? "opacity-75 grayscale-25" : ""}`}
        />
        {isOutOfStock && (
          <span className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs z-10">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="pt-2 pb-2">
        {/* Name */}
        <Link href={`/products/${slug}`} className="block">
          <p className="text-sm text-gray-800 line-clamp-2 hover:underline">
            {name}
          </p>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          {Number(discount) > 0 ? (
            <>
              <span className="text-sm font-bold text-gray-900">
                Rs. {(Number(price) - Number(discount)).toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 line-through">
                Rs. {Number(price).toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-900">
              Rs. {Number(price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Stars + Shop Now & Social Icons */}
        <div className="flex items-center justify-between mt-1.5 gap-1">
          <Stars rating={rating} count={reviewCount} />
          
          <div className="flex items-center gap-1.5 shrink-0">
            {showSocialVideoLinks && hasVideoLinks && (
              <div className="flex items-center gap-1">
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch on TikTok"
                    className="p-1 rounded-full text-gray-800 hover:text-black hover:bg-gray-100 transition"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch on Facebook"
                    className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition"
                  >
                    <FacebookIcon className="w-3.5 h-3.5" />
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch on Instagram"
                    className="p-1 rounded-full text-pink-600 hover:bg-pink-50 transition"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            <Link
              href={`/products/${slug}`}
              className={
                isOutOfStock
                  ? "bg-red-50 text-red-600 border border-red-200 text-xs px-2.5 py-1 rounded font-semibold hover:bg-red-100 transition-colors duration-200"
                  : "bg-gray-900 text-white text-xs px-3 py-1.5 rounded hover:bg-black transition-colors duration-200"
              }
            >
              {isOutOfStock ? "Out of Stock" : "Shop Now"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
