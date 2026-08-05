# Sales Analytics & Automation Dashboard 📊

A high-performance, multi-channel e-commerce sales analytics and reporting dashboard built to match native Microsoft Excel spreadsheet layouts with high fidelity. Processes multi-marketplace sales orders and automatically formats daily totals, new contribution metrics, sub-channel breakdowns, and division summaries.

![Tech Stack](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.1-purple?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-sky?style=for-the-badge&logo=tailwindcss)

---

## ✨ Key Features

- **Exact Excel Sheet Replica**: Renders authentic Microsoft Excel spreadsheet aesthetics for all e-commerce channels with native header colors, cell borders, and typography.
- **Multi-Marketplace Support**:
  - **Myntra + SJIT** (PPMP & SJIT sub-channel breakdown)
  - **Amazon + Cocoblu + FBA** (Amazon Direct, Cocoblu, & FBA sub-channels)
  - **Ajio**
  - **Nykaa**
  - **FirstCry**
  - **Flipkart**
  - **D2C (Shopify)**
- **Strict Sticky Freeze Panes**:
  - `Category Level`, `Online Style Count`, and `Division` columns strictly frozen on horizontal scroll with shadow dividers.
  - Top 2 header rows (`Weekday Name` & `Formatted Date`) frozen on vertical scroll.
- **Real Calendar Alignment**:
  - Automatically calculates real-world calendar day-of-week starting days for any month (e.g. August 2026 starting on Saturday, July on Wednesday).
  - Formats date labels cleanly as `1 Aug`, `2 Aug`, `13 July` etc.
- **Dual Sheet Containers**:
  - **Monthly Sales Sheet**: Total sales units per category per day.
  - **New Contribution Sheet**: Dedicated section isolating new styles populated from the "New" order column.
- **Sub-Channel Grouping Toggle `[+]` / `[-]`**:
  - Excel-style collapsible dates for Myntra and Amazon to collapse or expand sub-channel totals.
- **Interactive "+ Add New Month" Sheet Creator**:
  - Add and generate custom monthly sheets for any month (January – December) and year (2025 – 2030) on the fly.
- **Channel Summary Cards**:
  - **Day Level New Style Contribution** (Total units sold, New style units sold, % Contribution Share).
  - **Division Level Summary** (Footwear vs. Apparel units breakdown and % Share).
- **Excel Workbook Export (`.xlsx`)**:
  - Export complete, professionally styled Excel workbooks directly from the browser.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Excel Parsing & Exporting**: ExcelJS, XLSX (SheetJS)
- **Icons & Visuals**: Lucide React, Framer Motion, Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+ recommended) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MNegi17/Sales-Analytics-Dashboard.git
   cd Sales-Analytics-Dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000/`.

---

## 📦 Production Build

To build the project for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📄 License

This project is licensed under the MIT License.
