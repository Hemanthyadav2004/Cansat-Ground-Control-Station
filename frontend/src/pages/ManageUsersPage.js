import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Helper function to get token from localStorage or sessionStorage
const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUsers(res.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error.response ? error.response.data : error.message);
      setError(error.response ? error.response.data.message || error.response.data.error : error.message);
    }
  };

  const handleAction = async (id, action, data = {}) => {
    try {
      const token = getToken();
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }
      const url = `http://localhost:5000/api/admin/users/${id}${action}`;
      await axios[action === '' ? 'put' : 'patch'](url, data, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      fetchUsers();
    } catch (error) {
      console.error('Error performing action:', error.response ? error.response.data : error.message);
      setError(error.response ? error.response.data.message || error.response.data.error : error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = getToken();
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error.response ? error.response.data : error.message);
      setError(error.response ? error.response.data.message || error.response.data.error : error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const pageData = users.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div style={styles(darkMode).container}>
      <h2 style={styles(darkMode).header}>Manage Users</h2>
      <div style={styles(darkMode).controls}>
        <button onClick={() => setDarkMode(!darkMode)} style={styles(darkMode).darkToggle}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
      {error && <div style={styles(darkMode).error}>{error}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={styles(darkMode).table}>
          <thead>
            <tr>
              <th style={styles(darkMode).th}>No.</th>
              <th style={styles(darkMode).th}>Email</th>
              <th style={styles(darkMode).th}>Username</th>
              <th style={styles(darkMode).th}>Role</th>
              <th style={styles(darkMode).th}>Approved</th>
              <th style={styles(darkMode).th}>Disabled</th>
              <th style={styles(darkMode).th}>TOTPSecret</th>
              <th style={styles(darkMode).th}>Created At</th>
              <th style={styles(darkMode).th}>Updated At</th>
              <th style={styles(darkMode).th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((user, index) => (
              <tr key={user.id} style={index % 2 === 0 ? styles(darkMode).evenRow : styles(darkMode).oddRow}>
                <td style={styles(darkMode).td}>{(page - 1) * perPage + index + 1}</td>
                <td style={styles(darkMode).td}>{user.email}</td>
                <td style={styles(darkMode).td}>{user.username}</td>
                <td style={styles(darkMode).td}>
                  <select
                    value={user.role}
                    onChange={(e) => handleAction(user.id, '', { role: e.target.value })}
                    style={styles(darkMode).select}
                  >
                    <option value="admin">admin</option>
                    <option value="operator">operator</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td style={{ ...styles(darkMode).td, textAlign: 'center' }}>{user.isApproved ? '✅' : '❌'}</td>
                <td style={{ ...styles(darkMode).td, textAlign: 'center' }}>{user.isDisabled ? '⛔' : '✔️'}</td>
                <td style={{ ...styles(darkMode).td, width: "80px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.totpSecret || 'N/A'}</td>
                <td style={styles(darkMode).td}>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                <td style={styles(darkMode).td}>{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</td>
                <td style={styles(darkMode).td}>
                  {!user.isApproved && <button onClick={() => handleAction(user.id, '/approve')} style={styles(darkMode).actionButton}>Approve</button>}
                  {!user.isDisabled && <button onClick={() => handleAction(user.id, '/disable')} style={styles(darkMode).actionButton}>Disable</button>}
                  <button onClick={() => handleDelete(user.id)} style={{ ...styles(darkMode).actionButton, ...styles(darkMode).deleteButton }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles(darkMode).pagination}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} style={styles(darkMode).paginationButton}>◀ Prev</button>
        <span style={styles(darkMode).paginationInfo}>Page {page}</span>
        <button onClick={() => setPage(p => (p * perPage < users.length ? p + 1 : p))} disabled={page * perPage >= users.length} style={styles(darkMode).paginationButton}>Next ▶</button>
      </div>
    </div>
  );
};

const styles = (darkMode) => ({
  container: {
    textAlign: "center",
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: darkMode ? "#121212" : "#f8f9fa",
    color: darkMode ? "#fff" : "#000",
    overflowX: "hidden",
  },
  header: { fontSize: "28px", fontWeight: "bold", marginBottom: "20px" },
  controls: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  darkToggle: {
    padding: "10px 16px",
    backgroundColor: darkMode ? "#555" : "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  error: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "5px",
    maxWidth: "600px",
    margin: "0 auto 20px auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    color: darkMode ? "#fff" : "#000",
  },
  th: {
    padding: "10px",
    border: "1px solid #888",
    backgroundColor: darkMode ? "#333" : "#f1f1f1",
    color: darkMode ? "#fff" : "#000",
    fontWeight: "bold",
  },
  td: {
    padding: "10px",
    border: "1px solid #888",
    textAlign: "center",
  },
  evenRow: {
    backgroundColor: darkMode ? "#2a2a2a" : "#f9f9f9",
  },
  oddRow: {
    backgroundColor: "transparent",
  },
  select: {
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  actionButton: {
    margin: "2px",
    padding: "4px 10px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#28a745",
    color: "#fff",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  pagination: {
    marginTop: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  paginationButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #888",
    backgroundColor: darkMode ? "#333" : "#f1f1f1",
    color: darkMode ? "#fff" : "#000",
    cursor: "pointer",
  },
  paginationInfo: {
    fontWeight: "bold",
  },
});

export default ManageUsersPage;
