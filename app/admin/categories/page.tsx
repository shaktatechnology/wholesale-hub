import { getCategories } from "../../actions/category";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
    const categories = await getCategories();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage categories and control which category appears first on the store.
                </p>
            </div>
            <CategoriesClient initialCategories={categories} />
        </div>
    );
}
