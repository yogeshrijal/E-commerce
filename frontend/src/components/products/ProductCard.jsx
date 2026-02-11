import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/currency';

const ProductCard = ({ product }) => {
    const { addToCompare, isInCompare, removeFromCompare } = useCompare();
    const imageUrl = product.image || '/placeholder-product.png';


    const avgRating = product.avg_rating ? Number(product.avg_rating) : 0;
    const reviewCount = product.review_count || product.reviews?.length || 0;
    const hasRatings = avgRating > 0;


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

    const handleCompareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isInCompare(product.id)) {
            removeFromCompare(product.id);
        } else {
            addToCompare(product);
        }
    };

    const inCompare = isInCompare(product.id);

    return (
        <div className="product-card">
            <Link to={`/products/${product.id}`} className="product-card-link">
                <div className="product-image">
                    <img src={imageUrl} alt={product.name} />
                    {product.stock === 0 && (
                        <div className="out-of-stock-badge">Out of Stock</div>
                    )}
                    <button
                        onClick={handleCompareClick}
                        className={`compare-icon-btn ${inCompare ? 'active' : ''}`}
                        aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                        title={inCompare ? 'Remove from compare' : 'Add to compare'}
                    >
                        {inCompare ? '✓' : '⚖️'}
                    </button>
                </div>
                <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>

                    { }
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
                        <span className="product-price">{formatPrice(product.base_price)}</span>
                        {product.stock > 0 && product.stock < 10 && (
                            <span className="low-stock">Only {product.stock} left</span>
                        )}
                    </div>

                    {product.created_by && (
                        <div className="product-seller">
                            <span className="seller-label">Seller: {product.created_by}</span>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
