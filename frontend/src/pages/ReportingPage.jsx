import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/AdminNav';
import './ReportingPage.css';
import api, { userApi } from '../services/api';

export default function ReportingPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seasonType, setSeasonType] = useState('build');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [reportSelection, setReportSelection] = useState('summary');
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [studentsRes, mentorsRes, coachesRes] = await Promise.all([
          userApi.getAll('student'),
          userApi.getAll('mentor'),
          userApi.getAll('coach'),
        ]);
        setStudents(studentsRes.data || []);
        const mentorList = [...(mentorsRes.data || []), ...(coachesRes.data || [])];
        setMentors(mentorList);
      } catch (error) {
        console.error('Error loading users for reports:', error);
      }
    };
    loadUsers();
  }, []);

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

  const handleReportAction = async (action) => {
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
      setReportData(null);

      if (reportSelection === 'summary') {
        if (action === 'csv') {
          const response = await api.get('/reports/attendance-csv', {
            params: { startDate, endDate, seasonType },
          });
          downloadFile(response.data, `attendance_report_${startDate}_to_${endDate}.csv`, 'text/csv');
          return;
        }
        const response = await api.get('/reports/attendance', {
          params: { startDate, endDate, seasonType },
        });
        setReportData(response.data);
        setReportType('summary');
        return;
      }

      if (reportSelection === 'attendance-students') {
        const response = await api.get('/reports/attendance-sessions', {
          params: { startDate, endDate, role: 'student' },
        });
        setReportData(response.data);
        setReportType('attendance-students');
      }

      if (reportSelection === 'attendance-student') {
        const response = await api.get('/reports/attendance-sessions', {
          params: { startDate, endDate, userId: selectedStudentId },
        });
        setReportData(response.data);
        setReportType('attendance-student');
      }

      if (reportSelection === 'attendance-mentors') {
        const response = await api.get('/reports/attendance-sessions', {
          params: { startDate, endDate, role: 'mentor-coach' },
        });
        setReportData(response.data);
        setReportType('attendance-mentors');
      }

      if (reportSelection === 'attendance-mentor') {
        const response = await api.get('/reports/attendance-sessions', {
          params: { startDate, endDate, userId: selectedMentorId },
        });
        setReportData(response.data);
        setReportType('attendance-mentor');
      }

      if (reportSelection === 'absences-students') {
        const response = await api.get('/reports/absences', {
          params: { startDate, endDate, seasonType },
        });
        setReportData(response.data);
        setReportType('absences-students');
      }

      if (reportSelection === 'absences-student') {
        const response = await api.get('/reports/absences', {
          params: { startDate, endDate, seasonType, userId: selectedStudentId },
        });
        setReportData(response.data);
        setReportType('absences-student');
      }

      if (reportSelection === 'future') {
        const response = await api.get('/reports/future');
        setReportData(response.data);
        setReportType('future');
      }

      if (reportSelection === 'student-totals') {
        const response = await api.get('/reports/student-totals', {
          params: { startDate, endDate, seasonType },
        });
        setReportData(response.data);
        setReportType('student-totals');
      }

      if (reportSelection === 'valid-sessions') {
        const response = await api.get('/reports/valid-sessions', {
          params: { startDate, endDate, seasonType },
        });
        setReportData(response.data);
        setReportType('valid-sessions');
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

  const handleAttendanceSessionsReport = async ({ role, userId, type }) => {
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
      const response = await api.get('/reports/attendance-sessions', {
        params: { startDate, endDate, role, userId },
      });
      setReportData(response.data);
      setReportType(type);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      alert('Failed to fetch attendance report: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbsencesReport = async ({ userId, type }) => {
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
      const response = await api.get('/reports/absences', {
        params: { startDate, endDate, seasonType, userId },
      });
      setReportData(response.data);
      setReportType(type);
    } catch (error) {
      console.error('Error fetching absences report:', error);
      alert('Failed to fetch absences report: ' + error.response?.data?.error);
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
    if (!reportData) return;

    if (reportType === 'summary') {
      let csv = 'Student Name,Approved Absences,Unapproved Absences\n';
      reportData.students.forEach(student => {
        csv += `"${student.firstName} ${student.lastName}",${student.approved},${student.unapproved}\n`;
      });
      downloadFile(csv, `summary_report_${startDate}_to_${endDate}.csv`, 'text/csv');
      return;
    }

    if (reportType.startsWith('attendance')) {
      let csv = 'Name,Alias,Role,Check In,Check Out,Duration Minutes\n';
      reportData.sessions.forEach(session => {
        csv += `"${session.first_name} ${session.last_name}","${session.alias}",${session.role},"${session.check_in_time}","${session.check_out_time || ''}",${session.duration_minutes || ''}\n`;
      });
      downloadFile(csv, `attendance_sessions_${startDate}_to_${endDate}.csv`, 'text/csv');
      return;
    }

    if (reportType.startsWith('absences')) {
      let csv = 'Student,Alias,Date,Status,Notes\n';
      reportData.absences.forEach(absence => {
        csv += `"${absence.first_name} ${absence.last_name}","${absence.student_alias}",${absence.absence_date},${absence.status},"${absence.notes || ''}"\n`;
      });
      downloadFile(csv, `absences_${startDate}_to_${endDate}.csv`, 'text/csv');
    }

    if (reportType === 'student-totals') {
      let csv = 'Student Name,Alias,Total Minutes,Excused Absences,Unexcused Absences\n';
      reportData.students.forEach(student => {
        csv += `"${student.first_name} ${student.last_name}","${student.alias}",${Math.round(Number(student.total_minutes || 0))},${student.excused_count},${student.unexcused_count}\n`;
      });
      downloadFile(csv, `student_totals_${startDate}_to_${endDate}.csv`, 'text/csv');
    }

    if (reportType === 'valid-sessions') {
      let csv = 'Student Name,Alias,Required Days,Absences,Unexcused Absences,Approved Absences,Valid Sessions\n';
      reportData.students.forEach(student => {
        csv += `"${student.first_name} ${student.last_name}","${student.alias}",${student.required_count},${student.absences_count},${student.unexcused_count},${student.approved_count},${student.valid_sessions}\n`;
      });
      downloadFile(csv, `valid_sessions_${startDate}_to_${endDate}.csv`, 'text/csv');
    }
  };

  return (
    <div className="admin-page-wrapper">
      <AdminNav />
      <div className="reporting-page">
        <div className="header-row">
          <h1>Reports & Analytics</h1>
          <Link to="/" className="btn btn-secondary">
            ← Back to Home
          </Link>
        </div>

      <div className="report-controls">
        <div className="filter-section">
          <h2>Generate Report</h2>

          <div className="form-group">
            <label>Report Type</label>
            <select value={reportSelection} onChange={(e) => setReportSelection(e.target.value)}>
              <option value="summary">All Student Attendance Summary</option>
              <option value="student-totals">All Student Totals (durations + absences)</option>
              <option value="valid-sessions">Valid Required Days (no absences)</option>
              <option value="attendance-students">All Student Attendance (sessions)</option>
              <option value="absences-students">All Student Absences</option>
              <option value="attendance-student">Single Student Attendance</option>
              <option value="absences-student">Single Student Absences</option>
              <option value="attendance-mentors">All Mentors/Coaches Attendance</option>
              <option value="attendance-mentor">Single Mentor/Coach Attendance</option>
              <option value="future">Future Absences</option>
            </select>
          </div>
          
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

          {['attendance-student', 'absences-student'].includes(reportSelection) && (
            <div className="form-group">
              <label>Student</label>
              <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">Select student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.alias}
                  </option>
                ))}
              </select>
            </div>
          )}

          {['attendance-mentor'].includes(reportSelection) && (
            <div className="form-group">
              <label>Mentor/Coach</label>
              <select value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)}>
                <option value="">Select mentor/coach...</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.alias}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={() => handleReportAction('screen')}
              disabled={loading || (['attendance-student', 'absences-student'].includes(reportSelection) && !selectedStudentId) || (reportSelection === 'attendance-mentor' && !selectedMentorId)}
            >
              {loading ? 'Loading...' : 'View Report'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={downloadReportAsCSV}
              disabled={!reportData || loading}
            >
              Download CSV
            </button>
          </div>

          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={() => handleReportAction('csv')}
              disabled={loading || reportSelection !== 'summary'}
            >
              {loading ? 'Loading...' : 'Download Summary CSV'}
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

      {reportData && reportType === 'student-totals' && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Student Totals Report</h2>
            <p>Period: {reportData.startDate} to {reportData.endDate} ({reportData.seasonType})</p>
          </div>

          {reportData.students.length === 0 ? (
            <p className="no-data">No students found for this period</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Alias</th>
                  <th>Total Minutes</th>
                  <th>Excused Absences</th>
                  <th>Unexcused Absences</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.alias}</td>
                    <td>{Math.round(Number(student.total_minutes || 0))}</td>
                    <td className="text-success">{student.excused_count}</td>
                    <td className="text-danger">{student.unexcused_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reportData && reportType === 'valid-sessions' && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Valid Required Days Report</h2>
            <p>Period: {reportData.startDate} to {reportData.endDate} ({reportData.seasonType})</p>
          </div>

          {reportData.students.length === 0 ? (
            <p className="no-data">No students found for this period</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Alias</th>
                  <th>Required Days</th>
                  <th>Absences</th>
                  <th>Unexcused</th>
                  <th>Approved</th>
                  <th>Valid Days</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.alias}</td>
                    <td>{student.required_count}</td>
                    <td>{student.absences_count}</td>
                    <td className="text-danger">{student.unexcused_count}</td>
                    <td className="text-success">{student.approved_count}</td>
                    <td className="font-bold">{student.valid_sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reportData && reportType.startsWith('attendance') && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Attendance Report</h2>
            <p>Period: {reportData.startDate} to {reportData.endDate}</p>
          </div>

          {reportData.sessions.length === 0 ? (
            <p className="no-data">No attendance records found for this period</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Alias</th>
                  <th>Role</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.first_name} {session.last_name}</td>
                    <td>{session.alias}</td>
                    <td>{session.role}</td>
                    <td>{new Date(session.check_in_time).toLocaleString()}</td>
                    <td>{session.check_out_time ? new Date(session.check_out_time).toLocaleString() : 'Active'}</td>
                    <td>{session.duration_minutes ? Math.round(Number(session.duration_minutes)) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {reportData && reportType.startsWith('absences') && !loading && (
        <div className="report-container">
          <div className="report-header">
            <h2>Absence Report</h2>
            <p>Period: {reportData.startDate} to {reportData.endDate} ({reportData.seasonType})</p>
          </div>

          {reportData.absences.length === 0 ? (
            <p className="no-data">No absences found for this period</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Alias</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reportData.absences.map((absence) => (
                  <tr key={absence.id}>
                    <td>{absence.first_name} {absence.last_name}</td>
                    <td>{absence.student_alias}</td>
                    <td>{absence.absence_date}</td>
                    <td className={absence.status === 'approved' ? 'text-success' : 'text-danger'}>
                      {absence.status}
                    </td>
                    <td>{absence.notes || '-'}</td>
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
    </div>
  );
}
