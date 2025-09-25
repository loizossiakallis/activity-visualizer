import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

/**
 * @param {{ data: import('../api').Network }} props
 */
export default function NetworkGraph({ data }) {
  const ref = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [minConnections, setMinConnections] = useState(0);
  
  const getFilteredNodes = (nodes, minConn) => {
    return nodes.filter(node => node.totalDegree >= minConn);
  };
  
  const getNodeSize = (totalDegree, maxDegree, isFullscreenMode) => {
    if (totalDegree === 0) return isFullscreenMode ? 8 : 5;
    const baseSize = isFullscreenMode ? 15 : 8;
    const maxSize = isFullscreenMode ? 50 : 25;
    const ratio = totalDegree / maxDegree;
    return baseSize + (ratio * (maxSize - baseSize));
  };
  
  const renderChart = (isFullscreenMode) => {
    if (!ref.current) return;
    
    // Dispose existing chart if it exists
    const existingChart = echarts.getInstanceByDom(ref.current);
    if (existingChart) {
      existingChart.dispose();
    }
    
    const chart = echarts.init(ref.current);
    
    const allNodes = (data.nodes || []).map(n => ({
      name: n.name || n.id || 'Unknown',
      id: n.id || 'unknown',
      value: Math.max(n.totalDegree || 0, 1),
      inDegree: n.inDegree || 0,
      outDegree: n.outDegree || 0,
      totalDegree: n.totalDegree || 0
    }));
    
    const filteredNodes = getFilteredNodes(allNodes, minConnections);
    const maxDegree = Math.max(...allNodes.map(n => n.totalDegree), 1);
    
    // Get links that connect to visible nodes
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = (data.links || []).filter(l => 
      visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target)
    );
    
    // Color scale based on degree (red for high degree = bottlenecks)
    const getNodeColor = (degree) => {
      if (degree === 0) return '#ccc';
      const intensity = Math.min(degree / maxDegree, 1);
      return `hsl(${120 * (1 - intensity)}, 70%, 50%)`; // Green to red - took some tweaking to get this right
    };
    
    const option = {
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '10%',
        containLabel: true
      },
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          if (p.dataType === 'node' && p.data) {
            const node = p.data;
            return `${node.name || 'Unknown'}<br/>
              In-degree: ${node.inDegree || 0}<br/>
              Out-degree: ${node.outDegree || 0}<br/>
              Total connections: ${node.totalDegree || 0}`;
          }
          return '';
        }
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: filteredNodes.map(n => ({
          ...n,
          symbolSize: getNodeSize(n.totalDegree, maxDegree, isFullscreenMode),
          itemStyle: { color: getNodeColor(n.totalDegree) }
        })),
        links: filteredLinks,
        roam: true,
        label: { 
          show: isFullscreenMode, 
          position: 'right',
          fontSize: isFullscreenMode ? 12 : 10
        },
        force: { 
          repulsion: isFullscreenMode ? 300 : 200, 
          edgeLength: isFullscreenMode ? [80, 150] : [50, 120],
          layoutAnimation: true,
          gravity: 0.1 // Add gravity to pull nodes toward center
        },
        emphasis: { 
          focus: 'adjacency',
          scale: true
        },
        center: ['50%', '50%'] // Center the entire graph
      }]
    };
    
    chart.setOption(option, true);
    
    // Auto-fit the graph in normal mode - ensure it's fully zoomed out and centered
    if (!isFullscreenMode) {
      setTimeout(() => {
        // Get the chart container dimensions
        const containerWidth = ref.current.offsetWidth;
        const containerHeight = ref.current.offsetHeight;
        
        // Calculate center position
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        
        // Force zoom out and center the graph
        chart.dispatchAction({
          type: 'graphRoam',
          zoom: 0.1,
          originX: centerX,
          originY: centerY
        });
        
        chart.resize();
      }, 400); // Increased timeout to ensure layout is complete
    }
    
    chart.on('click', params => {
      if (params.data) {
        alert('Clicked: ' + (params.data.name || params.data.id));
      }
    });
    
    return chart;
  };
  
  useEffect(() => {
    if (!ref.current) return;
    
    const chart = renderChart(isFullscreen);
    
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => resize());
    ro.observe(ref.current);
    
    return () => {
      window.removeEventListener('resize', resize);
      ro.disconnect();
      chart.dispose();
    }
  }, [data, isFullscreen, minConnections]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const maxConnections = Math.max(...(data.nodes || []).map(n => n.totalDegree || 0), 1);
  
  if (isFullscreen) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-chart">
          <div className="chart-controls">
            <div className="filter-controls">
              <label>Min Connections:</label>
              <input
                type="range"
                min="0"
                max={maxConnections}
                value={minConnections}
                onChange={(e) => setMinConnections(parseInt(e.target.value))}
                className="connection-slider"
              />
              <span className="slider-value">{minConnections}</span>
            </div>
            <button className="exit-fullscreen-btn" onClick={toggleFullscreen}>
              ✕ Exit Fullscreen
            </button>
          </div>
          <div className="chart fullscreen-chart-container" ref={ref} />
        </div>
      </div>
    );
  }
  
  const getTitle = () => {
    if (isFullscreen) {
      const allNodes = (data.nodes || []).map(n => ({
        name: n.name || n.id || 'Unknown',
        id: n.id || 'unknown',
        value: Math.max(n.totalDegree || 0, 1),
        inDegree: n.inDegree || 0,
        outDegree: n.outDegree || 0,
        totalDegree: n.totalDegree || 0
      }));
      const filteredNodes = allNodes.filter(node => node.totalDegree >= minConnections);
      return `Network Graph (${filteredNodes.length} nodes, min ${minConnections} connections)`;
    } else {
      return 'Activity Network';
    }
  };

  return (
    <div className="chart-container">
      <h2 className="chart-title">{getTitle()}</h2>
      <button className="fullscreen-btn" onClick={toggleFullscreen}>
        ⛶ Fullscreen
      </button>
      <div className="chart" ref={ref} />
    </div>
  );
}
