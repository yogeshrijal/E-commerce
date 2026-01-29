import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post('/api/tokenrefresh/', {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('access_token', access);

                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/gettoken/', credentials),
    register: (userData) => api.post('/user/', userData),
    verifyToken: (token) => api.post('/verifytoken/', { token }),
    refreshToken: (refresh) => api.post('/tokenrefresh/', { refresh }),
};

// User API
export const userAPI = {
    getUsers: () => api.get('/user/'),
    getUser: (id) => api.get(`/user/${id}/`),
    updateUser: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.patch(`/user/${id}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteUser: (id) => api.delete(`/user/${id}/`),
};

// Category API
export const categoryAPI = {
    getCategories: () => api.get('/category/'),
    getCategory: (id) => api.get(`/category/${id}/`),
    createCategory: (data) => api.post('/category/', data),
    updateCategory: (id, data) => api.patch(`/category/${id}/`, data),
    deleteCategory: (id) => api.delete(`/category/${id}/`),
};

// Product API
export const productAPI = {
    getProducts: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.ordering) {
            queryParams.append('ordering', params.ordering);
        }
        const queryString = queryParams.toString();
        return api.get(`/product/${queryString ? `?${queryString}` : ''}`);
    },
    getProduct: (id) => api.get(`/product/${id}/`),
    createProduct: (data) => {
        // Use FormData for image upload support
        const formData = new FormData();

        // Add basic fields
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('base_price', data.base_price);
        formData.append('stock', data.stock);

        // Add image if present
        if (data.image && data.image instanceof File) {
            formData.append('image', data.image);
        }

        // Add specs as JSON string
        if (data.specs && data.specs.length > 0) {
            formData.append('specs', JSON.stringify(data.specs));
        }

        // Add SKUs as JSON string
        if (data.skus && data.skus.length > 0) {
            formData.append('skus', JSON.stringify(data.skus));
        }

        return api.post('/product/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updateProduct: async (id, data) => {
        // If there's a new image file, split into two requests
        if (data.image && data.image instanceof File) {
            // 1. Upload image
            const imageFormData = new FormData();
            imageFormData.append('image', data.image);

            await api.patch(`/product/${id}/`, imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // 2. Update other data as JSON
            const jsonData = {
                name: data.name,
                description: data.description,
                category: data.category,
                base_price: data.base_price,
                stock: data.stock,
            };

            if (data.is_active !== undefined) {
                jsonData.is_active = data.is_active;
            }

            if (data.specs && data.specs.length > 0) {
                jsonData.specs = data.specs;
            }
            if (data.skus && data.skus.length > 0) {
                jsonData.skus = data.skus;
            }

            return api.patch(`/product/${id}/`, jsonData, {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // If no new image, use regular JSON
        const jsonData = {
            name: data.name,
            description: data.description,
            category: data.category,
            base_price: data.base_price,
            stock: data.stock,
        };

        if (data.is_active !== undefined) {
            jsonData.is_active = data.is_active;
        }

        // Include specs and SKUs as arrays (not JSON strings)
        if (data.specs && data.specs.length > 0) {
            jsonData.specs = data.specs;
        }
        if (data.skus && data.skus.length > 0) {
            jsonData.skus = data.skus;
        }

        return api.patch(`/product/${id}/`, jsonData, {
            headers: { 'Content-Type': 'application/json' },
        });
    },
    deleteProduct: (id) => api.delete(`/product/${id}/`),
};

// Order API
export const orderAPI = {
    getOrders: () => api.get('/order/'),
    getOrder: (id) => api.get(`/order/${id}/`),
    createOrder: (data) => api.post('/order/', data),
    updateOrder: (id, data) => api.patch(`/order/${id}/`, data),
    deleteOrder: (id) => api.delete(`/order/${id}/`),
};

// Shipping API
export const shippingAPI = {
    getShippingZones: () => api.get('/shippingzone/'),
    getShippingZone: (id) => api.get(`/shippingzone/${id}/`),
    createShippingZone: (data) => api.post('/shippingzone/', data),
    updateShippingZone: (id, data) => api.patch(`/shippingzone/${id}/`, data),
    deleteShippingZone: (id) => api.delete(`/shippingzone/${id}/`),

    getGlobalShippingRates: () => api.get('/globalshippingrate/'),
    updateGlobalShippingRate: (id, data) => api.patch(`/globalshippingrate/${id}/`, data),
};

// Review API
export const reviewAPI = {
    getReviews: () => api.get('/review/'),
    createReview: (data) => api.post('/review/', data),
    updateReview: (id, data) => api.patch(`/review/${id}/`, data),
    deleteReview: (id) => api.delete(`/review/${id}/`),
};

// Payment API
export const paymentAPI = {
    verifyEsewa: (data) => api.post('/payments/verify_esewa/', data),
};

export default api;
