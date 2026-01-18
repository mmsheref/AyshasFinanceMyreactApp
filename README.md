# Ayshas Finance Tracker

A comprehensive, mobile-first P&L dashboard designed for restaurant owners to track daily finances, manage inventory, and gain deep insights into their business performance. Developed by **Ameer**, this application combines simplicity with powerful analytics, running completely offline on your device.

## 📥 Download App

**Android Users**: Get the latest APK from the **Releases** section on GitHub.

1.  Go to the [**Releases**](https://github.com/mmsheref/AyshasFinanceMyreactApp/releases) page.
2.  Find the latest version (e.g., `v2.4.0`).
3.  Click on **Assets** and download the `.apk` file.
4.  Install it on your Android device.

## 🚀 Key Features

### 📊 Dashboard & Analytics
*   **Real-time Pulse**: Instantly view today's live performance, including sales, expenses, and net profit.
*   **Weekly & Monthly Trends**: Visual charts for Profit/Loss trends and Sales Splits (Morning vs. Night).
*   **Key Metrics**: Track Net Profit, Profit Margin, Prime Cost %, Food Cost %, and Labor Cost %.
*   **Date Filtering**: Analyze data by Week, Month, Year, or Custom Date Ranges.

### 🔥 Gas Inventory Management
*   **Stock Tracking**: Keep a precise count of Full vs. Empty cylinders.
*   **Usage Logging**: Log when a cylinder is connected (usage) or when stock is refilled (exchange).
*   **Smart Stats**: Automatically calculates your **Average Daily Usage** and **Days Since Last Swap**.
*   **History Log**: View a detailed timeline of all gas-related activities.

### 📦 Inventory Watch
*   **Last Purchase Tracker**: Select specific items (e.g., "Rice", "Oil") to watch.
*   **Days Ago Counter**: The dashboard tells you exactly how many days have passed since you last purchased these items, helping you prevent stockouts or over-ordering.

### 📝 Daily Records
*   **Granular Entry**: Log Morning Sales, Total Sales, and detailed expenses across custom categories.
*   **Bill Photos**: Attach receipts/bills directly to expense items using the Camera or Gallery. Images are compressed and stored locally.
*   **Recurring Defaults**: Set default values for frequent expenses to speed up data entry.
*   **Shop Closed Mode**: Mark days as closed to track fixed costs (Rent, Electricity) without sales.

### 📂 Data Management & Security
*   **Offline-First**: All data is stored locally on your device. No internet required.
*   **Backup & Restore**: Export your full database to a JSON file for safekeeping.
*   **CSV Export**: Export reports and raw data to CSV for Excel/Google Sheets analysis.
*   **Structure Import/Export**: Share your expense category setup across devices.

### 🎨 User Experience
*   **Material Design 3**: A beautiful, modern interface with support for Light, Dark, and System themes.
*   **Native Feel**: Haptic feedback, smooth animations, and native sharing dialogs via Capacitor.
*   **Developer Branding**: Proudly developed by Ameer.

## 🛠 Technology Stack

*   **Frontend**: React 18, TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Heroicons
*   **Build Tool**: Vite
*   **Mobile Runtime**: Capacitor (Android/iOS)
*   **Storage**: IndexedDB (Local Browser Storage)
*   **Routing**: React Router DOM

## 📱 How to Use

### 1. Initial Setup
*   **Onboarding**: Follow the welcome screens to understand the basics.
*   **Settings**: Go to *Settings > Expense Structure* to define your categories (e.g., Meat, Vegetables, Labor) and items.
*   **Gas Setup**: Go to *Settings > Gas Configuration* to input your total cylinders and current stock.

### 2. Daily Routine
*   **Add Record**: Tap the **+** button. Enter the date, sales figures, and fill in expenses.
*   **Upload Bills**: Tap the camera icon next to an expense item to attach a photo.
*   **Gas Check**: If you changed a cylinder, tap the **Gas Inventory** card on the dashboard and select "Connect Fresh Cylinder".

### 3. Analysis
*   **Dashboard**: Check the "Resources" section for inventory alerts and the "Trends" section for financial health.
*   **Reports**: Navigate to the Reports tab for a deep dive into Food Costs, Labor Costs, and category breakdowns.
*   **Share**: Open any record detail and tap the **Share** button at the top to generate a professional PNG report to share via WhatsApp or Email.

## 👨‍💻 Developer

**Developed by Ameer**
*Lead Developer & Designer*

---
*Version 2.4.0*
