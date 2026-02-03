import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const PublicSellerProfile = () => {
    const { sellerName } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSellerProducts = async () => {
            try {
                setLoading(true);
                // Since we don't have a direct "get products by seller" endpoint for public use,
                // we fetch all products and filter client-side. 
                // Note: ideally the backend should support ?seller=username filtering.
                const response = await productAPI.getProducts();

                // The created_by field usually comes as "username (role)" or just "username"
                // We need to match efficiently.
                const sellerProducts = response.data.filter(product => {
                    const createdBy = product.created_by || '';
                    return createdBy.includes(sellerName);
                });

                setProducts(sellerProducts);
            } catch (err) {
                console.error("Error fetching seller products:", err);
                setError("Failed to load seller's products");
            } finally {
                setLoading(false);
            }
        };

        if (sellerName) {
            fetchSellerProducts();
        }
    }, [sellerName]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-container" style={{ maxWidth: '1200px' }}> {/* Wider container for products */}
                    <h1>Seller Profile</h1>

                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                <div className="avatar-placeholder">
                                    {sellerName?.[0]?.toUpperCase()}
                                </div>
                            </div>
                            <div className="profile-info">
                                <h2>{sellerName}</h2>
                                <p className="role-badge">Seller</p>
                            </div>
                        </div>

                        <div className="seller-products-section" style={{ marginTop: '2rem' }}>
                            <h3>Products by {sellerName} ({products.length})</h3>

                            {products.length > 0 ? (
                                <div className="product-grid">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-products">
                                    <p>This seller has no active products listed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicSellerProfile;
