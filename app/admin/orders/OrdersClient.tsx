"use client";
import { useState, useEffect, useTransition, useRef } from "react";
import OrderStatusSelect from "./OrderStatusSelect";
import { deleteOrder } from "../../actions/order";
import { useToast } from "@/app/components/Toast";

type OrderItem = {
  id: number;
  productId: number;
  colorId: number | null;
  sizeId: number | null;
  quantity: number;
  price: unknown;
  total: unknown;
  product: {
    id: number;
    name: string;
    image: string;
  };
  color: {
    id: number;
    name: string;
    hexCode: string;
  } | null;
  size: {
    id: number;
    name: string;
  } | null;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  subtotal: unknown;
  shippingCharge: unknown;
  total: unknown;
  paymentMethod: string;
  status: string;
  advancePaid: unknown;
  paymentProof: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number | null;
  orderItems: OrderItem[];
};

type Props = {
  orders: Order[];
};

export default function OrdersClient({ orders }: Props) {
  const { toast } = useToast();
  const [ordersList, setOrdersList] = useState(orders);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copiedPhone, setCopiedPhone] = useState<number | null>(null);

  // Zoom and pan states for payment proof modal
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMoved, setDragMoved] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isZoomed = scale > 1;

  function closeProofModal() {
    setActiveProofUrl(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setDragMoved(false);
  }

  // Set up mouse wheel listener on viewport element to handle zooming
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (!activeProofUrl) return;
      e.preventDefault();
      const zoomIntensity = 0.15;
      const delta = e.deltaY < 0 ? 1 : -1;
      setScale((prevScale) => {
        const nextScale = Math.min(Math.max(prevScale + delta * zoomIntensity, 1), 5);
        if (nextScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return nextScale;
      });
    };

    viewport.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheelEvent);
    };
  }, [activeProofUrl]);

  // Drag and pan handler functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
      setDragMoved(true);
    }
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
      setDragMoved(true);
    }
    setPosition({ x: newX, y: newY });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragMoved) return;
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
      setPosition({ x: 0, y: 0 });
    }
  };
  const itemsPerPage = 10;

  // Keep ordersList in sync with incoming orders prop
  useEffect(() => {
    setOrdersList(orders);
  }, [orders]);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Format phone: insert dash after +977 country code only
  function formatPhone(phone: string) {
    if (phone.startsWith("+977")) return "+977-" + phone.slice(4);
    return phone;
  }

  // Copy phone to clipboard and show brief feedback
  function copyPhone(orderId: number, phone: string) {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhone(orderId);
      toast("Phone number copied to clipboard!", "info");
      setTimeout(() => setCopiedPhone(null), 2000);
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this order?")) return;
    startTransition(async () => {
      try {
        await deleteOrder(id);
        setOrdersList((prev) => prev.filter((o) => o.id !== id));
        toast("Order deleted successfully!", "info");
      } catch (error) {
        console.error("Failed to delete order:", error);
        toast("Failed to delete order. Please try again.", "error");
      }
    });
  }

  // Derived Filtered and Sorted Orders List
  const filteredOrders = ordersList
    .filter((o) => {
      const term = searchTerm.toLowerCase();
      const orderNumMatch = o.orderNumber.toLowerCase().includes(term);
      const customerMatch = o.customerName.toLowerCase().includes(term);
      const phoneMatch = o.phone.toLowerCase().includes(term);
      const addressMatch = o.address.toLowerCase().includes(term);
      const itemsMatch =
        o.orderItems?.some((item) =>
          item.product?.name?.toLowerCase().includes(term),
        ) ?? false;

      const matchesSearch =
        orderNumMatch ||
        customerMatch ||
        phoneMatch ||
        addressMatch ||
        itemsMatch;

      const matchesStatus =
        statusFilter === "all" ||
        o.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "total-desc":
          return Number(b.total) - Number(a.total);
        case "total-asc":
          return Number(a.total) - Number(b.total);
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedOrders = filteredOrders.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Control Panel */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search by order #, customer, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-black transition duration-150"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
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
              className="absolute right-3 top-2 text-gray-400 hover:text-black text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter and Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none bg-white focus:border-black cursor-pointer"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none bg-white focus:border-black cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="total-desc">Total: High to Low</option>
              <option value="total-asc">Total: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results metadata label */}
      <div className="text-xs text-gray-500">
        Found {filteredOrders.length}{" "}
        {filteredOrders.length === 1 ? "order" : "orders"}
        {(searchTerm || statusFilter !== "all") && " matching active filters"}
      </div>

      {/* ── Mobile Card List (visible on small screens) ──────────────── */}
      <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {paginatedOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No orders found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {paginatedOrders.map((o, idx) => {
              const serialNumber = (activePage - 1) * itemsPerPage + idx + 1;
              const totalQty =
                o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ||
                0;
              return (
                <li key={o.id} className="p-4 flex flex-col gap-2.5">
                  {/* Top row: serial + order number + date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">
                        #{serialNumber}
                      </span>
                      <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {o.orderNumber}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Customer info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {o.customerName}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyPhone(o.id, o.phone)}
                        className="flex items-center gap-1 text-xs text-blue-600 active:text-blue-800 transition select-none"
                      >
                        {formatPhone(o.phone)}
                        {copiedPhone === o.id ? (
                          <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full ml-1">
                            Copied!
                          </span>
                        ) : (
                          <svg
                            className="w-3 h-3 text-gray-400 ml-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {/* Payment badge */}
                    {o.paymentMethod === "QR Payment" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                        QR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        COD
                      </span>
                    )}
                  </div>

                  {/* Product + qty + total */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate max-w-[55%]">
                      {o.orderItems?.[0]?.product?.name || "—"}{" "}
                      <span className="text-gray-400 text-xs">×{totalQty}</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      Rs. {Number(o.total).toLocaleString()}
                    </span>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <OrderStatusSelect id={o.id} currentStatus={o.status} />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-gray-600 hover:text-black font-semibold transition text-xs cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        disabled={pending}
                        className="text-red-600 hover:text-red-800 font-semibold transition text-xs cursor-pointer disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={activePage === 1}
            className="text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">
            Page{" "}
            <span className="font-semibold text-gray-900">{activePage}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={activePage === totalPages}
            className="text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Desktop Table (hidden on small screens) ───────────────────── */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-650">
              <tr>
                <th className="text-left px-4 py-3">S.N.</th>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Color</th>
                <th className="text-left px-4 py-3">Size</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Advance</th>
                <th className="text-left px-4 py-3">Proof</th>
                {/* <th className="text-left px-4 py-3">Payment</th> */}
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((o, idx) => {
                const serialNumber = (activePage - 1) * itemsPerPage + idx + 1;
                const totalQty =
                  o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ||
                  0;
                return (
                  <tr
                    key={o.id}
                    className="border-t border-gray-100 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {serialNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {o.customerName}
                      </div>
                      <div className="text-xs text-gray-505 mt-0.5">
                        {formatPhone(o.phone)}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate">
                      {o.orderItems?.[0]?.product?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {o.orderItems?.[0]?.color ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{
                              backgroundColor: o.orderItems[0].color.hexCode,
                            }}
                          />
                          <span className="text-xs text-gray-600">
                            {o.orderItems[0].color.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.orderItems?.[0]?.size ? (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium uppercase tracking-wider">
                          {o.orderItems[0].size.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{totalQty}</td>
                    <td className="px-4 py-3">
                      Rs. {Number(o.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {o.advancePaid
                        ? `Rs. ${Number(o.advancePaid).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {o.paymentProof ? (
                        <button
                          onClick={() =>
                            setActiveProofUrl(o.paymentProof as string)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                        >
                          View Proof
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    {/* <td className="px-4 py-3">
                    {o.paymentMethod === "QR Payment" ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                                    QR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    COD
                                                </span>
                                            )}
                                        </td> */}
                                            
                    <td className="px-4 py-3">
                      <OrderStatusSelect id={o.id} currentStatus={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-gray-600 hover:text-black font-semibold transition text-xs cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          disabled={pending}
                          className="text-red-600 hover:text-red-800 font-semibold transition text-xs cursor-pointer disabled:opacity-50"
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

        {filteredOrders.length === 0 && (
          <p className="text-center text-gray-400 py-10">No orders found.</p>
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
                    {Math.min(activePage * itemsPerPage, filteredOrders.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">{filteredOrders.length}</span>{" "}
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

      {/* View Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div
            className={`relative w-full transition-all duration-300 ${selectedOrder.paymentProof ? "max-w-4xl" : "max-w-sm"} rounded-[28px] p-[3px] bg-gradient-to-br from-emerald-400 via-emerald-200 to-white shadow-2xl`}
          >
            <div className="bg-white rounded-[25px] max-h-[90vh] overflow-y-auto relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur rounded-full p-1 transition"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Timestamp badge */}
              <span className="absolute bottom-3 right-4 text-[11px] text-gray-400">
                {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              <div className="p-6">
                <div
                  className={`grid gap-6 ${selectedOrder.paymentProof ? "grid-cols-1 md:grid-cols-5" : "grid-cols-1"}`}
                >
                  {/* Left Column: Order Details */}
                  <div
                    className={
                      selectedOrder.paymentProof ? "md:col-span-2" : ""
                    }
                  >
                    {/* Product Image */}
                    <div className="flex justify-center mb-4">
                      <img
                        src={selectedOrder.orderItems?.[0]?.product?.image}
                        alt={selectedOrder.orderItems?.[0]?.product?.name}
                        className="w-40 h-52 object-cover rounded-xl shadow-md"
                      />
                    </div>

                    {/* Heading */}
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      🛒 New Order Received!
                    </h2>

                    {/* Product / Total / Qty / Payment rows */}
                    <div className="space-y-1.5 text-sm mb-4">
                      <p className="flex items-center gap-2">
                        <span>📦</span>
                        <span className="font-semibold text-gray-900">
                          Product:
                        </span>
                        <span className="text-gray-700">
                          {selectedOrder.orderItems?.[0]?.product?.name}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>💰</span>
                        <span className="font-semibold text-gray-900">
                          Total:
                        </span>
                        <span className="text-gray-700">
                          NPR {Number(selectedOrder.total).toLocaleString()}/-
                        </span>
                      </p>
                      {Number(selectedOrder.advancePaid) > 0 && (
                        <>
                          <p className="flex items-center gap-2">
                            <span>💵</span>
                            <span className="font-semibold text-gray-900">
                              Advance Paid:
                            </span>
                            <span className="text-emerald-700 font-bold">
                              NPR{" "}
                              {Number(
                                selectedOrder.advancePaid,
                              ).toLocaleString()}
                              /-
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span>🚚</span>
                            <span className="font-semibold text-gray-900">
                              Remaining COD:
                            </span>
                            <span className="text-rose-600 font-semibold">
                              NPR{" "}
                              {Math.max(
                                0,
                                Number(selectedOrder.total) -
                                  Number(selectedOrder.advancePaid),
                              ).toLocaleString()}
                              /-
                            </span>
                          </p>
                        </>
                      )}
                      <p className="flex items-center gap-2">
                        <span>📊</span>
                        <span className="font-semibold text-gray-900">
                          Quantity:
                        </span>
                        <span className="text-gray-700">
                          {selectedOrder.orderItems?.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          )}
                        </span>
                      </p>
                      {selectedOrder.orderItems?.[0]?.color && (
                        <p className="flex items-center gap-2">
                          <span>🎨</span>
                          <span className="font-semibold text-gray-900">
                            Color:
                          </span>
                          <span className="text-gray-700">
                            {selectedOrder.orderItems[0].color.name}
                          </span>
                        </p>
                      )}
                      {selectedOrder.orderItems?.[0]?.size && (
                        <p className="flex items-center gap-2">
                          <span>📏</span>
                          <span className="font-semibold text-gray-900">
                            Size:
                          </span>
                          <span className="text-gray-700 uppercase">
                            {selectedOrder.orderItems[0].size.name}
                          </span>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <span>💳</span>
                        <span className="font-semibold text-gray-900">
                          Payment:
                        </span>
                        {selectedOrder.paymentMethod === "QR Payment" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                            QR Payment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            Cash on Delivery
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Customer Details */}
                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 text-sm">
                        👤 Customer Details:
                      </h3>
                      <ul className="text-sm text-gray-700 space-y-1 pl-1">
                        <li>
                          • <span className="font-medium">Name:</span>{" "}
                          {selectedOrder.customerName}
                        </li>
                        <li>
                          • <span className="font-medium">Phone:</span>{" "}
                          <a
                            href={`tel:${selectedOrder.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {formatPhone(selectedOrder.phone)}
                          </a>
                        </li>
                        <li>
                          • <span className="font-medium">Address:</span>{" "}
                          {selectedOrder.address}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Payment Proof */}
                  {selectedOrder.paymentProof && (
                    <div className="flex flex-col justify-start border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 md:col-span-3">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5 text-sm">
                        📸 Payment Proof:
                      </h3>
                      <div className="flex justify-center rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveProofUrl(selectedOrder.paymentProof)
                          }
                          title="Click to view full screenshot"
                          className="cursor-zoom-in border-none bg-transparent p-0 flex justify-center w-full focus:outline-none"
                        >
                          <img
                            src={selectedOrder.paymentProof}
                            alt="Payment Proof Screenshot"
                            className="max-h-[460px] object-contain rounded-xl shadow-xs hover:scale-[1.01] transition duration-200"
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order ID Footer */}
                <p className="flex items-center gap-2 text-xs text-gray-600 border-t border-gray-100 pt-4 mt-6">
                  <span>🆔</span>
                  <span className="font-semibold text-gray-900">Order ID:</span>
                  <span className="font-mono">{selectedOrder.orderNumber}</span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Proof Modal Popup */}
      {activeProofUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 md:bg-black/75 md:backdrop-blur-[4px] animate-fadeIn cursor-zoom-out"
          onClick={closeProofModal}
        >
          <div
            className={`relative w-full h-full md:h-auto md:bg-white md:rounded-3xl md:shadow-2xl p-0 md:p-5 flex flex-col items-center justify-center md:gap-4 transition-all duration-300 ${
              scale > 1 ? "md:max-w-5xl" : "md:max-w-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeProofModal}
              className="absolute top-4 right-4 text-white md:text-gray-400 md:hover:text-gray-700 bg-black/40 md:bg-gray-100 hover:bg-black/60 md:hover:bg-gray-250 transition rounded-full p-2 md:p-1.5 cursor-pointer z-50"
              aria-label="Close proof modal"
            >
              <svg
                className="w-6 h-6 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="hidden md:block text-center w-full border-b border-gray-100 pb-2">
              <p className="font-bold text-gray-900 text-base">
                📄 Payment Proof Screenshot
              </p>
            </div>

            {/* Image Viewport */}
            <div
              ref={viewportRef}
              className="relative md:border md:border-gray-100 md:rounded-2xl md:bg-gray-50 p-0 md:p-2 flex items-center justify-center h-full md:max-h-[75vh] w-full overflow-hidden transition-all duration-300"
            >
              <img
                src={activeProofUrl}
                alt="Payment Proof Screenshot"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                }}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                onClick={handleImageClick}
                className={`max-h-screen md:max-h-[65vh] w-auto h-auto object-contain md:rounded-xl shadow-xs select-none ${
                  isDragging ? "transition-none" : "transition-transform duration-200"
                }`}
              />

              {/* Floating Zoom Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-50 transition-all duration-300 select-none">
                {/* Zoom Out Button */}
                <button
                  type="button"
                  onClick={() => {
                    setScale((prev) => {
                      const next = Math.max(prev - 0.25, 1);
                      if (next === 1) setPosition({ x: 0, y: 0 });
                      return next;
                    });
                  }}
                  disabled={scale <= 1}
                  className="text-white hover:text-rose-400 disabled:opacity-40 disabled:hover:text-white transition p-1 cursor-pointer"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                  </svg>
                </button>

                {/* Zoom Level Indicator */}
                <span className="text-white text-xs font-bold min-w-[3.5rem] text-center">
                  {Math.round(scale * 100)}%
                </span>

                {/* Zoom In Button */}
                <button
                  type="button"
                  onClick={() => {
                    setScale((prev) => Math.min(prev + 0.25, 5));
                  }}
                  disabled={scale >= 5}
                  className="text-white hover:text-rose-400 disabled:opacity-40 disabled:hover:text-white transition p-1 cursor-pointer"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Reset Button */}
                {(scale > 1 || position.x !== 0 || position.y !== 0) && (
                  <>
                    <div className="w-[1px] h-4 bg-white/20 self-center mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setScale(1);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className="text-white hover:text-rose-400 transition p-1 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={closeProofModal}
              className="hidden md:block w-full bg-rose-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-rose-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
