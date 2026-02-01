import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/currency';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, getTax, getGrandTotal, getSellerGroups, hasMultipleSellers } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <h2>Please login to view your cart</h2>
                        <Link to="/login" className="btn btn-primary">Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <h2>Your cart is empty</h2>
                        <p>Start shopping to add items to your cart</p>
                        <Link to="/products" className="btn btn-primary">Browse Products</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart</h1>

                <div className="cart-layout">
                    <div className="cart-items">
                        {hasMultipleSellers() && (
                            <div className="multi-seller-notice">
                                <p>ℹ️ Your cart contains products from multiple sellers. They will be included in a single order.</p>
                            </div>
                        )}

                        {Object.entries(getSellerGroups()).map(([seller, items]) => (
                            <div key={seller} className="seller-group">
                                <div className="seller-header">
                                    <h3>Sold by: {seller}</h3>
                                    <span className="item-count">{items.length} item{items.length > 1 ? 's' : ''}</span>
                                </div>

                                {items.map((item) => (
                                    <div key={item.sku.sku_code} className="cart-item">
                                        <div className="item-image">
                                            {item.product.image ? (
                                                <img src={item.product.image} alt={item.product.name} />
                                            ) : (
                                                <div className="no-image">No image</div>
                                            )}
                                        </div>

                                        <div className="item-details">
                                            <h3>{item.product.name}</h3>
                                            <p className="item-sku">SKU: {item.sku.sku_code}</p>
                                            {item.sku.sku_attribute && item.sku.sku_attribute.length > 0 && (
                                                <div className="item-attributes">
                                                    {item.sku.sku_attribute.map((attr, idx) => (
                                                        <span key={idx} className="attribute-tag">
                                                            {attr.attribute}: {attr.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="item-price">
                                            {formatPrice(item.sku.price)}
                                        </div>

                                        <div className="item-quantity">
                                            <button
                                                onClick={() => updateQuantity(item.sku.sku_code, item.quantity - 1)}
                                                className="qty-btn"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.sku.sku_code, parseInt(e.target.value) || 1)}
                                                min="1"
                                                max={item.sku.stock}
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.sku.sku_code, item.quantity + 1)}
                                                className="qty-btn"
                                                disabled={item.quantity >= item.sku.stock}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="item-total">
                                            {formatPrice(Number(item.sku.price) * item.quantity)}
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.sku.sku_code)}
                                            className="remove-btn"
                                            aria-label="Remove item"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h2>Order Summary</h2>

                        <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>{formatPrice(getCartTotal())}</span>
                        </div>

                        <div className="summary-row">
                            <span>Tax (13%):</span>
                            <span>{formatPrice(getTax())}</span>
                        </div>

                        <div className="summary-row total">
                            <span>Total:</span>
                            <span>{formatPrice(getGrandTotal())}</span>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn btn-primary btn-block"
                        >
                            Proceed to Checkout
                        </button>

                        <Link to="/products" className="continue-shopping">
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
