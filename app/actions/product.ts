"use server";
// Fetches products for the homepage grid and a single product by slug

import { prisma } from "../lib/prisma";
import { serialize } from "../lib/serialize";

export async function getProducts() {
    const products = await prisma.product.findMany({
        where: { status: true },
        orderBy: { createdAt: "desc" },
    });
    return serialize(products);
}

export async function getProductBySlug(slug: string) {
    const decodedSlug = decodeURIComponent(slug);
    const product = await prisma.product.findUnique({
        where: { slug: decodedSlug },
        include: {
            productColors: {
                include: { color: true },
            },
            productSizes: {
                include: { size: true },
            },
        },
    });
    return serialize(product);
}

export async function getAllProducts() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            productColors: {
                include: { color: true },
            },
            productSizes: {
                include: { size: true },
            },
        },
    });
    return serialize(products);
}

// Helper function to generate a guaranteed unique slug
async function generateUniqueSlug(baseSlug: string, currentProductId?: number): Promise<string> {
    let slug = baseSlug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    if (!slug) slug = "product";

    let candidate = slug;
    let count = 1;

    while (true) {
        const existing = await prisma.product.findFirst({
            where: {
                slug: candidate,
                NOT: currentProductId ? { id: currentProductId } : undefined,
            },
        });
        if (!existing) return candidate;
        candidate = `${slug}-${count}`;
        count++;
    }
}

export async function createProduct(data: {
    name: string;
    slug: string;
    description: string;
    price: number;
    discount?: number;
    stock: number;
    status: boolean;
    image: string;
    images?: string[];
    tiktokUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    colorIds?: number[];
    sizeIds?: number[];
}) {
    const { colorIds, sizeIds, images, slug: rawSlug, ...productData } = data;
    const imagesJson = images ? JSON.stringify(images) : null;
    const uniqueSlug = await generateUniqueSlug(rawSlug || data.name);

    const product = await prisma.product.create({
        data: {
            ...productData,
            slug: uniqueSlug,
            images: imagesJson,
            productColors: colorIds
                ? {
                      create: colorIds.map((colorId) => ({ colorId })),
                  }
                : undefined,
            productSizes: sizeIds
                ? {
                      create: sizeIds.map((sizeId) => ({ sizeId })),
                  }
                : undefined,
        },
        include: {
            productColors: {
                include: { color: true },
            },
            productSizes: {
                include: { size: true },
            },
        },
    });
    return serialize(product);
}

export async function deleteProduct(id: number) {
    return prisma.product.delete({ where: { id } });
}

export async function updateProduct(
    id: number,
    data: {
        name: string;
        slug?: string;
        description: string;
        price: number;
        discount?: number;
        stock: number;
        status: boolean;
        image: string;
        images?: string[];
        tiktokUrl?: string | null;
        facebookUrl?: string | null;
        instagramUrl?: string | null;
        colorIds?: number[];
        sizeIds?: number[];
    }
) {
    const { colorIds, sizeIds, images, slug: rawSlug, ...productData } = data;
    const imagesJson = images ? JSON.stringify(images) : undefined;
    const uniqueSlug = await generateUniqueSlug(rawSlug || data.name, id);

    const product = await prisma.product.update({
        where: { id },
        data: {
            ...productData,
            slug: uniqueSlug,
            images: imagesJson,
            productColors: colorIds
                ? {
                      deleteMany: {},
                      create: colorIds.map((colorId) => ({ colorId })),
                  }
                : undefined,
            productSizes: sizeIds
                ? {
                      deleteMany: {},
                      create: sizeIds.map((sizeId) => ({ sizeId })),
                  }
                : undefined,
        },
        include: {
            productColors: {
                include: { color: true },
            },
            productSizes: {
                include: { size: true },
            },
        },
    });
    return serialize(product);
}