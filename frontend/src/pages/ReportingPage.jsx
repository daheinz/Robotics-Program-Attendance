import React, { useState } from 'react';
import './ReportingPage.css';
import api from '../services/api';

export default function ReportingPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seasonType, setSeasonType] = useState('build');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');

  const handleGenerateReport = async (type) => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      
      if (type === 'csv') {
        // Download CSV
        const response = await api.get('/reports/attendance-csv', {
          params: { startDate, endDate, seasonType }
        });
        downloadFile(response.data, `attendance_report_${startDate}_to_${endDate}.csv`, 'text/csv');
      } else if (type === 'audit') {
        // Download audit report
        const response = await api.get('/reports/audit', {
          params: { startDate, endDate }
        });
        downloadFile(response.data, `audit_report_${startDate}_to_${endDate}.txt`, 'text/plain');
      } else if (type === 'summary') {
        // Get summary for web display
        const response = await api.get('/reports/attendance', {
          params: { startDate, endDate, seasonType }
        });
        setReportData(response.data);
        setReportType('summary');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleFutureAbsences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/future');
      setReportData(response.data);
      setReportType('future');
    } catch (error) {
      console.error('Error fetching future absences:', error);
      alert('Failed to fetch future absences');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadReportAsCSV = () => {
    if (!reportData || reportType !== 'summary') return;

    let csv = 'Student Name,Approved Absences,Unapproved Absences\n';
    
    reportData.students.forEach(student => {
      csv += `"${student.firstName} ${student.lastName}",${student.approved},${student.unapproved}\n`;
    });

    downloadFile(csv, `summary_report_${startDate}_to_${endDate}.csv`, 'text/csv');
  };

  return (
    <div className="reporting-page">
      <h1>Absence Reporting</h1>

      <div className="report-controls">
        <div className="filter-section">
          <h2>Generate Report</h2>
          
          <div className="form-group">
            <label>Start Date *</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>End Date *</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Season Type</label>
            <select 
              value={seasonType}
              onChange={(e) => setSeasonType(e.target.value)}
            >
              <option value="build">Build Season</option>
              <option value="offseason">Off-Season</option>
            </select>
          </div>

          <div className="button-group">
            <button 
              className="btn btn-primary"
              onClick={() => handleGenerateReport('summary')}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'View Summary'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleGenerateReport('csv')}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Download CSV'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleGenerateReport('audit')}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Download Audit Report'}
            </button>
          </div>

          <button 
            className="btn btn-info"
            onClick={handleFutureAbsences}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View Future Absences'}
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading report...</div>}

      {reportData && reportType === 'summary' && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Attendance Summary Report</h2>
            <p>Period: {startDate} to {endDate} ({seasonType})</p>
            <button 
              className="btn btn-small"
              onClick={downloadReportAsCSV}
            >
              Download as CSV
            </button>
          </div>

          {reportData.students.length === 0 ? (
            <p className="no-data">No absence records found for this period</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Alias</th>
                  <th>Approved Absences</th>
                  <th>Unapproved Absences</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.map((student, idx) => (
                  <tr key={idx}>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.alias}</td>
                    <td className="text-success">{student.approved}</td>
                    <td className="text-danger">{student.unapproved}</td>
                    <td className="font-bold">{student.approved + student.unapproved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reportData && reportType === 'future' && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Future Absences</h2>
            <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
          </div>

          {reportData.students.length === 0 ? (
            <p className="no-data">No future absences scheduled</p>
          ) : (
            <div className="future-absences-list">
              {reportData.students.map((student, idx) => (
                <div key={idx} className="student-future-absences">
                  <h3>{student.firstName} {student.lastName} ({student.alias})</h3>
                  <div className="absences-items">
                    {student.absences.map((absence, aidx) => (
                      <div key={aidx} className={`absence-item status-${absence.status}`}>
                        <div className="absence-date">{absence.date}</div>
                        <div className="absence-status">
                          {absence.status === 'approved' ? 'APPROVED' : 'PENDING'}
                        </div>
                        <div className="absence-notes">{absence.notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
