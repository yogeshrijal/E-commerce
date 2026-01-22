import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Profile = () => {
    const { user, updateUserData } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        contact: '',
        address: '',
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                contact: user.contact || '',
                address: user.address || '',
            });
            setPreview(user.profile_picture);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = { ...formData };
            if (profilePicture) {
                updateData.profile_picture = profilePicture;
            }

            const response = await userAPI.updateUser(user.id, updateData);
            updateUserData(response.data);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-container">
                    <h1>My Profile</h1>

                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {preview ? (
                                    <img src={preview} alt="Profile" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="profile-info">
                                <h2>{user.username}</h2>
                                <p className="role-badge">{user.role}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="profile_picture">Profile Picture</label>
                                <input
                                    type="file"
                                    id="profile_picture"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contact">Contact Number</label>
                                <input
                                    type="number"
                                    id="contact"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter your address"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
