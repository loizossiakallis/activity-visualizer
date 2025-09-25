import React, { useEffect, useState } from 'react'
import BarChart from './components/BarChart'
import NetworkGraph from './components/NetworkGraph'
import ActiveLineChart from './components/ActiveLineChart'
import { getActivities, getNetwork, getCounts } from './api'

export default function App() {
  // State management for all chart data
  const [activities, setActivities] = useState([]);
  const [network, setNetwork] = useState({ nodes: [], links: [] });
  const [counts, setCounts] = useState([]);

  // Fetch all data on component mount
  useEffect(() => {
    (async () => {
      try {
        // Parallel API calls for better performance
        const [a, n, c] = await Promise.all([
          getActivities(),
          getNetwork(),
          getCounts()
        ]);
        // Update state with fetched data
        setActivities(a.activities || []);
        setNetwork(n || { nodes: [], links: [] });
        setCounts({ counts: c.counts || [], peaks: c.peaks || [] });
      } catch (e) {
        console.error('Error fetching data:', e);
        // TODO: Add proper error UI instead of just console.error
      }
    })();
  }, []);

  return (
    <div className="app">
      <header><h1>Activity Visualizer</h1></header>
      <main>
        {/* Activity Timeline Chart */}
        <section className="card">
          <BarChart data={activities} />
        </section>
        {/* Network Graph Chart */}
        <section className="card">
          <NetworkGraph data={network} />
        </section>
        {/* Active Activities Over Time Chart */}
        <section className="card">
          <ActiveLineChart data={counts} />
        </section>
      </main>
      <footer>
        <small>Backend serves CSV data. Built for the Full Stack task.</small>
      </footer>
    </div>
  )
}
