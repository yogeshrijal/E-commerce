export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return { isValid: false, message: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }

    return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.)' };
    }

    return { isValid: true, message: '' };
};

export const validatePhone = (phone) => {
    if (!phone) {
        return { isValid: true, message: '' };
    }

    const cleanedPhone = phone.replace(/[\s-]/g, '');

    const phoneRegex = /^98\d{8}$/;

    if (!phoneRegex.test(cleanedPhone)) {
        return { isValid: false, message: 'Please enter a valid Nepali phone number (10 digits starting with 98)' };
    }

    return { isValid: true, message: '' };
};

export const validateUsername = (username) => {
    if (!username) {
        return { isValid: false, message: 'Username is required' };
    }

    if (username.length < 3) {
        return { isValid: false, message: 'Username must be at least 3 characters long' };
    }

    if (username.length > 30) {
        return { isValid: false, message: 'Username must be less than 30 characters' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }

    return { isValid: true, message: '' };
};

export const validatePrice = (price) => {
    if (!price && price !== 0) {
        return { isValid: false, message: 'Price is required' };
    }

    const numPrice = Number(price);

    if (isNaN(numPrice)) {
        return { isValid: false, message: 'Price must be a valid number' };
    }

    if (numPrice < 0) {
        return { isValid: false, message: 'Price cannot be negative' };
    }

    if (numPrice === 0) {
        return { isValid: false, message: 'Price must be greater than 0' };
    }

    return { isValid: true, message: '' };
};

export const validateStock = (stock) => {
    if (!stock && stock !== 0) {
        return { isValid: false, message: 'Stock quantity is required' };
    }

    const numStock = Number(stock);

    if (isNaN(numStock)) {
        return { isValid: false, message: 'Stock must be a valid number' };
    }

    if (!Number.isInteger(numStock)) {
        return { isValid: false, message: 'Stock must be a whole number' };
    }

    if (numStock < 0) {
        return { isValid: false, message: 'Stock cannot be negative' };
    }

    return { isValid: true, message: '' };
};

export const getPasswordStrength = (password) => {
    if (!password) return 'weak';

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
};
