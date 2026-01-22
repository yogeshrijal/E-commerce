import { useState, useEffect } from 'react';
import { categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        parent: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = {
                name: formData.name,
                parent: formData.parent || null,
            };

            if (editingId) {
                await categoryAPI.updateCategory(editingId, data);
                toast.success('Category updated successfully');
            } else {
                await categoryAPI.createCategory(data);
                toast.success('Category created successfully');
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', parent: '' });
            fetchCategories();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to save category');
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            parent: category.parent || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) {
            return;
        }

        try {
            await categoryAPI.deleteCategory(id);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete category');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', parent: '' });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="category-management-page">
            <div className="container">
                <div className="page-header">
                    <h1>Category Management</h1>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            + Add Category
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="category-form-card">
                        <h2>{editingId ? 'Edit Category' : 'Add New Category'}</h2>
                        <form onSubmit={handleSubmit} className="category-form">
                            <div className="form-group">
                                <label htmlFor="name">Category Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="parent">Parent Category (Optional)</label>
                                <select
                                    id="parent"
                                    value={formData.parent}
                                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                                >
                                    <option value="">None (Top Level)</option>
                                    {categories
                                        .filter((cat) => cat.id !== editingId)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="categories-list">
                    <h2>All Categories</h2>
                    {categories.length === 0 ? (
                        <p>No categories yet.</p>
                    ) : (
                        <div className="categories-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Parent Category</th>
                                        <th>Created By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr key={category.id}>
                                            <td>{category.name}</td>
                                            <td>{category.parent || '-'}</td>
                                            <td>{category.created_by || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button onClick={() => handleEdit(category)} className="btn-link">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(category.id)} className="btn-link danger">
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManagement;
