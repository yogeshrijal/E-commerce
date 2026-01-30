import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

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
    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'esewa'
    const [shippingCost, setShippingCost] = useState(0);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.username || '',
                email: user.email || '',
                contact: user.contact || '',
                address: user.address || '',
            }));
        }
    }, [user]);

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

    const generateSignature = (totalAmount, transactionUuid, productCode) => {
        const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        const secretKey = "8gBm/:&EnhH.1/q"; // Test Secret Key
        const hash = CryptoJS.HmacSHA256(signatureString, secretKey);
        const signature = CryptoJS.enc.Base64.stringify(hash);
        return signature;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate cart items before submitting
            const invalidItems = cartItems.filter(item => !item?.sku?.id);
            if (invalidItems.length > 0) {
                toast.error('Some items in your cart are invalid. Please remove them and try again.');
                console.error('Invalid cart items:', invalidItems);
                setLoading(false);
                return;
            }

            // Prepare order data
            const orderData = {
                ...formData,
                total_amount: getGrandTotal() + shippingCost, // Include shipping in total if needed, but backend recalculates
                tax: getTax(),
                shipping_cost: shippingCost,
                order_item: cartItems.map((item) => ({
                    sku: Number(item.sku.id), // Backend expects integer ID
                    quantity_at_purchase: item.quantity,
                })),
            };

            console.log('Sending order data:', orderData); // Debug log

            const response = await orderAPI.createOrder(orderData);
            const orderId = response.data.id;

            if (paymentMethod === 'esewa') {
                // Construct eSewa v2 form data
                let totalAmountVal = getGrandTotal() + shippingCost;
                // Fix potential floating point issues
                totalAmountVal = Math.round(totalAmountVal * 100) / 100;

                // Match backend verification logic: whole numbers as integers, decimals with 2 places
                const totalAmount = (totalAmountVal % 1 === 0)
                    ? totalAmountVal.toString()  // "1356" for whole numbers
                    : totalAmountVal.toFixed(2);  // "1356.50" for decimals
                const transactionUuid = `${orderId}-${Date.now()}`; // Unique ID for every attempt

                // Clean up any existing pending payments for this order to prevent backend conflicts
                try {
                    const allPayments = await paymentAPI.getPayments();
                    // Filter for pending payments for this specific order
                    const pendingPayments = allPayments.data.filter(
                        p => p.order === orderId && p.status === 'pending'
                    );

                    if (pendingPayments.length > 0) {
                        console.log(`Cleaning up ${pendingPayments.length} pending payments for order ${orderId}`);
                        await Promise.all(pendingPayments.map(p => paymentAPI.deletePayment(p.id)));
                    }
                } catch (err) {
                    console.warn('Failed to cleanup old payments:', err);
                    // Continue flow - if cleanup fails, we still try to proceed
                }

                // Create Payment record in backend first
                await paymentAPI.createPayment({
                    order: orderId,
                    amount: totalAmount,
                    method: 'esewa',
                    status: 'pending',
                    transaction_uuid: transactionUuid
                });

                const productCode = "EPAYTEST";
                const signature = generateSignature(totalAmount, transactionUuid, productCode);

                const path = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
                const params = {
                    amount: totalAmount,
                    tax_amount: 0,
                    total_amount: totalAmount,
                    transaction_uuid: transactionUuid,
                    product_code: productCode,
                    product_service_charge: 0,
                    product_delivery_charge: 0,
                    success_url: `${window.location.origin}/payment/success`,
                    failure_url: `${window.location.origin}/payment/failure?oid=${orderId}`,
                    signed_field_names: "total_amount,transaction_uuid,product_code",
                    signature: signature,
                };

                // Create a hidden form and submit it
                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", path);

                for (const key in params) {
                    const hiddenField = document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", params[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                // For COD, create a pending payment record as well so we can track it
                let totalAmountVal = getGrandTotal() + shippingCost;
                totalAmountVal = Math.round(totalAmountVal * 100) / 100;
                const totalAmount = (totalAmountVal % 1 === 0) ? totalAmountVal.toString() : totalAmountVal.toFixed(2);

                // Try to create payment record for COD (failure shouldn't block order success though)
                try {
                    await paymentAPI.createPayment({
                        order: orderId,
                        amount: totalAmount,
                        method: 'cod',
                        status: 'pending',
                        transaction_uuid: `${orderId}-COD-${Date.now()}`
                    });
                } catch (err) {
                    console.error('Failed to create COD payment record:', err);
                }

                toast.success('Order placed successfully!');
                clearCart();
                navigate(`/orders/${orderId}`);
            }

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

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [cartItems, navigate]);

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
                <p>Redirecting to cart...</p>
            </div>
        );
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
                                    value={formData.full_name || ''}
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
                                    value={formData.email || ''}
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
                                    value={formData.contact || ''}
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
                                    value={formData.address || ''}
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
                                        value={formData.city || ''}
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
                                        value={formData.postal_code || ''}
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
                                    value={formData.country || 'Nepal'}
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

                            <div className="form-group">
                                <label>Payment Method *</label>
                                <div className="payment-methods">
                                    <div className={`payment-method ${paymentMethod === 'cod' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('cod')}>
                                        <input
                                            type="radio"
                                            id="cod"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                        />
                                        <label htmlFor="cod">Cash on Delivery</label>
                                    </div>
                                    <div className={`payment-method ${paymentMethod === 'esewa' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('esewa')}>
                                        <input
                                            type="radio"
                                            id="esewa"
                                            name="paymentMethod"
                                            value="esewa"
                                            checked={paymentMethod === 'esewa'}
                                            onChange={() => setPaymentMethod('esewa')}
                                        />
                                        <label htmlFor="esewa">eSewa Mobile Wallet</label>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Processing...' : (paymentMethod === 'esewa' ? 'Pay with eSewa' : 'Place Order')}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary-section">
                        <h2>Order Summary</h2>

                        <div className="summary-items">
                            {cartItems.map((item) => (
                                <div key={item?.sku?.sku_code || Math.random()} className="summary-item">
                                    <div className="item-info">
                                        <span className="item-name">{item?.product?.name || 'Unknown Product'}</span>
                                        <span className="item-qty">x{item?.quantity || 0}</span>
                                    </div>
                                    <span className="item-price">
                                        ${(Number(item?.sku?.price || 0) * (item?.quantity || 0)).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>${(getCartTotal() || 0).toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Tax (13%):</span>
                                <span>${(getTax() || 0).toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Shipping:</span>
                                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${((getGrandTotal() || 0) + shippingCost).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
