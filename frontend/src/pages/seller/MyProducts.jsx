import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './MyProducts.css';
import { formatPrice } from '../../utils/currency';

const MyProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getProducts();
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

    const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();

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

            setProducts(products.map(p =>
                p.id === id ? { ...p, is_active: !currentStatus } : p
            ));

            toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error('Failed to update product status');
        }
    };

    const filteredProducts = products
        .filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return Number(a.base_price) - Number(b.base_price);
                case 'price-desc':
                    return Number(b.base_price) - Number(a.base_price);
                case 'stock-asc':
                    return a.stock - b.stock;
                case 'stock-desc':
                    return b.stock - a.stock;
                default:
                    return 0;
            }
        });

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

                <div className="products-controls-container">
                    <div className="control-group">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="control-input"
                        />
                    </div>

                    <div className="control-group">
                        <label>Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="control-select"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="control-select"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                            <option value="stock-asc">Stock (Low to High)</option>
                            <option value="stock-desc">Stock (High to Low)</option>
                        </select>
                    </div>
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
                                        <td>{formatPrice(product.base_price)}</td>
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
