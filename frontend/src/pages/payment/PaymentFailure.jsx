import { Link } from 'react-router-dom';

const PaymentFailure = () => {
    return (
        <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ color: 'red', fontSize: '48px', marginBottom: '20px' }}>✕</div>
            <h1>Payment Failed</h1>
            <p>We couldn't process your payment. Please try again.</p>
            <div style={{ marginTop: '30px' }}>
                <Link to="/cart" className="btn btn-primary">Return to Cart</Link>
            </div>
        </div>
    );
};

export default PaymentFailure;
