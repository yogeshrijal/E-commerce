import { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderAPI.updateOrder(orderId, { status: newStatus });
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            console.error('Update error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update order status';
            toast.error(errorMessage);
        }
    };

    const filteredOrders = filterStatus
        ? orders.filter((order) => order.status === filterStatus)
        : orders;

    // Sellers can only move forward: pending -> processing -> shipped
    const getNextStatus = (currentStatus) => {
        const flow = ['pending', 'processing', 'shipped'];
        const currentIndex = flow.indexOf(currentStatus);
        if (currentIndex !== -1 && currentIndex < flow.length - 1) {
            return flow[currentIndex + 1];
        }
        return null;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="seller-orders-page">
            <div className="container">
                <h1>Manage Orders</h1>

                <div className="filters">
                    <label htmlFor="statusFilter">Filter by Status:</label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="canceled">Canceled</option>
                    </select>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="no-results">
                        <p>No orders found.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="order-card-admin">
                                <div className="order-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                    <div className="order-info">
                                        <h3>Order #{order.id}</h3>
                                        <p>{order.full_name}</p>
                                        <p className="order-date">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="order-meta">
                                        <span className="order-total">${Number(order.total_amount).toFixed(2)}</span>
                                        <span className={`status-badge status-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                {expandedOrder === order.id && (
                                    <div className="order-details-admin">
                                        <div className="order-section">
                                            <h4>Shipping Address</h4>
                                            <p>{order.address}, {order.city} - {order.postal_code}</p>
                                            <p>Contact: {order.contact}</p>
                                        </div>

                                        <div className="order-section">
                                            <h4>Order Items</h4>
                                            {order.order_item && order.order_item.map((item) => (
                                                <div key={item.id} className="order-item-row">
                                                    <span>SKU: {item.sku}</span>
                                                    <span>Qty: {item.quantity_at_purchase}</span>
                                                    <span>${Number(item.price_at_purchase).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-section">
                                            <h4>Update Status</h4>
                                            <div className="status-buttons">
                                                {/* Show current status as active/disabled */}
                                                <button
                                                    className={`status-btn active`}
                                                    disabled
                                                >
                                                    Current: {order.status}
                                                </button>

                                                {/* Show next available status if any */}
                                                {getNextStatus(order.status) && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                                                        className="status-btn"
                                                    >
                                                        Mark as {getNextStatus(order.status)}
                                                    </button>
                                                )}

                                                {/* Cancel Button for Sellers */}
                                                {['pending', 'processing'].includes(order.status) && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to cancel this order?')) {
                                                                handleStatusUpdate(order.id, 'canceled');
                                                            }
                                                        }}
                                                        className="status-btn danger"
                                                        style={{ marginLeft: 'auto', backgroundColor: '#dc3545' }}
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}
                                            </div>
                                            <p className="status-help-text">
                                                Sellers can only move orders forward from Pending → Processing → Shipped.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerOrders;
