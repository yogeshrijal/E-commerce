import { useState, useEffect } from 'react';
import { shippingAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ShippingManagement = () => {
    const [shippingZones, setShippingZones] = useState([]);
    const [globalRate, setGlobalRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newZone, setNewZone] = useState({ country_name: '', rate: '' });
    const [updatingGlobal, setUpdatingGlobal] = useState(false);

    useEffect(() => {
        fetchShippingData();
    }, []);

    const fetchShippingData = async () => {
        try {
            const [zonesRes, globalRes] = await Promise.all([
                shippingAPI.getShippingZones(),
                shippingAPI.getGlobalShippingRates()
            ]);
            setShippingZones(zonesRes.data);
            if (globalRes.data.length > 0) {
                setGlobalRate(globalRes.data[0]);
            }
        } catch (error) {
            console.error('Error fetching shipping data:', error);
            toast.error('Failed to load shipping data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddZone = async (e) => {
        e.preventDefault();
        try {
            const response = await shippingAPI.createShippingZone(newZone);
            setShippingZones([...shippingZones, response.data]);
            setNewZone({ country_name: '', rate: '' });
            toast.success('Shipping zone added successfully');
        } catch (error) {
            console.error('Error adding shipping zone:', error);
            toast.error('Failed to add shipping zone');
        }
    };

    const handleDeleteZone = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;
        try {
            await shippingAPI.deleteShippingZone(id);
            setShippingZones(shippingZones.filter(zone => zone.id !== id));
            toast.success('Shipping zone deleted successfully');
        } catch (error) {
            console.error('Error deleting shipping zone:', error);
            toast.error('Failed to delete shipping zone');
        }
    };

    const handleUpdateGlobalRate = async (e) => {
        e.preventDefault();
        setUpdatingGlobal(true);
        try {
            const response = await shippingAPI.updateGlobalShippingRate(globalRate.id, {
                base_rate: globalRate.base_rate
            });
            setGlobalRate(response.data);
            toast.success('Global shipping rate updated');
        } catch (error) {
            console.error('Error updating global rate:', error);
            toast.error('Failed to update global rate');
        } finally {
            setUpdatingGlobal(false);
        }
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="shipping-management">
            <div className="container">
                <h1>Shipping Management</h1>

                <div className="dashboard-section">
                    <h2>Global Shipping Rate</h2>
                    {globalRate ? (
                        <form onSubmit={handleUpdateGlobalRate} className="form-inline">
                            <div className="form-group">
                                <label>Base Rate ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={globalRate.base_rate}
                                    onChange={(e) => setGlobalRate({ ...globalRate, base_rate: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={updatingGlobal}>
                                {updatingGlobal ? 'Updating...' : 'Update Rate'}
                            </button>
                        </form>
                    ) : (
                        <p>No global rate configured.</p>
                    )}
                </div>

                <div className="dashboard-section">
                    <h2>Add New Shipping Zone</h2>
                    <form onSubmit={handleAddZone} className="form-inline">
                        <div className="form-group">
                            <label>Country Name</label>
                            <input
                                type="text"
                                value={newZone.country_name}
                                onChange={(e) => setNewZone({ ...newZone, country_name: e.target.value })}
                                placeholder="e.g., United States"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Rate ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newZone.rate}
                                onChange={(e) => setNewZone({ ...newZone, rate: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Add Zone</button>
                    </form>
                </div>

                <div className="dashboard-section">
                    <h2>Existing Shipping Zones</h2>
                    {shippingZones.length === 0 ? (
                        <p>No shipping zones found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Country</th>
                                        <th>Rate ($)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shippingZones.map((zone) => (
                                        <tr key={zone.id}>
                                            <td>{zone.country_name}</td>
                                            <td>{Number(zone.rate).toFixed(2)}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteZone(zone.id)}
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    Delete
                                                </button>
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

export default ShippingManagement;
