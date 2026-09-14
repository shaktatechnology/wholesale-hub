"use server";
// Category server actions for admin management and homepage display

import { prisma } from "../lib/prisma";
import { serialize } from "../lib/serialize";

// Helper to generate a URL-safe unique slug
async function generateUniqueCategorySlug(name: string, currentId?: number): Promise<string> {
    let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

    if (!slug) slug = "category";

    let candidate = slug;
    let count = 1;

    while (true) {
        const existing = await prisma.category.findFirst({
            where: {
                slug: candidate,
                NOT: currentId ? { id: currentId } : undefined,
            },
        });
        if (!existing) return candidate;
        candidate = `${slug}-${count}`;
        count++;
    }
}

export async function getCategories() {
    const categories = await prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
            _count: {
                select: { products: true },
            },
        },
    });
    return serialize(categories);
}

export async function createCategory(data: { name: string; sortOrder?: number }) {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new Error("Category name is required.");

    const slug = await generateUniqueCategorySlug(trimmedName);

    // If sortOrder is not provided, place it at the end
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined || isNaN(sortOrder)) {
        const lastCategory = await prisma.category.findFirst({
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
        });
        sortOrder = (lastCategory?.sortOrder ?? 0) + 1;
    }

    const category = await prisma.category.create({
        data: {
            name: trimmedName,
            slug,
            sortOrder,
        },
        include: {
            _count: {
                select: { products: true },
            },
        },
    });

    return serialize(category);
}

export async function updateCategory(
    id: number,
    data: { name: string; sortOrder?: number }
) {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new Error("Category name is required.");

    const slug = await generateUniqueCategorySlug(trimmedName, id);

    const category = await prisma.category.update({
        where: { id },
        data: {
            name: trimmedName,
            slug,
            sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        },
        include: {
            _count: {
                select: { products: true },
            },
        },
    });

    return serialize(category);
}

export async function deleteCategory(id: number) {
    // 1. Check if any products are associated with this category
    const productCount = await prisma.product.count({
        where: { categoryId: id },
    });

    if (productCount > 0) {
        return {
            success: false,
            error: `Cannot delete category: ${productCount} product${
                productCount > 1 ? "s are" : " is"
            } currently linked to this category. Please reassign or delete the products first.`,
        };
    }

    // 2. Safe to delete
    await prisma.category.delete({
        where: { id },
    });

    return { success: true };
}

export async function updateCategoriesOrder(items: { id: number; sortOrder: number }[]) {
    await prisma.$transaction(
        items.map((item) =>
            prisma.category.update({
                where: { id: item.id },
                data: { sortOrder: item.sortOrder },
            })
        )
    );
    return { success: true };
}
