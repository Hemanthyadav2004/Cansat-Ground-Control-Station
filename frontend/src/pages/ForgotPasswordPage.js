import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/request-reset", { email });
      alert(res.data.message);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong!");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong!");
    }
  };

  return (
    <div style={styles.container1}>
    <div style={styles.container}>
      {step === 1 ? (
        <>
          <h2>Forgot Your Password?</h2>
          <form onSubmit={handleEmailSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.button}>Send OTP</button>
            <p><a href="/login" style={{ color: "yellow" }}>Back to Login</a></p>
          </form>
        </>
      ) : (
        <>
          <h2>Enter OTP & New Password</h2>
          <form onSubmit={handleResetPassword} style={styles.form}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={styles.input}
            />
            <div style={{ position: "relative", width: "300px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ ...styles.input, width: "93%" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "5px",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "18px",
                  userSelect: "none",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            <button type="submit" style={styles.button}>Reset Password</button>
            <p><a href="/login" style={{ color: "yellow" }}>Back to Login</a></p>
          </form>
        </>
      )}
    </div></div>
  );
}

const styles = {
  container1: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#f4f4f4",
    backgroundImage: "url('/images/Signup.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Arial, sans-serif",
  },
  container: { textAlign: "center", padding: "40px" , margin:"90px auto"},
  form: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  input: { padding: "10px", width: "280px" },
  button: { padding: "10px 20px", backgroundColor: "blue", color: "white", border: "none" },
};

export default ForgotPasswordPage;
