import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI, productAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ReviewForm from '../../components/reviews/ReviewForm';
import { toast } from 'react-toastify';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItemForReview, setSelectedItemForReview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [orderRes, productsRes] = await Promise.all([
                    orderAPI.getOrder(id),
                    productAPI.getProducts()
                ]);
                setOrder(orderRes.data);
                setProducts(productsRes.data);
                setError(null);
            } catch (err) {
                setError('Failed to load order details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getProductDetails = (skuId) => {
        // skuId might be an ID or a code depending on backend response, 
        // but usually in OrderItem it's the ID or the string representation.
        // Based on serializers, it seems to be the ID or object if nested.
        // Let's assume it's an ID first.

        for (const product of products) {
            const foundSku = product.skus.find(s => s.id === skuId || s.sku_code === skuId);
            if (foundSku) {
                return {
                    name: product.name,
                    image: foundSku.image || product.image,
                    sku_code: foundSku.sku_code,
                    productId: product.id
                };
            }
        }
        // Fallback if we can't find it (maybe deleted product)
        return { name: 'Unknown Product', image: null, sku_code: skuId, productId: null };
    };

    const getStatusSteps = () => {
        const steps = ['pending', 'processing', 'shipped', 'delivered'];
        const currentIndex = steps.indexOf(order.status);
        return steps.map((step, index) => ({
            name: step,
            completed: index <= currentIndex,
            active: index === currentIndex,
        }));
    };

    const handleWriteReview = (item, details) => {
        if (!details.productId) {
            toast.error('Cannot review this product');
            return;
        }
        setSelectedItemForReview({
            productId: details.productId,
            skuId: item.sku,
            productName: details.name
        });
        setReviewModalOpen(true);
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
    if (!order) return <ErrorMessage message="Order not found" />;

    return (
        <div className="order-detail-page">
            <div className="container">
                <div className="page-header">
                    <Link to="/orders" className="back-link">← Back to Orders</Link>
                    <h1>Order #{order.id}</h1>
                </div>

                <div className="order-detail-layout">
                    <div className="order-main">
                        {order.status !== 'canceled' && (
                            <div className="order-status-timeline">
                                <h2>Order Status</h2>
                                <div className="timeline">
                                    {getStatusSteps().map((step, index) => (
                                        <div
                                            key={step.name}
                                            className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
                                        >
                                            <div className="step-indicator">
                                                {step.completed ? '✓' : index + 1}
                                            </div>
                                            <div className="step-label">
                                                {step.name.charAt(0).toUpperCase() + step.name.slice(1)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.status === 'canceled' && (
                            <div className="order-canceled">
                                <h2>This order has been canceled</h2>
                            </div>
                        )}

                        <div className="order-items-section">
                            <h2>Order Items</h2>
                            <div className="order-items">
                                {order.order_item && order.order_item.map((item) => {
                                    const details = getProductDetails(item.sku);
                                    return (
                                        <div key={item.id} className="order-item">
                                            {details.image && (
                                                <div className="item-image">
                                                    <img src={details.image} alt={details.name} />
                                                </div>
                                            )}
                                            <div className="item-details">
                                                <h3>{details.name}</h3>
                                                <p className="item-sku">SKU: {details.sku_code}</p>
                                                <p className="item-quantity">Quantity: {item.quantity_at_purchase}</p>
                                            </div>
                                            <div className="item-pricing">
                                                <p className="item-price">${Number(item.price_at_purchase).toFixed(2)} each</p>
                                                <p className="item-total">
                                                    ${(Number(item.price_at_purchase) * item.quantity_at_purchase).toFixed(2)}
                                                </p>
                                                {order.status === 'delivered' && (
                                                    <button
                                                        className="btn btn-sm btn-secondary mt-2"
                                                        style={{ marginTop: '0.5rem' }}
                                                        onClick={() => handleWriteReview(item, details)}
                                                    >
                                                        Write Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cancel Order Button */}
                        {['pending', 'processing'].includes(order.status) && (
                            <div className="order-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to cancel this order?')) {
                                            try {
                                                setLoading(true);
                                                await orderAPI.updateOrder(order.id, { status: 'canceled' });
                                                // Refresh order details
                                                // fetchOrder(); // This function is not defined in the original code, need to fix
                                                window.location.reload();
                                            } catch (err) {
                                                console.error(err);
                                                // Error is handled by global toast or we can add specific handling here
                                                alert('your order is cancelled');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                >
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="order-sidebar">
                        <div className="order-info-card">
                            <h3>Order Information</h3>
                            <div className="info-row">
                                <span>Order Date:</span>
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="info-row">
                                <span>Status:</span>
                                <span className="status-badge">
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>
                            {order.transaction_id && (
                                <div className="info-row">
                                    <span>Transaction ID:</span>
                                    <span>{order.transaction_id}</span>
                                </div>
                            )}
                            <div className="info-row">
                                <span>Payment Status:</span>
                                <span className={`status-badge ${order.payment_details?.[0]?.status || 'pending'}`}>
                                    {order.payment_details?.[0]?.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="shipping-info-card">
                            <h3>Shipping Address</h3>
                            <p><strong>{order.full_name}</strong></p>
                            <p>{order.email}</p>
                            <p>{order.contact}</p>
                            <p>{order.address}</p>
                            <p>{order.city}, {order.postal_code}</p>
                        </div>

                        <div className="order-summary-card">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>
                                    ${(Number(order.total_amount) - Number(order.tax) - Number(order.shipping_cost)).toFixed(2)}
                                </span>
                            </div>
                            <div className="summary-row">
                                <span>Tax:</span>
                                <span>${Number(order.tax).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping:</span>
                                <span>${Number(order.shipping_cost).toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {reviewModalOpen && selectedItemForReview && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Review {selectedItemForReview.productName}</h3>
                            <button className="modal-close" onClick={() => setReviewModalOpen(false)}>×</button>
                        </div>
                        <ReviewForm
                            productId={selectedItemForReview.productId}
                            orderId={order.id}
                            skuId={selectedItemForReview.skuId}
                            onReviewAdded={() => {
                                setReviewModalOpen(false);
                                toast.success('Review submitted successfully');
                            }}
                            onCancel={() => setReviewModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;
