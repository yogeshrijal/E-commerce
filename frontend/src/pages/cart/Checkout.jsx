import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, paymentAPI, productAPI } from '../../services/api';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import { formatPrice } from '../../utils/currency';

const Checkout = () => {
    const { cartItems, getCartTotal, getTax, getGrandTotal, clearCart, getSellerGroups, hasMultipleSellers, removeFromCart } = useCart();
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
    const [shippingRates, setShippingRates] = useState({});
    const [shippingCost, setShippingCost] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [errors, setErrors] = useState({}); useEffect(() => {
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

    useEffect(() => {
        const fetchShippingRates = async () => {
            try {
                const response = await fetch('/api/shippingzone/');
                const data = await response.json();
                const rates = {};
                data.forEach(zone => {
                    rates[zone.country_name.toLowerCase()] = parseFloat(zone.rate);
                });
                setShippingRates(rates);

                const initialCountry = formData.country || 'Nepal';
                const initialRate = rates[initialCountry.toLowerCase()] || 0;
                setShippingCost(initialRate);
            } catch (error) {
                console.error('Error fetching shipping rates:', error);
                setShippingCost(0);
            }
        };
        fetchShippingRates();
    }, []);

    const calculateShippingCost = (country) => {
        const normalizedCountry = country.trim().toLowerCase();

        return shippingRates[normalizedCountry] || 0;
    };

    const validateField = (name, value) => {
        let error = '';

        const stringValue = String(value || ''); switch (name) {
            case 'full_name':
                if (!stringValue.trim()) {
                    error = 'Full name is required';
                } else if (stringValue.trim().length < 2) {
                    error = 'Full name must be at least 2 characters';
                }
                break;
            case 'email':
                if (!stringValue.trim()) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'contact':
                if (!stringValue.trim()) {
                    error = 'Contact number is required';
                } else if (!/^98\d{8}$/.test(stringValue.replace(/[\s-]/g, ''))) {
                    error = 'Please enter a valid Nepali phone number (10 digits starting with 98)';
                }
                break;
            case 'address':
                if (!stringValue.trim()) {
                    error = 'Address is required';
                } else if (stringValue.trim().length < 5) {
                    error = 'Address must be at least 5 characters';
                }
                break;
            case 'city':
                if (!stringValue.trim()) {
                    error = 'City is required';
                }
                break;
            case 'postal_code':
                if (!stringValue.trim()) {
                    error = 'Postal code is required';
                }
                break;
            case 'country':
                if (!stringValue.trim()) {
                    error = 'Country is required';
                }
                break;
            default:
                break;
        }

        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));

        if (name === 'country') {
            setShippingCost(calculateShippingCost(value));
        }
        if (name === 'country') {
            setShippingCost(calculateShippingCost(value));
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        try {
            const subtotal = getCartTotal();
            const response = await orderAPI.applyCoupon({
                code: couponCode,
                subtotal: subtotal
            });

            if (response.data.valid) {
                setDiscountAmount(parseFloat(response.data.discount));
                setAppliedCoupon(couponCode);
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Coupon error:', error);
            setDiscountAmount(0);
            setAppliedCoupon('');
            setAppliedCoupon('');

            let message = 'Failed to apply coupon';
            if (error.response?.data) {
                if (error.response.data.message) {
                    message = error.response.data.message;
                } else if (error.response.data.detail) {
                    message = error.response.data.detail;
                } else if (typeof error.response.data === 'string') {
                    message = error.response.data;
                } else {
                    message = JSON.stringify(error.response.data);
                }
            }
            toast.error(message);
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

        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        // Check if coupon is entered but not applied
        if (couponCode.trim() && (!appliedCoupon || appliedCoupon !== couponCode.trim())) {
            toast.warn('Please apply the coupon or clear the field before placing the order');
            return;
        }

        setLoading(true);

        try {
            const invalidItems = cartItems.filter(item => !item?.sku?.id && !item?.sku?.sku_code);
            if (invalidItems.length > 0) {
                toast.error('Some items in your cart are invalid. Please remove them and try again.');
                console.error('Invalid cart items:', invalidItems);
                setLoading(false);
                return;
            }

            const orderItems = [];
            for (const item of cartItems) {
                if (item.sku.id) {
                    orderItems.push({
                        sku: Number(item.sku.id),
                        quantity_at_purchase: item.quantity,
                    });
                } else {
                    try {
                        const productResponse = await productAPI.getProduct(item.product.id);
                        const baseSKU = productResponse.data.skus?.find(s => s.sku_code === item.sku.sku_code);
                        if (!baseSKU || !baseSKU.id) {
                            throw new Error(`SKU ${item.sku.sku_code} not found`);
                        }
                        orderItems.push({
                            sku: Number(baseSKU.id),
                            quantity_at_purchase: item.quantity,
                        });
                    } catch (err) {
                        console.error(`Failed to fetch SKU id for ${item.sku.sku_code}:`, err);
                        // Auto-remove invalid item
                        const invalidSku = item.sku.sku_code;
                        // removeFromCart is not available in handleSubmit scope directly if not de-structured
                        // We need to make sure removeFromCart is available. 
                        // Check line 11: const { ... } = useCart();
                        // We need to add removeFromCart to destructuring at the top.

                        // For now, let's just throw, but we should fix destructuring first.
                        // Actually, I can't easily change the destructuring line and this block in one go safely with replace.
                        // I will throw a specific error with the SKU code to be handled in catch block?
                        // Or better, I will assume I will fix destructuring in another step or this step if I can.
                        throw new Error(`Invalid SKU: ${item.sku.sku_code}`);
                    }
                }
            }

            const orderData = {
                ...formData,
                total_amount: getGrandTotal() + shippingCost, // Include shipping in total if needed, but backend recalculates
                tax: getTax(),
                shipping_cost: shippingCost,
                order_item: orderItems,
                shipping_cost: shippingCost,
                order_item: orderItems,
                coupon_code: appliedCoupon, // Use applied coupon code
            };

            console.log('Sending order data:', orderData); // Debug log

            const response = await orderAPI.createOrder(orderData);
            const orderId = response.data.id;
            // Use the total amount sent back from the backend (which includes any discounts)
            const finalTotal = parseFloat(response.data.total_amount);

            if (paymentMethod === 'esewa') {
                let totalAmountVal = finalTotal;
                totalAmountVal = Math.round(totalAmountVal * 100) / 100;

                const totalAmount = (totalAmountVal % 1 === 0)
                    ? totalAmountVal.toString()  // "1356" for whole numbers
                    : totalAmountVal.toFixed(2);  // "1356.50" for decimals
                const transactionUuid = `${orderId}-${Date.now()}`; // Unique ID for every attempt

                try {
                    const allPayments = await paymentAPI.getPayments();
                    const pendingPayments = allPayments.data.filter(
                        p => p.order === orderId && p.status === 'pending'
                    );

                    if (pendingPayments.length > 0) {
                        console.log(`Cleaning up ${pendingPayments.length} pending payments for order ${orderId}`);
                        await Promise.all(pendingPayments.map(p => paymentAPI.deletePayment(p.id)));
                    }
                } catch (err) {
                    console.warn('Failed to cleanup old payments:', err);
                }

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
                let totalAmountVal = finalTotal;
                totalAmountVal = Math.round(totalAmountVal * 100) / 100;
                const totalAmount = (totalAmountVal % 1 === 0) ? totalAmountVal.toString() : totalAmountVal.toFixed(2);

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

            // Check for Invalid SKU error
            if (error.message && error.message.includes('Invalid SKU:')) {
                const invalidSku = error.message.split('Invalid SKU:')[1].trim();
                removeFromCart(invalidSku);
                toast.error(`Removed invalid item (${invalidSku}) from cart. Please try placing order again.`);
                setLoading(false);
                return;
            }

            console.error('Error response:', error.response?.data);
            console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));

            const message = error.response?.data?.order_item?.[0] ||
                JSON.stringify(error.response?.data?.order_item) ||
                error.response?.data?.detail ||
                error.response?.data?.error ||
                error.message ||
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
                            <div className={`form-group ${errors.full_name ? 'error' : ''}`}>
                                <label htmlFor="full_name">Full Name *</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.full_name && <span className="error-message">{errors.full_name}</span>}
                            </div>

                            <div className={`form-group ${errors.email ? 'error' : ''}`}>
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            <div className={`form-group ${errors.contact ? 'error' : ''}`}>
                                <label htmlFor="contact">Contact Number *</label>
                                <input
                                    type="text"
                                    id="contact"
                                    name="contact"
                                    value={formData.contact || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.contact && <span className="error-message">{errors.contact}</span>}
                            </div>

                            <div className={`form-group ${errors.address ? 'error' : ''}`}>
                                <label htmlFor="address">Address *</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.address && <span className="error-message">{errors.address}</span>}
                            </div>

                            <div className="form-row">
                                <div className={`form-group ${errors.city ? 'error' : ''}`}>
                                    <label htmlFor="city">City *</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.city && <span className="error-message">{errors.city}</span>}
                                </div>

                                <div className={`form-group ${errors.postal_code ? 'error' : ''}`}>
                                    <label htmlFor="postal_code">Postal Code *</label>
                                    <input
                                        type="text"
                                        id="postal_code"
                                        name="postal_code"
                                        value={formData.postal_code || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.postal_code && <span className="error-message">{errors.postal_code}</span>}
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
                                <label htmlFor="couponCode">Coupon Code (Optional)</label>
                                <div className="coupon-input-group" style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        id="couponCode"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter coupon code"
                                        disabled={!!appliedCoupon}
                                        className="form-control"
                                    />
                                    {appliedCoupon ? (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setAppliedCoupon('');
                                                setDiscountAmount(0);
                                                setCouponCode('');
                                                toast.info('Coupon removed');
                                            }}
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleApplyCoupon}
                                        >
                                            Apply
                                        </button>
                                    )}
                                </div>
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

                        {hasMultipleSellers() && (
                            <div className="multi-seller-notice">
                                <p>ℹ️ This order contains products from multiple sellers</p>
                            </div>
                        )}

                        <div className="summary-items">
                            {Object.entries(getSellerGroups()).map(([seller, items]) => (
                                <div key={seller} className="seller-group-summary">
                                    <div className="seller-label">
                                        <strong>Seller: {seller}</strong>
                                    </div>
                                    {items.map((item) => (
                                        <div key={item?.sku?.sku_code || Math.random()} className="summary-item">
                                            <div className="item-info">
                                                <span className="item-name">{item?.product?.name || 'Unknown Product'}</span>
                                                <span className="item-qty">x{item?.quantity || 0}</span>
                                            </div>
                                            <span className="item-price">
                                                {formatPrice(Number(item?.sku?.price || 0) * (item?.quantity || 0))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>{formatPrice(getCartTotal() || 0)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Tax (13%):</span>
                                <span>{formatPrice(getTax() || 0)}</span>
                            </div>

                            {discountAmount > 0 && (
                                <div className="summary-row discount" style={{ color: 'green' }}>
                                    <span>Discount:</span>
                                    <span>-{formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            <div className="summary-row">
                                <span>Shipping:</span>
                                <span>{formatPrice(shippingCost)}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>{formatPrice((getGrandTotal() || 0) + shippingCost - discountAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
