import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const ResultBanner = ({ result, reason, studentInfo, assetInfo, onReset }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (result) {
      // Auto reset after 10 seconds
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onReset) onReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [result, onReset]);

  if (!result) return null;

  const isAllowed = result === 'ALLOWED' || result === 'OK';

  return (
    <div className="result-banner mt-4">
      <div className={`status-${isAllowed ? 'allowed' : 'blocked'} p-4`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">
              <i className={`bi ${isAllowed ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
              {isAllowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
            </h2>
            <p className="mb-0">{reason}</p>
          </div>
          
          <div className="text-end">
            <div className="countdown-display">
              <small>Resetting in: {countdown}s</small>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-light btn-sm mt-3"
          onClick={() => setShowDetails(!showDetails)}
        >
          <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'} me-1`}></i>
          {showDetails ? 'Hide' : 'Show'} Details
        </button>

        {showDetails && (
          <div className="details mt-3 p-3 bg-white bg-opacity-25 rounded">
            {studentInfo && (
              <div className="student-details mb-3">
                <h5>Student Information:</h5>
                <div className="row">
                  <div className="col-md-6">
                    <strong>ID:</strong> {studentInfo.student_id}
                  </div>
                  <div className="col-md-6">
                    <strong>Name:</strong> {studentInfo.full_name}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong> 
                    <span className={`badge ms-2 ${studentInfo.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                      {studentInfo.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {assetInfo && (
              <div className="asset-details">
                <h5>Asset Information:</h5>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Asset ID:</strong> {assetInfo.asset_id}
                  </div>
                  <div className="col-md-6">
                    <strong>Serial No:</strong> {assetInfo.serial_number}
                  </div>
                  <div className="col-md-6">
                    <strong>Brand:</strong> {assetInfo.brand}
                  </div>
                  <div className="col-md-6">
                    <strong>Color:</strong> {assetInfo.color}
                  </div>
                  <div className="col-md-12">
                    <strong>Specs:</strong> {assetInfo.visible_specs}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>
                    <span className={`badge ms-2 ${
                      assetInfo.status === 'active' ? 'bg-success' : 
                      assetInfo.status === 'revoked' ? 'bg-warning' : 'bg-danger'
                    }`}>
                      {assetInfo.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons mt-3">
          <button 
            onClick={onReset}
            className="btn btn-light me-2"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Scan Next Student
          </button>
          
          {isAllowed && (
            <button 
              onClick={() => {
                // Print exit pass
                window.print();
              }}
              className="btn btn-outline-light"
            >
              <i className="bi bi-printer me-1"></i>
              Print Pass
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultBanner;