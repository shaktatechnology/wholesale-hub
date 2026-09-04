"use client";
import { useState, useTransition } from "react";
import { updateOrderStatus } from "../../actions/order";
import { useToast } from "@/app/components/Toast";

const STATUS_OPTIONS = ["pending", "processing", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    processing: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
};

export default function OrderStatusSelect({
    id,
    currentStatus,
}: {
    id: number;
    currentStatus: string;
}) {
    const { toast } = useToast();
    const [status, setStatus] = useState(currentStatus);
    const [pending, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newStatus = e.target.value;
        setStatus(newStatus);
        startTransition(async () => {
            await updateOrderStatus(id, newStatus);
            toast(`Order #${id} status updated to ${newStatus}!`, "success");
        });
    }

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={pending}
            className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[status] ?? "bg-gray-100"}`}
        >
            {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                    {s}
                </option>
            ))}
        </select>
    );
}
