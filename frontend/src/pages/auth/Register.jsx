import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validatePhone, validateUsername, getPasswordStrength } from '../../utils/validation';
import { toast } from 'react-toastify';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        contact: '',
        role: 'customer',
    });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }

        if (name === 'password') {
            setPasswordStrength(getPasswordStrength(value));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
            newErrors.username = usernameValidation.message;
        }

        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }

        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
        }

        const phoneValidation = validatePhone(formData.contact);
        if (!phoneValidation.isValid) {
            newErrors.contact = phoneValidation.message;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            await register(formData);

            // Only redirect to login on successful registration
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (error) {
            console.error('Registration error:', error);
            // Error is already handled in AuthContext with toast
            // Don't redirect on error
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 'weak':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'strong':
                return '#10b981';
            default:
                return '#d1d5db';
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1>Create Account</h1>
                    <p className="auth-subtitle">Join EMarket today</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Choose a username"
                                className={errors.username ? 'error' : ''}
                            />
                            {errors.username && (
                                <span className="error-message">{errors.username}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email"
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && (
                                <span className="error-message">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a strong password"
                                className={errors.password ? 'error' : ''}
                            />
                            {formData.password && (
                                <div className="password-strength">
                                    <div
                                        className="strength-bar"
                                        style={{
                                            width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                                            backgroundColor: getStrengthColor()
                                        }}
                                    ></div>
                                    <span style={{ color: getStrengthColor(), fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        {passwordStrength ? `${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)} password` : ''}
                                    </span>
                                </div>
                            )}
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                            <small style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                                Must be 8+ characters with uppercase, lowercase, number & special character
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact">Contact Number (Optional)</label>
                            <input
                                type="text"
                                id="contact"
                                name="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                placeholder="98XXXXXXXX (10 digits)"
                                className={errors.contact ? 'error' : ''}
                            />
                            {errors.contact && (
                                <span className="error-message">{errors.contact}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">I want to</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="customer">Buy products (Customer)</option>
                                <option value="seller">Sell products (Seller)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
