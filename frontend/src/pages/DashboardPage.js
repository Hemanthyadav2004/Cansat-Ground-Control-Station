// ✅ Fully Working CanSat Dashboard with Accurate Filtering, Sorting, Pagination, and Real-Time Charts (Backend Filter)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import io from "socket.io-client";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
});

function DashboardPage() {
  const [telemetryData, setTelemetryData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [sortKey, setSortKey] = useState("timestamp");
  const [ascending, setAscending] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cansatId, setCansatId] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const username = localStorage.getItem("username") || sessionStorage.getItem("username");
    const email = localStorage.getItem("email") || sessionStorage.getItem("email");
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");

    
    if (!token) {
      alert("You must be logged in to access the dashboard!");
      navigate("/login");
      return;
    }

    setUser({ username, email, role });
    document.body.className = darkMode ? "dark-mode" : "light-mode";
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id);
    });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("telemetry", (data) => {
      if (cansatId && data.cansatId !== cansatId) {
        return; // Ignore data not matching selected cansatId
      }
      const formatted = { ...data, timestamp: new Date(data.timestamp).toISOString() };
      setTelemetryData((prev) => [...prev.slice(-49), formatted]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("telemetry");
    };
  }, [navigate, darkMode, cansatId]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        const query = {};
        if (startDate) query.start = new Date(startDate).toISOString();
        if (endDate) query.end = new Date(endDate).toISOString();
  
        const url = `http://localhost:5000/api/telemetry/filter${
          Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : ""
        }`;
  
        const response = await axios.get(url);
  
        const sorted = [...response.data].sort((a, b) => {
          const aVal = sortKey === "timestamp" ? new Date(a[sortKey]).getTime() : a[sortKey];
          const bVal = sortKey === "timestamp" ? new Date(b[sortKey]).getTime() : b[sortKey];
          return ascending ? aVal - bVal : bVal - aVal;
        });
  
        setTelemetryData(sorted);
        setPage(1);
      } catch (err) {
        console.error("❌ Error fetching filtered data:", err);
      }
    };
  
    fetchFilteredData();
  }, [startDate, endDate, sortKey, ascending]);
  
  
  const downloadCSV = () => {
    const headers = ["Temperature", "Pressure", "Altitude", "Latitude", "Longitude", "Timestamp (Local Time)"];
    const rows = telemetryData.map((item) => [
      item.temperature,
      item.pressure,
      item.altitude,
      item.latitude,
      item.longitude,
      new Date(item.timestamp).toLocaleString(), // ✅ Convert UTC to local time for CSV
    ]);
  
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "telemetry_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const pageData = telemetryData.slice((page - 1) * perPage, page * perPage);

  const chartColors = {
    temperature: "#ff4c4c",
    pressure: "#00b8d9",
    altitude: "#7a63ff",
    latitude: "#34c759",
    longitude: "#ff9500",
  };

  return (
    <div style={styles(darkMode).container}>
      <NavBar />
      <h2 style={styles(darkMode).header}>CanSat Dashboard</h2>

      {user && <p style={styles(darkMode).welcome}>👋 Welcome back, {user.username?.trim() || user.email}!</p>}

      {user?.role === "admin" && (
        <button
          onClick={() => navigate("/manage-users")}
          style={{
            ...styles(darkMode).downloadButton,
            backgroundColor: "#6a0dad",
            color: "white",
          }}
        >
          👥 Manage Users
        </button>
      )}

      <div style={styles(darkMode).controls}>
        <button onClick={() => setDarkMode(!darkMode)} style={styles(darkMode).darkToggle}>
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={downloadCSV} style={styles(darkMode).downloadButton}>📥 Download CSV</button>
        <input
          type="text"
          placeholder="Filter by CanSat ID"
          value={cansatId}
          onChange={(e) => setCansatId(e.target.value)}
          style={{ ...styles(darkMode).input, width: "200px" }}
        />
        <select onChange={(e) => setSortKey(e.target.value)} style={styles(darkMode).select}>
          <option value="timestamp">Sort by Time</option>
          <option value="temperature">Temperature</option>
          <option value="pressure">Pressure</option>
          <option value="altitude">Altitude</option>
        </select>
        <button onClick={() => setAscending(!ascending)} style={styles(darkMode).downloadButton}>
          {ascending ? "⬆ Ascending" : "⬇ Descending"}
        </button>
        <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles(darkMode).input} />
        <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles(darkMode).input} />
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          style={styles(darkMode).downloadButton}
        >
          ❌ Clear Filters
        </button>
      </div>

      <p style={{ color: isConnected ? "#4caf50" : "#ff3b30", fontWeight: "bold" }}>
        Status: {isConnected ? "Connected" : "Disconnected"}
      </p>
      {socketId && (
        <p style={{ fontWeight: "bold" }}>
          Socket ID: {socketId}
        </p>
      )}

      {telemetryData.length === 0 ? (
        <p style={{ margin: "40px 0", fontStyle: "italic" }}>⚠️ No telemetry data in the selected date range.</p>
      ) : (
        <>
          {/* First Row: Temperature Chart, Altitude Chart, Temperature Speedometer */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <div style={styles(darkMode).chartBox}>
              <h4 style={styles(darkMode).chartTitle}>Temperature Over Time</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={telemetryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
                  <XAxis dataKey="timestamp" stroke={darkMode ? "#fff" : "#000"} />
                  <YAxis stroke={darkMode ? "#fff" : "#000"} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? "#333" : "#fff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke={chartColors.temperature} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={styles(darkMode).chartBox}>
              <h4 style={styles(darkMode).chartTitle}>Altitude Over Time</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={telemetryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
                  <XAxis dataKey="timestamp" stroke={darkMode ? "#fff" : "#000"} />
                  <YAxis stroke={darkMode ? "#fff" : "#000"} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? "#333" : "#fff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="altitude" stroke={chartColors.altitude} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={styles(darkMode).mapBox}>
              {telemetryData.length ? (
                <MapContainer
                  center={[telemetryData[telemetryData.length - 1].latitude, telemetryData[telemetryData.length - 1].longitude]}
                  zoom={13}
                  style={{ height: "300px", borderRadius: "8px" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[telemetryData[telemetryData.length - 1].latitude, telemetryData[telemetryData.length - 1].longitude]}>
                    <Popup>
                      Latitude: {telemetryData[telemetryData.length - 1].latitude}<br />
                      Longitude: {telemetryData[telemetryData.length - 1].longitude}
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <p style={{ color: darkMode ? "#fff" : "#000" }}>No location data available</p>
              )}
            </div>

          </div>

          {/* Second Row: Pressure Speedometer, Longitude and Latitude Map */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
           
          <div style={styles(darkMode).speedometerBox}>
              <h4 style={styles(darkMode).chartTitle}>Temperature °C/°F</h4>
              <CustomSpeedometer
                maxValue={100}
                value={telemetryData.length ? telemetryData[telemetryData.length - 1].temperature : 0}
                needleColor="red"
                startColor="green"
                endColor="red"
                height={350}
                width={300}
              />
            </div>

            <div style={styles(darkMode).speedometerBox}>
            <h4 style={styles(darkMode).chartTitle}>Pressure K/PSI</h4>
            <CustomSpeedometer
              maxValue={2000}
              value={telemetryData.length ? telemetryData[telemetryData.length - 1].pressure : 0}
              needleColor="#6a0dad"
              startColor="#b57edc"
              endColor="#6a0dad"
              height={350}
              width={300}
            />
            </div>
            
            </div>

          {/* Live Telemetry Data Table */}
          <div style={styles(darkMode).tableContainer}>
            <h3 style={styles(darkMode).chartTitle}>Live Telemetry Data</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles(darkMode).table}>
                <thead>
                  <tr>
                    <th style={styles(darkMode).th}>Temperature</th>
                    <th style={styles(darkMode).th}>Pressure</th>
                    <th style={styles(darkMode).th}>Altitude</th>
                    <th style={styles(darkMode).th}>Latitude</th>
                    <th style={styles(darkMode).th}>Longitude</th>
                    <th style={styles(darkMode).th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((item, idx) => (
                    <tr key={idx}>
                      <td style={styles(darkMode).td}>{item.temperature}</td>
                      <td style={styles(darkMode).td}>{item.pressure}</td>
                      <td style={styles(darkMode).td}>{item.altitude}</td>
                      <td style={styles(darkMode).td}>{item.latitude}</td>
                      <td style={styles(darkMode).td}>{item.longitude}</td>
                      <td style={styles(darkMode).td}>{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>◀ Prev</button>
              <span style={{ margin: "0 10px" }}>Page {page}</span>
              <button onClick={() => setPage(p => (p * perPage < telemetryData.length ? p + 1 : p))}>Next ▶</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// CustomSpeedometer component using SVG
const CustomSpeedometer = ({ maxValue, value, needleColor, startColor, endColor, height, width }) => {
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const angleRange = 180; // semi-circle
  const valueRatio = Math.min(Math.max(value / maxValue, 0), 1);
  const needleAngle = 180 - valueRatio * angleRange;

  // Calculate needle end point
  const needleLength = radius * 0.9;
  const radian = (needleAngle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(radian);
  const needleY = centerY - needleLength * Math.sin(radian);

  // Gradient id for arc
  const gradientId = `gradient-${needleColor.replace("#", "")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>
      {/* Arc background */}
      <path
        d={`
          M ${centerX - radius} ${centerY}
          A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
        `}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={20}
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={centerX}
        y1={centerY}
        x2={needleX}
        y2={needleY}
        stroke={needleColor}
        strokeWidth={3}
      />
      {/* Center circle */}
      <circle cx={centerX} cy={centerY} r={5} fill={needleColor} />
      {/* Text value */}
      <text
        x={centerX}
        y={height - 50}
        textAnchor="middle"
        fontSize={30}
        fill={needleColor}
        fontWeight="bold"
      >
        {Math.round(value)}
      </text>
    </svg>
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
  welcome: { marginBottom: 10 },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
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
  downloadButton: {
    padding: "10px 16px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  select: {
    padding: "8px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  input: {
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  frameset: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    padding: "20px",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    },
  },
  chartBox: {
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: darkMode ? "0 0 8px rgba(255,255,255,0.05)" : "0 0 10px rgba(0,0,0,0.1)",
    height: "300px",
    display: "flex",
    flexDirection: "column",
  },
  speedometerBox: {
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: darkMode ? "0 0 8px rgba(255,255,255,0.05)" : "0 0 10px rgba(0,0,0,0.1)",
    height: "300px",
    width: "95%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  mapBox: {
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: darkMode ? "0 0 8px rgba(255,255,255,0.05)" : "0 0 10px rgba(0,0,0,0.1)",
    height: "300px",
  },
  placeholderBox: {
    backgroundColor: darkMode ? "#2a2a2a" : "#f0f0f0",
    borderRadius: "8px",
    height: "300px",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: "22px",
    marginTop: "30px",
    marginBottom: "10px",
    color: darkMode ? "#fff" : "#000",
  },
  chartTitle: {
    fontWeight: 600,
    color: darkMode ? "#fff" : "#000",
    marginBottom: 10,
  },
  tableContainer: {
    width: "90%",
    margin: "30px auto",
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
});


export default DashboardPage;
