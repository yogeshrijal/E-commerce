import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Checkout = () => {
    const { cartItems, getCartTotal, getTax, getGrandTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.username || '',
        email: user?.email || '',
        contact: user?.contact || '',
        address: user?.address || '',
        city: '',
        postal_code: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare order data
            const orderData = {
                ...formData,
                total_amount: getGrandTotal(),
                tax: getTax(),
                shipping_cost: 0,
                order_item: cartItems.map((item) => ({
                    sku: item.sku.id || item.sku.sku_code, // Send SKU ID if available
                    quantity_at_purchase: item.quantity,
                })),
            };

            console.log('Sending order data:', orderData); // Debug log

            const response = await orderAPI.createOrder(orderData);

            toast.success('Order placed successfully!');
            clearCart();
            navigate(`/orders/${response.data.id}`);
        } catch (error) {
            console.error('Order error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));

            const message = error.response?.data?.order_item?.[0] ||
                JSON.stringify(error.response?.data?.order_item) ||
                error.response?.data?.detail ||
                'Failed to place order';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                <div className="checkout-layout">
                    <div className="checkout-form-section">
                        <h2>Shipping Information</h2>

                        <form onSubmit={handleSubmit} className="checkout-form">
                            <div className="form-group">
                                <label htmlFor="full_name">Full Name *</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contact">Contact Number *</label>
                                <input
                                    type="number"
                                    id="contact"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address *</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">City *</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="postal_code">Postal Code *</label>
                                    <input
                                        type="text"
                                        id="postal_code"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary-section">
                        <h2>Order Summary</h2>

                        <div className="summary-items">
                            {cartItems.map((item) => (
                                <div key={item.sku.sku_code} className="summary-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.product.name}</span>
                                        <span className="item-qty">x{item.quantity}</span>
                                    </div>
                                    <span className="item-price">
                                        ${(Number(item.sku.price) * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>${getCartTotal().toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Tax (13%):</span>
                                <span>${getTax().toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Shipping:</span>
                                <span>Free</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${getGrandTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
