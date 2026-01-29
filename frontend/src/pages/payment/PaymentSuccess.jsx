import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verifyPayment = async () => {
            const oid = searchParams.get('oid');
            const amt = searchParams.get('amt');
            const refId = searchParams.get('refId');

            if (!oid || !amt || !refId) {
                toast.error('Invalid payment parameters');
                navigate('/');
                return;
            }

            try {
                await paymentAPI.verifyEsewa({
                    oid,
                    amt,
                    refID: refId
                });
                toast.success('Payment verified successfully!');
                // Redirect to order details
                navigate(`/orders/${oid}`);
            } catch (error) {
                console.error('Payment verification failed:', error);
                toast.error(error.response?.data?.error || 'Payment verification failed');
                navigate('/payment/failure');
            } finally {
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
            {verifying ? (
                <>
                    <h2>Verifying Payment...</h2>
                    <LoadingSpinner />
                </>
            ) : (
                <h2>Redirecting...</h2>
            )}
        </div>
    );
};

export default PaymentSuccess;
