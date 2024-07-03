# BiteStats Chrome Extension and Dashboard

BiteStats is a Chrome extension that provides order insights from Grubhub and DoorDash. It includes a React-based dashboard to display various metrics and charts about your food orders.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Order Insights**: Fetches and displays order data from Grubhub and DoorDash.
- **Dashboard**: Interactive dashboard with various KPIs, charts, and a date range picker.
- **Theme Toggle**: Light and dark mode support.
- **Charts**: Bar chart, line chart, and donut chart for visualizing order data.
- **Date Range Picker**: Filter orders by a specific date range.

## Installation

### Chrome Extension
1. Clone the repository:
   ```bash
   git clone https://github.com/SDev6699/bitestas.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click "Load unpacked" and select the `chrome-extension` directory from the cloned repository.

### React Dashboard
1. Navigate to the `react-app` directory:
   ```bash
   cd bitestas/react-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

### Chrome Extension
1. Open Grubhub or DoorDash in your Chrome browser.
2. Click on the BiteStats extension icon in the Chrome toolbar.
3. Click "Open BiteStats Page" to view the React dashboard with your order insights.

### React Dashboard
1. The dashboard will display various KPIs such as Total Spend, Orders Count, Restaurants, Avg Order Price, and Items Ordered.
2. Use the date range picker to filter the order data.
3. Toggle between different charts and data views using the provided switches.

## Development
### Directory Structure
```
bitestas/
├── chrome-extension/
│   ├── background.js
│   ├── content/
│   │   ├── doordash_content.js
│   │   └── grubhub_content.js
│   ├── images/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── privacy-policy.html
└── react-app/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard/
    │   │   │   ├── BarChart.js
    │   │   │   ├── DonutChart.js
    │   │   │   ├── KPI.js
    │   │   │   ├── LineChart.js
    │   │   │   └── ToggleSwitch.js
    │   │   ├── DateRangePicker.js
    │   │   ├── Footer.js
    │   │   ├── Header.js
    │   │   └── ToggleSwitch.css
    │   ├── hooks/
    │   │   └── useOrderData.js
    │   ├── services/
    │   │   ├── DoorDashOrderData.js
    │   │   ├── GrubhubOrderData.js
    │   │   └── OrderData.js
    │   ├── pages/
    │   │   └── Dashboard.js
    │   ├── App.js
    │   ├── ToggleColorMode.js
    │   └── index.js
    └── package.json
```

### Building for Production
1. Build the React app:
   ```bash
   npm run build
   ```
2. The production-ready files will be in the `react-app/build` directory.

## Contributing
Contributions are welcome! Please create a pull request or open an issue to discuss your changes or suggestions.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
