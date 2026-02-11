import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            const { access, refresh } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            const payload = JSON.parse(atob(access.split('.')[1]));

            const userResponse = await userAPI.getUser(payload.user_id);
            const userData = userResponse.data;

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            toast.success('Login successful!');
            return userData;
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);

            // Don't auto-login - user must verify email first
            toast.success('Registration successful! Please check your email to verify your account.');
            return response.data;
        } catch (error) {
            // Handle different types of errors
            if (error.response?.status === 500) {
                // Server error (likely email sending issue during development)
                toast.error('Registration failed: Email service not configured. Please ask your administrator to configure SMTP settings in the backend.', {
                    autoClose: 5000
                });
            } else if (error.response?.data) {
                // Validation errors
                const message = error.response.data.username?.[0] ||
                    error.response.data.email?.[0] ||
                    error.response.data.message ||
                    'Registration failed. Please check your information.';
                toast.error(message);
            } else {
                toast.error('Registration failed. Please try again.');
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        toast.info('Logged out successfully');
    };

    const updateUserData = (newUserData) => {
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUserData,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller',
        isCustomer: user?.role === 'customer',
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
