import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './report.css';

const ViewReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('https://temiperi-stocks-backend.onrender.com/temiperi/get-reports');
      setReports(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await axios.delete(`https://temiperi-stocks-backend.onrender.com/temiperi/delete-report/${id}`);
      setReports(reports.filter(report => report._id !== id));
      if (selectedReport?._id === id) {
        setSelectedReport(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      title: selectedReport.title,
      content: selectedReport.content
    });
    setIsEditing(true);
  };

  const handleUpdateReport = async () => {
    try {
      const response = await axios.put(
        `https://temiperi-stocks-backend.onrender.com/temiperi/update-report/${selectedReport._id}`,
        editForm
      );
      
      // Update the reports list
      setReports(reports.map(report => 
        report._id === selectedReport._id ? response.data : report
      ));
      
      // Update the selected report
      setSelectedReport(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: '',
      content: ''
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="reports_view_container">
      <div className="reports_list">
        <h2>All Reports</h2>
        {loading ? (
          <p>Loading reports...</p>
        ) : (
          <div className="reports_grid">
            {reports.map((report) => (
              <div 
                key={report._id} 
                className={`report_card ${selectedReport?._id === report._id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedReport(report);
                  setIsEditing(false);
                }}
              >
                <h3>{report.title}</h3>
                <p className="report_meta">
                  By: {report.author} | {formatDate(report.createdAt)}
                </p>
                <div className="report_actions">
                  <button 
                    className="delete_btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReport(report._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="report_detail">
          {!isEditing ? (
            <>
              <div className="report_header">
                <h2>{selectedReport.title}</h2>
                <button 
                  className="edit_btn"
                  onClick={handleEditClick}
                >
                  Edit
                </button>
              </div>
              <p className="report_meta">
                Written by {selectedReport.author} on {formatDate(selectedReport.createdAt)}
                {selectedReport.updatedAt && selectedReport.updatedAt !== selectedReport.createdAt && (
                  <span> (Updated: {formatDate(selectedReport.updatedAt)})</span>
                )}
              </p>
              <div className="report_content">
                {selectedReport.content}
              </div>
              <div className="email_status">
                {selectedReport.emailSent ? 
                  <span className="status sent">Email Sent ✓</span> :
                  <span className="status pending">Email Pending</span>
                }
              </div>
            </>
          ) : (
            <div className="edit_form">
              <h2>Edit Report</h2>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Report Title"
              />
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Report Content"
              />
              <div className="edit_actions">
                <button onClick={handleUpdateReport}>Save Changes</button>
                <button className="cancel_btn" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewReports;
