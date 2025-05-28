import React from "react";
import { useNavigate } from "react-router-dom";

const AboutPage = () => {
  const navigate = useNavigate();

  const handleDashboardClick = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
    if (!token) {
      alert("Please login to access the Dashboard.");
      return navigate("/login");
    }
  
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-token", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!res.ok) {
        throw new Error("Invalid or expired token");
      }
  
      navigate("/dashboard");
    } catch (err) {
      alert("Session expired. Please login again.");
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  };
  

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <button onClick={() => navigate("/login")} style={styles.link}>Login</button>
        <button onClick={() => navigate("/signup")} style={styles.link}>Register</button>
        <button onClick={handleDashboardClick} style={styles.link}>Dashboard</button>
      </div>
      <div style={styles.content}>
        <h1>📡 CanSat Ground Control Station</h1>
        <p style={{textIndent:'40px'}}>
        The <b>CanSat Ground Control Station</b> is an interactive, full-stack web applicationdesigned to
           simulate real-world satellite telemetry monitoring in a secure and visually engaging environment. 
           It enables users to track vital CanSat parameters like <b>temperature, pressure, altitude, latitude, 
            longitude, </b> and <b>timestamp</b> — all updated in real-time and displayed through intuitive charts, gauges, 
            and map visualizations.
        </p>
        <p style={{textIndent:'40px'}}>
        Built using <b> React.js, Node.js, PostgreSQL,</b> and <b>Socket.IO,</b> this platform offers robust
         features like<b> JWT-based login, TOTP two-factor authentication (2FA),</b> and<b> role-based access 
          control</b> for Admins and Viewers.
        </p>
        <p>
          Click the buttons on the top-right to Login, Register, or access the Dashboard.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#f4f4f4",
    backgroundImage: "url('/images/cansat.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    position: "absolute",
    top: 20,
    right: 30,
    display: "flex",
    gap: "10px",
  },
  link: {
    padding: "8px 16px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  content: {
    maxWidth: "700px",
    margin: "100px auto",
    textAlign: "justify",
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
};

export default AboutPage;
