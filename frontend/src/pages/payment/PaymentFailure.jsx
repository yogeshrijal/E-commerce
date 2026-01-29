import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const oid = searchParams.get('oid');

    const [error, setError] = useState(null);

    useEffect(() => {
        const cancelOrder = async () => {
            console.log('PaymentFailure loaded, oid:', oid);
            if (oid) {
                try {
                    console.log('Attempting to cancel order:', oid);
                    await orderAPI.updateOrder(oid, { status: 'canceled' });
                    console.log('Order canceled successfully');
                    toast.info('Order has been canceled due to payment failure.');
                } catch (error) {
                    console.error('Failed to cancel order:', error);
                    setError('Failed to cancel order automatically. Please contact support.');
                }
            } else {
                console.log('No oid found in URL');
            }
        };

        cancelOrder();
    }, [oid]);

    return (
        <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ color: 'red', fontSize: '48px', marginBottom: '20px' }}>✕</div>
            <h1>Payment Failed</h1>
            <p>We couldn't process your payment. Please try again.</p>
            {oid && <p className="text-muted">Order #{oid} has been canceled.</p>}
            <div style={{ marginTop: '30px' }}>
                <Link to="/cart" className="btn btn-primary">Return to Cart</Link>
            </div>
        </div>
    );
};

export default PaymentFailure;
