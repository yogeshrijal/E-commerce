import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem('cart');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error('Failed to load cart from local storage', error);
            return [];
        }
    });

    useEffect(() => {
        // Save cart to localStorage whenever it changes
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, sku, quantity = 1) => {
        const existingItemIndex = cartItems.findIndex(
            (item) => item.sku.sku_code === sku.sku_code
        );

        if (existingItemIndex > -1) {
            // Update quantity if item already exists
            const updatedCart = [...cartItems];
            updatedCart[existingItemIndex].quantity += quantity;
            setCartItems(updatedCart);
            toast.success('Cart updated!');
        } else {
            // Add new item
            setCartItems([
                ...cartItems,
                {
                    product,
                    sku,
                    quantity,
                },
            ]);
            toast.success('Added to cart!');
        }
    };

    const removeFromCart = (skuCode) => {
        setCartItems(cartItems.filter((item) => item.sku.sku_code !== skuCode));
        toast.info('Removed from cart');
    };

    const updateQuantity = (skuCode, quantity) => {
        if (quantity <= 0) {
            removeFromCart(skuCode);
            return;
        }

        const updatedCart = cartItems.map((item) =>
            item.sku.sku_code === skuCode ? { ...item, quantity } : item
        );
        setCartItems(updatedCart);
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            return total + item.sku.price * item.quantity;
        }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const getTax = () => {
        return getCartTotal() * 0.13; // 13% tax as per backend
    };

    const getGrandTotal = () => {
        return getCartTotal() + getTax();
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getTax,
        getGrandTotal,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
