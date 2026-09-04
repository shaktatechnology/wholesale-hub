"use server";
// Takes order form data and saves it to the DB, returning the order number

import { prisma } from "../lib/prisma";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { checkRateLimit, getClientIp } from "../lib/rateLimit";
import { serialize } from "../lib/serialize";


type PlaceOrderInput = {
    customerName: string;
    phone: string;
    address: string;
    productId: number;
    colorId: number | null;
    sizeId: number | null;
    quantity: number;
    price: number;
    shippingCharge: number;
    paymentMethod: string;
    advancePaid: number;
    paymentProof: string | null;
};

// Helper function to resolve local file paths
const getLocalFilePath = (filePathOrUrl: string) => {
    const filename = path.basename(filePathOrUrl);
    let filePath = path.join(process.cwd(), "uploads", filename);
    if (!existsSync(filePath)) {
        filePath = path.join(process.cwd(), "public", "uploads", filename);
    }
    return existsSync(filePath) ? filePath : null;
};

// Helper function to send Telegram message
async function sendTelegramNotification(orderId: number) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        console.warn("Telegram bot token or Chat ID is missing in .env");
        return;
    }
    try {
        // 1. Fetch complete order details including relations
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: true,
                        color: true,
                        size: true,
                    },
                },
            },
        });
        if (!order || order.orderItems.length === 0) return;
        const firstItem = order.orderItems[0];
        const productName = firstItem.product.name;
        const colorName = firstItem.color?.name || "N/A";
        const sizeName = firstItem.size?.name || "N/A";
        // 2. Format details into HTML
        const caption = `
🛒 <b>Order Placed Successfully!</b>
<b>Order Number:</b> <code>${order.orderNumber}</code>

📦 <b>Product:</b> ${productName}
💰 <b>Total:</b> NPR ${order.total}/-
💵 <b>Advance Paid:</b> NPR ${order.advancePaid}/-
🚚 <b>Remaining COD:</b> NPR ${Number(order.total) - Number(order.advancePaid)}/-
🔢 <b>Quantity:</b> ${firstItem.quantity}
🎨 <b>Color / Number:</b> ${colorName}
📏 <b>Size:</b> ${sizeName}
💳 <b>Payment:</b> ${order.paymentMethod}

👤 <b>Customer Details:</b>
• <b>Name:</b> ${order.customerName}
• <b>Phone:</b> ${order.phone}
• <b>Address:</b> ${order.address}
        `.trim();

        // 3. Resolve paths to both images
        const productLocalPath = firstItem.product.image ? getLocalFilePath(firstItem.product.image) : null;
        const paymentLocalPath = order.paymentProof ? getLocalFilePath(order.paymentProof) : null;

        if (productLocalPath && paymentLocalPath) {
            // Case A: Both images exist -> Send as a grouped Album (Media Group)
            const formData = new FormData();
            formData.append("chat_id", chatId);

            const media = [];

            // Add Product Image (carries the caption/text details)
            const productBuffer = readFileSync(productLocalPath);
            const productBlob = new Blob([productBuffer], { type: "image/jpeg" });
            formData.append("product_image", productBlob, path.basename(productLocalPath));
            media.push({
                type: "photo",
                media: "attach://product_image",
                caption: caption,
                parse_mode: "HTML",
            });

            // Add Payment Proof
            const paymentBuffer = readFileSync(paymentLocalPath);
            const paymentBlob = new Blob([paymentBuffer], { type: "image/jpeg" });
            formData.append("payment_proof", paymentBlob, path.basename(paymentLocalPath));
            media.push({
                type: "photo",
                media: "attach://payment_proof",
            });

            formData.append("media", JSON.stringify(media));

            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Telegram API Error (MediaGroup):", errText);
            }
        } else if (productLocalPath) {
            // Case B: Only product image exists
            const formData = new FormData();
            formData.append("chat_id", chatId);
            
            const productBuffer = readFileSync(productLocalPath);
            const productBlob = new Blob([productBuffer], { type: "image/jpeg" });
            formData.append("photo", productBlob, path.basename(productLocalPath));
            formData.append("caption", caption);
            formData.append("parse_mode", "HTML");

            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Telegram API Error (ProductPhoto):", errText);
            }
        } else if (paymentLocalPath) {
            // Case C: Only payment proof exists
            const formData = new FormData();
            formData.append("chat_id", chatId);
            
            const paymentBuffer = readFileSync(paymentLocalPath);
            const paymentBlob = new Blob([paymentBuffer], { type: "image/jpeg" });
            formData.append("photo", paymentBlob, path.basename(paymentLocalPath));
            formData.append("caption", caption);
            formData.append("parse_mode", "HTML");

            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Telegram API Error (PaymentPhoto):", errText);
            }
        } else {
            // Case D: Fallback to text message if no images exist
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: caption,
                    parse_mode: "HTML",
                }),
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error("Telegram API Error (Text):", errText);
            }
        }
    } catch (error) {
        console.error("Failed to send Telegram notification:", error);
    }
}

export async function placeOrder(data: PlaceOrderInput) {
    const ip = await getClientIp();
    const { success, reset } = await checkRateLimit(`order:${ip}`, 5, 60);
    if (!success) {
        return { success: false, message: `Too many order attempts. Please try again in ${reset} seconds.` };
    }

    // Fetch site settings and product stock before placing order
    const [setting, product] = await Promise.all([
        prisma.setting.findFirst(),
        prisma.product.findUnique({
            where: { id: data.productId },
            select: { stock: true, name: true }
        }),
    ]);

    const allowOutOfStockOrders = setting?.allowOutOfStockOrders ?? false;

    if (!product) {
        return { success: false, message: "Product not found." };
    }

    if (!allowOutOfStockOrders) {
        if (product.stock <= 0) {
            return { success: false, message: "Sorry, this product is currently out of stock." };
        }

        if (product.stock < data.quantity) {
            return { success: false, message: `Only ${product.stock} unit(s) left in stock.` };
        }
    }

    const subtotal = data.price * data.quantity;
    const total = subtotal + data.shippingCharge;

    // Generate a random order number like ORD-20240630-4821
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Create order and decrement product stock (if available) atomically
    const [order] = await prisma.$transaction([
        prisma.order.create({
            data: {
                orderNumber,
                customerName: data.customerName,
                phone: data.phone,
                address: data.address,
                subtotal,
                shippingCharge: data.shippingCharge,
                total,
                paymentMethod: data.paymentMethod,
                advancePaid: data.advancePaid,
                paymentProof: data.paymentProof,
                status: "pending",
                orderItems: {
                    create: {
                        productId: data.productId,
                        colorId: data.colorId,
                        sizeId: data.sizeId,
                        quantity: data.quantity,
                        price: data.price,
                        total: subtotal,
                    },
                },
            },
        }),
        ...(product.stock > 0
            ? [
                  prisma.product.update({
                      where: { id: data.productId },
                      data: { stock: { decrement: Math.min(product.stock, data.quantity) } },
                  }),
              ]
            : []),
    ]);

    sendTelegramNotification(order.id);

    return { success: true, orderNumber: order.orderNumber };
}

export async function getOrders() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            orderItems: {
                include: {
                    product: true,
                    color: true,
                    size: true,
                },
            },
        },
    });
    return serialize(orders);
}

export async function updateOrderStatus(id: number, status: string) {
    const order = await prisma.order.update({ where: { id }, data: { status } });
    return serialize(order);
}

export async function deleteOrder(id: number) {
    return prisma.order.delete({ where: { id } });
}


