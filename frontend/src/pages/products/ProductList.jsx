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
    const [sortBy, setSortBy] = useState('name-asc');

    useEffect(() => {
        fetchData();
    }, [sortBy]); // Re-fetch when sort changes for rating-based sorts

    const fetchData = async () => {
        try {
            setLoading(true);

            const orderingParam = sortBy === 'rating-desc' ? '-avg_rating' :
                sortBy === 'rating-asc' ? 'avg_rating' : null;

            const [productsRes, categoriesRes] = await Promise.all([
                productAPI.getProducts(orderingParam ? { ordering: orderingParam } : {}),
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

    const filteredProducts = products
        .filter((product) => {
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch = !searchTerm ||
                product.name.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower) ||
                (product.category && product.category.toLowerCase().includes(searchLower)) ||
                (product.parent_category && product.parent_category.toLowerCase().includes(searchLower));

            const matchesCategory = !selectedCategory ||
                product.category === selectedCategory ||
                product.parent_category === selectedCategory;

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'rating-desc' || sortBy === 'rating-asc') {
                return 0;
            }

            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return Number(a.base_price) - Number(b.base_price);
                case 'price-desc':
                    return Number(b.base_price) - Number(a.base_price);
                case 'stock-asc':
                    return a.stock - b.stock;
                case 'stock-desc':
                    return b.stock - a.stock;
                default:
                    return 0;
            }
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
                            <label htmlFor="search-input">Search</label>
                            <input
                                id="search-input"
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filter-section">
                            <label htmlFor="category-select">Category</label>
                            <select
                                id="category-select"
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

                        <div className="filter-section">
                            <label htmlFor="sort-select">Sort By</label>
                            <select
                                id="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-dropdown"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="price-asc">Price (Low to High)</option>
                                <option value="price-desc">Price (High to Low)</option>
                                <option value="rating-desc">Rating (High to Low)</option>
                                <option value="rating-asc">Rating (Low to High)</option>
                                <option value="stock-asc">Stock (Low to High)</option>
                                <option value="stock-desc">Stock (High to Low)</option>
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
