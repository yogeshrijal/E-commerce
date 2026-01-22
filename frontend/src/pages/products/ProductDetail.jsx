import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { toast } from 'react-toastify';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated, isCustomer } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSKU, setSelectedSKU] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getProduct(id);
            setProduct(response.data);

            // Auto-select first SKU if available
            if (response.data.skus && response.data.skus.length > 0) {
                setSelectedSKU(response.data.skus[0]);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load product details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        if (!isCustomer) {
            toast.error('Only customers can add items to cart');
            return;
        }

        const skuToAdd = selectedSKU || {
            sku_code: `BASE-${product.id}`,
            price: product.base_price,
            stock: product.stock,
        };

        if (skuToAdd.stock < quantity) {
            toast.error('Insufficient stock');
            return;
        }

        addToCart(product, skuToAdd, quantity);
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchProduct} />;
    if (!product) return <ErrorMessage message="Product not found" />;

    const currentPrice = selectedSKU ? selectedSKU.price : product.base_price;
    const currentStock = selectedSKU ? selectedSKU.stock : product.stock;
    const currentImage = selectedSKU?.image || product.image;

    return (
        <div className="product-detail-page">
            <div className="container">
                <div className="product-detail">
                    <div className="product-gallery">
                        <div className="main-image">
                            {currentImage ? (
                                <img src={currentImage} alt={product.name} />
                            ) : (
                                <div className="no-image">No image available</div>
                            )}
                        </div>
                    </div>

                    <div className="product-info-section">
                        <h1 className="product-title">{product.name}</h1>

                        <div className="product-meta">
                            <span className="category-tag">{product.category}</span>
                            {product.parent_category && (
                                <span className="parent-category">{product.parent_category}</span>
                            )}
                        </div>

                        <div className="product-price">
                            <span className="price">${Number(currentPrice).toFixed(2)}</span>
                        </div>

                        <div className="stock-info">
                            {currentStock > 0 ? (
                                <span className="in-stock">✓ In Stock ({currentStock} available)</span>
                            ) : (
                                <span className="out-of-stock">✗ Out of Stock</span>
                            )}
                        </div>

                        <div className="product-description">
                            <h3>Description</h3>
                            <p>{product.description}</p>
                        </div>

                        {product.specs && product.specs.length > 0 && (
                            <div className="product-specs">
                                <h3>Specifications</h3>
                                <ul>
                                    {product.specs.map((spec, index) => (
                                        <li key={index}>
                                            <strong>{spec.attribute}:</strong> {spec.value}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {product.skus && product.skus.length > 0 && (
                            <div className="product-variants">
                                <h3>Available Variants</h3>
                                <div className="sku-options">
                                    {product.skus.map((sku) => (
                                        <button
                                            key={sku.sku_code}
                                            className={`sku-option ${selectedSKU?.sku_code === sku.sku_code ? 'active' : ''}`}
                                            onClick={() => setSelectedSKU(sku)}
                                        >
                                            <div className="sku-info">
                                                <span className="sku-code">{sku.sku_code}</span>
                                                {sku.sku_attribute && sku.sku_attribute.length > 0 && (
                                                    <div className="sku-attributes">
                                                        {sku.sku_attribute.map((attr, idx) => (
                                                            <span key={idx} className="attribute">
                                                                {attr.attribute}: {attr.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="sku-price">${Number(sku.price).toFixed(2)}</span>
                                                <span className="sku-stock">Stock: {sku.stock}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isCustomer && currentStock > 0 && (
                            <div className="add-to-cart-section">
                                <div className="quantity-selector">
                                    <label htmlFor="quantity">Quantity:</label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        min="1"
                                        max={currentStock}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <button onClick={handleAddToCart} className="btn btn-primary btn-large">
                                    Add to Cart
                                </button>
                            </div>
                        )}

                        {product.created_by && (
                            <div className="seller-info">
                                <p>Sold by: <strong>{product.created_by}</strong></p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
