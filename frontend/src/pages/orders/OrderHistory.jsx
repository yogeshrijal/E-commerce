import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI, productAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, productsRes] = await Promise.all([
                orderAPI.getOrders(),
                productAPI.getProducts()
            ]);

            let fetchedOrders = ordersRes.data;
            const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
            const now = Date.now();
            const ordersToCancel = [];

            // Check for stale pending orders
            fetchedOrders.forEach(order => {
                if (order.status === 'pending') {
                    const createdTime = new Date(order.created_at).getTime();
                    if (now - createdTime > STALE_THRESHOLD_MS) {
                        ordersToCancel.push(order.id);
                    }
                }
            });

            // Cancel stale orders
            if (ordersToCancel.length > 0) {
                await Promise.all(ordersToCancel.map(id =>
                    orderAPI.updateOrder(id, { status: 'canceled' })
                ));

                // Update local state to reflect cancellation
                fetchedOrders = fetchedOrders.map(order =>
                    ordersToCancel.includes(order.id)
                        ? { ...order, status: 'canceled' }
                        : order
                );

                // Optional: Notify user
                // toast.info(`${ordersToCancel.length} incomplete order(s) were canceled.`);
            }

            setOrders(fetchedOrders);
            setProducts(productsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load orders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getProductNames = (orderItems) => {
        if (!orderItems || orderItems.length === 0) return '';

        const names = orderItems.map(item => {
            // Find product that has this SKU
            for (const product of products) {
                const foundSku = product.skus.find(s => s.id === item.sku || s.sku_code === item.sku);
                if (foundSku) {
                    return product.name;
                }
            }
            return 'Unknown Product';
        });

        // Unique names only
        const uniqueNames = [...new Set(names)];
        return uniqueNames.join(', ');
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
                                        <span className="total-amount">${Number(order.total_amount).toFixed(2)}</span>
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
