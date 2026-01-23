import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SellerDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellerProducts();
    }, []);

    const fetchSellerProducts = async () => {
        try {
            const response = await productAPI.getProducts();
            // Filter products created by this seller
            // Backend returns created_by as "username (role)"
            const sellerProducts = response.data.filter(
                (p) => p.created_by && p.created_by.includes(user.username)
            );
            setProducts(sellerProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="seller-dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1>Seller Dashboard</h1>
                    <Link to="/seller/products/new" className="btn btn-primary">
                        + Add New Product
                    </Link>
                </div>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>{products.length}</h3>
                            <p>Total Products</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✓</div>
                        <div className="stat-info">
                            <h3>{products.filter((p) => p.is_active).length}</h3>
                            <p>Active Products</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h3>{products.reduce((sum, p) => sum + p.stock, 0)}</h3>
                            <p>Total Stock</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions">
                        <Link to="/seller/products/new" className="action-card">
                            <span className="action-icon">➕</span>
                            <h3>Add Product</h3>
                            <p>Create a new product listing</p>
                        </Link>

                        <Link to="/seller/products" className="action-card">
                            <span className="action-icon">📋</span>
                            <h3>Manage Products</h3>
                            <p>View and edit your products</p>
                        </Link>

                        <Link to="/seller/orders" className="action-card">
                            <span className="action-icon">📦</span>
                            <h3>Manage Orders</h3>
                            <p>View and process orders</p>
                        </Link>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Recent Products</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't added any products yet.</p>
                            <Link to="/seller/products/new" className="btn btn-primary">
                                Add Your First Product
                            </Link>
                        </div>
                    ) : (
                        <div className="products-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, 5).map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>${Number(product.base_price).toFixed(2)}</td>
                                            <td>{product.stock}</td>
                                            <td>
                                                <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/seller/products/${product.id}/edit`} className="btn-link">
                                                    Edit
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

export default SellerDashboard;
