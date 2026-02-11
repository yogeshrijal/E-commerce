import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatPrice } from '../../utils/currency';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProductCompare = () => {
    const navigate = useNavigate();
    const { compareList, removeFromCompare, clearCompare } = useCompare();
    const { addToCart } = useCart();
    const { isAuthenticated, isCustomer } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (compareList.length === 0) {
            setLoading(false);
            return;
        }

        fetchCompareProducts();
    }, [compareList]);

    const fetchCompareProducts = async () => {
        try {
            setLoading(true);
            const productIds = compareList.map(p => p.id);
            const response = await productAPI.compareProducts(productIds);
            setProducts(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load comparison data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        if (!isCustomer) {
            toast.error('Only customers can add items to cart');
            return;
        }

        const sku = product.skus && product.skus.length > 0
            ? product.skus[0]
            : {
                sku_code: `BASE-${product.id}`,
                price: product.base_price,
                stock: product.stock,
            };

        if (sku.stock < 1) {
            toast.error('Product is out of stock');
            return;
        }

        addToCart(product, sku, 1);
    };

    const getAllSpecs = () => {
        const specsMap = new Map();
        products.forEach(product => {
            if (product.specs) {
                product.specs.forEach(spec => {
                    specsMap.set(spec.attribute, true);
                });
            }
        });
        return Array.from(specsMap.keys());
    };

    const getSpecValue = (product, attribute) => {
        if (!product.specs) return '-';
        const spec = product.specs.find(s => s.attribute === attribute);
        return spec ? spec.value : '-';
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchCompareProducts} />;

    if (compareList.length === 0) {
        return (
            <div className="compare-page">
                <div className="container">
                    <div className="empty-compare">
                        <div className="empty-icon">⚖️</div>
                        <h2>No Products to Compare</h2>
                        <p>Add products to your compare list to see them side by side</p>
                        <button onClick={() => navigate('/')} className="btn btn-primary">
                            Browse Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const allSpecs = getAllSpecs();
    const categoryName = products[0]?.category || 'Products';

    return (
        <div className="compare-page">
            <div className="container">
                <div className="compare-header">
                    <div>
                        <h1>Compare {categoryName}</h1>
                        <p>{products.length} product{products.length !== 1 ? 's' : ''} selected</p>
                    </div>
                    <button onClick={clearCompare} className="btn btn-secondary">
                        Clear All
                    </button>
                </div>

                <div className="compare-table-wrapper">
                    <table className="compare-table">
                        <tbody>
                            {/* Product Images & Names */}
                            <tr className="product-header-row">
                                <td className="spec-label">Product</td>
                                {products.map(product => (
                                    <td key={product.id} className="product-cell">
                                        <div className="product-header">
                                            <button
                                                onClick={() => removeFromCompare(product.id)}
                                                className="remove-btn"
                                                aria-label="Remove from compare"
                                            >
                                                ✕
                                            </button>
                                            <div
                                                className="product-image-wrapper"
                                                onClick={() => navigate(`/products/${product.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} />
                                                ) : (
                                                    <div className="no-image">No image</div>
                                                )}
                                            </div>
                                            <h3
                                                onClick={() => navigate(`/products/${product.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {product.name}
                                            </h3>
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Price */}
                            <tr>
                                <td className="spec-label">Price</td>
                                {products.map(product => (
                                    <td key={product.id} className="spec-value">
                                        <span className="price-large">{formatPrice(product.base_price)}</span>
                                    </td>
                                ))}
                            </tr>

                            {/* Stock */}
                            <tr>
                                <td className="spec-label">Availability</td>
                                {products.map(product => (
                                    <td key={product.id} className="spec-value">
                                        {product.stock > 0 ? (
                                            <span className="in-stock">✓ In Stock ({product.stock})</span>
                                        ) : (
                                            <span className="out-of-stock">✗ Out of Stock</span>
                                        )}
                                    </td>
                                ))}
                            </tr>

                            {/* Rating */}
                            <tr>
                                <td className="spec-label">Rating</td>
                                {products.map(product => (
                                    <td key={product.id} className="spec-value">
                                        {product.avg_rating ? (
                                            <div className="rating-info">
                                                <span className="stars">{'★'.repeat(Math.round(product.avg_rating))}</span>
                                                <span>{product.avg_rating.toFixed(1)}</span>
                                                <span className="review-count">({product.review_count} reviews)</span>
                                            </div>
                                        ) : (
                                            <span className="no-rating">No ratings yet</span>
                                        )}
                                    </td>
                                ))}
                            </tr>

                            {/* Description */}
                            <tr>
                                <td className="spec-label">Description</td>
                                {products.map(product => (
                                    <td key={product.id} className="spec-value description">
                                        {product.description}
                                    </td>
                                ))}
                            </tr>

                            {/* Specifications */}
                            {allSpecs.length > 0 && (
                                <>
                                    <tr className="section-divider">
                                        <td colSpan={products.length + 1}>
                                            <h3>Specifications</h3>
                                        </td>
                                    </tr>
                                    {allSpecs.map(attribute => (
                                        <tr key={attribute}>
                                            <td className="spec-label">{attribute}</td>
                                            {products.map(product => (
                                                <td key={product.id} className="spec-value">
                                                    {getSpecValue(product, attribute)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* Add to Cart Buttons */}
                            <tr className="action-row">
                                <td className="spec-label">Actions</td>
                                {products.map(product => (
                                    <td key={product.id} className="spec-value">
                                        <div className="action-buttons">
                                            {isCustomer && product.stock > 0 && (
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="btn btn-primary btn-small"
                                                >
                                                    Add to Cart
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/products/${product.id}`)}
                                                className="btn btn-secondary btn-small"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductCompare;
