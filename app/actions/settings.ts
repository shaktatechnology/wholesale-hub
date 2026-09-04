"use server";
// Fetches site settings and homepage settings from the DB

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { serialize } from "../lib/serialize";

export async function getSettings() {
    const setting = await prisma.setting.findFirst();
    return serialize(setting);
}

export async function getHomepageSettings() {
    const homepage = await prisma.homepageSetting.findFirst();
    return serialize(homepage);
}


export async function saveSettings(data: {
    siteName: string;
    email?: string;
    phone?: string;
    address?: string;
    shippingCharge: number;
    advancePayment: number;
    logo?: string;
    favicon?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    showSocialVideoLinks?: boolean;
    enableLowStockAlert?: boolean;
    lowStockThreshold?: number;
    allowOutOfStockOrders?: boolean;
    qrImage?: string;
    whatsapp?: string;
}) {
    // Convert empty strings to null for optional fields
    const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);

    const payload = {
        siteName: data.siteName,
        email: data.email?.trim() || "",
        phone: data.phone?.trim() || "",
        address: data.address?.trim() || "",
        shippingCharge: data.shippingCharge,
        advancePayment: data.advancePayment,
        logo: toNull(data.logo),
        favicon: toNull(data.favicon),
        facebook: toNull(data.facebook),
        instagram: toNull(data.instagram),
        tiktok: toNull(data.tiktok),
        showSocialVideoLinks: data.showSocialVideoLinks ?? true,
        enableLowStockAlert: data.enableLowStockAlert ?? true,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        allowOutOfStockOrders: data.allowOutOfStockOrders ?? false,
        qrImage: toNull(data.qrImage),
        whatsapp: toNull(data.whatsapp),
    };

    const existing = await prisma.setting.findFirst();
    if (existing) {
        await prisma.setting.update({ where: { id: existing.id }, data: payload });
    } else {
        await prisma.setting.create({ data: payload });
    }
    revalidatePath("/", "layout");
    return { success: true };
}

export async function saveHomepageSettings(data: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    image: string;
}) {
    const existing = await prisma.homepageSetting.findFirst();
    if (existing) {
        await prisma.homepageSetting.update({ where: { id: existing.id }, data });
    } else {
        await prisma.homepageSetting.create({ data });
    }
    return { success: true };
}