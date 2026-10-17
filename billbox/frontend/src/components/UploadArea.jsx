import React, { useRef, useState } from 'react';

export default function UploadArea({
  file,
  setFile,
  uploading,
  uploadStep,
  handleUpload,
  handleFileChange,
  onDemoSample,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <section
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        padding: '24px 28px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> AI Invoice Intake &amp; Extraction
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Upload supplier invoices (PDF, images, CSV, JSON) to auto-extract line items, vendor details, and GST calculations.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#F1F5F9',
              color: '#475569',
            }}
          >
            PDF, PNG, JPG, CSV, JSON
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.csv,.json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Dropzone Area */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: `2px dashed ${isDragging ? '#0F766E' : '#CBD5E1'}`,
            borderRadius: '14px',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? '#F0FDFA' : '#F8FAFC',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = '#0F766E';
              e.currentTarget.style.background = '#F0FDFA';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.background = '#F8FAFC';
            }
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: '#CCFBF1',
              color: '#0F766E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            📤
          </div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
            Click to upload or drag &amp; drop your invoice
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>
            Supports Indian GST tax invoices, utility bills, and standard receipts
          </p>
        </div>
      ) : (
        /* Selected File Preview Box */
        <div
          style={{
            border: '1px solid #CCFBF1',
            borderRadius: '12px',
            padding: '16px 20px',
            background: '#F0FDFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#0F766E',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📄
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                {file.name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                {formatFileSize(file.size)} • Ready for AI extraction
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={uploading}
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#475569',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              Change File
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                background: uploading ? '#94A3B8' : '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {uploading ? 'Processing Invoice...' : '⚡ Extract & Process'}
            </button>
          </div>
        </div>
      )}

      {/* Uploading Status Progress Bar */}
      {uploading && (
        <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> {uploadStep || 'Processing...'}
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>AI Pipeline Running</span>
          </div>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0F766E, #14B8A6)',
                width: '75%',
                borderRadius: '3px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
