import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI, orderAPI } from '../../services/api';
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
                toast.error('Invalid payment parameters');
                navigate('/');
                return;
            }

            let paymentInfo = null;
            let orderId = null;

            try {
                const decodedData = atob(data);
                paymentInfo = JSON.parse(decodedData);

                if (paymentInfo && paymentInfo.transaction_uuid) {
                    orderId = paymentInfo.transaction_uuid.split('-')[0];
                }

                let totalAmount = parseFloat(paymentInfo.total_amount);
                totalAmount = (totalAmount % 1 === 0) ? totalAmount.toString() : totalAmount.toFixed(2);

                const verificationPayload = {
                    transaction_uuid: paymentInfo.transaction_uuid,
                    total_amount: totalAmount,
                    transaction_code: paymentInfo.transaction_code
                };

                const response = await paymentAPI.verifyEsewa(verificationPayload);

                if (response.data.status === 'Payment Failed') {
                    toast.error('Payment failed. Order has been canceled.');
                    navigate('/payment/failure');
                    return;
                }

                toast.success('Payment verified successfully!');
                navigate(`/orders/${orderId}`);

            } catch (error) {
                console.error('Payment verification failed:', error);


                if (error.response?.status === 404 && orderId) {
                    try {
                        const orderRes = await orderAPI.getOrder(orderId);
                        const orderStatus = orderRes.data.status;

                        if (['processing', 'shipped', 'delivered'].includes(orderStatus)) {
                            console.log('Order already processed, redirecting to success.');
                            toast.success('Payment verified successfully!');
                            navigate(`/orders/${orderId}`);
                            return;
                        }
                    } catch (ordErr) {
                        console.error('Failed to check order status fallback:', ordErr);
                    }
                }

                if (error.response?.status === 500 && orderId && paymentInfo) {
                    try {
                        console.log('Detected potential duplicate payment crash. Attempting cleanup...');

                        const allPayments = await paymentAPI.getPayments();
                        const duplicates = allPayments.data.filter(
                            p => p.order === parseInt(orderId) && p.status === 'pending'
                        );

                        if (duplicates.length > 1) {
                            console.log(`Found ${duplicates.length} duplicate pending payments. Cleaning up...`);



                            const currentUuid = paymentInfo.transaction_uuid;


                            const paymentsToDelete = duplicates.filter(p => p.transaction_uuid !== currentUuid);


                            if (paymentsToDelete.length === 0 && duplicates.length > 1) {
                                paymentsToDelete.push(...duplicates.slice(0, duplicates.length - 1));
                            } else if (paymentsToDelete.length < duplicates.length) {
                            } else {
                                paymentsToDelete.pop(); // Remove last one from delete list (keep it)
                            }

                            await Promise.all(paymentsToDelete.map(p => paymentAPI.deletePayment(p.id)));

                            console.log('Cleanup complete. Retrying verification...');

                            let amt = parseFloat(paymentInfo.total_amount);
                            amt = (amt % 1 === 0) ? amt.toString() : amt.toFixed(2);

                            const retryPayload = {
                                transaction_uuid: paymentInfo.transaction_uuid,
                                total_amount: amt,
                                transaction_code: paymentInfo.transaction_code
                            };

                            const retryRes = await paymentAPI.verifyEsewa(retryPayload);
                            if (retryRes.data.status === 'Payment Verified' || retryRes.status === 200) {
                                toast.success('Payment verified successfully!');
                                navigate(`/orders/${orderId}`);
                                return;
                            }
                        }
                    } catch (retryErr) {
                        console.error('Retry strategy failed:', retryErr);
                    }
                }

                const errorMessage = error.response?.data?.details
                    || error.response?.data?.error
                    || 'Payment verification failed';

                toast.error(errorMessage);
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
