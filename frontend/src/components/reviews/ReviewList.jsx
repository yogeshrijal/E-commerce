import { useState, useEffect } from 'react';
import { reviewAPI, orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ReviewForm from './ReviewForm';
import { toast } from 'react-toastify';

const ReviewList = ({ product }) => {
    const { isAuthenticated, user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(false);

    const [editingReview, setEditingReview] = useState(null);

    useEffect(() => {
        if (isAuthenticated && product) {
            fetchReviews();
            checkReviewEligibility();
        } else {
            setLoading(false);
        }
    }, [product, isAuthenticated]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getReviews();
            const productReviews = response.data.filter(
                (review) => review.product === product.id
            );
            setReviews(productReviews);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const [eligibleOrder, setEligibleOrder] = useState(null);
    const [eligibleSku, setEligibleSku] = useState(null);

    const checkReviewEligibility = async () => {
        try {
            setCheckingEligibility(true);
            const response = await orderAPI.getOrders();
            const orders = response.data;

            const validSkuIds = product.skus ? product.skus.map(sku => sku.id) : [];

            let foundOrder = null;
            let foundSkuId = null;

            const hasDeliveredProduct = orders.some(order => {
                if (order.status !== 'delivered') return false;

                const item = order.order_item.find(item => validSkuIds.includes(item.sku));
                if (item) {
                    foundOrder = order;
                    foundSkuId = item.sku;
                    return true;
                }
                return false;
            });

            if (hasDeliveredProduct) {
                setEligibleOrder(foundOrder);
                setEligibleSku(foundSkuId);
            } else {
                setEligibleOrder(null);
                setEligibleSku(null);
            }

            const hasReviewed = reviews.some(review => review.user === user.user_id);

            setCanReview(hasDeliveredProduct && !hasReviewed);

        } catch (err) {
            console.error('Failed to check review eligibility:', err);
        } finally {
            setCheckingEligibility(false);
        }
    };

    const handleReviewAdded = (newReview) => {
        if (editingReview) {
            setReviews(reviews.map(r => r.id === newReview.id ? newReview : r));
            setEditingReview(null);
            toast.success('Review updated successfully!');
        } else {
            setReviews([newReview, ...reviews]);
            toast.success('Review submitted successfully!');
        }
        setShowForm(false);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await reviewAPI.deleteReview(reviewId);
            setReviews(reviews.filter((r) => r.id !== reviewId));
            toast.success('Review deleted successfully');
        } catch (err) {
            console.error('Failed to delete review:', err);
            toast.error('Failed to delete review');
        }
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setShowForm(true);
    };

    if (!isAuthenticated) {
        return (
            <div className="reviews-section">
                <h3>Customer Reviews</h3>
                <div className="login-prompt">
                    <p>Please log in to view and write reviews.</p>
                </div>
            </div>
        );
    }

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchReviews} />;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const userReview = reviews.find(r => r.user === user?.user_id);

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <h3>Customer Reviews ({reviews.length})</h3>
                {reviews.length > 0 && (
                    <div className="average-rating">
                        <span className="rating-number">{averageRating}</span>
                        <span className="rating-stars">{'★'.repeat(Math.round(averageRating))}</span>
                    </div>
                )}
            </div>

            {!showForm && !userReview && (
                <div className="review-action-area">
                    {canReview ? (
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setEditingReview(null);
                                setShowForm(true);
                            }}
                        >
                            Write a Review
                        </button>
                    ) : (
                        <p className="eligibility-message">
                            {checkingEligibility ? 'Checking eligibility...' : 'You can only review products you have purchased and received.'}
                        </p>
                    )}
                </div>
            )}

            {showForm && (
                <ReviewForm
                    productId={product.id}
                    orderId={eligibleOrder?.id}
                    skuId={eligibleSku}
                    initialData={editingReview}
                    onReviewAdded={handleReviewAdded}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingReview(null);
                    }}
                />
            )}

            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">{review.customer_name || `User #${review.user}`}</span>
                                    <span className="review-date">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="review-rating">
                                    {'★'.repeat(review.rating)}
                                    {'☆'.repeat(5 - review.rating)}
                                </div>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                            {user && (user.user_id === review.user || user.id === review.user) && (
                                <div className="review-actions">
                                    <button
                                        className="btn-edit-review"
                                        onClick={() => handleEditReview(review)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn-delete-review"
                                        onClick={() => handleDeleteReview(review.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewList;
