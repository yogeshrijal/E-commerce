# 🛒 E-Market
## Multi-Vendor E-Commerce Platform

E-Market is a robust, full-stack **multi-vendor e-commerce platform** built with **Django (Backend)** and **React (Frontend)**.  
It enables multiple sellers to manage products and orders, while customers enjoy a seamless shopping experience.  
The platform also provides a powerful admin panel for complete system oversight.

---

## 🚀 Features

### 👤 User Roles & Authentication
- Secure authentication using **JWT (JSON Web Tokens)**
- Role-based access control for **Customers**, **Sellers**, and **Admins**
- User profile management with editable personal details and addresses

---

### 🛍️ Customer Features
- Browse products by category
- View detailed product information
- Shopping cart with quantity management
- Secure checkout process
- Order history and order status tracking

---

### 🏪 Seller Features
- Seller dashboard with sales overview
- Product management (create, update, delete)
- Inventory control with SKU-based stock tracking
- Order fulfillment for seller-related orders

---

### 🛡️ Admin Features
- Platform-wide monitoring dashboard
- User and role management
- Category management
- Order management across the platform
- Shipping management
  - Country-based shipping zones
  - Global shipping rate fallback

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **API Communication:** Axios
- **Forms:** React Hook Form
- **Notifications:** React Toastify
- **Styling:** CSS Modules / Styled Components

---

### Backend
- **Framework:** Django 6.0
- **API:** Django REST Framework (DRF)
- **Authentication:** Simple JWT
- **CORS:** django-cors-headers

---

### Database
- **Development:** SQLite
- **Production:** PostgreSQL / MySQL compatible

---

## 🧱 Architecture Overview
- RESTful API using Django REST Framework
- Single Page Application (SPA) using React
- JWT-based authentication
- Country-based shipping logic with global fallback
- Complete order lifecycle management

---

## ⚙️ Installation & Setup

### Backend
```bash
git clone https://github.com/yogeshrijal/E-commerce.git
cd E-commerce
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

