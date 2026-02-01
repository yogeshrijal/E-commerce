import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatPrice } from '../../utils/currency';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const ordersRes = await orderAPI.getOrders();
            setOrders(ordersRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load orders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getProductNames = (orderItems) => {
        if (!orderItems || orderItems.length === 0) return 'No items';

        return `${orderItems.length} item${orderItems.length > 1 ? 's' : ''}`;
    };

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered',
            canceled: 'status-canceled',
        };
        return statusClasses[status] || '';
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

    return (
        <div className="orders-page">
            <div className="container">
                <h1>My Orders</h1>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>You haven't placed any orders yet.</p>
                        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                                <div className="order-header">
                                    <div className="order-id">
                                        <strong>Order #{order.id}</strong>
                                        <span className="order-date">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`order-status ${getStatusClass(order.status)}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>

                                <div className="order-details">
                                    <div className="order-info">
                                        <p><strong>Shipping to:</strong> {order.full_name}</p>
                                        <p>{order.address}, {order.city} - {order.postal_code}</p>
                                    </div>
                                    <div className="order-total">
                                        <span className="total-label">Total:</span>
                                        <span className="total-amount">{formatPrice(order.total_amount)}</span>
                                    </div>
                                </div>

                                <div className="order-items-preview">
                                    {order.order_item && order.order_item.length > 0 && (
                                        <>
                                            <p className="items-count">
                                                {order.order_item.length} {order.order_item.length === 1 ? 'item' : 'items'}
                                            </p>
                                            <p className="items-summary">
                                                {getProductNames(order.order_item)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
