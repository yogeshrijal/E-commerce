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
            const data = searchParams.get('data');

            if (!data) {
                // Fallback for v1 or direct access (though we are moving to v2)
                const oid = searchParams.get('oid');
                const amt = searchParams.get('amt');
                const refId = searchParams.get('refId');

                if (oid && amt && refId) {
                    // Handle legacy v1 if needed, or just error out if we are strict
                    // For now, let's try to verify with legacy params if data is missing
                    // But since backend is changing to v2, this might fail unless backend handles both.
                    // Let's focus on v2 data handling.
                }

                toast.error('Invalid payment parameters');
                navigate('/');
                return;
            }

            try {
                // Decode Base64 data
                const decodedData = atob(data);
                const paymentInfo = JSON.parse(decodedData);

                // paymentInfo contains: transaction_code, status, total_amount, transaction_uuid, product_code, signed_field_names, signature

                // Format total_amount to match backend verification logic
                let totalAmount = parseFloat(paymentInfo.total_amount);
                totalAmount = (totalAmount % 1 === 0) ? totalAmount.toString() : totalAmount.toFixed(2);

                const response = await paymentAPI.verifyEsewa({
                    transaction_uuid: paymentInfo.transaction_uuid,
                    total_amount: totalAmount,
                    transaction_code: paymentInfo.transaction_code
                });

                if (response.data.status === 'Payment Failed') {
                    toast.error('Payment failed. Order has been canceled.');
                    navigate('/payment/failure');
                    return;
                }

                toast.success('Payment verified successfully!');
                // Extract order ID from transaction_uuid (it is now just the order ID)
                const orderId = paymentInfo.transaction_uuid;
                navigate(`/orders/${orderId}`);
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
