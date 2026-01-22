import { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

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
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Match by category or parent_category
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

                <div className="products-layout">
                    <aside className="filters-sidebar">
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
                            <h3>Categories</h3>
                            <div className="category-filters">
                                <button
                                    className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('')}
                                >
                                    All Categories
                                </button>
                                {categories
                                    .filter(cat => !cat.parent)
                                    .map((category) => (
                                        <div key={category.id}>
                                            <button
                                                className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
                                                onClick={() => setSelectedCategory(category.name)}
                                            >
                                                {category.name}
                                            </button>
                                            {categories
                                                .filter(subCat => subCat.parent === category.name)
                                                .map((subCategory) => (
                                                    <button
                                                        key={subCategory.id}
                                                        className={`category-btn subcategory ${selectedCategory === subCategory.name ? 'active' : ''}`}
                                                        onClick={() => setSelectedCategory(subCategory.name)}
                                                    >
                                                        ↳ {subCategory.name}
                                                    </button>
                                                ))}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </aside>

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
