# BillBox

**Turn a pile of bills into a clean spreadsheet, privately, on your own computer.**

Small shops and freelancers lose hours every month typing bills into spreadsheets for their accountant. BillBox reads the bill photo with an open-weight vision model running on your own laptop, checks the GST math, and exports a clean file. Nothing is uploaded anywhere.

> **Try the demo:** https://billbox-pi.vercel.app/
> The hosted demo uses sample data and a simulated pipeline. No model runs there. The real app runs on your computer with Ollama (see [Run locally](#run-locally-with-the-real-model)).

[![Open-weight model](https://img.shields.io/badge/Model-Qwen2.5--VL_3B-blue?style=flat-square)](https://ollama.com/library/qwen2.5vl)
[![Runs locally](https://img.shields.io/badge/Inference-Ollama_(local)-success?style=flat-square)](https://ollama.com/)

![Inbox screenshot](docs/inbox.png)
![Review screenshot](docs/review.png)

---

## Who it's for

- A shop owner whose accountant keeps asking for "the bills in Excel"
- A freelancer sorting a month of receipts before tax time
- An accountant who doesn't want clients' financial documents on a cloud server

## How it works

1. Drop in photos or PDFs of bills.
2. A local vision model (`qwen2.5vl:3b` via Ollama) reads each one and returns structured data.
3. A validation engine checks the numbers and flags anything suspicious.
4. You review flagged fields next to the original image, fix them, and approve.
5. Export a CSV your accountant can open in Excel.

## Features

- **Extraction from images and PDFs:** vendor, GSTIN, invoice number, date, line items, HSN codes and taxes. The model's output is cleaned up in code (for example `04-07-2018` becomes `2018-07-04`, and `"1,031.00"` becomes the number `1031`).
- **GST and math checks:**
  - GSTIN format and checksum
  - Rate x quantity = amount, and subtotal + taxes = total
  - CGST/SGST vs IGST consistency
  - Dates in the future or older than 3 years
- **Human-in-the-loop review:** flagged invoices show what to check. Approve with one click, or open the review screen to edit fields beside the original bill.
- **Bulk approve** for batches you have already checked.
- **Dashboard:** invoice count, review backlog, approved count and total amount in INR.
- **Export:** CSV and JSON for your accountant.
- **Demo mode:** the hosted version runs on sample data so you can click through the whole flow without installing anything.

## Why open models

- **Privacy:** bills contain GSTINs, bank details and customer names. They never leave the laptop.
- **Cost:** no per-page fee, so processing 500 bills costs the same as 5.
- **Control:** the model is a one-line setting. Swap in a bigger or fine-tuned model without changing the app.

## Results

Tested on [FILL IN: number] real bills (printed invoices, phone photos, one electricity bill) on an 8 GB RAM Windows laptop with no GPU.

| Field | Correct |
|---|---|
| Vendor name | [FILL IN]/[N] |
| Invoice number | [FILL IN]/[N] |
| Date | [FILL IN]/[N] |
| Total | [FILL IN]/[N] |

Average time per bill: [FILL IN] seconds.

Validation caught [FILL IN] errors that would otherwise have gone into the spreadsheet.

## Known limitations

- A 3B model makes mistakes on digits (invoice numbers, totals), blurry photos and handwriting. That is why validation flags exist: treat the output as a draft to review, not a final record.
- It takes roughly a minute per bill on an 8 GB laptop without a GPU.
- The hosted demo does not run the model.
- The CSV is meant to be opened or imported by your accountant. It is not a ready-made import file for Tally or Zoho Books.

## Run locally with the real model

Prerequisites: [Node.js 18+](https://nodejs.org/), [Python 3.10+](https://www.python.org/), [Ollama](https://ollama.com/). Tested on Windows with 8 GB RAM.

**1. Download the model** (about 3 GB, one time):
```bash
ollama pull qwen2.5vl:3b
```
Keep Ollama running in the background. It serves the model at `http://localhost:11434`.

**2. Start the backend** (new terminal):
```bash
cd billbox
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

**3. Start the frontend** (new terminal):
```bash
cd billbox/frontend
npm install
npm run dev
```

Open http://localhost:5173. When the backend is connected, the header shows **Backend Online (Port 8000)**.

## Tech stack

| Layer | Technologies |
|---|---|
| Model | `qwen2.5vl:3b` (open weights) served by Ollama |
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI, Uvicorn, SQLModel, SQLite |
| Image processing | PyMuPDF, OpenCV, Pillow |
| Demo hosting | Vercel (frontend only) |

## Project structure

```text
billbox/
├── backend/
│   ├── api.py           # REST endpoints (upload, review, CRUD)
│   ├── config.py        # Ollama host and model settings
│   ├── db.py            # SQLite session management
│   ├── extract.py       # Ollama vision call and output normalization
│   ├── gstin.py         # GSTIN format and checksum validator
│   ├── main.py          # App entrypoint and CORS
│   ├── models.py        # Table schemas (Invoice, LineItem)
│   ├── preprocess.py    # Deskew, rotation, contrast enhancement
│   └── validate.py      # Rule engine (GST math, item math, dates)
├── frontend/
│   ├── src/
│   │   ├── components/  # KPICard, Navbar, SettingsModal, UploadArea
│   │   ├── pages/       # Review
│   │   ├── data/        # Sample invoices for demo mode
│   │   └── App.jsx      # Inbox with search, filters and approvals
│   └── vercel.json      # SPA routing for the hosted demo
└── requirements.txt
```

## License

MIT




# ⚡ BillBox — AI-Powered Invoice Intake & GST Compliance Hub

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://billbox-pi.vercel.app/)
[![Open-Source AI](https://img.shields.io/badge/Open--Source_AI-Ollama_%7C_Qwen2.5--VL-blue?style=for-the-badge&logo=ollama)](https://ollama.com/library/qwen2.5vl)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_+_SQLModel-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

> **Live Production URL:** [https://billbox-pi.vercel.app/](https://billbox-pi.vercel.app/)

---

## 🏆 Hackathon Theme Alignment

> **Theme:** *"Build something with open-source AI at its core. Running an open-weight model, building on an open-source agent harness, running inference locally, or all three. The open pieces should make your project work."*

**BillBox is built strictly around 100% open-source, local AI:**
1. **Open-Weight Vision Model:** Powered by **`qwen2.5vl:3b`** (Qwen 2.5 Vision-Language Model by Alibaba, open weights).
2. **Local, Private Edge Inference:** Serviced on-device via **Ollama** (`localhost:11434`). Sensitive corporate invoices, tax identifiers, and bank details **never leave your local machine** or touch proprietary cloud APIs.
3. **Open-Source Processing Stack:** PyMuPDF, OpenCV, FastAPI, and SQLModel form an end-to-end open pipeline that parses raw image/PDF pixels into structured Indian GST tax records.

---

## 📌 Problem Statement & Solution

### The Challenge
Finance and accounting teams spend hundreds of hours manually verifying vendor invoices, typing data into ERPs, and reconciling Indian GST calculations. Cloud AI OCR solutions charge per-page fees and present serious privacy risks by uploading sensitive financial documents to external servers.

### The Solution: BillBox
**BillBox** is a modern, privacy-first invoice intake and compliance dashboard. Drop in any scanned invoice, receipt, or PDF:
* The local **Qwen2.5-VL** model visually reads the invoice layout.
* An automated **GST Validation Engine** verifies arithmetic balance, line items, and vendor GSTIN formats.
* Invoices matching compliance criteria are **automatically approved**, while anomalies are flagged for a human-in-the-loop review with **1-click quick approvals**.

---

## ✨ Key Features

* 👁️ **Visual Multimodal Extraction:** Uses open-weight VLM (`qwen2.5vl:3b`) to extract vendor details, 15-character GSTIN, invoice dates, tabular line items, HSN codes, and tax rates directly from visual coordinates.
* ⚖️ **Automated Indian GST Validation Rules:**
  * **GSTIN Verifier:** Validates 15-character state code, PAN entity, and checksum structure.
  * **Arithmetic Cross-Check:** Verifies `Rate × Quantity = Amount` and `Subtotal + CGST/SGST (or IGST) = Total`.
  * **Tax Jurisdiction:** Automatically confirms intra-state (CGST + SGST) vs inter-state (IGST) compliance.
  * **Date Sanity:** Flags invoices dated in the future or older than 3 years.
* ⚡ **1-Click Quick & Bulk Approvals:**
  * **1-Click Row Approve:** Instantly mark flagged invoices as approved without navigating away.
  * **Approve All:** Bulk-approve pending invoices with a single click.
  * **Interactive Status Chips:** Click any status chip (`● Approved` ↔ `▲ Needs Review`) to toggle status instantly.
* 📊 **Executive KPI Dashboard:** Real-time visibility into total invoice count, review backlog, approved count, and cumulative spend in INR.
* 📥 **Export to CSV / JSON:** Export clean, standardized accounting records ready for import into Tally, Zoho Books, or ERP systems.
* 🌐 **Demo Mode:** Built with intelligent fallbacks so evaluators and judges can test the full UI, simulated OCR pipeline, and approval workflow anywhere without installing local dependencies.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    A[📄 Invoice PDF / Image / Scan] --> B[Frontend Dropzone - React 19]
    B --> C{Backend Running?}
    
    C -- Yes --> D[FastAPI Backend - Port 8000]
    D --> E[PyMuPDF / OpenCV Image Preprocessing]
    E --> F[Local Ollama VLM - qwen2.5vl:3b]
    F --> G[Normalized JSON Extraction]
    G --> H[GST Validation Engine]
    H --> I[(SQLite Database)]
    
    C -- Offline / Demo --> J[Local Simulated AI Engine]
    J --> H
    
    I --> K[Live Inbox Dashboard]
    K --> L{Validation Passed?}
    L -- Yes --> M[● Auto-Approved]
    L -- Flagged --> N[▲ Needs Review]
    N --> O[1-Click Quick Approve / Deep Review Screen]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **AI / Vision Model** | `qwen2.5vl:3b` (Open-weight Multimodal VLM) served via **Ollama** |
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, React Router 7 |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, SQLModel / SQLite |
| **Computer Vision / OCR** | PyMuPDF (fitz), OpenCV (cv2), Pillow |
| **Cloud Hosting** | Vercel (Production SPA Deployment) |

---

## 🚀 Getting Started (Run Locally with Real AI)

### Prerequisites
* [Node.js 18+](https://nodejs.org/)
* [Python 3.10+](https://www.python.org/)
* [Ollama](https://ollama.com/)

---

### Step 1: Start the Local Open-Source AI Model
Pull and run the open-weight vision model in your terminal:
```bash
ollama run qwen2.5vl:3b
```
*Ollama will serve inference locally at `http://localhost:11434`.*

---

### Step 2: Start the Python Backend
In a new terminal:
```bash
cd billbox

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI server on port 8000
python -m uvicorn backend.main:app --reload --port 8000
```

---

### Step 3: Start the React Frontend
In a new terminal:
```bash
cd billbox/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open **`http://localhost:5173`** in your browser. The navbar status indicator will illuminate green:
👉 **`● Backend Online (Port 8000)`**

---

## 📁 Project Structure

```text
billbox/
├── backend/
│   ├── api.py           # FastAPI REST endpoints (/invoices/upload, review, CRUD)
│   ├── config.py        # Ollama host & model configuration
│   ├── db.py            # SQLite session management
│   ├── extract.py       # Ollama Vision (qwen2.5vl:3b) multimodal pipeline & normalization
│   ├── gstin.py         # Indian GSTIN regex & checksum validator
│   ├── main.py          # App entrypoint & CORS middleware
│   ├── models.py        # SQLModel table schemas (Invoice, LineItem)
│   ├── preprocess.py    # OpenCV deskewing, rotation, and CLAHE contrast enhancement
│   └── validate.py      # Business rule engine (GST calculations, item math, dates)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KPICard.jsx       # Metric statistics cards with hover elevation
│   │   │   ├── Navbar.jsx        # Glassmorphic header with status pills & exports
│   │   │   ├── SettingsModal.jsx # Floating settings overlay for thresholds & reviewer email
│   │   │   └── UploadArea.jsx    # Drag-and-drop AI intake zone with progress animations
│   │   ├── pages/
│   │   │   └── Review.jsx        # Deep invoice editor, flag warnings, and line-item manager
│   │   ├── data/
│   │   │   └── sampleInvoices.js # Sample benchmark test invoices
│   │   ├── App.jsx               # Main Inbox view with search, filter, and 1-click approvals
│   │   └── index.css             # Tailwind v4 entrypoint & typography
│   ├── vercel.json               # SPA client-side routing rewrites
│   └── package.json
└── requirements.txt     # Python backend dependencies
```

---

## 📝 License
Distributed under the **MIT License**. Free for open-source and commercial use.
