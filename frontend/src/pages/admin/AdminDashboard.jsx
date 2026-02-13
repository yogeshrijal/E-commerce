import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, productAPI, orderAPI } from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [usersRes, productsRes, ordersRes] = await Promise.all([
                userAPI.getUsers(),
                productAPI.getProducts(),
                orderAPI.getOrders(),
            ]);

            setStats({
                totalUsers: usersRes.data.length,
                totalProducts: productsRes.data.length,
                totalOrders: ordersRes.data.length,
                pendingOrders: ordersRes.data.filter((o) => o.status === 'pending').length,
            });

            setRecentOrders(ordersRes.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="container">
                <h1>Admin Dashboard</h1>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>{stats.totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>{stats.totalProducts}</h3>
                            <p>Total Products</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🛒</div>
                        <div className="stat-info">
                            <h3>{stats.totalOrders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.pendingOrders}</h3>
                            <p>Pending Orders</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Quick Links</h2>
                    <div className="quick-actions">
                        <Link to="/admin/categories" className="action-card">
                            <span className="action-icon">📁</span>
                            <h3>Manage Categories</h3>
                            <p>Create and edit product categories</p>
                        </Link>

                        <Link to="/admin/users" className="action-card">
                            <span className="action-icon">👥</span>
                            <h3>Manage Users</h3>
                            <p>View all registered users</p>
                        </Link>

                        <Link to="/admin/products" className="action-card">
                            <span className="action-icon">📦</span>
                            <h3>Manage Products</h3>
                            <p>View and manage all products</p>
                        </Link>

                        <Link to="/admin/orders" className="action-card">
                            <span className="action-icon">🛒</span>
                            <h3>Manage Orders</h3>
                            <p>Process and track orders</p>
                        </Link>

                        <Link to="/admin/shipping" className="action-card">
                            <span className="action-icon">🚚</span>
                            <h3>Manage Shipping</h3>
                            <p>Configure shipping zones and rates</p>
                        </Link>

                        <Link to="/admin/coupons" className="action-card">
                            <span className="action-icon">🎫</span>
                            <h3>Manage Coupons</h3>
                            <p>Create and manage discount codes</p>
                        </Link>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Recent Orders</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : recentOrders.length === 0 ? (
                        <p>No orders yet.</p>
                    ) : (
                        <div className="orders-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>{order.full_name}</td>
                                            <td>${Number(order.total_amount).toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge status-${order.status}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Link to={`/admin/orders`} className="btn-link">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
