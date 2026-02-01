import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validatePassword, getPasswordStrength } from '../../utils/validation';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            toast.error('Invalid reset link. Please request a new one.');
            navigate('/forgot-password');
        }
    }, [searchParams, navigate]);

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

        if (name === 'new_password') {
            setPasswordStrength(getPasswordStrength(value));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const passwordValidation = validatePassword(formData.new_password);
        if (!passwordValidation.isValid) {
            newErrors.new_password = passwordValidation.message;
        }

        if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
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
            const response = await fetch('http://127.0.0.1:8000/reset-password-confirm/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    new_password: formData.new_password,
                    confirm_password: formData.confirm_password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password has been reset successfully! Please login with your new password.');
                navigate('/login');
            } else {
                if (data.error) {
                    toast.error(data.error);
                } else if (data.token) {
                    toast.error(data.token[0] || 'Invalid or expired token');
                } else if (data.non_field_errors) {
                    toast.error(data.non_field_errors[0]);
                } else {
                    toast.error(data.message || 'Failed to reset password. Please try again.');
                }
            }
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('An error occurred. Please try again later.');
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

    if (!token) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h1>Reset Password</h1>
                    <p className="auth-subtitle">Enter your new password below</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="new_password">New Password</label>
                            <input
                                type="password"
                                id="new_password"
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleChange}
                                required
                                placeholder="Enter new password"
                                className={errors.new_password ? 'error' : ''}
                            />
                            {formData.new_password && (
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
                            {errors.new_password && (
                                <span className="error-message">{errors.new_password}</span>
                            )}
                            <small style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                                Must be 8+ characters with uppercase, lowercase, number & special character
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                placeholder="Confirm new password"
                                className={errors.confirm_password ? 'error' : ''}
                            />
                            {errors.confirm_password && (
                                <span className="error-message">{errors.confirm_password}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Remember your password? <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
