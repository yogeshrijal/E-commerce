import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';

import Cart from './pages/cart/Cart';
import Checkout from './pages/cart/Checkout';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailure from './pages/payment/PaymentFailure';
import Chat from './pages/chat/Chat';

import OrderHistory from './pages/orders/OrderHistory';
import OrderDetail from './pages/orders/OrderDetail';

import SellerDashboard from './pages/seller/SellerDashboard';
import MyProducts from './pages/seller/MyProducts';
import ProductForm from './pages/seller/ProductForm';
import SellerOrders from './pages/seller/SellerOrders';
import PublicSellerProfile from './pages/seller/PublicSellerProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManagement from './pages/admin/CategoryManagement';
import UserManagement from './pages/admin/UserManagement';
import AllProducts from './pages/admin/AllProducts';
import OrderManagement from './pages/admin/OrderManagement';
import ShippingManagement from './pages/admin/ShippingManagement';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    { }
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:id" element={<ProductDetail />} />

                    { }
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    { }
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <Cart />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <OrderHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders/:id"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <OrderDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment/success"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <PaymentSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment/failure"
                      element={
                        <ProtectedRoute requiredRole="customer">
                          <PaymentFailure />
                        </ProtectedRoute>
                      }
                    />

                    {/* Chat Route - Accessible to Authenticated Users (Customer & Seller) */}
                    <Route
                      path="/chats"
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      }
                    />

                    { }
                    <Route
                      path="/seller/dashboard"
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <SellerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/seller/products"
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <MyProducts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/seller/products/new"
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <ProductForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/seller/products/:id/edit"
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <ProductForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/seller/orders"
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <SellerOrders />
                        </ProtectedRoute>
                      }
                    />

                    { }
                    <Route
                      path="/seller-profile/:sellerName"
                      element={<PublicSellerProfile />}
                    />

                    { }
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/categories"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <CategoryManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AllProducts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <OrderManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/shipping"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ShippingManagement />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <ToastContainer position="top-right" autoClose={3000} />
              </div>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
