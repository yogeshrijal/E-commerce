import { useState } from 'react';
import { reviewAPI } from '../../services/api';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';

const ReviewForm = ({ productId, orderId, skuId, onReviewAdded, onCancel, initialData = null }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(initialData ? initialData.rating : 5);
    const [comment, setComment] = useState(initialData ? initialData.comment : '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        try {
            setSubmitting(true);

            let response;
            if (initialData) {
                // Update existing review
                response = await reviewAPI.updateReview(initialData.id, {
                    rating,
                    comment
                });
            } else {
                // Create new review
                response = await reviewAPI.createReview({
                    product: productId,
                    rating,
                    comment,
                    user: user.user_id,
                    order: orderId,
                    sku: skuId
                });
            }

            onReviewAdded(response.data);
            if (!initialData) {
                setRating(5);
                setComment('');
            }
        } catch (err) {
            console.error('Failed to submit review:', err);
            const errorMessage = err.response?.data?.non_field_errors?.[0] ||
                err.response?.data?.detail ||
                'Failed to submit review';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="review-form">
            <h4>{initialData ? 'Edit Your Review' : 'Write a Review'}</h4>

            <div className="form-group">
                <label>Rating:</label>
                <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= rating ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={star <= rating ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="32"
                                height="32"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="comment">Comment:</label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    placeholder="Share your thoughts about this product..."
                    required
                />
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="btn btn-text"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : (initialData ? 'Update Review' : 'Submit Review')}
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;
