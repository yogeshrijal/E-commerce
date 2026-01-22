import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MyProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getProducts();
            // Backend returns created_by as "username (role)", so we need to check if it includes the username
            const sellerProducts = response.data.filter(
                (p) => p.created_by && p.created_by.includes(user.username)
            );
            setProducts(sellerProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await productAPI.deleteProduct(id);
            setProducts(products.filter((p) => p.id !== id));
            toast.success('Product deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete product');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        console.log('Toggle status clicked!', id, currentStatus);
        try {
            const product = products.find(p => p.id === id);
            await productAPI.updateProduct(id, {
                name: product.name,
                description: product.description,
                category: product.category,
                base_price: product.base_price,
                stock: product.stock,
                is_active: !currentStatus,
            });

            // Update local state
            setProducts(products.map(p =>
                p.id === id ? { ...p, is_active: !currentStatus } : p
            ));

            toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error('Failed to update product status');
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="my-products-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Products</h1>
                    <Link to="/seller/products/new" className="btn btn-primary">
                        + Add New Product
                    </Link>
                </div>

                <div className="products-controls">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <p>No products found.</p>
                        <Link to="/seller/products/new" className="btn btn-primary">
                            Add Your First Product
                        </Link>
                    </div>
                ) : (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>SKUs</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-image-cell">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} />
                                                ) : (
                                                    <div className="no-image">No image</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>{product.name}</td>
                                        <td>{product.category}</td>
                                        <td>${Number(product.base_price).toFixed(2)}</td>
                                        <td>{product.stock}</td>
                                        <td>{product.skus?.length || 0}</td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleToggleStatus(product.id, product.is_active);
                                                }}
                                                className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: 'none',
                                                    padding: '0.25rem 0.75rem',
                                                }}
                                                title={`Click to ${product.is_active ? 'deactivate' : 'activate'}`}
                                            >
                                                {product.is_active ? '✓ Active' : '✗ Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/products/${product.id}`}
                                                    className="btn-link"
                                                    target="_blank"
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    to={`/seller/products/${product.id}/edit`}
                                                    className="btn-link"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="btn-link danger"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProducts;
