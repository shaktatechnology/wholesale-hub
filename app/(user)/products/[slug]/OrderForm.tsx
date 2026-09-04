"use client";
import { useState, useEffect, useRef } from "react";
import { placeOrder } from "../../../actions/order";
import { compressImage } from "@/app/lib/compressImage";

type Color = { id: number; name: string; hexCode: string };
type Size = { id: number; name: string };

type Props = {
    productId: number;
    price: number;
    shippingCharge: number;
    advancePayment?: number;
    stock?: number;
    allowOutOfStockOrders?: boolean;
    colors: Color[];
    sizes: Size[];
    qrImage: string | null;
    whatsappNumber: string | null;
    productName: string;
    productImage: string;
};

export default function OrderForm({
    productId,
    price,
    shippingCharge,
    advancePayment = 300,
    stock,
    allowOutOfStockOrders = false,
    colors,
    sizes,
    qrImage,
    whatsappNumber,
    productName,
    productImage,
}: Props) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [quantity, setQuantity] = useState(1);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(
        colors[0]?.id ?? null
    );
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(
        sizes[0]?.id ?? null
    );
    
    // Step 1: Customer Details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    // Step 2: Order Summary
    const [advancePaidInput, setAdvancePaidInput] = useState<string>(String(advancePayment));

    // Step 3: Payment Proof
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadTimeRemaining, setUploadTimeRemaining] = useState<number | null>(null);

    // System status
    const [loading, setLoading] = useState(false);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [orderDate, setOrderDate] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-sync advance payment based on quantity (Rs advancePayment per piece)
    useEffect(() => {
        const subtotal = price * quantity;
        const total = subtotal + shippingCharge;
        const defaultAdvance = Math.min(advancePayment * quantity, total);
        setAdvancePaidInput(defaultAdvance.toString());
    }, [quantity, price, shippingCharge, advancePayment]);

    const subtotal = price * quantity;
    const total = subtotal + shippingCharge;
    const parsedAdvance = Math.min(Number(advancePaidInput) || 0, total);
    const remainingCod = Math.max(0, total - parsedAdvance);
    const paymentMethod = parsedAdvance > 0 ? "QR Payment" : "Cash on Delivery";

    // Progress Bar Render
    const renderProgressBar = () => {
        return (
            <div className="flex items-center justify-between w-full mb-8 select-none">
                {[
                    { label: "Customer", num: 1 },
                    { label: "Summary", num: 2 },
                    { label: "Payment", num: 3 },
                    { label: "Success", num: 4 }
                ].map((item, idx, arr) => {
                    const isActive = step === item.num;
                    const isCompleted = step > item.num;
                    return (
                        <div key={item.num} className="flex items-center flex-1 last:flex-initial">
                            <div className="flex flex-col items-center gap-1.5 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-rose-600 text-white"
                                        : isActive
                                        ? "bg-rose-600 text-white ring-4 ring-rose-100"
                                        : "bg-gray-100 text-gray-400 border border-gray-200"
                                }`}>
                                    {isCompleted ? "✓" : item.num}
                                </div>
                                <span className={`text-[10px] sm:text-[11px] font-semibold transition-all duration-300 ${
                                    isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                                }`}>
                                    {item.label}
                                </span>
                            </div>
                            {idx < arr.length - 1 && (
                                <div className="flex-1 h-[2px] mx-1.5 sm:mx-3 -mt-4 bg-gray-200 relative">
                                    <div className={`absolute inset-0 bg-rose-600 transition-all duration-500 ${
                                        isCompleted ? "w-full" : "w-0"
                                    }`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Step 1 Validation
    function handleContinueToSummary() {
        if (!name.trim()) {
            setValidationError("Please enter your full name");
            return;
        }
        if (phone.length !== 10) {
            setValidationError("Phone number must be exactly 10 digits");
            return;
        }
        if (!address.trim()) {
            setValidationError("Please enter your full address");
            return;
        }
        setValidationError(null);
        setStep(2);
    }

    // Step 3 File Upload
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        setUploadError(null);
        setUploadProgress(0);
        setUploadTimeRemaining(null);

        try {
            // Compress image on client-side before sending to server
            const compressedFile = await compressImage(file);

            const formData = new FormData();
            formData.append("file", compressedFile);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload");

            const startTime = Date.now();

            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && event.total > 0) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);

                    const elapsedMs = Date.now() - startTime;
                    if (elapsedMs > 500 && event.loaded > 0) {
                        const speedBytesPerMs = event.loaded / elapsedMs;
                        const remainingBytes = event.total - event.loaded;
                        const remainingMs = remainingBytes / speedBytesPerMs;
                        const remainingSec = Math.ceil(remainingMs / 1000);
                        setUploadTimeRemaining(remainingSec);
                    } else {
                        setUploadTimeRemaining(null);
                    }
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.url) {
                            setPaymentProofUrl(data.url);
                        } else {
                            setUploadError(data.error || "Upload failed. Please try again.");
                        }
                    } catch (err) {
                        setUploadError("Upload failed. Invalid response from server.");
                    }
                } else if (xhr.status === 413) {
                    setUploadError("File is too large for the web server limit. Please upload a smaller image.");
                } else {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        setUploadError(data.error || `Upload failed (Server HTTP ${xhr.status}).`);
                    } catch (err) {
                        setUploadError(`Upload failed (Server HTTP ${xhr.status}). Please try again.`);
                    }
                }
                setUploadingFile(false);
                setUploadProgress(0);
                setUploadTimeRemaining(null);
            };

            xhr.onerror = () => {
                setUploadError("Network error during file upload. Please check connection and try again.");
                setUploadingFile(false);
                setUploadProgress(0);
                setUploadTimeRemaining(null);
            };

            xhr.send(formData);
        } catch (err) {
            setUploadError("Failed to process image before upload.");
            setUploadingFile(false);
            setUploadProgress(0);
            setUploadTimeRemaining(null);
        }
    }


    // Final Order Creation
    async function handlePlaceOrder() {
        setLoading(true);
        setValidationError(null);
        try {
            const result = await placeOrder({
                customerName: name,
                phone: `+977${phone}`,
                address,
                productId,
                colorId: selectedColorId,
                sizeId: selectedSizeId,
                quantity,
                price,
                shippingCharge,
                paymentMethod,
                advancePaid: parsedAdvance,
                paymentProof: paymentProofUrl,
            });
            if (result.success) {
                setOrderNumber(result.orderNumber || null);
                setOrderDate(new Date().toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }));
                setStep(4);
            } else {
                setValidationError(result.message || "Failed to place order. Please try again.");
            }
        } catch (err) {
            setValidationError("Failed to place order due to server error.");
        } finally {
            setLoading(false);
        }
    }

    // WhatsApp Message trigger
    function handleWhatsAppClick() {
        if (!whatsappNumber || !orderNumber) return;
        
        let cleanNumber = whatsappNumber.replace(/\D/g, "");
        cleanNumber = cleanNumber.replace(/^0+/, "");
        if (cleanNumber.length === 10 && cleanNumber.startsWith("9")) {
            cleanNumber = "977" + cleanNumber;
        }

        const proofFilename = paymentProofUrl ? paymentProofUrl.split("/").pop() : "None";

        let specs = "";
        if (selectedColorId) {
            const colorName = colors.find(c => c.id === selectedColorId)?.name;
            if (colorName) specs += `Color: ${colorName}\n`;
        }
        if (selectedSizeId) {
            const sizeName = sizes.find(s => s.id === selectedSizeId)?.name;
            if (sizeName) specs += `Size: ${sizeName}\n`;
        }

        const text = `Total: NPR ${total.toLocaleString()}/-
Advance Paid: NPR ${parsedAdvance.toLocaleString()}/-
Remaining COD:NPR ${remainingCod.toLocaleString()}/-
${specs}
Customer Details:
• Name: ${name}
• Phone: +977-${phone}
• Address: ${address}
order number: ${orderNumber}

Payment Proof: ${proofFilename}

Please confirm my order. Thank you!`;

        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, "_blank");
    }

    // Reset Flow
    function handleContinueShopping() {
        setStep(1);
        setQuantity(1);
        setName("");
        setPhone("");
        setAddress("");
        setAdvancePaidInput(String(advancePayment));
        setPaymentProofUrl(null);
        setOrderNumber(null);
        setValidationError(null);
    }

    if (stock !== undefined && stock <= 0 && !allowOutOfStockOrders) {
        return (
            <div className="border border-red-200 rounded-2xl p-6 bg-red-50/50 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
                    ✕
                </div>
                <h3 className="text-base font-bold text-gray-900">Currently Out of Stock</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                    This item is currently sold out. Please check back later!
                </p>
            </div>
        );
    }

    const maxQty = stock !== undefined && stock > 0 ? stock : undefined;

    return (
        <div className="flex flex-col gap-6">
            {/* Available Colors / Numbers (Interactive) */}
            {colors.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">Select Color / Number</span>
                        <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
                            Selected: {colors.find((c) => c.id === selectedColorId)?.name || "None"}
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {colors.map((color) => {
                            const isSelected = selectedColorId === color.id;
                            // Check if color name is a number or starts with "Number"
                            const isNumberOption = /^\d+$/.test(color.name.trim()) || /^Number\s*\d+$/i.test(color.name.trim());
                            return (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setSelectedColorId(color.id)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer select-none shadow-2xs ${
                                        isSelected
                                            ? "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-100 scale-105"
                                            : "border-gray-250 bg-white text-gray-800 hover:border-rose-400 hover:bg-rose-50/20"
                                    }`}
                                >
                                    <span
                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: color.hexCode || "#000000" }}
                                    />
                                    <span>{color.name}</span>
                                    {isSelected && (
                                        <svg className="w-3.5 h-3.5 text-white ml-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Available Sizes (Interactive) */}
            {sizes.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">Available Sizes</span>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                            {sizes.find((s) => s.id === selectedSizeId)?.name || ""}
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {sizes.map((size) => {
                            const isSelected = selectedSizeId === size.id;
                            return (
                                <button
                                    key={size.id}
                                    type="button"
                                    onClick={() => setSelectedSizeId(size.id)}
                                    className={`flex items-center justify-center min-w-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none ${
                                        isSelected
                                            ? "border-black bg-black text-white"
                                            : "border-gray-200 bg-white text-gray-750 hover:border-gray-300"
                                    }`}
                                >
                                    <span>{size.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quantity Selector */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Select Quantity</span>
                    <span className="text-xs text-gray-500 font-medium">
                        Subtotal: <strong className="text-gray-900 font-bold">Rs. {subtotal.toLocaleString()}</strong>
                    </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* - / Input / + Controls */}
                    <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition text-lg font-bold cursor-pointer select-none"
                            title="Decrease quantity"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                const clamped = isNaN(val) || val < 1 ? 1 : val;
                                setQuantity(maxQty ? Math.min(maxQty, clamped) : clamped);
                            }}
                            className="w-14 text-center text-sm font-bold text-gray-900 outline-none border-x border-gray-200 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            type="button"
                            onClick={() => setQuantity(maxQty ? Math.min(maxQty, quantity + 1) : quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition text-lg font-bold cursor-pointer select-none"
                            title="Increase quantity"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Multi-Step Checkout Wizard Card ── */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm max-w-lg w-full mx-auto">
                {renderProgressBar()}

                {/* ── Step 1: Customer Details ── */}
                {step === 1 && (
                    <div className="space-y-5 animate-fadeIn">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                            <p className="text-xs text-gray-500 mt-1">Please enter your details to place the order</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name*</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setValidationError(null);
                                    }}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 placeholder:text-gray-400"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number*</label>
                                <div className="flex rounded-xl border border-gray-300 focus-within:ring-1 focus-within:ring-rose-500 focus-within:border-rose-500 overflow-hidden bg-white">
                                    <span className="bg-gray-50 px-4 py-3 text-sm text-gray-500 border-r border-gray-200 select-none flex items-center font-medium">
                                        +977
                                    </span>
                                    <input
                                        type="tel"
                                        pattern="[0-9]{10}"
                                        placeholder="Enter your mobile number"
                                        value={phone}
                                        onChange={(e) => {
                                            const cleanVal = e.target.value.replace(/\D/g, "");
                                            if (cleanVal.length <= 10) {
                                                setPhone(cleanVal);
                                                setValidationError(null);
                                            }
                                        }}
                                        className="w-full px-4 py-3 text-sm outline-none placeholder:text-gray-400 bg-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Address*</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter your full address (e.g. New Road, Kathmandu)"
                                    value={address}
                                    onChange={(e) => {
                                        setAddress(e.target.value);
                                        setValidationError(null);
                                    }}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 placeholder:text-gray-400 resize-none"
                                />
                            </div>

                            {validationError && (
                                <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs font-medium border border-red-100">
                                    ⚠️ {validationError}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleContinueToSummary}
                                className="w-full bg-rose-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-100 cursor-pointer"
                            >
                                Continue to Order Summary ➔
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Order Summary ── */}
                {step === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
                            <p className="text-xs text-gray-500 mt-1">Review your order and pay the advance amount</p>
                        </div>

                        {/* Product Card Details */}
                        <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                <img
                                    src={productImage}
                                    alt={productName}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{productName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {quantity}
                                    {selectedColorId && ` • Color: ${colors.find(c => c.id === selectedColorId)?.name}`}
                                    {selectedSizeId && ` • Size: ${sizes.find(s => s.id === selectedSizeId)?.name}`}
                                </p>
                            </div>
                        </div>

                        {/* Pricing details table */}
                        <div className="space-y-2.5 text-sm border-t border-gray-100 pt-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Price per piece:</span>
                                <span>Rs. {price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Quantity:</span>
                                <span>{quantity}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>Rs. {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping:</span>
                                <span>Rs. {shippingCharge.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-950 border-t border-dashed border-gray-200 pt-2.5 text-base">
                                <span>Total Amount:</span>
                                <span className="text-rose-600">Rs. {total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Quantity Selector inside Summary */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                            <span className="text-xs font-semibold text-gray-700">Change Quantity:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-9 h-9 flex items-center justify-center text-gray-650 hover:bg-gray-50 transition text-base font-bold cursor-pointer select-none"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setQuantity(isNaN(val) || val < 1 ? 1 : val);
                                    }}
                                    className="w-12 text-center text-xs font-bold text-gray-900 outline-none border-x border-gray-200 py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-9 h-9 flex items-center justify-center text-gray-650 hover:bg-gray-50 transition text-base font-bold cursor-pointer select-none"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Advance Payment Input */}
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Advance Payment {advancePayment > 0 ? `(Minimum of Rs.${advancePayment} Per Piece)` : ""}
                                </label>
                                <div className="relative rounded-xl border border-gray-350 focus-within:ring-1 focus-within:ring-rose-500 focus-within:border-rose-500 overflow-hidden bg-white">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">
                                        Rs.
                                    </span>
                                    <input
                                        type="number"
                                        min={Math.min(advancePayment * quantity, total)}
                                        max={total}
                                        placeholder="Enter advance amount"
                                        value={advancePaidInput}
                                        onChange={(e) => {
                                            const val = e.target.value;

                                            // Allow empty value while typing
                                            if (val === "") {
                                                setAdvancePaidInput("");
                                                setValidationError(null);
                                                return;
                                            }

                                            const amount = Number(val);
                                            const minRequired = Math.min(advancePayment * quantity, total);

                                            if (amount > total) {
                                                setValidationError(`Advance payment cannot exceed the total order amount of Rs. ${total}.`);
                                            } else if (amount > 0 && amount < minRequired) {
                                                if (minRequired === total) {
                                                    setValidationError(`Advance payment must be at least Rs. ${minRequired} (the full order amount, since the total is less than Rs. ${advancePayment} per piece).`);
                                                } else {
                                                    setValidationError(`Advance payment must be at least Rs. ${minRequired} (${quantity} × Rs. ${advancePayment}).`);
                                                }
                                            } else {
                                                setValidationError(null);
                                            }

                                            setAdvancePaidInput(val);
                                        }}
                                        className="w-full pl-12 pr-4 py-3 text-sm font-semibold outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* COD amount banner */}
                            <div className="p-3.5 bg-emerald-50 text-emerald-850 rounded-xl text-xs font-semibold border border-emerald-100 flex justify-between items-center">
                                <span>Remaining COD Amount (paid on delivery):</span>
                                <span className="font-bold text-sm">Rs. {remainingCod.toLocaleString()}</span>
                            </div>
                        </div>

                        {validationError && (
                            <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs font-medium border border-red-100 animate-fadeIn">
                                ⚠️ {validationError}
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer"
                            >
                                Back
                            </button>
                            
                            {parsedAdvance > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const amount = Number(advancePaidInput) || 0;
                                        const minRequired = Math.min(advancePayment * quantity, total);
                                        if (amount > total) {
                                            setValidationError(`Advance payment cannot exceed the total order amount of Rs. ${total}.`);
                                            return;
                                        }
                                        if (amount > 0 && amount < minRequired) {
                                            if (minRequired === total) {
                                                setValidationError(`Advance payment must be at least Rs. ${minRequired} (the full order amount, since the total is less than Rs. ${advancePayment} per piece).`);
                                            } else {
                                                setValidationError(`Advance payment must be at least Rs. ${minRequired} (${quantity} × Rs. ${advancePayment}).`);
                                            }
                                            return;
                                        }
                                        if (!qrImage) {
                                            setValidationError("QR payment is not configured by the administrator. Set advance payment to 0 to pay with Cash on Delivery.");
                                            return;
                                        }
                                        setValidationError(null);
                                        setStep(3);
                                    }}
                                    className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-100 cursor-pointer"
                                >
                                    Continue to Payment ➔
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-100 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? "Placing Order..." : "Place COD Order ➔"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Make Advance Payment ── */}
                {step === 3 && (
                    <div className="space-y-5 animate-fadeIn">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Make Advance Payment</h3>
                            <p className="text-xs text-gray-500 mt-1">Scan the QR code below to pay the advance amount</p>
                        </div>

                        

                        {/* Total to pay display */}
                        <div className="text-center py-2 bg-rose-50/50 rounded-xl border border-rose-100/50">
                            <p className="text-xs text-rose-500 font-bold uppercase tracking-wider">Total Advance to Pay</p>
                            <p className="text-3xl font-black text-rose-600 mt-0.5">Rs. {parsedAdvance.toLocaleString()}</p>
                        </div>

                        {/* QR Image */}
                        {qrImage && (
                            <div className="flex justify-center border border-dashed border-gray-250 rounded-2xl p-4 bg-gray-50">
                                <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden flex flex-col items-center">
                                    <img
                                        src={qrImage}
                                        alt="QR Code"
                                        className="w-44 h-44 object-contain p-2"
                                    />
                                    <div className="w-full bg-gray-900 py-1.5 px-3 text-center">
                                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Scan & Pay using any banking app</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File Upload Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-700">
                                Upload Payment Screenshot*
                            </label>
                            
                            {paymentProofUrl ? (
                                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center p-3 gap-3 animate-fadeIn">
                                    <img
                                        src={paymentProofUrl}
                                        alt="Payment Proof"
                                        className="w-12 h-16 object-cover rounded-lg border border-gray-250 shadow-2xs"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate">Screenshot Uploaded</p>
                                        <p className="text-[10px] text-green-600 font-bold mt-0.5">✓ Upload complete</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentProofUrl(null)}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold underline underline-offset-2 cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : uploadingFile ? (
                                <div className="border border-gray-200 rounded-xl p-5 bg-white flex flex-col items-center justify-center gap-4 shadow-sm animate-fadeIn">
                                    <div className="relative flex items-center justify-center w-12 h-12">
                                        {/* Spinning Outer Ring */}
                                        <div className="absolute inset-0 rounded-full border-2 border-gray-100"></div>
                                        <div className="absolute inset-0 rounded-full border-2 border-rose-600 border-t-transparent animate-spin"></div>
                                        {/* Percentage */}
                                        <span className="text-[10px] font-bold text-gray-805 z-10">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full space-y-2.5">
                                        <div className="flex justify-between items-center text-xs font-semibold">
                                            <span className="text-gray-700">Uploading Payment Screenshot</span>
                                            <span className="text-rose-600 font-bold">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-rose-600 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
                                            <span>Please do not close this tab</span>
                                            <span>
                                                {uploadProgress === 100 
                                                    ? "Processing image..." 
                                                    : uploadTimeRemaining !== null 
                                                        ? `~${uploadTimeRemaining}s remaining` 
                                                        : "Uploading..."
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 hover:border-rose-500 rounded-xl p-6 text-center cursor-pointer bg-white transition duration-200 hover:bg-rose-50/10 flex flex-col items-center justify-center gap-1.5"
                                >
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span className="text-xs font-semibold text-gray-700">
                                        Choose Payment Screenshot
                                    </span>
                                    <span className="text-[10px] text-gray-405 font-medium">PNG, JPG or WEBP up to 20MB</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {uploadError && (
                                <p className="text-red-500 text-xs mt-1 font-semibold">⚠️ {uploadError}</p>
                            )}
                        </div>

                        {validationError && (
                            <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs font-medium border border-red-100">
                                ⚠️ {validationError}
                            </div>
                        )}

                        {/* Stepper buttons */}
                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!paymentProofUrl) {
                                        setValidationError("Please upload the payment screenshot to confirm your payment");
                                        return;
                                    }
                                    setValidationError(null);
                                    handlePlaceOrder();
                                }}
                                disabled={loading || uploadingFile}
                                className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-100 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? "Placing Order..." : "I have Paid ➔"}
                            </button>
                        </div>
                        {/* Why Advance Payment Checklist */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-250 p-4.5 space-y-2 text-xs">
                            <h4 className="font-bold text-gray-900 text-sm">Why Advance Payment?</h4>
                            <ul className="space-y-1.5 text-gray-650 font-medium">
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>Confirms Your Order</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-650 font-bold">✓</span>
                                    <span>Prevents Fake Order</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-650 font-bold">✓</span>
                                    <span>Ensures Smooth Delivery</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-emerald-650 font-bold">✓</span>
                                    <span>Only Rs. {advancePayment} Per Piece</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Success Page ── */}
                {step === 4 && (
                    <div className="space-y-6 text-left animate-fadeIn py-2">
                        {/* Product Image */}
                        <div className="flex justify-center mb-4">
                            <img
                                src={productImage}
                                alt={productName}
                                className="w-40 h-52 object-cover rounded-xl shadow-md"
                            />
                        </div>

                        {/* Heading */}
                        <div className="text-center mb-3">
                            <h2 className="text-base font-bold text-gray-900 flex items-center justify-center gap-1.5">
                                🛒 Order Placed Successfully!
                            </h2>
                            <p className="text-xs text-rose-600 font-bold font-mono mt-1 select-all">
                                Order Number: {orderNumber}
                            </p>
                        </div>

                        {/* Product / Total / Qty / Payment rows */}
                        <div className="space-y-2 text-sm mb-4">
                            <p className="flex items-center gap-2">
                                <span>📦</span>
                                <span className="font-semibold text-gray-900">Product:</span>
                                <span className="text-gray-700">{productName}</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span>💰</span>
                                <span className="font-semibold text-gray-900">Total:</span>
                                <span className="text-gray-700">NPR {total.toLocaleString()}/-</span>
                            </p>
                            {parsedAdvance > 0 && (
                                <>
                                    <p className="flex items-center gap-2">
                                        <span>💵</span>
                                        <span className="font-semibold text-gray-900">Advance Paid:</span>
                                        <span className="text-emerald-700 font-bold">NPR {parsedAdvance.toLocaleString()}/-</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span>🚚</span>
                                        <span className="font-semibold text-gray-900">Remaining COD:</span>
                                        <span className="text-rose-600 font-semibold">NPR {remainingCod.toLocaleString()}/-</span>
                                    </p>
                                </>
                            )}
                            <p className="flex items-center gap-2">
                                <span>📊</span>
                                <span className="font-semibold text-gray-900">Quantity:</span>
                                <span className="text-gray-700">{quantity}</span>
                            </p>
                            {selectedColorId && (
                                <p className="flex items-center gap-2">
                                    <span>🎨</span>
                                    <span className="font-semibold text-gray-900">Color:</span>
                                    <span className="text-gray-700">
                                        {colors.find(c => c.id === selectedColorId)?.name || "N/A"}
                                    </span>
                                </p>
                            )}
                            {selectedSizeId && (
                                <p className="flex items-center gap-2">
                                    <span>📏</span>
                                    <span className="font-semibold text-gray-900">Size:</span>
                                    <span className="text-gray-700 uppercase">
                                        {sizes.find(s => s.id === selectedSizeId)?.name || "N/A"}
                                    </span>
                                </p>
                            )}
                            <p className="flex items-center gap-2">
                                <span>💳</span>
                                <span className="font-semibold text-gray-900">Payment:</span>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                    {paymentMethod}
                                </span>
                            </p>
                        </div>

                        {/* Customer Details */}
                        <div className="mb-4 pt-3 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 text-sm">
                                👤 Customer Details:
                            </h3>
                            <ul className="text-sm text-gray-700 space-y-1 pl-1">
                                <li>• <span className="font-medium">Name:</span> {name}</li>
                                <li>
                                    • <span className="font-medium">Phone:</span>{" "}
                                    <span className="text-blue-600 font-medium">+977-{phone}</span>
                                </li>
                                <li>• <span className="font-medium">Address:</span> {address}</li>
                            </ul>
                        </div>

                        {/* Payment Proof Image */}
                        {paymentProofUrl && (
                            <div className="mb-4 border-t border-gray-100 pt-3">
                                <h3 className="font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 text-sm">
                                    📸 Payment Proof:
                                </h3>
                                <div className="flex justify-center rounded-xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                                    <img
                                        src={paymentProofUrl}
                                        alt="Payment Proof Screenshot"
                                        className="max-h-48 object-contain rounded shadow-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Order ID & Date Footer */}
                        <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3 flex justify-between">
                            <span>ID: <span className="font-mono">{orderNumber}</span></span>
                            <span>{orderDate}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2.5 pt-3">
                            {whatsappNumber && (
                                <button
                                    type="button"
                                    onClick={handleWhatsAppClick}
                                    className="w-full bg-[#25D366] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 shadow-md shadow-green-100 cursor-pointer"
                                >
                                    <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.747 1.451 5.436.002 9.861-4.422 9.864-9.862.002-2.637-1.023-5.115-2.887-6.979-1.864-1.865-4.343-2.89-6.984-2.89-5.441 0-9.866 4.424-9.869 9.864-.001 1.568.452 3.1 1.311 4.545l-.975 3.562 3.659-.96c1.468.802 2.8.204 4.092.81zM17.487 14.41c-.299-.15-1.771-.875-2.04-.972-.269-.099-.463-.148-.658.15-.195.297-.753.949-.922 1.147-.169.197-.338.221-.637.072-1.077-.54-2.22-1.07-3.155-1.879-.884-.765-1.563-1.688-1.854-2.185-.292-.498-.031-.767.218-1.014.224-.223.493-.578.74-.867.247-.289.329-.49.493-.818.164-.329.082-.618-.041-.867-.123-.247-.658-1.637-.922-2.27-.258-.606-.52-.524-.716-.534-.185-.01-.397-.01-.61-.01-.213 0-.56.08-.853.401-.293.321-1.12 1.096-1.12 2.67 0 1.575 1.147 3.094 1.306 3.308.16.213 2.257 3.447 5.467 4.834.763.33 1.358.527 1.821.674.767.244 1.467.21 2.02.128.618-.092 1.77-.723 2.02-1.417.25-.694.25-1.288.175-1.416-.075-.128-.27-.203-.57-.353z" />
                                    </svg>
                                    <span>Send Details to WhatsApp</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleContinueShopping}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-center"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
