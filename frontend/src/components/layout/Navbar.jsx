import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
    const { isAuthenticated, user, logout, isAdmin, isSeller } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-content">
                    <Link to="/" className="logo">
                        <span className="logo-icon">🛒</span>
                        <span className="logo-text">EMarket</span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/products" className="nav-link">
                            Products
                        </Link>

                        <ThemeToggle />

                        {isAuthenticated ? (
                            <>
                                {isAdmin && (
                                    <Link to="/admin/dashboard" className="nav-link">
                                        Admin Dashboard
                                    </Link>
                                )}

                                {isSeller && (
                                    <Link to="/seller/dashboard" className="nav-link">
                                        Seller Dashboard
                                    </Link>
                                )}

                                {!isAdmin && !isSeller && (
                                    <>
                                        <Link to="/cart" className="nav-link cart-link">
                                            <span className="cart-icon">🛒</span>
                                            {getCartCount() > 0 && (
                                                <span className="cart-badge">{getCartCount()}</span>
                                            )}
                                        </Link>
                                        <Link to="/orders" className="nav-link">
                                            My Orders
                                        </Link>
                                    </>
                                )}

                                <div className="user-menu">
                                    <button className="user-button">
                                        <span className="user-avatar">
                                            {user?.profile_picture ? (
                                                <img src={user.profile_picture} alt={user.username} />
                                            ) : (
                                                <span className="avatar-placeholder">
                                                    {user?.username?.[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </span>
                                        <span className="user-name">{user?.username}</span>
                                    </button>
                                    <div className="dropdown-menu">
                                        <Link to="/profile" className="dropdown-item">
                                            Profile
                                        </Link>
                                        <button onClick={handleLogout} className="dropdown-item">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
