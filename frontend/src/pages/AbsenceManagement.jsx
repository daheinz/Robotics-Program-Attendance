import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AbsenceManagement.css';
import api from '../services/api';

export default function AbsenceManagement() {
  const [absences, setAbsences] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('unapproved');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchStudentId, setSearchStudentId] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    absenceDate: '',
    dayOfWeek: 0,
    status: 'unapproved',
    notes: '',
  });

  // Fetch unapproved absences on load
  useEffect(() => {
    fetchUnapprovedAbsences();
    fetchStudents();
  }, []);

  const isRangeFilterReady = () => searchStudentId && searchStartDate && searchEndDate;

  const fetchUnapprovedAbsences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/absences/unapproved');
      setAbsences(response.data);
    } catch (error) {
      console.error('Error fetching absences:', error);
      alert('Failed to fetch absences');
    } finally {
      setLoading(false);
    }
  };

  const fetchFutureAbsences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/absences/future');
      setAbsences(response.data);
    } catch (error) {
      console.error('Error fetching future absences:', error);
      alert('Failed to fetch future absences');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users');
      setStudents(response.data.filter(u => u.role === 'student'));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'unapproved') {
      fetchUnapprovedAbsences();
    } else if (newFilter === 'future') {
      fetchFutureAbsences();
    } else if (newFilter === 'range') {
      if (isRangeFilterReady()) {
        fetchStudentAbsencesRange({ silent: true });
      } else {
        setAbsences([]);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    const dayOfWeek = date.getDay();
    setFormData(prev => ({
      ...prev,
      absenceDate: e.target.value,
      dayOfWeek
    }));
  };

  const refreshCurrentFilter = () => {
    if (filter === 'unapproved') {
      fetchUnapprovedAbsences();
    } else if (filter === 'future') {
      fetchFutureAbsences();
    } else if (filter === 'range') {
      fetchStudentAbsencesRange({ silent: true });
    }
  };

  const fetchStudentAbsencesRange = async ({ silent = false } = {}) => {
    if (!isRangeFilterReady()) {
      if (!silent) {
        alert('Select a student and start/end dates');
      }
      return;
    }

    if (new Date(searchStartDate) > new Date(searchEndDate)) {
      alert('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/absences/student/${searchStudentId}`, {
        params: { startDate: searchStartDate, endDate: searchEndDate }
      });
      setAbsences(response.data);
    } catch (error) {
      console.error('Error fetching absences:', error);
      alert('Failed to fetch absences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.absenceDate || !formData.notes) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/absences/${editingId}`, {
          status: formData.status,
          notes: formData.notes,
          approvedBy: formData.status === 'approved' ? localStorage.getItem('userId') : null
        });
        alert('Absence updated successfully');
      } else {
        await api.post('/absences', formData);
        alert('Absence recorded successfully');
      }
      
      setFormData({
        studentId: '',
        absenceDate: '',
        dayOfWeek: 0,
        status: 'unapproved',
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      refreshCurrentFilter();
    } catch (error) {
      console.error('Error saving absence:', error);
      alert('Failed to save absence: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (absence) => {
    const dateValue = absence.absence_date
      ? absence.absence_date.split('T')[0]
      : '';

    setFormData({
      studentId: absence.student_id,
      absenceDate: dateValue,
      dayOfWeek: absence.day_of_week,
      status: absence.status,
      notes: absence.notes || '',
    });
    setEditingId(absence.id);
    setShowForm(true);
  };

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    // Handle both 'YYYY-MM-DD' and ISO formats
    if (dateString.includes('T')) {
      return new Date(dateString);
    } else {
      // Parse YYYY-MM-DD as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (absenceId) => {
    if (!window.confirm('Are you sure you want to delete this absence record?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/absences/${absenceId}`);
      alert('Absence deleted successfully');
      refreshCurrentFilter();
    } catch (error) {
      console.error('Error deleting absence:', error);
      alert('Failed to delete absence: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (absenceId) => {
    try {
      setLoading(true);
      const absence = absences.find(a => a.id === absenceId);
      
      await api.put(`/absences/${absenceId}`, {
        status: 'approved',
        approvedBy: localStorage.getItem('userId')
      });

      alert('Absence approved');
      refreshCurrentFilter();
    } catch (error) {
      console.error('Error approving absence:', error);
      alert('Failed to approve absence');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAuditLog = async (absenceId) => {
    try {
      const response = await api.get(`/absences/${absenceId}/audit-log`);
      const logs = response.data.logs || [];
      
      if (logs.length === 0) {
        alert('Audit Log:\n\nNo audit entries yet.');
        return;
      }

      let logText = 'Audit Log:\n\n';
      logs.forEach(log => {
        logText += `[${new Date(log.created_at).toLocaleString()}] ${log.action.toUpperCase()} by ${log.user_alias}\n`;
        if (log.changes) {
          try {
            const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
            Object.keys(changes || {}).forEach(key => {
              logText += `  ${key}: ${JSON.stringify(changes[key])}\n`;
            });
          } catch (parseErr) {
            console.error('Failed to parse audit log changes', parseErr, log.changes);
            logText += '  (changes could not be displayed)\n';
          }
        }
      });
      
      alert(logText);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      alert('Failed to fetch audit log');
    }
  };

  const dayOfWeekName = (dow) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dow];
  };

  return (
    <div className="absence-management">
      <div className="header-row">
        <h1>Absence Management</h1>
        <Link to="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>
      
      <div className="controls">
        <div className="filter-buttons">
          <button 
            className={`btn ${filter === 'unapproved' ? 'active' : ''}`}
            onClick={() => handleFilterChange('unapproved')}
          >
            Unapproved
          </button>
          <button 
            className={`btn ${filter === 'future' ? 'active' : ''}`}
            onClick={() => handleFilterChange('future')}
          >
            Future Absences
          </button>
          <button 
            className={`btn ${filter === 'range' ? 'active' : ''}`}
            onClick={() => handleFilterChange('range')}
          >
            By Student/Date
          </button>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setFormData({
                studentId: '',
                absenceDate: '',
                dayOfWeek: 0,
                status: 'unapproved',
                notes: '',
              });
              setEditingId(null);
            }
          }}
        >
          {showForm ? 'Cancel' : 'Record New Absence'}
        </button>
      </div>

      {filter === 'range' && (
        <div className="range-filter">
          <h3>Filter Absences by Student and Date Range</h3>
          <div className="range-fields">
            <div className="form-group inline">
              <label>Student</label>
              <select 
                value={searchStudentId}
                onChange={(e) => setSearchStudentId(e.target.value)}
              >
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.alias} - {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group inline">
              <label>Start Date</label>
              <input 
                type="date"
                value={searchStartDate}
                onChange={(e) => setSearchStartDate(e.target.value)}
              />
            </div>
            <div className="form-group inline">
              <label>End Date</label>
              <input 
                type="date"
                value={searchEndDate}
                onChange={(e) => setSearchEndDate(e.target.value)}
              />
            </div>
            <div className="range-actions">
              <button 
                className="btn btn-primary"
                onClick={fetchStudentAbsencesRange}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load Absences'}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setSearchStudentId('');
                  setSearchStartDate('');
                  setSearchEndDate('');
                  setAbsences([]);
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form className="absence-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Absence' : 'Record New Absence'}</h2>
          
          <div className="form-group">
            <label>Student *</label>
            <select 
              name="studentId" 
              value={formData.studentId}
              onChange={handleInputChange}
              disabled={editingId !== null}
              required
            >
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.alias} - {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input 
              type="date" 
              name="absenceDate" 
              value={formData.absenceDate}
              onChange={handleDateChange}
              required
            />
            {formData.absenceDate && (
              <small>{dayOfWeekName(formData.dayOfWeek)}</small>
            )}
          </div>

          <div className="form-group">
            <label>Status</label>
            <select 
              name="status" 
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="unapproved">Unapproved</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes (Required) *</label>
            <textarea 
              name="notes" 
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter reason for absence..."
              required
            />
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update Absence' : 'Record Absence'}
          </button>
        </form>
      )}

      <div className="absences-list">
        {loading && <p className="loading">Loading...</p>}
        
        {!loading && absences.length === 0 && (
          <p className="no-data">
            {filter === 'unapproved'
              ? 'No unapproved absences'
              : filter === 'future'
                ? 'No future absences'
                : 'No absences for the selected student and date range'}
          </p>
        )}

        {!loading && absences.length > 0 && (
          <table className="absences-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(absence => (
                <tr key={absence.id} className={`status-${absence.status}`}>
                  <td>{absence.student_alias} - {absence.first_name} {absence.last_name}</td>
                  <td>{formatDateForDisplay(absence.absence_date)}</td>
                  <td>{dayOfWeekName(absence.day_of_week)}</td>
                  <td className={`status-badge status-${absence.status}`}>
                    {absence.status === 'approved' ? 'APPROVED' : 'UNAPPROVED'}
                  </td>
                  <td>{absence.notes}</td>
                  <td className="actions">
                    {absence.status === 'unapproved' && (
                      <>
                        <button
                          className="btn-small btn-approve"
                          onClick={() => handleApprove(absence.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-small btn-edit"
                          onClick={() => handleEdit(absence)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-small btn-delete"
                          onClick={() => handleDelete(absence.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {absence.status === 'approved' && (
                      <>
                        <button
                          className="btn-small btn-edit"
                          onClick={() => handleEdit(absence)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-small btn-delete"
                          onClick={() => handleDelete(absence.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button 
                      className="btn-small btn-log"
                      onClick={() => handleViewAuditLog(absence.id)}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
