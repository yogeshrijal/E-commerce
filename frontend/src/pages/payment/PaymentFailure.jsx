import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const oid = searchParams.get('oid');
    const [loading, setLoading] = useState(true); // Start loading immediately to check order status
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAndHandleOrder = async () => {
            if (!oid) {
                setLoading(false);
                return;
            }

            try {
                const response = await orderAPI.getOrder(oid);
                const order = response.data;


                const payments = order.payment_details || [];
                const isCOD = payments.some(p => p.method === 'cod');
                const hasNoPayments = payments.length === 0;


                if (isCOD || hasNoPayments) {
                    console.log('Order is COD or has no payment info. Preventing auto-cancellation.');
                    if (isCOD) toast.info('Order placed via Cash on Delivery.');
                    navigate(`/orders/${oid}`);
                    return;
                }

                console.log('Online payment failed. Auto-canceling order...');
                await orderAPI.updateOrder(oid, { status: 'canceled' });
                toast.error('Order canceled due to payment failure.');
                setLoading(false); // Stay on failure page

            } catch (err) {
                console.error('Error handling payment failure:', err);
                setError('Failed to process cancellation. Please retry.');
                setLoading(false);
            }
        };

        checkAndHandleOrder();
    }, [oid, navigate]);

    const handleSwitchToCOD = async () => {
        if (!oid) return;
        setLoading(true);
        try {
            const allPayments = await paymentAPI.getPayments();
            const pendingPayments = allPayments.data.filter(
                p => p.order === parseInt(oid) && p.status === 'pending'
            );

            await Promise.all(pendingPayments.map(p => paymentAPI.deletePayment(p.id)));

            await orderAPI.updateOrder(oid, { status: 'pending' });

            await paymentAPI.createPayment({
                order: oid,
                amount: '0.00', // Amount doesn't matter for pending COD re-creation here, or fetch from order
                method: 'cod',
                status: 'pending',
                transaction_uuid: `${oid}-COD-RETRY-${Date.now()}`
            });

            toast.success('Switched to Cash on Delivery');
            navigate(`/orders/${oid}`);
        } catch (error) {
            console.error('Failed to switch to COD:', error);
            toast.error('Failed to switch method.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <h2>Processing...</h2>
            </div>
        );
    }

    return (
        <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ color: 'red', fontSize: '48px', marginBottom: '20px' }}>✕</div>
            <h1>Payment Failed</h1>
            <p>We couldn't process your payment.</p>

            {oid && (
                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                    <p style={{ color: '#666' }}>Order #{oid} has been canceled.</p>
                    <p>You can try again or pay with Cash on Delivery.</p>

                    <button
                        onClick={handleSwitchToCOD}
                        className="btn btn-success"
                        disabled={loading}
                        style={{ minWidth: '250px' }}
                    >
                        Switch to Cash on Delivery
                    </button>

                    <button
                        onClick={handleRetry}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ minWidth: '250px' }}
                    >
                        Retry Payment (New Order)
                    </button>

                    <Link to="/" className="text-muted" style={{ marginTop: '10px' }}>
                        Return to Home
                    </Link>
                </div>
            )}

            {!oid && (
                <div style={{ marginTop: '30px' }}>
                    <Link to="/cart" className="btn btn-primary">Return to Cart</Link>
                </div>
            )}
        </div>
    );
};

export default PaymentFailure;
