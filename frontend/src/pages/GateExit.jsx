import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import QRScanner from '../components/QRScanner';
import ResultBanner from '../components/ResultBanner';
import StudentInfo from '../components/StudentInfo';
import { gateAPI } from '../services/api';
import { logout, getUsername } from '../services/auth';

const GateExit = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Scan Student, 2: Scan Asset
  const [studentId, setStudentId] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [qrData, setQrData] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [exitToken, setExitToken] = useState('');

  useEffect(() => {
    // Load recent exit logs
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const response = await gateAPI.getExitLogs(10);
      setRecentLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleStudentScan = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      toast.error('Please enter a student ID');
      return;
    }

    setLoading(true);
    try {
      const response = await gateAPI.scanStudent(studentId);
      
      setStudentInfo({
        ...response.student,
        has_assets: response.has_assets,
        asset_count: response.asset_count
      });
      setExitToken(response.exit_token || '');
      
      if (response.status === 'OK' && response.has_assets) {
        setStep(2);
        toast.info('Student verified. Please scan the asset QR code.');
      } else if (response.status === 'OK' && !response.has_assets) {
        // Student has no assets, exit without asset scan
        handleExitWithoutAsset();
      }
    } catch (error) {
      console.error('Student scan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scannedData) => {
    setQrData(scannedData);
    
    if (!studentId) {
      toast.error('Please scan student ID first');
      return;
    }
    if (!exitToken) {
      toast.error('Exit token missing. Please rescan student ID.');
      return;
    }

    setLoading(true);
    try {
      const response = await gateAPI.scanAsset(studentId, scannedData, exitToken);
      setScanResult({
        result: response.status,
        reason: response.reason,
        studentInfo: response.student,
        assetInfo: response.asset
      });
      
      // Refresh logs
      fetchRecentLogs();
    } catch (error) {
      console.error('QR scan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitWithoutAsset = async () => {
    if (!studentId) return;
    if (!exitToken) {
      toast.error('Exit token missing. Please rescan student ID.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await gateAPI.exitWithoutAsset(studentId, exitToken);
      setScanResult({
        result: response.status,
        reason: response.reason,
        studentInfo: response.student
      });
      
      // Refresh logs
      fetchRecentLogs();
    } catch (error) {
      console.error('Exit without asset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStudentId('');
    setStudentInfo(null);
    setQrData('');
    setScanResult(null);
    setExitToken('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container-fluid">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark mb-4">
        <div className="container">
          <span className="navbar-brand">
            <i className="bi bi-shield-check me-2"></i>
            DBU Gate Exit System
          </span>
          
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <i className="bi bi-person-circle me-1"></i>
              {getUsername()} (Gate Operator)
            </span>
            <button 
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          <div className="gate-container">
            <h2 className="text-center mb-4">
              <i className="bi bi-door-closed me-2"></i>
              Main Gate Exit Verification
            </h2>
            
            {/* Step 1: Student ID Scan */}
            {step === 1 && (
              <div className="step-1">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-badge me-2"></i>
                      Step 1: Scan Student ID
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleStudentScan}>
                      <div className="mb-3">
                        <label className="form-label">Student ID Number</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-person-badge"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Student ID (e.g., STU001)"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            disabled={loading}
                            autoFocus
                          />
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading || !studentId.trim()}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-1"></i>
                                Verify
                              </>
                            )}
                          </button>
                        </div>
                        <div className="form-text">
                          Enter the student's ID number or scan their ID card
                        </div>
                      </div>
                    </form>
                    
                    <div className="text-center">
                      <hr />
                      <p className="text-muted">OR</p>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => toast.info('ID Card Scanner coming soon...')}
                      >
                        <i className="bi bi-card-text me-2"></i>
                        Scan ID Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: QR Scan */}
            {step === 2 && (
              <div className="step-2">
                <div className="card">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-qr-code-scan me-2"></i>
                      Step 2: Scan Asset QR Code
                    </h5>
                  </div>
                  <div className="card-body">
                    <StudentInfo student={studentInfo} />
                    
                    <div className="mt-4">
                      <QRScanner 
                        onScan={handleQRScan}
                        onError={(error) => toast.error(`Scan error: ${error}`)}
                      />
                    </div>
                    
                    <div className="mt-3 text-center">
                      <button 
                        className="btn btn-secondary me-2"
                        onClick={() => setStep(1)}
                      >
                        <i className="bi bi-arrow-left me-1"></i>
                        Back to Student Scan
                      </button>
                      
                      <button 
                        className="btn btn-warning"
                        onClick={handleExitWithoutAsset}
                        disabled={loading}
                      >
                        <i className="bi bi-person-walking me-1"></i>
                        Exit Without Asset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result Display */}
            {scanResult && (
              <ResultBanner 
                result={scanResult.result}
                reason={scanResult.reason}
                studentInfo={scanResult.studentInfo}
                assetInfo={scanResult.assetInfo}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Recent Logs */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Exit Logs
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {recentLogs.length === 0 ? (
                  <div className="list-group-item text-center py-4">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mb-0">No exit logs yet</p>
                  </div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.log_id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{log.student_id}</strong>
                          <div className="small text-muted">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <span className={`badge ${
                          log.result === 'ALLOWED' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {log.result}
                        </span>
                      </div>
                      {log.reason && (
                        <div className="small mt-1">
                          <em>{log.reason}</em>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-sm btn-outline-info w-100"
                onClick={fetchRecentLogs}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh Logs
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Today's Stats
              </h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <div className="stat-item">
                    <div className="stat-value text-primary">
                      {recentLogs.filter(l => l.result === 'ALLOWED').length}
                    </div>
                    <div className="stat-label">Allowed</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <div className="stat-value text-danger">
                      {recentLogs.filter(l => l.result === 'BLOCKED').length}
                    </div>
                    <div className="stat-label">Blocked</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <div className="stat-value text-success">
                      {recentLogs.length}
                    </div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateExit;
