import { useNavigate } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';

const CompareButton = () => {
    const navigate = useNavigate();
    const { getCompareCount } = useCompare();
    const count = getCompareCount();

    if (count === 0) {
        return null;
    }

    return (
        <button
            onClick={() => navigate('/compare')}
            className="compare-floating-button"
            aria-label="View compare list"
        >
            <span className="compare-icon">⚖️</span>
            <span className="compare-text">Compare</span>
            <span className="compare-badge">{count}</span>
        </button>
    );
};

export default CompareButton;
