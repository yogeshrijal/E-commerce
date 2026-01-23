import { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

import './ProductFilters.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                productAPI.getProducts(),
                categoryAPI.getCategories(),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((product) => {
        const searchLower = searchTerm.toLowerCase();

        // Search in product name, description, category, and parent_category
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            (product.category && product.category.toLowerCase().includes(searchLower)) ||
            (product.parent_category && product.parent_category.toLowerCase().includes(searchLower));

        // Match by category or parent_category (from dropdown)
        const matchesCategory = !selectedCategory ||
            product.category === selectedCategory ||
            product.parent_category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

    return (
        <div className="products-page">
            <div className="container">
                <div className="page-header">
                    <h1>Our Products</h1>
                    <p>Discover amazing products from our sellers</p>
                </div>

                <div className="filters-sidebar">
                    <div className="filters-container">
                        <div className="filter-section">
                            <h3>Search</h3>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-section">
                            <h3>Category</h3>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-dropdown"
                            >
                                <option value="">All Categories</option>
                                {categories
                                    .filter(cat => !cat.parent)
                                    .map((category) => (
                                        <optgroup key={category.id} label={category.name}>
                                            <option value={category.name}>{category.name}</option>
                                            {categories
                                                .filter(subCat => subCat.parent === category.name)
                                                .map((subCategory) => (
                                                    <option key={subCategory.id} value={subCategory.name}>
                                                        &nbsp;&nbsp;↳ {subCategory.name}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="products-layout-horizontal">

                    <div className="products-content">
                        <div className="products-header">
                            <p className="results-count">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                            </p>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="no-products">
                                <p>No products found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
