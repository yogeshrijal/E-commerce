import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CompareContext = createContext(null);

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within CompareProvider');
    }
    return context;
};

export const CompareProvider = ({ children }) => {
    const [compareList, setCompareList] = useState(() => {
        try {
            const storedCompare = localStorage.getItem('compareList');
            return storedCompare ? JSON.parse(storedCompare) : [];
        } catch (error) {
            console.error('Failed to load compare list from local storage', error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('compareList', JSON.stringify(compareList));
    }, [compareList]);

    const canAddToCompare = (product) => {
        if (compareList.length === 0) {
            return true;
        }

        // Check if product is already in compare list
        const alreadyExists = compareList.some(item => item.id === product.id);
        if (alreadyExists) {
            return false;
        }

        // Check if all products are from the same category
        const existingCategory = compareList[0].category;
        if (product.category !== existingCategory) {
            return false;
        }

        // Limit to 4 products for better UI
        if (compareList.length >= 4) {
            return false;
        }

        return true;
    };

    const addToCompare = (product) => {
        // Check if already exists
        const alreadyExists = compareList.some(item => item.id === product.id);
        if (alreadyExists) {
            toast.info('Product already in compare list');
            return;
        }

        // Check category match
        if (compareList.length > 0) {
            const existingCategory = compareList[0].category;
            if (product.category !== existingCategory) {
                toast.error(`Can only compare products from the same category (${existingCategory})`);
                return;
            }
        }

        // Check limit
        if (compareList.length >= 4) {
            toast.error('Maximum 4 products can be compared at once');
            return;
        }

        setCompareList([...compareList, product]);
        toast.success('Added to compare list!');
    };

    const removeFromCompare = (productId) => {
        setCompareList(compareList.filter(item => item.id !== productId));
        toast.info('Removed from compare list');
    };

    const clearCompare = () => {
        setCompareList([]);
        localStorage.removeItem('compareList');
        toast.info('Compare list cleared');
    };

    const getCompareCount = () => {
        return compareList.length;
    };

    const isInCompare = (productId) => {
        return compareList.some(item => item.id === productId);
    };

    const value = {
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        getCompareCount,
        canAddToCompare,
        isInCompare,
    };

    return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};
