import { createWorker } from 'tesseract.js';

// Indian GSTIN regular expression (15 alphanumeric characters)
const GSTIN_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z|C]{1}[0-9A-Z]{1})\b/i;

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

/**
 * Robustly parses and formats dates into strict RFC 3339 YYYY-MM-DD
 */
export function parseInvoiceDate(raw) {
  if (!raw || typeof raw !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  // Remove trailing OCR noise and punctuation
  const cleaned = raw.trim().replace(/[,\s]+/g, '.').replace(/[^0-9a-zA-Z.-]/g, '');
  const parts = cleaned.split(/[-/.]/).filter(Boolean);

  if (parts.length >= 3) {
    let day = parts[0];
    let month = parts[1].toLowerCase();
    let year = parts[2];

    if (MONTH_MAP[month]) {
      month = MONTH_MAP[month];
    } else {
      month = month.padStart(2, '0');
    }

    if (parts[0].length === 4) {
      // Format: YYYY-MM-DD
      year = parts[0];
      day = parts[2];
    } else if (year.length === 2) {
      year = '20' + year;
    }

    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    const yNum = parseInt(year, 10);

    // Validate calendar ranges
    if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12 && yNum >= 2000 && yNum <= 2040) {
      return `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    }
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Intelligent vendor detection that filters mobile status bars and prioritizes business names
 */
function extractVendorName(text, fileName) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);

  // Common mobile screenshot status bar noise to exclude
  const isNoise = (line) => {
    const l = line.toLowerCase();
    if (/^\s*\d{1,2}[:.]\d{2}/.test(line)) return true; // Clock time like 12:41
    if (/\b(?:volte|4g|5g|lte|wifi|battery|kb\/s|mb\/s)\b/i.test(l)) return true; // Status icons
    if (/^[<>\s]*(?:doc-|img-|screenshot|whatsapp)/i.test(l)) return true; // Mobile file header
    if (/^\s*[\d\s:._\-+=*#@!?%&]{4,}\s*$/.test(line)) return true; // Pure punctuation or numbers
    return false;
  };

  const ignoreWords = [
    'tax invoice', 'invoice', 'original for recipient', 'duplicate', 'triplicate',
    'bill to', 'ship to', 'cash memo', 'retail invoice', 'customer copy', 'bill-internet copy'
  ];

  const companyKeywords = /(?:Electricity|Distribution|Power|Energy|Discom|Board|Corporation|Company|Ltd|Limited|Pvt|Private|Enterprises|Technologies|Solutions|Infotech|Services|Retail|Store|Supermarket|Hotel|Restaurant|Hospital|Clinic)/i;

  // 1. First pass: look for a line matching prominent company/business indicators
  for (const line of lines) {
    if (isNoise(line)) continue;
    const clean = line.replace(/^[0-9\W]+/, '').replace(/[^a-zA-Z0-9\s.&'-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length < 4) continue;
    if (ignoreWords.some((w) => clean.toLowerCase().includes(w))) continue;

    if (companyKeywords.test(clean)) {
      return clean;
    }
  }

  // 2. Second pass: first non-noise, non-generic line
  for (const line of lines) {
    if (isNoise(line)) continue;
    const clean = line.replace(/^[0-9\W]+/, '').replace(/[^a-zA-Z0-9\s.&'-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length < 5) continue;
    if (ignoreWords.some((w) => clean.toLowerCase().includes(w))) continue;
    if (!/^[0-9]+$/.test(clean)) {
      return clean;
    }
  }

  // Fallback to sanitized file name
  if (fileName) {
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').toUpperCase();
  }
  return 'Unknown Vendor';
}

export async function performClientOCR(file, onProgress) {
  let worker = null;
  try {
    if (onProgress) onProgress('Initializing OCR engine...');
    worker = await createWorker('eng');

    if (onProgress) onProgress('Scanning image & reading visual text...');
    const result = await worker.recognize(file);
    const text = result.data.text || '';

    if (onProgress) onProgress('Parsing vendor, GSTIN & amounts...');

    // 1. Extract GSTIN
    const gstinMatch = text.match(GSTIN_REGEX);
    const extractedGstin = gstinMatch ? gstinMatch[1].toUpperCase() : '';

    // 2. Extract Vendor Name
    const vendorName = extractVendorName(text, file.name);

    // 3. Extract Invoice / Bill Number
    const invMatch = text.match(/(?:Invoice|Bill|Inv|Consumer\s*Id|Consumer\s*No|Tax\s*Invoice)\s*(?:No|Number|#|Id)?\s*[:.\-]?\s*([A-Za-z0-9/\-_]+)/i);
    const invoiceNo = invMatch && invMatch[1].length >= 3 ? invMatch[1].trim() : `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Extract Date
    const labeledDateMatch = text.match(/(?:Billing\s*Date|Invoice\s*Date|Reading\s*Date|Date|Dated)\s*[:.\-]?\s*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})/i);
    const generalDateMatch = text.match(/\b([0-9]{1,2}[-/.](?:[0-9]{1,2}|[A-Za-z]{3})[-/.][0-9]{2,4})\b/);
    const rawDate = labeledDateMatch ? labeledDateMatch[1] : (generalDateMatch ? generalDateMatch[1] : null);
    const invoiceDate = parseInvoiceDate(rawDate);

    // 5. Detect Document Type (Utility / Electricity vs Standard GST)
    const isUtilityBill = /(?:Electricity|Power|WBSEDCL|BESCOM|BSES|TATA\s*POWER|Discom|Electricity\s*Duty|Consumer\s*Id|Meter\s*No)/i.test(text) ||
      /(?:Electricity|Power|Distribution)/i.test(vendorName);

    // 6. Extract Line Items & Amounts
    const items = [];
    let detectedTotal = 0;

    // Check for utility bill specific items if applicable
    if (isUtilityBill) {
      const chargePatterns = [
        { name: 'Energy Charges', regex: /Energy\s*Charge[^\d]*([0-9,]+(?:\.[0-9]{2})?)/i, hsn: '9987' },
        { name: 'Fixed / Demand Charges', regex: /Fixed[^\d]*([0-9,]+(?:\.[0-9]{2})?)/i, hsn: '9987' },
        { name: 'Meter Rent', regex: /Meter\s*Rent[^\d]*([0-9,]+(?:\.[0-9]{2})?)/i, hsn: '9987' },
        { name: 'Electricity Duty (State Levy)', regex: /Electricity\s*Duty[^\d]*([0-9,]+(?:\.[0-9]{2})?)/i, hsn: '9987' },
      ];

      for (const cp of chargePatterns) {
        const m = text.match(cp.regex);
        if (m) {
          const val = parseFloat(m[1].replace(/,/g, ''));
          if (!isNaN(val) && val > 0) {
            items.push({
              description: cp.name,
              hsn: cp.hsn,
              qty: 1,
              rate: val,
              amount: val,
            });
          }
        }
      }

      // Check for total payable
      const payableMatch = text.match(/(?:Total\s*Amount\s*Payable|Amount\s*payable|Gross\s*Amount)[^\d]*([0-9,]+(?:\.[0-9]{2})?)/i);
      if (payableMatch) {
        const val = parseFloat(payableMatch[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
          detectedTotal = val;
        }
      }
    }

    // Fallback amount parsing if no items parsed yet
    if (items.length === 0) {
      const numberMatches = text.match(/(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g) || [];
      const numbers = numberMatches
        .map((n) => parseFloat(n.replace(/[^0-9.]/g, '')))
        .filter((n) => !isNaN(n) && n > 10 && n < 10000000);

      detectedTotal = numbers.length > 0 ? Math.max(...numbers) : 1000.0;
      const subtotal = +(detectedTotal / 1.18).toFixed(2);
      items.push({
        description: `Billed Services from ${vendorName}`,
        hsn: '9983',
        qty: 1,
        rate: isUtilityBill ? detectedTotal : subtotal,
        amount: isUtilityBill ? detectedTotal : subtotal,
      });
    }

    const itemSum = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    const finalTotal = detectedTotal || itemSum;
    const subtotal = isUtilityBill ? finalTotal : +(finalTotal / 1.18).toFixed(2);
    const cgst = isUtilityBill ? 0 : +((finalTotal - subtotal) / 2).toFixed(2);
    const sgst = isUtilityBill ? 0 : +((finalTotal - subtotal) / 2).toFixed(2);

    // 7. Context-Aware Flags
    const flags = [];
    if (!extractedGstin) {
      if (isUtilityBill) {
        flags.push('Utility Bill: Electricity distribution is GST-exempt under Indian tax regulations (State Electricity Duty applies).');
      } else {
        flags.push('Missing Vendor GSTIN in scanned document');
      }
    }

    await worker.terminate();

    return {
      vendor_name: vendorName,
      vendor_gstin: extractedGstin,
      gstin: extractedGstin,
      invoice_number: invoiceNo,
      invoice_no: invoiceNo,
      date: invoiceDate,
      invoice_date: invoiceDate,
      total_amount: finalTotal,
      total: finalTotal,
      subtotal,
      cgst,
      sgst,
      igst: 0,
      status: extractedGstin || isUtilityBill ? 'approved' : 'needs_review',
      flags,
      items,
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
