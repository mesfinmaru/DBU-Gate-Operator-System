import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import { adminAPI } from '../services/api';
import { logout, getUsername } from '../services/auth';

const RegisterAsset = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner_student_id: '',
    serial_number: '',
    brand: '',
    color: '',
    visible_specs: '',
  });
  
  const [qrData, setQrData] = useState(null);
  const [registeredAssets, setRegisteredAssets] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExistingAsset, setShowExistingAsset] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchAssets();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await adminAPI.getAllStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await adminAPI.getAllAssets();
      setRegisteredAssets(response.assets || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.registerAsset(formData);
      
      if (response.status === 'CONFLICT') {
        // Show existing asset for review
        setShowExistingAsset(response.existing_asset);
        toast.warning('Asset with this serial number already exists!');
        return;
      }

      toast.success('Asset registered successfully!');
      setQrData(response.qr_data);
      
      // Refresh assets list
      fetchAssets();
      
      // Reset form
      setFormData({
        owner_student_id: '',
        serial_number: '',
        brand: '',
        color: '',
        visible_specs: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!showExistingAsset) return;
    
    if (window.confirm('Are you sure you want to override this asset registration? This will reassign the asset to a new student.')) {
      try {
        const updateData = {
          owner_student_id: formData.owner_student_id,
          status: 'active'
        };
        
        await adminAPI.updateAsset(showExistingAsset.asset_id, updateData);
        
        toast.success('Asset ownership updated successfully!');
        setShowExistingAsset(null);
        
        // Refresh assets
        fetchAssets();
      } catch (error) {
        console.error('Update error:', error);
      }
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>DBU Asset QR - ${formData.serial_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .qr-container { margin: 20px auto; }
            .info { margin-top: 20px; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h3>DBU Registered Asset</h3>
          <div class="qr-container">
            ${document.querySelector('.qr-display').innerHTML}
          </div>
          <div class="info">
            <p><strong>Serial Number:</strong> ${formData.serial_number}</p>
            <p><strong>Brand:</strong> ${formData.brand}</p>
            <p><strong>Student ID:</strong> ${formData.owner_student_id}</p>
            <p><small>Scan this QR code at the university gate</small></p>
          </div>
          <div class="footer">
            DBU Gate Exit System - ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
            DBU Admin Portal
          </span>
          
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <i className="bi bi-person-circle me-1"></i>
              {getUsername()} (Admin)
            </span>
            <button 
              onClick={() => navigate('/gate')}
              className="btn btn-outline-light btn-sm me-2"
            >
              <i className="bi bi-door-closed me-1"></i>
              Gate View
            </button>
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
        {/* Registration Form */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-laptop me-2"></i>
                Register New Asset
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Student ID *</label>
                    <select
                      name="owner_student_id"
                      className="form-select"
                      value={formData.owner_student_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.student_id} value={student.student_id}>
                          {student.student_id} - {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Serial Number *</label>
                    <input
                      type="text"
                      name="serial_number"
                      className="form-control"
                      placeholder="Enter serial number"
                      value={formData.serial_number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      className="form-control"
                      placeholder="e.g., Dell, HP, Lenovo"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Color</label>
                    <input
                      type="text"
                      name="color"
                      className="form-control"
                      placeholder="e.g., Black, Silver"
                      value={formData.color}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label className="form-label">Visible Specifications</label>
                    <textarea
                      name="visible_specs"
                      className="form-control"
                      rows="3"
                      placeholder="Describe visible specs, stickers, damages, etc."
                      value={formData.visible_specs}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Register Asset
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              {/* Existing Asset Warning */}
              {showExistingAsset && (
                <div className="alert alert-warning mt-3">
                  <h5>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Asset Already Registered!
                  </h5>
                  <p>This serial number is already registered to:</p>
                  <div className="p-3 bg-light rounded">
                    <strong>Student ID:</strong> {showExistingAsset.owner_student_id}<br />
                    <strong>Brand:</strong> {showExistingAsset.brand}<br />
                    <strong>Status:</strong> {showExistingAsset.status}<br />
                    <strong>Registered:</strong> {new Date(showExistingAsset.registered_at).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <button 
                      onClick={handleOverride}
                      className="btn btn-warning btn-sm me-2"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Override & Reassign
                    </button>
                    <button 
                      onClick={() => setShowExistingAsset(null)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* QR Display */}
          {qrData && (
            <div className="card mt-3">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-qr-code me-2"></i>
                  Generated QR Code
                </h5>
              </div>
              <div className="card-body text-center">
                <div className="qr-display p-3 bg-light rounded">
                  <QRCode value={qrData} size={200} />
                </div>
                <div className="mt-3">
                  <button 
                    onClick={handlePrintQR}
                    className="btn btn-primary me-2"
                  >
                    <i className="bi bi-printer me-1"></i>
                    Print QR Sticker
                  </button>
                  <button 
                    onClick={() => setQrData(null)}
                    className="btn btn-secondary"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Close
                  </button>
                </div>
                <div className="mt-2 small text-muted">
                  Print this QR code on a durable sticker and attach to the asset
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registered Assets List */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Registered Assets ({registeredAssets.length})
                </h4>
                <button 
                  onClick={fetchAssets}
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Serial No</th>
                      <th>Brand</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredAssets.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td>{asset.asset_id}</td>
                        <td>
                          <small className="text-muted">{asset.serial_number}</small>
                        </td>
                        <td>{asset.brand}</td>
                        <td>{asset.owner_student_id}</td>
                        <td>
                          <span className={`badge ${
                            asset.status === 'active' ? 'bg-success' : 
                            asset.status === 'revoked' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-info me-1"
                            onClick={() => toast.info(`QR Data: ${asset.qr_signature?.substring(0, 20)}...`)}
                            title="View QR"
                          >
                            <i className="bi bi-qr-code"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => toast.info('Edit feature coming soon...')}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterAsset;