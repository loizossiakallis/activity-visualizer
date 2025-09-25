import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

/**
 * @param {{ data: { counts: import('../api').ActiveCount[], peaks: import('../api').ActiveCount[] } }} props
 */
export default function ActiveLineChart({data}){
  const ref = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [peakPercentage, setPeakPercentage] = useState(10); // 0-50%
  const [selectedRange, setSelectedRange] = useState(null); // For drag selection
  
  const getFilteredPeaks = (allCounts, percentage) => {
    if (percentage === 0) {
      // Top 0% = single highest peak
      const maxCount = Math.max(...allCounts.map(c => c.count));
      return allCounts.filter(c => c.count === maxCount);
    }
    
    // Calculate top % of peaks
    const sortedCounts = [...allCounts].sort((a, b) => b.count - a.count);
    const thresholdIndex = Math.floor(sortedCounts.length * (percentage / 100));
    const thresholdCount = sortedCounts[thresholdIndex]?.count || 0;
    const peaks = allCounts.filter(c => c.count >= thresholdCount);
    
    
    // Remove sequential peaks with same count , only keep middle one
    const filteredPeaks = [];
    const processedIndices = new Set();
    for (let i = 0; i < peaks.length; i++) {
      const currentPeak = peaks[i];
      const currentIndex = allCounts.indexOf(currentPeak);
      
      if (processedIndices.has(currentIndex)) continue;
      
      // Find all consecutive peaks with the same count
      const consecutivePeaks = [currentPeak];
      const consecutiveIndices = [currentIndex];
      
      // Check previous dates
      let prevIndex = currentIndex - 1;
      while (prevIndex >= 0 && 
             allCounts[prevIndex].count === currentPeak.count &&
             !processedIndices.has(prevIndex)) {
        consecutivePeaks.unshift(allCounts[prevIndex]);
        consecutiveIndices.unshift(prevIndex);
        prevIndex--;
      }
      
      // Check next dates
      let nextIndex = currentIndex + 1;
      while (nextIndex < allCounts.length && 
             allCounts[nextIndex].count === currentPeak.count &&
             !processedIndices.has(nextIndex)) {
        consecutivePeaks.push(allCounts[nextIndex]);
        consecutiveIndices.push(nextIndex);
        nextIndex++;
      }
      
      // Mark all consecutive indices as processed
      consecutiveIndices.forEach(idx => processedIndices.add(idx));
      
      // Add only the middle peak from the consecutive group
      const middleIndex = Math.floor(consecutivePeaks.length / 2);
      filteredPeaks.push(consecutivePeaks[middleIndex]);
    }
    
    return filteredPeaks;
  };

  const getPeakColor = (peak, allPeaks) => {
    if (allPeaks.length === 1) return '#ff6b6b'; // Single peak is red
    
    const sortedPeaks = [...allPeaks].sort((a, b) => b.count - a.count);
    const maxCount = sortedPeaks[0].count;
    const minCount = sortedPeaks[sortedPeaks.length - 1].count;
    
    if (maxCount === minCount) return '#ff6b6b'; // All same count = red
    
    // Calculate position in gradient (0 = red, 1 = green)
    const ratio = (peak.count - minCount) / (maxCount - minCount);
    
    // Convert ratio to HSL: red (0°) to green (120°)
    const hue = 120 * (1 - ratio); // 0° = red, 120° = green
    return `hsl(${hue}, 70%, 50%)`;
  };

  const renderChart = (isFullscreenMode) => {
    if (!ref.current) return;
    
    // Dispose existing chart if it exists
    const existingChart = echarts.getInstanceByDom(ref.current);
    if (existingChart) {
      existingChart.dispose();
    }
    
    const chart = echarts.init(ref.current);
    const counts = data?.counts || [];
    const allPeaks = data?.peaks || [];
    const dates = counts.map(d=>d.date);
    const countValues = counts.map(d=>d.count);
    
    // Filter peaks based on selected percentage (apply in both modes)
    const filteredPeaks = getFilteredPeaks(counts, peakPercentage);
    
    // Create markPoints for peaks with gradient colors
    const markPoints = filteredPeaks.map(peak => ({
      coord: [peak.date, peak.count],
      itemStyle: { color: getPeakColor(peak, filteredPeaks) },
      label: { 
        show: isFullscreenMode, 
        position: 'top',
        formatter: `Peak: ${peak.count}`,
        fontSize: isFullscreenMode ? 10 : 8
      }
    }));
    
    const option = {
      tooltip: { 
        trigger: 'axis',
        formatter: (params) => {
          const point = params[0];
          const isPeak = filteredPeaks.some(p => p.date === point.axisValue);
          const peakInfo = isPeak ? 
            '<br/><span style="color: #ff6b6b; font-weight: bold;">⚠️ PEAK PERIOD</span><br/><span style="color: #666;">This is one of the busiest days in your project</span>' : 
            '';
          return `${point.axisValue}<br/>Active Activities: ${point.value}${peakInfo}`;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        top: isFullscreenMode ? '15%' : '10%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLabel: {
          rotate: isFullscreenMode ? 45 : 0,
          fontSize: isFullscreenMode ? 12 : 10
        }
      },
      yAxis: { 
        type: 'value', 
        name: 'Active Activities',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          fontSize: isFullscreenMode ? 12 : 10
        }
      },
      dataZoom: isFullscreenMode ? [{
        type: 'inside',
        xAxisIndex: 0,
        start: selectedRange ? selectedRange.start : 0,
        end: selectedRange ? selectedRange.end : 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      }, {
        type: 'slider',
        xAxisIndex: 0,
        start: selectedRange ? selectedRange.start : 0,
        end: selectedRange ? selectedRange.end : 100,
        height: 30,
        bottom: 10
      }] : undefined,
      series: [{ 
        type: 'line', 
        data: countValues, 
        smooth: true,
        lineStyle: {
          width: isFullscreenMode ? 3 : 2
        },
        itemStyle: {
          color: '#5470c6'
        },
        markPoint: {
          data: markPoints,
          symbol: 'pin',
          symbolSize: isFullscreenMode ? 20 : 15
        },
        markLine: isFullscreenMode ? {
          data: [{
            type: 'average',
            name: 'Average',
            label: {
              formatter: 'Avg: {c}',
              position: 'end'
            }
          }]
        } : undefined
      }]
    };
    
    chart.setOption(option, true);
    
    // Add mouse event listeners for drag selection
    if (isFullscreenMode) {
      let isDragging = false;
      let startIndex = null;
      
      chart.on('mousedown', (params) => {
        if (params.componentType === 'series') {
          isDragging = true;
          startIndex = params.dataIndex;
        }
      });
      
      chart.on('mousemove', (params) => {
        if (isDragging && params.componentType === 'series' && startIndex !== null) {
          const endIndex = params.dataIndex;
          const start = Math.min(startIndex, endIndex);
          const end = Math.max(startIndex, endIndex);
          
          // Calculate percentage range
          const totalPoints = countValues.length;
          const startPercent = (start / totalPoints) * 100;
          const endPercent = (end / totalPoints) * 100;
          
          setSelectedRange({ start: startPercent, end: endPercent });
        }
      });
      
      chart.on('mouseup', () => {
        isDragging = false;
        startIndex = null;
      });
      
      // Handle dataZoom events
      chart.on('dataZoom', (params) => {
        if (params.batch && params.batch[0]) {
          const zoomInfo = params.batch[0];
          setSelectedRange({
            start: zoomInfo.start,
            end: zoomInfo.end
          });
        }
      });
    }
    
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
  }, [data, isFullscreen, peakPercentage, selectedRange]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  if (isFullscreen) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-chart">
          <div className="chart-controls">
            <div className="chart-info">
              <h3>Peak Analysis</h3>
              <p>Peak periods (red pins) represent the busiest days in your project. Use the controls below to adjust the analysis.</p>
            </div>
            <div className="chart-controls-row">
              <div className="filter-controls">
                <label>Peak Threshold:</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={peakPercentage}
                  onChange={(e) => setPeakPercentage(parseInt(e.target.value))}
                  className="connection-slider"
                />
                <span className="slider-value">
                  {peakPercentage === 0 ? 'Top 0% (Single Peak)' : `Top ${peakPercentage}%`}
                </span>
              </div>
              <div className="filter-controls">
                <button 
                  onClick={() => {
                    setSelectedRange(null);
                    // Force chart update by triggering a re-render
                    setTimeout(() => {
                      if (ref.current) {
                        const chart = echarts.getInstanceByDom(ref.current);
                        if (chart) {
                          chart.dispatchAction({
                            type: 'dataZoom',
                            start: 0,
                            end: 100
                          });
                        }
                      }
                    }, 100);
                  }}
                  className="reset-zoom-btn"
                >
                  Reset Zoom
                </button>
              </div>
            </div>
            <div className="exit-fullscreen-container">
              <button className="exit-fullscreen-btn" onClick={toggleFullscreen}>
                ✕ Exit Fullscreen
              </button>
            </div>
          </div>
          <div className="chart fullscreen-chart-container" ref={ref} />
        </div>
      </div>
    );
  }
  
  const getTitle = () => {
    if (isFullscreen) {
      const counts = data?.counts || [];
      const filteredPeaks = getFilteredPeaks(counts, peakPercentage);
      return `Active Activities Over Time (${counts.length} days, ${filteredPeaks.length} peak periods)`;
    } else {
      const counts = data?.counts || [];
      const filteredPeaks = getFilteredPeaks(counts, peakPercentage);
      return `Active Activities Over Time (${filteredPeaks.length} peaks)`;
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
