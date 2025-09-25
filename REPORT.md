Activity Visualizer - Report
===========================

Overview
--------
This project implements a small full-stack web app to visualise activity data provided as CSV files.
The dataset included:
- activity-properties.csv (activity name / start / end)
- adjacency-matrix.csv (directed links between activities)

Project structure
-----------------
/backend - Simple Node.js + Express API that reads the CSV files from /backend/data and exposes endpoints:
  GET /api/activities     -> list of activities with parsed ISO start/end and durationDays
  GET /api/adjacency     -> raw adjacency matrix as numeric 2D array
  GET /api/network       -> nodes and links derived from activities + adjacency
  GET /api/active-counts -> daily counts of active activities between min and max dates

/frontend - Vite + React single-page app that consumes the API and renders 3 ECharts visualisations:
  1) Bar chart of activity durations (days)
  2) Force-directed network graph showing links between activities (from adjacency matrix)
  3) Line chart showing number of activities active per day (time series)

Design decisions
----------------
- Framework: React + Vite was chosen for a fast, lightweight frontend that is easy to run locally.
  The task mentioned Angular as preferred, but React provides equivalent capabilities for a short exercise.
- Charts: Apache ECharts was used (via the echarts npm package) to implement three different chart types
  (bar / graph / line). ECharts provides force-directed graph support out-of-the-box which worked well for
  rendering the adjacency matrix as links.
- Backend: Node.js + Express for simplicity. The backend reads CSV files on each request (lightweight, no DB).
  Endpoints return JSON with basic error handling. CORS is enabled for local development.
- CSV parsing: The backend uses a tiny parser assuming CSV with a header row. It attempts to find 'name', 'start', 'end'
  headers case-insensitively; otherwise, it falls back to columns 0,1,2. Dates are parsed with new Date().

How components address the task requirements
-------------------------------------------
- Responsive web application: The frontend uses responsive CSS grid and charts listen to window resize events to resize.
- Interfaces for data models: The backend returns consistent JSON shapes (activities, network nodes/links, counts).
  Frontend components expect these shapes and render accordingly.
- Basic reactivity: Frontend uses React state and useEffect for data flow. Components re-render when data changes.
- Clean component architecture: Charts are separated into standalone React components (BarChart, NetworkGraph, ActiveLineChart).
- Charts: Three chart types implemented with tooltips and click handler (network node click triggers a small alert).
  Chart containers resize on window resize to support responsiveness.
- Backend RESTful endpoints: Implemented as described above with simple error handling and JSON responses.
- Documentation: README contains setup and run instructions. This report explains decisions and how to run the project.

Known limitations & stretch ideas
--------------------------------
- CSV parsing is intentionally simple; if CSV uses different date formats, parsing could fail. A robust parser (csv-parse)
  and explicit date-format handling would improve reliability.
- The backend reads CSV files on each request. For larger datasets or production, cache or load once at startup.
- Stretch improvements could include state management in frontend (Redux / Zustand) for performance, server-side
  computed aggregations, or richer interaction (select node to filter charts, export functionality).
- AI stretch: If code generation was used, include prompts and flow here (omitted in this submission).
