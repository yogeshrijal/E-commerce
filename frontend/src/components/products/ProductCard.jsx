import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const imageUrl = product.image || '/placeholder-product.png';


    // Calculate average rating and review count
    const avgRating = product.avg_rating ? Number(product.avg_rating) : 0;
    // Safely handle missing review_count or reviews array
    const reviewCount = product.review_count || product.reviews?.length || 0;
    const hasRatings = avgRating > 0;


    // Helper to render stars
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="star-rating">
                {'★'.repeat(fullStars)}
                {hasHalfStar && '⯨'}
                {'☆'.repeat(emptyStars)}
            </div>
        );
    };

    return (
        <Link to={`/products/${product.id}`} className="product-card">
            <div className="product-image">
                <img src={imageUrl} alt={product.name} />
                {product.stock === 0 && (
                    <div className="out-of-stock-badge">Out of Stock</div>
                )}
            </div>
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>

                {/* Rating Display */}
                {hasRatings ? (
                    <div className="product-rating">
                        {renderStars(avgRating)}
                        <span className="rating-text">
                            {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                    </div>
                ) : (
                    <div className="product-rating no-rating">
                        <span className="rating-text">No ratings yet</span>
                    </div>
                )}

                <div className="product-footer">
                    <span className="product-price">${Number(product.base_price).toFixed(2)}</span>
                    {product.stock > 0 && product.stock < 10 && (
                        <span className="low-stock">Only {product.stock} left</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
