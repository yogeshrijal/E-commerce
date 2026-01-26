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
        country: 'Nepal', // Default country
    });
    const [shippingCost, setShippingCost] = useState(0);

    // Update shipping cost when country changes
    // Note: This logic mimics backend behavior for immediate UI feedback
    const calculateShippingCost = (country) => {
        const normalizedCountry = country.trim().toLowerCase();
        // Assuming backend settings: National (Nepal) = 0, International = 100 (example)
        // You might want to fetch these constants from an API if possible, 
        // but for now we'll hardcode to match typical backend defaults or set to 0 if unknown.
        // Since backend defaults are 0.00 in models, we'll stick to 0 for now unless specified.
        // If you know the specific values, update them here.
        // Based on serializers.py: 
        // if input_country == home_country (settings.SHIPPING_HOME_COUNTRY) -> settings.SHIPPING_COST_NATIONAL
        // else -> settings.SHIPPING_COST_INTERNATIONAL

        // For this implementation, we'll keep it simple as the backend recalculates it anyway.
        // We mainly need to send the country field.
        return 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === 'country') {
            setShippingCost(calculateShippingCost(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare order data
            const orderData = {
                ...formData,
                total_amount: getGrandTotal() + shippingCost, // Include shipping in total if needed, but backend recalculates
                tax: getTax(),
                shipping_cost: shippingCost,
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

                            <div className="form-group">
                                <label htmlFor="country">Country *</label>
                                <select
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                    className="form-control"
                                >
                                    <option value="Nepal">Nepal</option>
                                    <option value="India">India</option>
                                    <option value="China">China</option>
                                    <option value="USA">USA</option>
                                    <option value="UK">UK</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Other">Other</option>
                                </select>
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
                                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${(getGrandTotal() + shippingCost).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
