import React, { useState, useEffect } from 'react';
import './AbsenceManagement.css';
import api from '../services/api';

export default function AbsenceManagement() {
  const [absences, setAbsences] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('unapproved');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
      fetchUnapprovedAbsences();
    } catch (error) {
      console.error('Error saving absence:', error);
      alert('Failed to save absence: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (absence) => {
    setFormData({
      studentId: absence.student_id,
      absenceDate: absence.absence_date,
      dayOfWeek: absence.day_of_week,
      status: absence.status,
      notes: absence.notes,
    });
    setEditingId(absence.id);
    setShowForm(true);
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
      fetchUnapprovedAbsences();
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
      const logs = response.data.logs;
      
      let logText = 'Audit Log:\n\n';
      logs.forEach(log => {
        logText += `[${new Date(log.created_at).toLocaleString()}] ${log.action.toUpperCase()} by ${log.user_alias}\n`;
        if (log.changes) {
          const changes = JSON.parse(log.changes);
          Object.keys(changes).forEach(key => {
            logText += `  ${key}: ${JSON.stringify(changes[key])}\n`;
          });
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
      <h1>Absence Management</h1>
      
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
            {filter === 'unapproved' ? 'No unapproved absences' : 'No future absences'}
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
                  <td>{absence.absence_date}</td>
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
                      </>
                    )}
                    {absence.status === 'approved' && (
                      <button 
                        className="btn-small btn-edit"
                        onClick={() => handleEdit(absence)}
                      >
                        Edit
                      </button>
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
