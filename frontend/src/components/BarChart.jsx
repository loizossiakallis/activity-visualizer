import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

/**
 * @param {{ data: import('../api').Activity[] }} props
 */
export default function BarChart({ data }) {
  const ref = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState('startDate'); // 'startDate', 'duration', 'idAsc', 'idDesc'
  
  const getSortedActivities = (activities, sortType) => {
    switch (sortType) {
      case 'duration':
        return [...activities].sort((a, b) => b.durationDays - a.durationDays);
      case 'idAsc':
        return [...activities].sort((a, b) => {
          const idA = parseInt(a.name) || 0;
          const idB = parseInt(b.name) || 0;
          return idA - idB;
        });
      case 'idDesc':
        return [...activities].sort((a, b) => {
          const idA = parseInt(a.name) || 0;
          const idB = parseInt(b.name) || 0;
          return idB - idA;
        });
      case 'startDate':
      default:
        return [...activities].sort((a, b) => new Date(a.start) - new Date(b.start));
    }
  };

  const renderChart = (activities, isFullscreenMode) => {
    if (!ref.current) return;
    
    // Dispose existing chart if it exists
    const existingChart = echarts.getInstanceByDom(ref.current);
    if (existingChart) {
      existingChart.dispose();
    }
    
        const chart = echarts.init(ref.current);
        
        const sortedActivities = getSortedActivities(activities, sortBy);
        const displayActivities = isFullscreenMode ? sortedActivities : sortedActivities.slice(0, 20);
        const names = displayActivities.map(d => d.name || `A${d.index}`);
        const durations = displayActivities.map(d => d.durationDays);
        
        // console.log(`Rendering ${displayActivities.length} activities`);
    
        const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const activity = displayActivities[params[0].dataIndex];
          const start = new Date(activity.start).toLocaleDateString();
          const end = new Date(activity.end).toLocaleDateString();
          return `${activity.name}<br/>Start: ${start}<br/>End: ${end}<br/>Duration: ${activity.durationDays} days`;
        }
      },
      xAxis: { 
        type: 'category',
        data: names,
        axisLabel: { 
          interval: isFullscreenMode ? 'auto' : 0,
          rotate: isFullscreenMode ? 90 : 45,
          formatter: (value) => value.length > (isFullscreenMode ? 15 : 8) ? 
            value.substring(0, isFullscreenMode ? 15 : 8) + '...' : value
        }
      },
      yAxis: { 
        type: 'value',
        name: 'Duration (days)'
      },
      series: [{
        type: 'bar',
        data: durations,
        itemStyle: {
          color: '#5470c6'
        }
      }]
    };
    
    chart.setOption(option, true); // true = notMerge, completely replace
    return chart;
  };

  useEffect(() => {
    if (!ref.current) return;
    
    // Filter activities with valid dates and meaningful duration
    const validActivities = data
      .filter(d => d.start && d.end && d.durationDays > 0);
    
    if (validActivities.length === 0) {
      // Dispose existing chart
      const existingChart = echarts.getInstanceByDom(ref.current);
      if (existingChart) {
        existingChart.dispose();
      }
      
      const chart = echarts.init(ref.current);
      chart.setOption({
        title: { text: 'No activities with duration > 0', left: 'center', top: 'center' }
      });
      return () => chart.dispose();
    }
    
    const chart = renderChart(validActivities, isFullscreen);
    
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => resize());
    ro.observe(ref.current);
    
    return () => {
      window.removeEventListener('resize', resize);
      ro.disconnect();
      chart.dispose();
    }
  }, [data, isFullscreen, sortBy]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-chart">
          <div className="chart-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="startDate">Start Date</option>
                <option value="duration">Duration (High to Low)</option>
                <option value="idAsc">By ID (Asc)</option>
                <option value="idDesc">By ID (Des)</option>
              </select>
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
      const validActivities = data.filter(d => d.start && d.end && d.durationDays > 0);
      const sortedActivities = getSortedActivities(validActivities, sortBy);
      return `Activity Durations (${sortedActivities.length} activities) - Sorted by ${sortBy}`;
    } else {
      return 'Activity Durations (Top 20)';
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
