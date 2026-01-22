import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, getTax, getGrandTotal } = useCart();
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
                        {cartItems.map((item) => (
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
                                    ${Number(item.sku.price).toFixed(2)}
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
                                    ${(Number(item.sku.price) * item.quantity).toFixed(2)}
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

                    <div className="cart-summary">
                        <h2>Order Summary</h2>

                        <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>${getCartTotal().toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Tax (13%):</span>
                            <span>${getTax().toFixed(2)}</span>
                        </div>

                        <div className="summary-row total">
                            <span>Total:</span>
                            <span>${getGrandTotal().toFixed(2)}</span>
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
