"use client";
import { useState, useTransition } from "react";
import { deleteProduct } from "../../actions/product";
import { TikTokIcon, FacebookIcon, InstagramIcon } from "@/app/components/SocialIcons";

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
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    sortOrder?: number;
  } | null;
};

type Props = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
};

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  const [pending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    startTransition(async () => {
      await deleteProduct(id);
      onDelete(id);
    });
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedProducts = products.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 w-12">S.N.</th>
              <th className="text-left px-4 py-3">Image</th>
              <th className="text-left px-4 py-3 min-w-[200px]">Name</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Video Links</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Stock</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p, idx) => {
              const serialNumber = (activePage - 1) * itemsPerPage + idx + 1;
              const hasVideo = p.tiktokUrl || p.facebookUrl || p.instagramUrl;

              return (
                <tr
                  key={p.id}
                  className="border-t border-gray-100 hover:bg-gray-50/50 transition"
                >
                  <td className="px-4 py-3 text-gray-500 font-medium">
                    {serialNumber}
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 leading-snug">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full border border-gray-200">
                        {p.category.name}
                      </span>
                    ) : (
                      <span className="inline-block text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        Uncategorized
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasVideo ? (
                      <div className="flex items-center gap-1.5">
                        {p.tiktokUrl && (
                          <a
                            href={p.tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Watch TikTok Video"
                            className="p-1 rounded-full text-black hover:bg-gray-200 transition"
                          >
                            <TikTokIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {p.facebookUrl && (
                          <a
                            href={p.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Watch Facebook Video"
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition"
                          >
                            <FacebookIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {p.instagramUrl && (
                          <a
                            href={p.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Watch Instagram Video"
                            className="p-1 rounded-full text-pink-600 hover:bg-pink-50 transition"
                          >
                            <InstagramIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>Rs. {Number(p.price).toLocaleString()}</div>
                    {Number(p.discount) > 0 && (
                      <div className="text-xs text-red-500 font-semibold mt-0.5">
                        - Rs. {Number(p.discount).toLocaleString()} off
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        p.status
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {p.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onEdit(p)}
                        className="text-gray-600 hover:text-black font-medium transition text-xs"
                      >
                        Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={pending}
                        className="text-red-500 hover:text-red-700 font-medium transition text-xs disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-400 py-10">No products yet.</p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={activePage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={activePage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-700">
                Showing{" "}
                <span className="font-semibold">
                  {(activePage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(activePage * itemsPerPage, products.length)}
                </span>{" "}
                of <span className="font-semibold">{products.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={activePage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-xs font-medium transition ${
                        page === activePage
                          ? "z-10 bg-black border-black text-white"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={activePage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
