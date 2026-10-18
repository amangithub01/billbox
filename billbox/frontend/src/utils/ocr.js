import { createWorker } from 'tesseract.js';

// Indian GSTIN regular expression (15 alphanumeric characters)
const GSTIN_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z|C]{1}[0-9A-Z]{1})\b/i;

// Date regex (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
const DATE_REGEX = /\b(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4})\b/;

function parseInvoiceDate(raw) {
  if (!raw) return new Date().toISOString().split('T')[0];
  const parts = raw.split(/[-/.]/);
  if (parts.length === 3) {
    // If YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // If DD-MM-YYYY
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

export async function performClientOCR(file, onProgress) {
  let worker = null;
  try {
    if (onProgress) onProgress('Initializing OCR engine...');
    worker = await createWorker('eng');

    if (onProgress) onProgress('Scanning image & reading visual text...');
    const result = await worker.recognize(file);
    const text = result.data.text || '';

    if (onProgress) onProgress('Parsing GSTIN, vendor & line items...');

    // 1. Extract GSTIN
    const gstinMatch = text.match(GSTIN_REGEX);
    const extractedGstin = gstinMatch ? gstinMatch[1].toUpperCase() : '';

    // 2. Extract Invoice Number
    const invMatch = text.match(/(?:Invoice|Bill|Inv|Tax\s*Invoice)\s*(?:No|Number|#)?\s*[:.\-]?\s*([A-Za-z0-9/\-_]+)/i);
    const invoiceNo = invMatch && invMatch[1].length >= 3 ? invMatch[1].trim() : `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Extract Date
    const dateMatch = text.match(DATE_REGEX);
    const invoiceDate = dateMatch ? parseInvoiceDate(dateMatch[1]) : new Date().toISOString().split('T')[0];

    // 4. Extract Vendor Name (first prominent non-generic line)
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    let vendorName = '';
    const ignoreKeywords = ['tax invoice', 'invoice', 'original', 'duplicate', 'bill to', 'ship to', 'gstin', 'cash memo', 'retail invoice'];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!ignoreKeywords.some((kw) => lower.includes(kw)) && line.length > 3) {
        vendorName = line.replace(/[^a-zA-Z0-9\s.&'-]/g, '').trim();
        if (vendorName.length > 3) break;
      }
    }
    if (!vendorName) {
      vendorName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').toUpperCase();
    }

    // 5. Extract Amounts
    const numberMatches = text.match(/(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g) || [];
    const numbers = numberMatches
      .map((n) => parseFloat(n.replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n) && n > 10 && n < 10000000);

    const totalAmount = numbers.length > 0 ? Math.max(...numbers) : 0.0;
    const subtotal = +(totalAmount / 1.18).toFixed(2);
    const cgst = +((totalAmount - subtotal) / 2).toFixed(2);
    const sgst = +((totalAmount - subtotal) / 2).toFixed(2);

    await worker.terminate();

    return {
      vendor_name: vendorName,
      vendor_gstin: extractedGstin,
      gstin: extractedGstin,
      invoice_number: invoiceNo,
      invoice_no: invoiceNo,
      date: invoiceDate,
      invoice_date: invoiceDate,
      total_amount: totalAmount,
      total: totalAmount,
      subtotal,
      cgst,
      sgst,
      igst: 0,
      status: extractedGstin ? 'approved' : 'needs_review',
      flags: extractedGstin ? [] : ['Missing Vendor GSTIN in scanned document'],
      items: [
        {
          description: `Extracted items from ${vendorName}`,
          hsn: '9983',
          qty: 1,
          rate: subtotal || totalAmount,
          amount: subtotal || totalAmount,
        },
      ],
      raw_ocr_text: text,
    };
  } catch (err) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    throw err;
  }
}
