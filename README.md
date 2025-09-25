# Activity Visualizer

A full-stack web application for visualizing project activity data with interactive charts and dependency visualization.

## Features

### Interactive Data Visualizations
- **Activity Timeline**: Bar chart showing activity durations with sorting options
- **Network Graph**: Force-directed graph showing activity dependencies and connections
- **Active Activities Over Time**: Line chart with peak period analysis

### Advanced Controls
- **Fullscreen Mode**: Detailed analysis with enhanced controls for each chart
- **Dynamic Filtering**: Real-time data filtering and sorting
- **Peak Analysis**: Intelligent identification of project bottleneck periods
- **Timeline Zoom**: Mouse wheel and drag-to-zoom functionality

### User Experience
- **Responsive Design**: Adapts to different screen sizes
- **Interactive Tooltips**: Detailed information on hover
- **Smooth Animations**: Professional chart transitions
- **Modern UI**: Clean, intuitive interface

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **ECharts** - Powerful charting library
- **Axios** - HTTP client for API calls
- **CSS3** - Responsive styling with Grid and Flexbox

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **Custom CSV Parser** - Data processing

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd activity-project
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Start the Application

#### Start Backend Server
```bash
cd backend
npm start
```
The backend will start on `http://localhost:4000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173` (or next available port)

### 4. Access the Application
Open your browser and navigate to the frontend URL (typically `http://localhost:5173`)

## Project Structure

```
activity-project/
├── backend/
│   ├── data/                    # CSV data files
│   │   ├── activity-properties.csv
│   │   └── adjacency-matrix.csv
│   ├── index.js                 # Express server and API routes
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/          # React chart components
│   │   │   ├── BarChart.jsx
│   │   │   ├── NetworkGraph.jsx
│   │   │   └── ActiveLineChart.jsx
│   │   ├── api.js              # API helper functions
│   │   ├── App.jsx             # Main application component
│   │   ├── main.jsx            # Application entry point
│   │   └── styles.css          # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

The backend provides the following RESTful endpoints:

- `GET /api/activities` - Returns activity data with durations
- `GET /api/network` - Returns network graph data with node degrees
- `GET /api/active-counts` - Returns daily activity counts with peak analysis

## Data Format

### Activity Properties
```json
{
  "index": 0,
  "name": "1",
  "start": "2016-09-01T00:00:00.000Z",
  "end": "2016-09-15T00:00:00.000Z",
  "durationDays": 14
}
```

### Network Data
```json
{
  "nodes": [
    {
      "id": "0",
      "name": "1",
      "value": 5,
      "inDegree": 2,
      "outDegree": 3,
      "totalDegree": 5
    }
  ],
  "links": [
    {
      "source": "0",
      "target": "1"
    }
  ]
}
```

## Usage Guide

### Activity Timeline
- **Normal View**: Shows top 20 activities by duration
- **Fullscreen**: Shows all activities with sorting options
- **Sorting**: By start date, duration, or activity ID

### Network Graph
- **Node Size**: Proportional to connection count
- **Node Color**: Red (high connections) to Green (low connections)
- **Fullscreen**: Filter by minimum connections with slider

### Active Activities Over Time
- **Peak Analysis**: Identifies busiest project periods
- **Timeline Zoom**: Mouse wheel and drag-to-zoom
- **Peak Filtering**: Adjustable threshold (0% to 50%)