// Activity Visualizer Backend Server
// Started this as a simple CSV parser, ended up building a full API
// Learned a lot about date parsing edge cases along the way

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// path to data
// Data directory containing CSV files
const DATA_DIR = path.join(__dirname, 'data');

//#region Data Processing Functions

/**
 * Parses CSV file and returns structured data
 * @param {string} filePath - Path to CSV file
 * @returns {Object} Object with header and rows arrays
 */
function parseCSV(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8').trim();
  const lines = txt.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',').map(h=>h.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(c=>c.trim()));
  return { header, rows };
}

/**
 * Parses date string in various formats (dd/mm/yyyy, yyyy-mm-dd, etc.)
 * Had to handle this because the CSV had inconsistent date formats
 * @param {string} s - Date string to parse
 * @returns {Date} Parsed date object
 */
function parseMaybeDMY(s){
  if(!s) return new Date(NaN);
  // If contains '/', try dd/mm/yyyy
  if(s.includes('/')){
    const parts = s.split('/').map(p=>p.trim());
    if(parts.length===3){
      // detect whether year is first or last by length
      const [a,b,c] = parts;
      // if first part length 4 -> yyyy/mm/dd
      if(a.length===4) return new Date(Number(a), Number(b)-1, Number(c));
      // otherwise assume dd/mm/yyyy
      return new Date(Number(c), Number(b)-1, Number(a));
    }
  }
  // fallback to Date parsing - this handles ISO strings
  return new Date(s);
}
/**
 * Loads and processes activity data from CSV file
 * @returns {Array} Array of activity objects with calculated durations
 */
function loadActivities() {
  const csv = parseCSV(path.join(DATA_DIR, 'activity-properties.csv'));
  const header = csv.header;
  const rows = csv.rows;
  // map rows to activities
  const activities = rows.map((r, idx) => {
    const nodeIdIdx = header.indexOf('NodeId');
    const startIdx = header.indexOf('StartDate');
    const endIdx = header.indexOf('EndDate');
    if (nodeIdIdx === -1 || startIdx === -1 || endIdx === -1) {
      throw new Error('CSV headers must include NodeId, StartDate, EndDate');
    }
    const name = r[nodeIdIdx] || `Activity ${idx}`;
    const start = parseMaybeDMY(r[startIdx]);
    const end = parseMaybeDMY(r[endIdx]);
    const durationMs = (end - start);
    const durationDays = isNaN(durationMs) ? null : Math.round(durationMs / (1000*60*60*24));
    
    // TODO: Maybe add validation for negative durations?
    return { index: idx, name, start: isNaN(start)?null:start.toISOString(), end: isNaN(end)?null:end.toISOString(), durationDays };
  });
  return activities;
}

/**
 * Loads adjacency matrix data from CSV file
 * @returns {Array} 2D array representing network connections
 */
function loadAdjacency() {
  const csv = parseCSV(path.join(DATA_DIR, 'adjacency-matrix.csv'));
  const rows = csv.rows;
  const matrix = rows
    .filter(r => r && r.length > 0) // Filter out empty rows
    .map(r => r.map(c => Number(c || 0)));
  return matrix;
}
//#endregion

//#region routes
/**
 * GET /api/activities
 * Returns activity data with calculated durations
 */
app.get('/api/activities', (req, res) => {
  try {
    const activities = loadActivities();
    res.json({ ok:true, activities });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

app.get('/api/adjacency', (req, res) => {
  try {
    const matrix = loadAdjacency();
    res.json({ ok:true, matrix });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});

/**
 * GET /api/network
 * Returns network graph data with node degrees and connections
 */
app.get('/api/network', (req, res) => {
  try {
    const activities = loadActivities();
    const matrix = loadAdjacency();
    
    
    // Safety check: ensure matrix dimensions match activities
    const minSize = Math.min(activities.length, matrix.length);
    
    // Compute in-degree and out-degree for each node
    const degrees = activities.map((_, i) => {
      let inDegree = 0, outDegree = 0;
      if (i < matrix.length) {
        for (let j = 0; j < matrix.length; j++) {
          if (matrix[j] && matrix[j][i] && matrix[j][i] !== 0) inDegree++; // incoming
          if (matrix[i] && matrix[i][j] && matrix[i][j] !== 0) outDegree++; // outgoing
        }
      }
      return { inDegree, outDegree, totalDegree: inDegree + outDegree };
    });
    
    const nodes = activities.map((a, idx) => ({
      id: a.index.toString(),
      name: a.name,
      value: degrees[idx].totalDegree || 1,
      inDegree: degrees[idx].inDegree,
      outDegree: degrees[idx].outDegree,
      totalDegree: degrees[idx].totalDegree
    }));
    
    const links = [];
    for (let i=0;i<minSize;i++){
      if (matrix[i]) {
        for (let j=0;j<matrix[i].length;j++){
          if (matrix[i][j] && matrix[i][j]!==0) links.push({ source: i.toString(), target: j.toString() });
        }
      }
    }
    res.json({ ok:true, nodes, links });
  } catch (err) {
    console.error('Network endpoint error:', err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

/**
 * GET /api/active-counts
 * Returns daily activity counts with peak period analysis
 */
app.get('/api/active-counts', (req, res) => {
  try {
    const activities = loadActivities().filter(a => a.start && a.end);
    if (!activities.length) return res.json({ ok:true, counts: [], peaks: [] });
    const dates = activities.flatMap(a => [new Date(a.start), new Date(a.end)]);
    const minD = new Date(Math.min(...dates.map(d=>d.getTime())));
    const maxD = new Date(Math.max(...dates.map(d=>d.getTime())));
    const counts = [];
    for (let d = new Date(minD); d <= maxD; d.setDate(d.getDate()+1)) {
      const iso = new Date(d).toISOString().slice(0,10);
      const count = activities.reduce((acc, a) => {
        const s = new Date(a.start), e = new Date(a.end);
        return acc + ((s <= d && d <= e) ? 1 : 0);
      }, 0);
      counts.push({ date: iso, count });
    }
    
    // Find peak periods (top 10% of counts)
    const sortedCounts = [...counts].sort((a, b) => b.count - a.count);
    const peakThreshold = sortedCounts[Math.floor(sortedCounts.length * 0.1)].count;
    const peaks = counts.filter(c => c.count >= peakThreshold);
    
    res.json({ ok:true, counts, peaks });
  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
});
//#endregion

//#region server
// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Activity Visualizer API server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/activities - Activity data with durations`);
  console.log(`  GET /api/network - Network graph data`);
  console.log(`  GET /api/active-counts - Daily activity counts with peaks`);
});
//#endregion