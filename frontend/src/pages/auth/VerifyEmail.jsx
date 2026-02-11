import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const hasVerified = useRef(false); // Prevent duplicate calls in React strict mode

    useEffect(() => {
        const verifyEmail = async () => {
            // Prevent duplicate verification attempts
            if (hasVerified.current) return;
            hasVerified.current = true;

            const token = searchParams.get('token');

            if (!token) {
                setError('Verification token is missing');
                setVerifying(false);
                return;
            }

            try {
                const response = await authAPI.verifyEmail(token);
                setVerified(true);
                toast.success(response.data.message || 'Email verified successfully!');
            } catch (err) {
                const errorMessage = err.response?.data?.error ||
                    'Verification failed. The token may be invalid or expired.';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setVerifying(false);
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {verifying ? (
                        <div className="verification-loading">
                            <div className="spinner"></div>
                            <h2>Verifying Your Email...</h2>
                            <p className="auth-subtitle">Please wait while we verify your account</p>
                        </div>
                    ) : verified ? (
                        <div className="verification-success">
                            <div className="success-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h2>Email Verified!</h2>
                            <p className="auth-subtitle">
                                Your account has been successfully verified. You can now log in to your account.
                            </p>
                            <div style={{ marginTop: '2rem' }}>
                                <Link to="/login" className="btn btn-primary btn-block">
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="verification-error">
                            <div className="error-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </div>
                            <h2>Verification Failed</h2>
                            <p className="auth-subtitle error-message">{error}</p>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                <Link to="/register" className="btn btn-secondary btn-block">
                                    Register Again
                                </Link>
                                <Link to="/login" className="btn btn-outline btn-block">
                                    Try to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .verification-loading,
                .verification-success,
                .verification-error {
                    text-align: center;
                    padding: 2rem 0;
                }

                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-left-color: var(--primary-color, #2563eb);
                    border-radius: 50%;
                    width: 64px;
                    height: 64px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .success-icon {
                    color: #10b981;
                    margin-bottom: 1.5rem;
                }

                .error-icon {
                    color: #ef4444;
                    margin-bottom: 1.5rem;
                }

                .success-icon svg,
                .error-icon svg {
                    display: inline-block;
                }

                .btn-outline {
                    background: transparent;
                    border: 2px solid var(--primary-color, #2563eb);
                    color: var(--primary-color, #2563eb);
                }

                .btn-outline:hover {
                    background: var(--primary-color, #2563eb);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default VerifyEmail;
