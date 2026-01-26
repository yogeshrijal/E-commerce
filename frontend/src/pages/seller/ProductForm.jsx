import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        parent_category: '',
        base_price: '',
        stock: '',
        image: null,
    });
    const [specs, setSpecs] = useState([{ attribute: '', value: '' }]);
    const [skus, setSkus] = useState([
        { sku_code: '', price: '', stock: '', image: null, sku_attribute: [{ attribute: '', value: '' }] },
    ]);
    
    // Store original SKU data to detect actual changes
    const originalSkus = useRef(null);

    useEffect(() => {
        fetchCategories();
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await productAPI.getProduct(id);
            const product = response.data;

            setFormData({
                name: product.name,
                description: product.description,
                category: product.category,
                parent_category: product.parent_category || '',
                base_price: product.base_price,
                stock: product.stock,
                image: null,
            });

            if (product.specs && product.specs.length > 0) {
                setSpecs(product.specs);
            }

            if (product.skus && product.skus.length > 0) {
                const loadedSkus = product.skus.map(sku => ({
                    id: sku.id, // Preserve the ID for updates
                    ...sku,
                    existingImage: sku.image,
                    image: null,
                    sku_attribute: (sku.sku_attribute || []).map(attr => ({
                        id: attr.id, // Preserve attribute IDs too
                        ...attr
                    })),
                }));
                setSkus(loadedSkus);
                
                // Store deep copy of original SKU data for comparison
                originalSkus.current = JSON.parse(JSON.stringify(loadedSkus));
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check if SKUs have actually changed
    const haveSkusChanged = () => {
        if (!originalSkus.current) return true; // New product
        
        // Check if SKU count changed
        if (skus.length !== originalSkus.current.length) {
            return true;
        }

        // Check each SKU for changes
        for (let i = 0; i < skus.length; i++) {
            const current = skus[i];
            const original = originalSkus.current[i];

            // Check basic fields
            if (
                current.sku_code !== original.sku_code ||
                String(current.price) !== String(original.price) ||
                String(current.stock) !== String(original.stock) ||
                current.image !== null // New image uploaded
            ) {
                return true;
            }

            // Check attributes count
            if (current.sku_attribute.length !== original.sku_attribute.length) {
                return true;
            }

            // Check each attribute
            for (let j = 0; j < current.sku_attribute.length; j++) {
                if (
                    current.sku_attribute[j].attribute !== original.sku_attribute[j].attribute ||
                    current.sku_attribute[j].value !== original.sku_attribute[j].value
                ) {
                    return true;
                }
            }
        }

        return false;
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({
            ...formData,
            [name]: files ? files[0] : value,
        });
    };

    const handleSpecChange = (index, field, value) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = value;
        setSpecs(newSpecs);
    };

    const addSpec = () => {
        setSpecs([...specs, { attribute: '', value: '' }]);
    };

    const removeSpec = (index) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const handleSKUChange = (index, field, value) => {
        const newSKUs = [...skus];
        if (field === 'image') {
            newSKUs[index][field] = value;
        } else {
            newSKUs[index][field] = value;
        }
        setSkus(newSKUs);
    };

    const handleSKUAttributeChange = (skuIndex, attrIndex, field, value) => {
        const newSKUs = [...skus];
        newSKUs[skuIndex].sku_attribute[attrIndex][field] = value;
        setSkus(newSKUs);
    };

    const addSKUAttribute = (skuIndex) => {
        const newSKUs = [...skus];
        newSKUs[skuIndex].sku_attribute.push({ attribute: '', value: '' });
        setSkus(newSKUs);
    };

    const removeSKUAttribute = (skuIndex, attrIndex) => {
        const newSKUs = [...skus];
        newSKUs[skuIndex].sku_attribute = newSKUs[skuIndex].sku_attribute.filter((_, i) => i !== attrIndex);
        setSkus(newSKUs);
    };

    const addSKU = () => {
        setSkus([
            ...skus,
            { sku_code: '', price: '', stock: '', image: null, sku_attribute: [{ attribute: '', value: '' }] },
        ]);
    };

    const removeSKU = (index) => {
        setSkus(skus.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate image size if present
            if (formData.image && formData.image.size > 10 * 1024 * 1024) {
                toast.error('Image size must be less than 10MB. Please compress your image.');
                setLoading(false);
                return;
            }

            const productData = {
                name: formData.name,
                description: formData.description,
                category: formData.parent_category || formData.category,
                base_price: parseFloat(formData.base_price),
                stock: parseInt(formData.stock),
                image: formData.image,
                specs: specs.filter((s) => s.attribute && s.value),
            };

            // Check if SKUs actually changed before including them
            const skusChanged = haveSkusChanged();
            
            if (skusChanged) {
                productData.skus = skus
                    .filter((sku) => sku.sku_code && sku.price && sku.stock)
                    .map((sku) => ({
                        id: sku.id || undefined, // Include ID for existing SKUs
                        sku_code: sku.sku_code,
                        price: parseFloat(sku.price),
                        stock: parseInt(sku.stock),
                        image: sku.image || undefined,
                        sku_attribute: sku.sku_attribute
                            .filter((attr) => attr.attribute && attr.value)
                            .map((attr) => ({
                                id: attr.id || undefined, // Include ID for existing attributes
                                attribute: attr.attribute,
                                value: attr.value,
                            })),
                    }));
            }

            console.log('Sending product data:', productData);
            console.log('SKUs changed:', skusChanged);

            if (isEdit) {
                await productAPI.updateProduct(id, productData);
                toast.success('Product updated successfully!');
            } else {
                await productAPI.createProduct(productData);
                toast.success('Product created successfully!');
            }

            navigate('/seller/products');
        } catch (error) {
            console.error('Submit error:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.detail ||
                error.response?.data?.category?.[0] ||
                error.response?.data?.base_price?.[0] ||
                error.response?.data?.image?.[0] ||
                error.response?.data?.skus?.[0]?.sku_code?.[0] ||
                'Failed to save product';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (isEdit && loading) return <LoadingSpinner />;

    return (
        <div className="product-form-page">
            <div className="container">
                <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

                <form onSubmit={handleSubmit} className="product-form">
                    <div className="form-section">
                        <h2>Basic Information</h2>

                        <div className="form-group">
                            <label htmlFor="name">Product Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories
                                        .filter(cat => !cat.parent)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {formData.category && categories.filter(cat => cat.parent === formData.category).length > 0 && (
                                <div className="form-group">
                                    <label htmlFor="parent_category">Subcategory (Optional)</label>
                                    <select
                                        id="parent_category"
                                        name="parent_category"
                                        value={formData.parent_category || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">None</option>
                                        {categories
                                            .filter(cat => cat.parent === formData.category)
                                            .map((cat) => (
                                                <option key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="base_price">Base Price *</label>
                                <input
                                    type="number"
                                    id="base_price"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock">Stock *</label>
                                <input
                                    type="number"
                                    id="stock"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="image">Product Image</label>
                            <input
                                type="file"
                                id="image"
                                name="image"
                                onChange={handleChange}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <h2>Specifications</h2>
                            <button type="button" onClick={addSpec} className="btn btn-secondary">
                                + Add Spec
                            </button>
                        </div>

                        {specs.map((spec, index) => (
                            <div key={index} className="dynamic-field">
                                <input
                                    type="text"
                                    placeholder="Attribute (e.g., Brand)"
                                    value={spec.attribute}
                                    onChange={(e) => handleSpecChange(index, 'attribute', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g., Nike)"
                                    value={spec.value}
                                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                />
                                {specs.length > 1 && (
                                    <button type="button" onClick={() => removeSpec(index)} className="btn-remove">
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <h2>Product Variants (SKUs)</h2>
                            <button type="button" onClick={addSKU} className="btn btn-secondary">
                                + Add SKU
                            </button>
                        </div>

                        {skus.map((sku, skuIndex) => (
                            <div key={skuIndex} className="sku-section">
                                <div className="sku-header">
                                    <h3>SKU #{skuIndex + 1}</h3>
                                    {skus.length > 1 && (
                                        <button type="button" onClick={() => removeSKU(skuIndex)} className="btn-remove">
                                            Remove SKU
                                        </button>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>SKU Code</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., PROD-001-RED-L"
                                            value={sku.sku_code}
                                            onChange={(e) => handleSKUChange(skuIndex, 'sku_code', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Price</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={sku.price}
                                            onChange={(e) => handleSKUChange(skuIndex, 'price', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Stock</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={sku.stock}
                                            onChange={(e) => handleSKUChange(skuIndex, 'stock', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>SKU Image</label>
                                    {sku.existingImage && !sku.image && (
                                        <div className="existing-image-info">
                                            <img src={sku.existingImage} alt="Current SKU" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current image (upload new to replace)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        onChange={(e) => handleSKUChange(skuIndex, 'image', e.target.files[0])}
                                        accept="image/*"
                                    />
                                </div>

                                <div className="sku-attributes">
                                    <div className="section-header">
                                        <h4>Attributes</h4>
                                        <button
                                            type="button"
                                            onClick={() => addSKUAttribute(skuIndex)}
                                            className="btn btn-sm"
                                        >
                                            + Add Attribute
                                        </button>
                                    </div>

                                    {sku.sku_attribute.map((attr, attrIndex) => (
                                        <div key={attrIndex} className="dynamic-field">
                                            <input
                                                type="text"
                                                placeholder="Attribute (e.g., Color)"
                                                value={attr.attribute}
                                                onChange={(e) =>
                                                    handleSKUAttributeChange(skuIndex, attrIndex, 'attribute', e.target.value)
                                                }
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value (e.g., Red)"
                                                value={attr.value}
                                                onChange={(e) =>
                                                    handleSKUAttributeChange(skuIndex, attrIndex, 'value', e.target.value)
                                                }
                                            />
                                            {sku.sku_attribute.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSKUAttribute(skuIndex, attrIndex)}
                                                    className="btn-remove"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/seller/products')} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;