
import { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/currency';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'fixed',
        discount_value: '',
        min_purchase_ammount: '',
        valid_from: '',
        valid_to: '',
        usage_limit: '',
        active: true
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await couponAPI.getCoupons();
            setCoupons(response.data);
        } catch (error) {
            toast.error('Failed to fetch coupons');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                min_purchase_ammount: parseFloat(formData.min_purchase_ammount),
                usage_limit: parseInt(formData.usage_limit),
                valid_from: new Date(formData.valid_from).toISOString(),
                valid_to: new Date(formData.valid_to).toISOString(),
            };

            if (editingId) {
                await couponAPI.updateCoupon(editingId, payload);
                toast.success('Coupon updated successfully');
            } else {
                await couponAPI.createCoupon(payload);
                toast.success('Coupon created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            resetForm();
            fetchCoupons();
        } catch (error) {
            console.error(error);
            const errorData = error.response?.data;
            let errorMessage = 'Operation failed';

            if (errorData) {
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (typeof errorData === 'object') {
                    // Handle DRF field errors
                    const firstKey = Object.keys(errorData)[0];
                    const firstError = errorData[firstKey];
                    if (Array.isArray(firstError)) {
                        errorMessage = `${firstKey}: ${firstError[0]}`;
                    } else if (typeof firstError === 'string') {
                        errorMessage = `${firstKey}: ${firstError}`;
                    } else {
                        errorMessage = JSON.stringify(firstError);
                    }
                }
            }

            toast.error(errorMessage);
        }
    };

    const handleEdit = (coupon) => {
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_purchase_ammount: coupon.min_purchase_ammount,
            valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
            valid_to: coupon.valid_to ? new Date(coupon.valid_to).toISOString().slice(0, 16) : '',
            usage_limit: coupon.usage_limit,
            active: coupon.active
        });
        setEditingId(coupon.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await couponAPI.deleteCoupon(id);
                toast.success('Coupon deleted successfully');
                fetchCoupons();
            } catch (error) {
                toast.error('Failed to delete coupon');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discount_type: 'fixed',
            discount_value: '',
            min_purchase_ammount: '',
            valid_from: '',
            valid_to: '',
            usage_limit: '',
            active: true
        });
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Coupon Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setEditingId(null);
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? 'Cancel' : 'Add New Coupon'}
                </button>
            </div>

            {showForm && (
                <div className="admin-form-container">
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="form-group">
                            <label>Coupon Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount Type</label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                >
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Discount Value</label>
                                <input
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Minimum Purchase Amount</label>
                            <input
                                type="number"
                                name="min_purchase_ammount"
                                value={formData.min_purchase_ammount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Valid From</label>
                                <input
                                    type="datetime-local"
                                    name="valid_from"
                                    value={formData.valid_from}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Valid To</label>
                                <input
                                    type="datetime-local"
                                    name="valid_to"
                                    value={formData.valid_to}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Usage Limit</label>
                            <input
                                type="number"
                                name="usage_limit"
                                value={formData.usage_limit}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                />
                                Active
                            </label>
                        </div>

                        <button type="submit" className="btn btn-success">
                            {editingId ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                    </form>
                </div>
            )}

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Min Purchase</th>
                            <th>Validity</th>
                            <th>Usage</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon.id}>
                                <td>{coupon.code}</td>
                                <td>
                                    {coupon.discount_type === 'fixed'
                                        ? formatPrice(coupon.discount_value)
                                        : `${coupon.discount_value}%`}
                                </td>
                                <td>{formatPrice(coupon.min_purchase_ammount)}</td>
                                <td>
                                    {new Date(coupon.valid_from).toLocaleDateString()} -
                                    {new Date(coupon.valid_to).toLocaleDateString()}
                                </td>
                                <td>{coupon.used_count} / {coupon.usage_limit}</td>
                                <td>
                                    <span className={`status-badge ${coupon.active ? 'success' : 'danger'}`}>
                                        {coupon.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleEdit(coupon)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        onClick={() => handleDelete(coupon.id)}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CouponManagement;
