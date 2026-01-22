import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="home-page">
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Welcome to EMarket</h1>
                        <p className="hero-subtitle">
                            Your one-stop destination for quality products from trusted sellers
                        </p>
                        <div className="hero-actions">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/products" className="btn btn-primary btn-large">
                                        Browse Products
                                    </Link>
                                    {user?.role === 'seller' && (
                                        <Link to="/seller/dashboard" className="btn btn-secondary btn-large">
                                            Seller Dashboard
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link to="/products" className="btn btn-primary btn-large">
                                        Start Shopping
                                    </Link>
                                    <Link to="/register" className="btn btn-secondary btn-large">
                                        Become a Seller
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2>Why Choose EMarket?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🛍️</div>
                            <h3>Wide Selection</h3>
                            <p>Browse thousands of products from various categories</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✓</div>
                            <h3>Quality Assured</h3>
                            <p>All products are verified by our trusted sellers</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🚚</div>
                            <h3>Fast Delivery</h3>
                            <p>Quick and reliable shipping to your doorstep</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💳</div>
                            <h3>Secure Payment</h3>
                            <p>Safe and secure payment processing</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Start Shopping?</h2>
                        <p>Join thousands of satisfied customers today</p>
                        <Link to="/products" className="btn btn-primary btn-large">
                            Explore Products
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
