# Aysha's P&L Dashboard

Aysha's P&L Dashboard is a comprehensive, mobile-first web application designed to help restaurant owners track their daily profit and loss with ease. It provides a simple and intuitive interface to manage daily sales, categorize expenses, and gain insights into financial performance. Built with modern web technologies and a focus on offline-first functionality, it ensures your data is always accessible.

## Key Features

*   **At-a-Glance Dashboard**: A comprehensive overview of your financial health, including key metrics like 7-day and 30-day average profit, total profit, and recent activity.
*   **In-Depth Reports Page**: A dedicated section for deep financial analysis with powerful date filtering.
    *   **KPI Summary**: View total sales, expenses, net profit, profit margin, and average daily profit for any period.
    *   **Expense Analysis**: A visual donut chart and list break down expenses by category, while a "Top 5" list identifies your biggest individual costs.
    *   **Sales Insights**: Compare morning vs. night sales performance and analyze daily trends.
*   **Advanced Data Visualization**:
    *   **Profit/Loss Trend Chart**: A bar chart visualizing profit and loss over time.
    *   **Sales Trend Chart**: A stacked bar chart breaking down morning vs. night sales.
    *   **Dynamic Filtering**: Filter all charts by preset ranges (7D, 30D, 90D, All-Time) or a custom date range for deeper analysis.
*   **Granular Sales Tracking**: Log morning and night sales separately to get a clearer picture of your daily revenue streams.
*   **Full CRUD for Records**: Easily create, view, update, and delete daily financial records.
*   **Detailed & Customizable Expenses**:
    *   Log expenses across multiple categories.
    *   The app intelligently pre-fills recurring costs (e.g., Labour, Rent) from your most recent entry to speed up data entry.
    *   **Fully Customizable Structure**: Add, edit, or remove expense categories and items directly from the Settings page to perfectly match your business needs.
*   **Bill Photo Upload**: Attach one or more bill photos to any expense item for easy record-keeping. Images are automatically compressed for efficient offline storage.
*   **Search and Filter**: Quickly find past records using the date-based search and filtering functionality.
*   **Shareable Reports**: Generate a clean, shareable PNG image of any daily record's detailed breakdown. The report theme automatically matches your app's light or dark mode setting.
*   **Robust Data Management**:
    *   **Backup & Restore**: Safeguard your data by exporting all records to a single `.json` file. Restore from a backup at any time.
    *   **CSV Export**: Export all financial data to a `.csv` file for use in spreadsheet software like Excel or Google Sheets.
*   **Personalization**:
    *   **Theme Support**: Choose between Light, Dark, or System default themes for a comfortable viewing experience.
*   **Mobile-First & Offline-Ready**: Designed with a mobile-first approach and built as a Progressive Web App (PWA). All data is stored locally in your browser's IndexedDB, so the app works perfectly even without an internet connection.
*   **Native Device Integration**: Uses Capacitor to provide a more native app-like experience, including native file saving, sharing dialogs, and back button handling on Android.

## Technology Stack

*   **Frontend Framework**: React
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Routing**: React Router
*   **State Management**: React Context API
*   **Offline Storage**: IndexedDB
*   **Native Runtime**: Capacitor
*   **Build Tool**: Vite (Implicit via the development environment)

## How to Use

1.  **Open the App**: Launch the application in your web browser or as a standalone app.
2.  **Onboarding**: The first time you open the app, you'll see a brief overview of its features.
3.  **Add a Record**: Tap the `+` button on the Dashboard or Records screen to create a new entry for the day.
4.  **Enter Data**: Fill in the date, morning sales, and total sales. Go through the expense accordions to input your daily costs. Attach bill photos where needed.
5.  **Save**: Once done, save the record.
6.  **Analyze**: Use the dashboard charts and filters to see your performance over time. View detailed reports for specific days by tapping on them in the "Records" list.
7.  **Customize (Recommended)**: Go to **Settings -> Manage Expense Structure** to add your own custom expense items and categories.
8.  **Backup**: Regularly use the "Export Backup" feature in the Settings menu to back up your records.