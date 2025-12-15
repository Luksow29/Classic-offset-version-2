import ProductLibrary from "@/components/customer/ProductLibrary";

export default function ProductLibraryPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Design Library</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Browse our collection of templates and designs.
                </p>
            </div>
            <ProductLibrary />
        </div>
    );
}
