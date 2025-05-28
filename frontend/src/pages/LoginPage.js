import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [totp, setTotp] = useState("");
  const [qrData, setQrData] = useState(null);
  const [step, setStep] = useState(1); // 1 = login, 2 = QR, 3 = TOTP
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.qrCode) {
        setQrData({ qrCode: data.qrCode, manualCode: data.manualCode });
        setStep(2);
      } else if (data.requiresTOTP) {
        setStep(3);
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, token: totp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user?.role || "viewer");
        localStorage.setItem("email", data.user?.email || "");
        localStorage.setItem("username", data.user?.username || "");
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", data.user?.role || "viewer");
        sessionStorage.setItem("email", data.user?.email || "");
        sessionStorage.setItem("username", data.user?.username || "");
      }
      

      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "TOTP verification failed");
    }
  };

  return (
    <div style={styles.container1}>
    <div style={styles.container}>
      <h2 style={{ color: "whitesmoke"}}>Login</h2>
      {error && <p style={styles.error}>{error}</p>}

      {step === 1 && (
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ ...styles.input, paddingRight: "10px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <label style={{ fontSize: "14px", marginBottom: "5px",color:'Window' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              style={{ marginRight: "5px" }}
            />
            Remember this device
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <b><p style={{ color: "white" }}>
            New User?{" "}
            <a href="/signup" style={{ color: "white" }}>
              Register Here
            </a>
            <br />
            <a href="/forgot-password" style={{ color: "yellow" }}>
              Forgot Password?
            </a>
          </p></b>
        </form>
      )}

      {step === 2 && qrData && (
        <div style={styles.form}>
          <p style={{ color:"whitesmoke" }}>📱 Scan this QR code using Google Authenticator:</p>
          <img src={qrData.qrCode} alt="QR Code" style={{ width: "200px", margin: "10px 0" }} />
          <p style={{ color:"whitesmoke" }}>
            🔐 Or enter this code manually: <b style={{ color:"whitesmoke" }}>{qrData.manualCode}</b>
          </p>
          <button onClick={() => setStep(3)} style={styles.button}>
            I’ve set it up
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={styles.form}>
          <p style={{color:'yellow'}}>Enter the 6-digit code from Google Authenticator</p>
          <input
            type="text"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="Enter TOTP"
            style={styles.input}
          />
          <button onClick={handleVerifyTotp} style={styles.button}>
            Verify Code
          </button>
        </div>
      )}
    </div></div>
  );
};

const styles = {
  container1: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#f4f4f4",
    backgroundImage: "url('/images/Login.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Arial, sans-serif",
  },
  container: { width: "300px", margin: "150px auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    width: "100%",
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "darkblue",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    boxShadow: "0 0 8px 2px rgba(0, 123, 255, 0.7)",
    transition: "box-shadow 0.3s ease-in-out",
  },
  buttonActive: {
    boxShadow: "0 0 15px 5px rgba(0, 123, 255, 1)",
  },
  error: { color: "red", fontWeight: "bold" },
};

export default LoginPage;
