import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")); // 👈 Fetch user from localStorage

  const handleLogout = () => {
    localStorage.clear();
    alert("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav style={{ backgroundColor: "#282c34", padding: "10px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: "20px", color: "white" }}>Dashboard</Link>

        {/* 👇 Conditionally show Manage Users link if role is Admin */}
        {user && user.role === "Admin" && (
          <Link to="/manage-users" style={{ color: "white" }}>Manage Users</Link>
        )}
      </div>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
    </nav>
  );
}

const styles = {
  logoutButton: {
    background: "red",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
  },
};

export default NavBar;