import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validateEmail } from '../../utils/validation';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (emailError) {
            setEmailError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validateEmail(email);
        if (!validation.isValid) {
            setEmailError(validation.message);
            toast.error(validation.message);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setEmailSent(true);
                toast.success('Password reset link has been sent to your email!');
            } else {
                if (data.email) {
                    const errorMsg = data.email[0] || 'Invalid email address';
                    setEmailError(errorMsg);
                    toast.error(errorMsg);
                } else {
                    toast.error(data.message || 'Failed to send reset link. Please try again.');
                }
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {!emailSent ? (
                        <>
                            <h1>Forgot Password?</h1>
                            <p className="auth-subtitle">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                        placeholder="Enter your email"
                                        className={emailError ? 'error' : ''}
                                    />
                                    {emailError && (
                                        <span className="error-message">{emailError}</span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <p className="auth-footer">
                                Remember your password? <Link to="/login">Back to Login</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '4rem',
                                    color: 'var(--success-color)',
                                    marginBottom: '1rem'
                                }}>
                                    ✉️
                                </div>
                                <h1>Check Your Email</h1>
                                <p className="auth-subtitle">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    marginBottom: '2rem'
                                }}>
                                    Click the link in the email to reset your password.
                                    If you don't see the email, check your spam folder.
                                </p>
                                <Link to="/login" className="btn btn-primary">
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
