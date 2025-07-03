"use client";

import React, { useMemo } from "react";
import Image from "next/image";

// Move processTimelineData outside the component to avoid react-hooks/exhaustive-deps warning
function processTimelineData(predictions, reverseOrder) {
  if (!predictions || predictions.length === 0) {
    return [];
  }

  // Sort predictions by date - try both timestamp fields
  let sortedPredictions = [...predictions].sort((a, b) => {
    const dateA = new Date(a.upload_timestamp || a.inference_timestamp || a.timestamp);
    const dateB = new Date(b.upload_timestamp || b.inference_timestamp || b.timestamp);
    return dateA - dateB;
  });
  if (reverseOrder) sortedPredictions = sortedPredictions.reverse();

  // Group predictions by date for better visualization
  const groupedByDate = sortedPredictions.reduce((acc, prediction) => {
    const timestamp = prediction.upload_timestamp || prediction.inference_timestamp || prediction.timestamp;
    if (!timestamp) return acc; // Skip if no valid timestamp
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return acc; // Skip invalid dates
    const dateKey = date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(prediction);
    return acc;
  }, {});

  return Object.entries(groupedByDate).map(([date, dayPredictions]) => ({
    date,
    predictions: dayPredictions,
    count: dayPredictions.length,
    malignantCount: dayPredictions.filter(p => {
      const predClass = p.predicted_class || p.prediction || '';
      return predClass.toLowerCase().includes('malignant');
    }).length,
    benignCount: dayPredictions.filter(p => {
      const predClass = p.predicted_class || p.prediction || '';
      return predClass.toLowerCase().includes('benign');
    }).length
  }));
}

const TimelineChart = ({ predictions }) => {
  const [reverseOrder, setReverseOrder] = React.useState(true);
  const timelineData = useMemo(() => processTimelineData(predictions, reverseOrder), [predictions, reverseOrder]);

  // Toggle button for order
  const renderOrderToggle = () => (
    <div style={{ textAlign: 'right', marginBottom: 12 }}>
      <button
        onClick={() => setReverseOrder((prev) => !prev)}
        style={{
          background: 'var(--info-color)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontWeight: 500,
          cursor: 'pointer',
          fontSize: 13,
          marginLeft: 8
        }}
        aria-label="Toggle timeline order"
      >
        {reverseOrder ? 'Show Oldest First' : 'Show Newest First'}
      </button>
    </div>
  );

  if (!predictions || predictions.length === 0) {
    return (
      <div style={{
        background: "var(--card-background)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--card-border)",
        padding: 24
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 16
        }}>
          Timeline View
        </h3>
        <p style={{
          color: "var(--text-secondary)",
          textAlign: "center",
          padding: "32px 0"
        }}>
          No predictions to display in timeline.
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (prediction) => {
    const timestamp = prediction.upload_timestamp || prediction.inference_timestamp || prediction.timestamp;
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid time';
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Card logic for confidence extraction
  const getConfidenceScore = (p) => {
    if (typeof p.confidence_score === 'number') return p.confidence_score / 100;
    if (
      p.confidence_scores &&
      typeof p.confidence_scores === 'object' &&
      p.confidence_scores.confidence_scores &&
      typeof p.confidence_scores.confidence_scores === 'object'
    ) {
      const vals = Object.values(p.confidence_scores.confidence_scores)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
      if (vals.length > 0) return Math.max(...vals) / 100;
    }
    return 0;
  };

  const getPredictionLabel = (prediction) => {
    return prediction.predicted_class || prediction.prediction || 'Unknown';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div style={{
      background: "var(--card-background)",
      borderRadius: 12,
      boxShadow: "var(--shadow-lg)",
      border: "1px solid var(--card-border)",
      padding: 24
    }}>
      {renderOrderToggle()}
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: "var(--text-primary)",
        marginBottom: 24
      }}>
        Timeline View
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5" style={{
          background: "var(--card-border)"
        }}></div>
        {timelineData.map((dayData, dayIndex) => (
          <div key={dayData.date} className="relative mb-8">
            {/* Date marker */}
            <div className="flex items-center mb-4">
              <div className="relative z-10 flex items-center justify-center w-4 h-4 rounded-full border-4 shadow" style={{
                background: "var(--info-color)",
                borderColor: "var(--card-background)"
              }}>
              </div>
              <div className="ml-4">
                <h4 style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)"
                }}>
                  {formatDate(dayData.date)}
                </h4>
                <p style={{
                  fontSize: 12,
                  color: "var(--text-secondary)"
                }}>
                  {dayData.count} prediction{dayData.count !== 1 ? 's' : ''}
                  {dayData.malignantCount > 0 && (
                    <span style={{ 
                      marginLeft: 8,
                      color: "var(--error-color)"
                    }}>
                      • {dayData.malignantCount} malignant
                    </span>
                  )}
                  {dayData.benignCount > 0 && (
                    <span style={{ 
                      marginLeft: 8,
                      color: "var(--success-color)"
                    }}>
                      • {dayData.benignCount} benign
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Predictions for this day */}
            <div className="ml-12 space-y-3">
              {dayData.predictions.map((prediction, predIndex) => (
                <div
                  key={prediction.prediction_id}
                  className="rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{
                    background: "var(--hover-background)",
                    border: "1px solid var(--card-border)"
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span style={{
                          fontSize: 12,
                          color: "var(--text-secondary)"
                        }}>
                          {formatTime(prediction)}
                        </span>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: getPredictionLabel(prediction).toLowerCase().includes('malignant') 
                              ? '#fee2e2' : '#ecfdf5',
                            color: getPredictionLabel(prediction).toLowerCase().includes('malignant') 
                              ? '#dc2626' : '#059669'
                          }}
                        >
                          {getPredictionLabel(prediction)}
                        </span>
                      </div>
                      
                      {prediction.filename && (
                        <p style={{
                          fontSize: 14,
                          color: "var(--text-primary)",
                          marginBottom: 4
                        }}>
                          File: {prediction.filename}
                        </p>
                      )}
                      
                      {getConfidenceScore(prediction) > 0 && (
                        <div className="flex items-center space-x-2">
                          <span style={{
                            fontSize: 12,
                            color: "var(--text-secondary)"
                          }} className="flex-shrink-0">
                            Confidence:
                          </span>
                          <div className="flex-1 rounded-full h-2 min-w-0 max-w-16 overflow-hidden" style={{
                            background: "var(--input-border)"
                          }}>
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(getConfidenceScore(prediction) * 100, 100)}%`,
                                backgroundColor: getConfidenceColor(getConfidenceScore(prediction))
                              }}
                            ></div>
                          </div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            minWidth: 32,
                            textAlign: "right"
                          }} className="flex-shrink-0">
                            {(getConfidenceScore(prediction) * 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {(prediction.image_uri || prediction.image_path) && (
                      <div className="ml-4 flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden relative" style={{
                          background: "var(--input-border)"
                        }}>
                          <Image
                            src={prediction.image_uri || prediction.image_path}
                            alt="Prediction"
                            fill
                            sizes="48px"
                            priority={dayIndex === 0 && predIndex === 0}
                            className="object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {timelineData.length === 0 && (
        <p style={{
          color: "var(--text-secondary)",
          textAlign: "center",
          padding: "32px 0"
        }}>
          No timeline data available.
        </p>
      )}
    </div>
  );
};

export default TimelineChart;