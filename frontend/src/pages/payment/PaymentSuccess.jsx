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
                // Fallback or error if data is missing
                toast.error('Invalid payment parameters');
                navigate('/');
                return;
            }

            let paymentInfo = null;
            let orderId = null;

            try {
                // Decode Base64 data
                const decodedData = atob(data);
                paymentInfo = JSON.parse(decodedData);

                // paymentInfo contains: transaction_uuid, total_amount, etc.
                if (paymentInfo && paymentInfo.transaction_uuid) {
                    orderId = paymentInfo.transaction_uuid.split('-')[0];
                }

                // Format total_amount to match backend verification logic
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

                // --- ROBUST ERROR HANDLING STRATEGIES ---

                // Strategy 1: Handle "Already Verified" scenario (404 from backend because payment is no longer pending)
                // If the user refreshed the page or pressed back/forward, the payment might already be completed.
                if (error.response?.status === 404 && orderId) {
                    try {
                        const orderRes = await orderAPI.getOrder(orderId);
                        const orderStatus = orderRes.data.status;

                        // If order is already moving forward, treat as success
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

                // Strategy 2: Handle "Duplicate Pending Payments" Crash (500 Internal Server Error)
                // This happens if multiple pending payments exist for the same order.
                if (error.response?.status === 500 && orderId && paymentInfo) {
                    try {
                        console.log('Detected potential duplicate payment crash. Attempting cleanup...');

                        // Fetch all payments to find duplicates
                        const allPayments = await paymentAPI.getPayments();
                        const duplicates = allPayments.data.filter(
                            p => p.order === parseInt(orderId) && p.status === 'pending'
                        );

                        if (duplicates.length > 1) {
                            console.log(`Found ${duplicates.length} duplicate pending payments. Cleaning up...`);

                            // We want to KEEP the one that matches our current transaction if possible, 
                            // OR just keep the most recent one.
                            // But since backend crashes, we must reduce count to 1.

                            // Let's delete ALL pending payments except the one matching our current transaction UUID (if identifiable)
                            // Note: Backend 'Payment' model has 'transaction_uuid' field. 

                            const currentUuid = paymentInfo.transaction_uuid;

                            // Identify payments to delete: anyone NOT matching our current UUID
                            // OR if none match (weird), keep the latest.

                            const paymentsToDelete = duplicates.filter(p => p.transaction_uuid !== currentUuid);

                            // If we filtered out everything (meaning all match? or none match?), safeguard:
                            // If all match, delete all but one.
                            // If none match, delete all duplicates (and maybe fail, but let's try).

                            if (paymentsToDelete.length === 0 && duplicates.length > 1) {
                                // All have same UUID? or none have UUID? Just keep the last one.
                                paymentsToDelete.push(...duplicates.slice(0, duplicates.length - 1));
                            } else if (paymentsToDelete.length < duplicates.length) {
                                // We identified specific ones to delete.
                            } else {
                                // None matched current UUID? Maybe backend didn't save UUID correctly? 
                                // Keep the latest one.
                                paymentsToDelete.pop(); // Remove last one from delete list (keep it)
                            }

                            await Promise.all(paymentsToDelete.map(p => paymentAPI.deletePayment(p.id)));

                            console.log('Cleanup complete. Retrying verification...');

                            // Retry verification ONCE
                            // format payload again just in case
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

                // Default Error Handling
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
