"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Utility to extract and format data for the chart

function prepareTrendData(predictions) {
  if (!predictions || predictions.length === 0) return { labels: [], data: [], risk: [] };
  // Sort by date
  const sorted = [...predictions].sort((a, b) =>
    new Date(a.upload_timestamp || a.inference_timestamp || a.timestamp) -
    new Date(b.upload_timestamp || b.inference_timestamp || b.timestamp)
  );

  // Card logic for confidence extraction
  function getConf(p) {
    if (typeof p.confidence_score === 'number') return p.confidence_score;
    if (
      p.confidence_scores &&
      typeof p.confidence_scores === 'object' &&
      p.confidence_scores.confidence_scores &&
      typeof p.confidence_scores.confidence_scores === 'object'
    ) {
      const vals = Object.values(p.confidence_scores.confidence_scores)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      if (vals.length > 0) return Math.max(...vals);
    }
    return 0;
  }

  return {
    labels: sorted.map(p => {
      const d = new Date(p.upload_timestamp || p.inference_timestamp || p.timestamp);
      return d.toLocaleDateString();
    }),
    data: sorted.map(getConf),
    risk: sorted.map(p => {
      const pred = (p.predicted_class || p.prediction || '').toLowerCase();
      if (pred.includes('malignant')) return 'Malignant';
      if (pred.includes('benign') || pred.includes('nevus')) return 'Benign';
      return 'Unknown';
    })
  };
}

const ConfidenceTrendChart = ({ predictions }) => {
  const { labels, data, risk } = prepareTrendData(predictions);

  // Color points based on risk
  const pointColors = risk.map(r =>
    r === 'Malignant' ? '#ef4444' : r === 'Benign' ? '#10b981' : '#a3a3a3'
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Confidence Score (%)',
        data,
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const idx = context.dataIndex;
            return `Confidence: ${data[idx].toFixed(2)}% | Risk: ${risk[idx]}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Confidence (%)',
        },
        grid: {
          color: 'rgba(200,200,200,0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          color: 'rgba(200,200,200,0.1)'
        }
      },
    },
  };

  return (
    <div
      style={{
        background: 'var(--card-background)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--card-border)',
        padding: 12,
        marginBottom: 24,
        marginTop: 32, // push chart down for background color
        width: 'calc(100% - 40px)', // leave space for background at sides
        maxWidth: 1100,
        marginLeft: 'auto',
        marginRight: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        Confidence Trend
      </h3>
      <div style={{ width: '100%', height: 240, position: 'relative', padding: 0, margin: 0 }}>
        <Line data={chartData} options={options} style={{ width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginTop: 16,
          textAlign: 'center',
          maxWidth: '90%',
          lineHeight: 1.5,
        }}
      >
        Each point represents a prediction. <span style={{ color: '#ef4444' }}>Red = Malignant</span>, <span style={{ color: '#10b981' }}>Green = Benign</span>.
      </div>
    </div>
  );
};

export default ConfidenceTrendChart;
