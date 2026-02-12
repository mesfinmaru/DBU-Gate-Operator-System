import React, { useState } from 'react';

const StudentInfo = ({ student, assets = [] }) => {
  const [showAssets, setShowAssets] = useState(false);

  if (!student) {
    return (
      <div className="student-info-card">
        <div className="text-center py-4">
          <i className="bi bi-person-x" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3">No Student Information</h5>
          <p className="mb-0">Scan a student ID to display information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-info-card">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h4>
            <i className="bi bi-person-badge me-2"></i>
            Student Details
          </h4>
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="info-item">
                <strong>Student ID:</strong>
                <div className="info-value">{student.student_id}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-item">
                <strong>Full Name:</strong>
                <div className="info-value">{student.full_name}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-item">
                <strong>Status:</strong>
                <div className="info-value">
                  <span className={`badge ${student.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                    {student.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            {student.has_assets !== undefined && (
              <div className="col-md-6">
                <div className="info-item">
                  <strong>Registered Assets:</strong>
                  <div className="info-value">
                    <span className="badge bg-info">
                      {student.asset_count || 0} Assets
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="status-indicator">
          <div className={`status-dot ${student.status === 'active' ? 'active' : 'inactive'}`}></div>
        </div>
      </div>

      {assets.length > 0 && (
        <div className="assets-section mt-3">
          <button 
            className="btn btn-sm btn-light w-100"
            onClick={() => setShowAssets(!showAssets)}
          >
            <i className={`bi bi-chevron-${showAssets ? 'up' : 'down'} me-1`}></i>
            {showAssets ? 'Hide' : 'Show'} Registered Assets ({assets.length})
          </button>
          
          {showAssets && (
            <div className="assets-list mt-2">
              <div className="row">
                {assets.map((asset) => (
                  <div key={asset.asset_id} className="col-md-6 mb-2">
                    <div className="asset-item p-2 bg-white bg-opacity-25 rounded">
                      <div className="d-flex justify-content-between">
                        <div>
                          <small><strong>{asset.brand}</strong></small>
                          <div><small>{asset.serial_number}</small></div>
                        </div>
                        <div>
                          <span className={`badge ${
                            asset.status === 'active' ? 'bg-success' : 
                            asset.status === 'revoked' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {asset.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentInfo;