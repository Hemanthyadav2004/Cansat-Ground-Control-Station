import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      console.log("Raw Response:", text);
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.message || "Signup failed");

      localStorage.setItem("token", data.token);
      alert("Signup Successful! Redirecting...");
      navigate("/login");
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container1}>
    <div style={styles.container}>
      <h2>Signup</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        {/* Password Input with Eye Toggle */}
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ ...styles.input, paddingRight: "95px" }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "18px",
              userSelect: "none",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <select name="role" value={formData.role} onChange={handleChange} style={styles.input}>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          style={loading ? {...styles.button, ...styles.buttonActive} : styles.button}
          onMouseDown={(e) => e.currentTarget.style.boxShadow = "0 0 15px 5px rgba(0, 123, 255, 1)"}
          onMouseUp={(e) => e.currentTarget.style.boxShadow = "0 0 8px 2px rgba(0, 123, 255, 0.7)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 8px 2px rgba(0, 123, 255, 0.7)"}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p>
          Already have an Account?{" "}
          <a href="/login" style={{ color: "yellow" }}>
            Log in
          </a>
        </p>
      </form>
    </div></div>
  );
};

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
  container: {
    width: "300px",
    margin: "120px auto",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "5px",
    border: "1px solid #ccc",
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
  error: {
    color: "red",
    fontWeight: "bold",
  },
};

export default SignupPage;
