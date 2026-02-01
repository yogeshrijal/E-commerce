import { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/currency';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

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
            setOrders(ordersRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const getProductDetails = (skuId) => {
        for (const product of products) {
            const foundSku = product.skus.find(s => s.id === skuId || s.sku_code === skuId);
            if (foundSku) {
                return {
                    name: product.name,
                    sku_code: foundSku.sku_code
                };
            }
        }
        return { name: 'Unknown Product', sku_code: skuId };
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderAPI.updateOrder(orderId, { status: newStatus });
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update order status');
        }
    };

    const filteredOrders = filterStatus
        ? orders.filter((order) => order.status === filterStatus)
        : orders;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="order-management-page">
            <div className="container">
                <h1>Order Management</h1>

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
                                        <p>{order.full_name} - {order.email}</p>
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
                                            {order.order_item && order.order_item.map((item) => {
                                                const details = getProductDetails(item.sku);
                                                return (
                                                    <div key={item.id} className="order-item-row">
                                                        <div className="item-info-col">
                                                            <span className="item-name-bold">{details.name}</span>
                                                            <span className="item-sku-small">SKU: {details.sku_code}</span>
                                                        </div>
                                                        <span>Qty: {item.quantity_at_purchase}</span>
                                                        <span>{formatPrice(item.price_at_purchase)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="order-section">
                                            <h4>Update Status</h4>
                                            <div className="status-buttons">
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'pending')}
                                                    className={`status-btn ${order.status === 'pending' ? 'active' : ''}`}
                                                    disabled={order.status === 'pending'}
                                                >
                                                    Pending
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'processing')}
                                                    className={`status-btn ${order.status === 'processing' ? 'active' : ''}`}
                                                    disabled={order.status === 'processing'}
                                                >
                                                    Processing
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                                    className={`status-btn ${order.status === 'shipped' ? 'active' : ''}`}
                                                    disabled={order.status === 'shipped'}
                                                >
                                                    Shipped
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                    className={`status-btn ${order.status === 'delivered' ? 'active' : ''}`}
                                                    disabled={order.status === 'delivered'}
                                                >
                                                    Delivered
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'canceled')}
                                                    className={`status-btn danger ${order.status === 'canceled' ? 'active' : ''}`}
                                                    disabled={order.status === 'canceled'}
                                                >
                                                    Canceled
                                                </button>
                                            </div>
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

export default OrderManagement;
