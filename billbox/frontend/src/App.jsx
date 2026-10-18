import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { sampleInvoices } from './data/sampleInvoices';
import Review from './pages/Review';
import Navbar from './components/Navbar';
import SettingsModal from './components/SettingsModal';
import KPICard from './components/KPICard';
import UploadArea from './components/UploadArea';
import { performClientOCR } from './utils/ocr';
function InboxPage({ invoices, setInvoices, isBackendOnline, checkBackend }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    homeState: '27 - Maharashtra',
    doubleCheck: true,
    confidenceThreshold: 85,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select an invoice file first.', 'error');
      return;
    }

    setUploading(true);
    setUploadStep('Uploading file...');

    try {
      if (isBackendOnline) {
        setUploadStep('Running OCR and AI extraction pipeline...');
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/invoices/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Backend upload failed');
        const data = await res.json();

        // Refresh invoices from backend
        const refreshed = await fetch('/invoices').then((r) => r.json());
        setInvoices(refreshed);
        showToast(`✓ Successfully processed ${file.name}!`, 'success');
      } else {
        // Run real client-side in-browser OCR on the photo
        setUploadStep('Reading text & scanning photo with OCR engine...');
        const extractedData = await performClientOCR(file, (msg) => setUploadStep(msg));

        const newId = invoices.length > 0 ? Math.max(...invoices.map((i) => Number(i.id) || 0)) + 1 : 1;
        const newInvoice = {
          id: newId,
          ...extractedData,
        };

        setInvoices((prev) => [newInvoice, ...prev]);
        if (extractedData.gstin) {
          showToast(`✓ Extracted GSTIN (${extractedData.gstin}) from ${file.name}!`, 'success');
        } else {
          showToast(`✓ Read ${file.name} (No GSTIN found on document)`, 'info');
        }
      }
      setFile(null);
    } catch (err) {
      console.warn('Backend upload failed:', err);
      showToast(`Upload failed: ${err.message || 'Check backend connection'}`, 'error');
      setFile(null);
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm(`Delete invoice #${id}?`)) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (isBackendOnline) {
        fetch(`/invoices/${id}`, { method: 'DELETE' }).catch(() => { });
      }
      showToast(`Invoice #${id} deleted`, 'info');
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Invoice Number', 'Date', 'Vendor', 'GSTIN', 'Total Amount', 'Status'];
    const rows = invoices.map((inv) => [
      inv.id,
      inv.invoice_number || inv.invoice_no,
      inv.invoice_date || inv.date,
      `"${inv.vendor_name || ''}"`,
      inv.gstin || inv.vendor_gstin || '',
      inv.total_amount || inv.total,
      inv.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `billbox_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported invoices to CSV', 'success');
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `billbox_invoices_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Exported invoices to JSON', 'success');
  };

  // Filtered invoices
  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      (inv.vendor_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || inv.invoice_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.gstin || inv.vendor_gstin || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalCount = invoices.length;
  const needsReviewCount = invoices.filter((i) => i.status === 'needs_review').length;
  const approvedCount = invoices.filter((i) => i.status === 'approved').length;
  const totalSpend = invoices.reduce((acc, i) => acc + (Number(i.total_amount || i.total) || 0), 0);

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
            background: toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#3B82F6' : '#10B981',
            color: '#FFFFFF',
            fontWeight: 500,
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          {toast.msg}
        </div>
      )}
      {/* Sticky Top Navbar */}
      <Navbar
        isBackendOnline={isBackendOnline}
        checkBackend={checkBackend}
        exportCSV={exportCSV}
        exportJSON={exportJSON}
        toggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 24px' }}>
        {/* Settings Modal (Overlay) */}
        <SettingsModal show={showSettings} setShow={setShowSettings} settings={settings} setSettings={setSettings} />

        {/* Top KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          <KPICard title="Total Invoices" value={totalCount} />
          <KPICard title="Needs Review" value={needsReviewCount} iconColor="#D97706" />
          <KPICard title="Approved" value={approvedCount} iconColor="#16A34A" />
          <KPICard title="Total Value (INR)" value={`₹${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        </div>

        {/* Upload Card */}
        <UploadArea
          file={file}
          setFile={setFile}
          uploading={uploading}
          uploadStep={uploadStep}
          handleUpload={handleUpload}
          handleFileChange={handleFileChange}
        />

        {/* Invoice Inbox Section */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header & Controls */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Invoices Inbox</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                Showing {filtered.length} of {invoices.length} invoices
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search */}
              <input
                type="text"
                placeholder="🔍 Search vendor, #, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  width: '220px',
                }}
              />

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', borderRadius: '8px', background: '#F1F5F9', padding: '3px' }}>
                {['all', 'needs_review', 'approved'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      border: 'none',
                      background: statusFilter === s ? '#FFFFFF' : 'transparent',
                      color: statusFilter === s ? '#0F172A' : '#64748B',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: statusFilter === s ? 600 : 500,
                      cursor: 'pointer',
                      boxShadow: statusFilter === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 18px' }}>ID &amp; Number</th>
                  <th style={{ padding: '12px 18px' }}>Date</th>
                  <th style={{ padding: '12px 18px' }}>Vendor Name</th>
                  <th style={{ padding: '12px 18px' }}>GSTIN</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total (INR)</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const status = inv.status || 'needs_review';
                    const isApproved = status === 'approved';
                    const num = inv.invoice_number || inv.invoice_no || `INV-${inv.id}`;
                    const invDate = inv.invoice_date || inv.date || '-';
                    const gstin = inv.gstin || inv.vendor_gstin || '';
                    const amt = Number(inv.total_amount || inv.total) || 0;

                    return (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <Link
                            to={`/review/${inv.id}`}
                            style={{
                              fontWeight: 600,
                              color: '#0F766E',
                              textDecoration: 'none',
                              fontFamily: '"JetBrains Mono", monospace',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span style={{ color: '#94A3B8', fontSize: '11px' }}>#{inv.id}</span>
                            {num}
                          </Link>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569' }}>{invDate}</td>

                        <td style={{ padding: '14px 18px', fontWeight: 500, color: '#1E293B' }}>
                          {inv.vendor_name || 'Unknown Vendor'}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {gstin ? (
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '11px',
                                background: '#F1F5F9',
                                color: '#334155',
                                padding: '3px 7px',
                                borderRadius: '4px',
                              }}
                            >
                              ✓ {gstin}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                padding: '3px 7px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              ⚠️ Missing
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: '14px 18px',
                            textAlign: 'right',
                            fontWeight: 600,
                            fontFamily: '"JetBrains Mono", monospace',
                            color: '#0F172A',
                          }}
                        >
                          ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: isApproved ? '#DCFCE7' : '#FEF3C7',
                              color: isApproved ? '#15803D' : '#B45309',
                              border: `1px solid ${isApproved ? '#BBF7D0' : '#FDE68A'}`,
                              textTransform: 'capitalize',
                            }}
                          >
                            {isApproved ? '● Approved' : '▲ Needs Review'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Link
                              to={`/review/${inv.id}`}
                              style={{
                                background: '#F1F5F9',
                                color: '#0F766E',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '12px',
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              Review
                            </Link>

                            <button
                              onClick={() => handleDelete(inv.id)}
                              title="Delete Invoice"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '4px',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const [invoices, setInvoices] = useState(sampleInvoices);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const checkBackend = () => {
    fetch('/invoices')
      .then((res) => {
        if (!res.ok) throw new Error('Backend offline');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInvoices(data);
        }
        setIsBackendOnline(true);
      })
      .catch(() => {
        setIsBackendOnline(false);
      });
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <InboxPage
              invoices={invoices}
              setInvoices={setInvoices}
              isBackendOnline={isBackendOnline}
              checkBackend={checkBackend}
            />
          }
        />
        <Route path="/review/:id" element={<Review invoices={invoices} setInvoices={setInvoices} />} />
        <Route path="/invoice/:id" element={<Review invoices={invoices} setInvoices={setInvoices} />} />
      </Routes>
    </Router>
  );
}
