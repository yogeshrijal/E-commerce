import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const imageUrl = product.image || '/placeholder-product.png';

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
