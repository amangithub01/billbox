import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sampleInvoices } from '../data/sampleInvoices';

export default function Review({ invoices, setInvoices }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // 1. Check parent state if available
    if (invoices && invoices.length > 0) {
      const foundInProps = invoices.find((inv) => String(inv.id) === String(id));
      if (foundInProps) {
        setInvoice(JSON.parse(JSON.stringify(foundInProps)));
        setLoading(false);
        return;
      }
    }

    // 2. Try fetching from backend
    fetch(`/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invoice not found in backend');
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(() => {
        // 3. Fallback to sample invoices
        const found = sampleInvoices.find((inv) => String(inv.id) === String(id));
        if (found) {
          setInvoice(JSON.parse(JSON.stringify(found)));
        } else {
          // Default placeholder invoice if ID not found
          setInvoice({
            id: Number(id) || 1,
            invoice_number: `INV-2024-${String(id).padStart(3, '0')}`,
            invoice_no: `INV-2024-${String(id).padStart(3, '0')}`,
            invoice_date: new Date().toISOString().split('T')[0],
            date: new Date().toISOString().split('T')[0],
            vendor_name: 'Sample Vendor Pvt Ltd',
            total_amount: 1500.0,
            total: 1500.0,
            subtotal: 1271.18,
            cgst: 114.41,
            sgst: 114.41,
            igst: 0,
            gstin: '27AAEPM1234C1Z5',
            vendor_gstin: '27AAEPM1234C1Z5',
            status: 'needs_review',
            flags: [],
            items: [
              { description: 'Consulting & Implementation', hsn: '9983', qty: 1, rate: 1271.18, amount: 1271.18 },
            ],
          });
        }
        setLoading(false);
      });
  }, [id, invoices]);

  const handleChange = (field, value) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (idx, field, value) => {
    if (!invoice || !invoice.items) return;
    const newItems = [...invoice.items];
    newItems[idx] = { ...newItems[idx], [field]: value };

    // Auto-calculate amount if qty or rate changed
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(field === 'qty' ? value : newItems[idx].qty) || 0;
      const r = parseFloat(field === 'rate' ? value : newItems[idx].rate) || 0;
      newItems[idx].amount = +(q * r).toFixed(2);
    }

    // Recalculate totals
    const newSubtotal = newItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const newCgst = +(newSubtotal * 0.09).toFixed(2);
    const newSgst = +(newSubtotal * 0.09).toFixed(2);
    const newTotal = +(newSubtotal + newCgst + newSgst).toFixed(2);

    setInvoice((prev) => ({
      ...prev,
      items: newItems,
      subtotal: +newSubtotal.toFixed(2),
      cgst: newCgst,
      sgst: newSgst,
      total_amount: newTotal,
      total: newTotal,
    }));
  };

  const addItem = () => {
    const newItem = { description: 'New line item', hsn: '', qty: 1, rate: 0, amount: 0 };
    setInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItem = (idx) => {
    if (!invoice || !invoice.items) return;
    const newItems = invoice.items.filter((_, i) => i !== idx);
    const newSubtotal = newItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const newCgst = +(newSubtotal * 0.09).toFixed(2);
    const newSgst = +(newSubtotal * 0.09).toFixed(2);
    const newTotal = +(newSubtotal + newCgst + newSgst).toFixed(2);

    setInvoice((prev) => ({
      ...prev,
      items: newItems,
      subtotal: +newSubtotal.toFixed(2),
      cgst: newCgst,
      sgst: newSgst,
      total_amount: newTotal,
      total: newTotal,
    }));
  };

  const handleSave = async (statusOverride) => {
    const updated = {
      ...invoice,
      status: statusOverride || invoice.status,
      flags: statusOverride === 'approved' ? [] : invoice.flags,
    };

    // Update parent state
    if (setInvoices) {
      setInvoices((prev) => {
        const index = prev.findIndex((i) => String(i.id) === String(id));
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updated;
          return clone;
        }
        return [updated, ...prev];
      });
    }

    // Attempt backend update
    try {
      await fetch(`/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Backend unavailable; demo mode handles state
    }

    showToast(statusOverride === 'approved' ? '✓ Invoice Approved!' : '✓ Changes Saved!', 'success');
    setTimeout(() => navigate('/'), 600);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#0F766E', fontSize: '18px', fontWeight: 600 }}>Loading Invoice #{id}...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px', textAlign: 'center' }}>
        <h2>Invoice Not Found</h2>
        <Link to="/" style={{ color: '#0F766E' }}>← Return to Inbox</Link>
      </div>
    );
  }

  const {
    invoice_number,
    invoice_no,
    invoice_date,
    date: dateVal,
    vendor_name,
    total_amount,
    total,
    subtotal = 0,
    cgst = 0,
    sgst = 0,
    gstin,
    vendor_gstin,
    items = [],
    status = 'needs_review',
    flags = [],
  } = invoice;

  const currentGstin = (gstin || vendor_gstin || '').trim().toUpperCase();
  const isGstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z|C]{1}[0-9A-Z]{1}$/i.test(currentGstin);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            fontWeight: 500,
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <header
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 28px',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ← Back to Inbox
            </Link>
            <span style={{ color: '#334155' }}>|</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
              Review: {invoice_number || invoice_no}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleSave('approved')}
              style={{
                background: 'linear-gradient(135deg, #16A34A, #15803D)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
              }}
            >
              ✓ Approve Invoice
            </button>

            <button
              onClick={() => handleSave()}
              style={{
                background: 'linear-gradient(135deg, #0F766E, #115E59)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💾 Save Changes
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 20px' }}>
        {/* Warning Flags Banner */}
        {flags && flags.length > 0 && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>Items Requiring Your Attention:</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px', color: '#B45309' }}>
                {flags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Vendor & Invoice Metadata Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Vendor &amp; Invoice Info</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
                  VENDOR NAME
                </label>
                <input
                  type="text"
                  value={vendor_name || ''}
                  onChange={(e) => handleChange('vendor_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
                  <span>VENDOR GSTIN</span>
                  <span style={{ color: isGstinValid ? '#16A34A' : '#D97706' }}>
                    {isGstinValid ? '✓ Valid Format' : '⚠️ Format Incomplete'}
                  </span>
                </label>
                <input
                  type="text"
                  value={currentGstin}
                  placeholder="e.g. 27AAEPM1234C1Z5"
                  onChange={(e) => {
                    handleChange('gstin', e.target.value);
                    handleChange('vendor_gstin', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isGstinValid ? '#86EFAC' : '#FDE68A'}`,
                    fontSize: '13px',
                    fontFamily: '"JetBrains Mono", monospace',
                    background: isGstinValid ? '#F0FDF4' : '#FFFBEB',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
                    INVOICE NUMBER
                  </label>
                  <input
                    type="text"
                    value={invoice_number || invoice_no || ''}
                    onChange={(e) => {
                      handleChange('invoice_number', e.target.value);
                      handleChange('invoice_no', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontFamily: '"JetBrains Mono", monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
                    DATE
                  </label>
                  <input
                    type="date"
                    value={invoice_date || dateVal || ''}
                    onChange={(e) => {
                      handleChange('invoice_date', e.target.value);
                      handleChange('date', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '5px' }}>
                  STATUS
                </label>
                <select
                  value={status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="needs_review">Needs Review</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax & Summary Calculation Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Tax &amp; Total Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Subtotal (Excl. Tax):</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, color: '#0F172A' }}>
                    ₹{Number(subtotal).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>CGST (9%):</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, color: '#0F172A' }}>
                    ₹{Number(cgst).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>SGST (9%):</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, color: '#0F172A' }}>
                    ₹{Number(sgst).toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: '2px dashed #E2E8F0',
                    margin: '8px 0',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ color: '#0F766E', fontFamily: '"JetBrains Mono", monospace' }}>
                    ₹{Number(total_amount || total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                color: '#64748B',
              }}
            >
              💡 Line item amounts are automatically summed up into subtotal and GST. Modifying rates will recalculate totals in real time.
            </div>
          </div>
        </div>

        {/* Line Items Table Card */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Extracted Line Items</h3>
            <button
              onClick={addItem}
              style={{
                background: '#F1F5F9',
                color: '#0F766E',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Item
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 14px' }}>Description</th>
                  <th style={{ padding: '10px 14px', width: '110px' }}>HSN</th>
                  <th style={{ padding: '10px 14px', width: '90px' }}>Qty</th>
                  <th style={{ padding: '10px 14px', width: '130px' }}>Rate (₹)</th>
                  <th style={{ padding: '10px 14px', width: '130px', textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No line items. Click "+ Add Item" to add one.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="text"
                          value={it.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="text"
                          value={it.hsn || ''}
                          placeholder="e.g. 9983"
                          onChange={(e) => handleItemChange(idx, 'hsn', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '12px',
                            fontFamily: '"JetBrains Mono", monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="number"
                          step="any"
                          value={it.qty ?? 1}
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="number"
                          step="any"
                          value={it.rate ?? 0}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            fontFamily: '"JetBrains Mono", monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                        ₹{(Number(it.amount) || 0).toFixed(2)}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
