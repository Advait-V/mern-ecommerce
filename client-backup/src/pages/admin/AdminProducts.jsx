// src/pages/admin/AdminProducts.jsx
//
// Full product CRUD in one page:
//   - Table of all products with Edit/Delete buttons
//   - "Add Product" toggleable form at the top
//   - Clicking Edit loads that product's data into the form (same form, dual-mode)
//
// Form dual-mode pattern:
//   editingProduct === null  → form is in CREATE mode  (POST)
//   editingProduct !== null  → form is in EDIT mode    (PUT)

import { useState, useEffect }         from 'react';
import {
  fetchProducts, createProduct,
  updateProduct, deleteProduct,
}                                       from '../../api/productApi';
import AdminLayout                     from '../../components/AdminLayout';
import Spinner                         from '../../components/Spinner';
import Message                         from '../../components/Message';
import { formatCurrency }              from '../../utils/formatCurrency';
import { toast }                       from 'react-toastify';

// Empty form template — reused to reset the form
const EMPTY_FORM = {
  name: '', description: '', price: '', category: '',
  brand: '', image: '', stock: '',
};

const AdminProducts = () => {
  const [products,        setProducts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');

  // Form state
  const [showForm,        setShowForm]        = useState(false);
  const [formData,        setFormData]        = useState(EMPTY_FORM);
  const [editingProduct,  setEditingProduct]  = useState(null); // null = create mode
  const [formLoading,     setFormLoading]     = useState(false);
  const [formError,       setFormError]       = useState('');

  // Delete confirmation state
  const [deletingId,      setDeletingId]      = useState(null);

  // ── Load products on mount ──────────────────────────────────────────────
  const loadProducts = async () => {
    try {
      setLoading(true);
      // Fetch all products (high limit) — admin sees everything
      const data = await fetchProducts({ limit: 100 });
      setProducts(data.products);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  // ── Form handlers ───────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (formError) setFormError('');
  };

  // Open form in EDIT mode — pre-fill with existing product data
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name:        product.name        || '',
      description: product.description || '',
      price:       product.price       || '',
      category:    product.category    || '',
      brand:       product.brand       || '',
      image:       product.image       || '',
      stock:       product.stock       || '',
    });
    setShowForm(true);
    // Scroll to top so the form is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form to CREATE mode
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowForm(false);
  };

  // Submit: create or update based on editingProduct
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.description ||
        !formData.price || !formData.category) {
      return setFormError('Name, description, price and category are required');
    }
    if (Number(formData.price) <= 0) {
      return setFormError('Price must be a positive number');
    }

    try {
      setFormLoading(true);
      setFormError('');

      // Build payload — convert price and stock to numbers
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock) || 0,
      };

      if (editingProduct) {
        // EDIT mode → PUT request
        await updateProduct(editingProduct._id, payload);
        toast.success('Product updated successfully!');
      } else {
        // CREATE mode → POST request
        await createProduct(payload);
        toast.success('Product created successfully!');
      }

      // Reset form and reload products list
      handleCancelEdit();
      loadProducts();

    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to save product'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Delete with confirmation
  const handleDelete = async (id, name) => {
    // First click sets the id (shows "Confirm?" state)
    // Second click on same id actually deletes
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    // Second click — confirmed
    try {
      await deleteProduct(id);
      toast.success(`"${name}" deleted`);
      setDeletingId(null);
      loadProducts();
    } catch {
      toast.error('Failed to delete product');
      setDeletingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Products">

      {/* ── Add / Edit Product Form ───────────────────────────────────── */}
      <div style={styles.formCard}>
        {/* Toggle header */}
        <div style={styles.formCardHeader}>
          <h2 style={styles.formCardTitle}>
            {editingProduct ? `✏️ Editing: ${editingProduct.name}` : '➕ Add New Product'}
          </h2>
          <button
            onClick={editingProduct ? handleCancelEdit : () => setShowForm((s) => !s)}
            style={styles.toggleBtn}
          >
            {editingProduct ? 'Cancel Edit' : showForm ? '− Collapse' : '+ Expand'}
          </button>
        </div>

        {/* Form — shown when showForm or editingProduct */}
        {(showForm || editingProduct) && (
          <form onSubmit={handleSubmit} style={styles.form}>
            {formError && <Message type="error">{formError}</Message>}

            <div style={styles.formGrid}>
              <ProductFormField label="Product Name *"   name="name"        value={formData.name}        onChange={handleChange} placeholder="e.g. Sony WH-1000XM5" span={2} />
              <ProductFormField label="Category *"       name="category"    value={formData.category}    onChange={handleChange} placeholder="Electronics" />
              <ProductFormField label="Brand"            name="brand"       value={formData.brand}       onChange={handleChange} placeholder="Sony" />
              <ProductFormField label="Price (₹) *"      name="price"       value={formData.price}       onChange={handleChange} placeholder="29999"  type="number" />
              <ProductFormField label="Stock (units) *"  name="stock"       value={formData.stock}       onChange={handleChange} placeholder="50"     type="number" />
              <ProductFormField label="Image URL"        name="image"       value={formData.image}       onChange={handleChange} placeholder="https://..." span={2} />

              {/* Description uses textarea, not input */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={styles.fieldLabel}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the product…"
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  ...styles.saveBtn,
                  opacity: formLoading ? 0.7 : 1,
                  cursor:  formLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {formLoading
                  ? 'Saving…'
                  : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── Products Table ────────────────────────────────────────────── */}
      {error && <Message type="error">{error}</Message>}

      {loading ? <Spinner /> : (
        <div style={styles.tableCard}>
          {/* Table header */}
          <div style={styles.tableHeaderRow}>
            <h2 style={styles.tableTitle}>
              All Products
              <span style={styles.countBadge}>{products.length}</span>
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    style={{
                      ...styles.tr,
                      // Highlight row if it's being edited
                      backgroundColor: editingProduct?._id === product._id
                        ? '#eff6ff' : 'transparent',
                    }}
                  >
                    {/* Product name + image */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          style={styles.productThumb}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                        />
                        <span style={styles.productName}>{product.name}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.categoryPill}>{product.category}</span>
                    </td>

                    <td style={{ ...styles.td, fontWeight: 700 }}>
                      {formatCurrency(product.price)}
                    </td>

                    {/* Stock — colour-coded */}
                    <td style={styles.td}>
                      <span style={{
                        fontWeight: 700,
                        color: product.stock === 0 ? '#dc2626'
                             : product.stock <= 5  ? '#ea580c'
                             : '#166534',
                      }}>
                        {product.stock}
                      </span>
                    </td>

                    <td style={styles.td}>
                      ⭐ {product.rating?.toFixed(1) || '0.0'}
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {' '}({product.numReviews})
                      </span>
                    </td>

                    {/* Actions: Edit + Delete */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={styles.editBtn}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          style={{
                            ...styles.deleteBtn,
                            // Show "Confirm?" in red on first click
                            backgroundColor: deletingId === product._id ? '#dc2626' : '#fee2e2',
                            color:           deletingId === product._id ? '#fff'    : '#991b1b',
                          }}
                        >
                          {deletingId === product._id ? '⚠️ Confirm?' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              No products found. Add your first product above!
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

// ── ProductFormField helper ───────────────────────────────────────────────────
const ProductFormField = ({
  label, name, value, onChange,
  placeholder, type = 'text', span = 1,
}) => (
  <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
    <label style={styles.fieldLabel}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={styles.fieldInput}
      min={type === 'number' ? '0' : undefined}
    />
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  formCard:        { backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  formCardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formCardTitle:   { fontSize: '1rem', fontWeight: 700, color: '#0f172a' },
  toggleBtn:       { backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.875rem', cursor: 'pointer', color: '#374151', fontWeight: 600 },
  form:            { marginTop: '1.25rem' },
  formGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  fieldLabel:      { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' },
  fieldInput:      { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box' },
  textarea:        { width: '100%', padding: '0.6rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', color: '#0f172a', boxSizing: 'border-box' },
  saveBtn:         { backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 700 },
  cancelBtn:       { backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' },
  tableCard:       { backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableHeaderRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' },
  tableTitle:      { fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  countBadge:      { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '999px' },
  table:           { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
  thead:           { backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' },
  th:              { textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:              { borderBottom: '1px solid #f8fafc', transition: 'background-color 0.1s' },
  td:              { padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#374151', verticalAlign: 'middle' },
  productThumb:    { width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', backgroundColor: '#f8fafc', flexShrink: 0 },
  productName:     { fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' },
  categoryPill:    { backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' },
  editBtn:         { backgroundColor: '#f0fdf4', color: '#166534', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  deleteBtn:       { border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
};

export default AdminProducts;