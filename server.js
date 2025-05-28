require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const nodemailer = require("nodemailer");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { Sequelize, DataTypes } = require("sequelize");
const rateLimit = require("express-rate-limit");
const pendingOTP = new Map(); // In-memory OTP storage

const adminRoutes = require('./routes/adminRoutes');
const authenticateToken = require('./middleware/authenticateToken');

const requiredEnv = ["JWT_SECRET", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_HOST", "DB_PORT", "EMAIL_USER", "EMAIL_PASS"];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: Missing ${envVar} in .env file`);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." },
  })
);

app.use('/api/admin', authenticateToken, adminRoutes);

// Debug endpoint to get current user info from token
app.get('/api/debug/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Debug me error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Debug endpoint to list all users and roles
app.get('/api/debug/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role']
    });
    res.json(users);
  } catch (err) {
    console.error('Debug users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT,
    logging: false,
  }
);

sequelize.authenticate().then(() => console.log("✅ PostgreSQL connected")).catch((err) => {
  console.error("❌ Connection failed:", err.message);
  process.exit(1);
});

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "operator", "viewer"), defaultValue: "viewer" },
  totpSecret: { type: DataTypes.STRING, allowNull: true },
});

const Telemetry = sequelize.define("Telemetry", {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  temperature: { type: DataTypes.FLOAT, allowNull: false },
  pressure: { type: DataTypes.FLOAT, allowNull: false },
  altitude: { type: DataTypes.FLOAT, allowNull: false },
  latitude: { type: DataTypes.FLOAT, allowNull: false },
  longitude: { type: DataTypes.FLOAT, allowNull: false },
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
}, { timestamps: false });

//sequelize.sync({ alter: true }).then(() => console.log("✅ DB Synced!")).catch((err) => console.error("❌ Sync error:", err));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword, role });

    res.status(201).json({ message: "Signup successful", userId: newUser.id });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid email" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: "Invalid password" });

    if (!user.totpSecret) {
      const secret = speakeasy.generateSecret({ name: `CanSat-GCS (${user.username})` });
      user.totpSecret = secret.base32;
      await user.save();

      const qrCodeDataUrl = await new Promise((resolve, reject) => {
        QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
          if (err) reject(err);
          else resolve(dataUrl);
        });
      });

      res.json({
        message: "TOTP setup required",
        qrCode: qrCodeDataUrl,
        manualCode: secret.base32,
      });
    } else {
      res.json({ message: "TOTP verification required", requiresTOTP: true, email: user.email });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/auth/verify-totp", async (req, res) => {
  const { email, token } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.totpSecret) return res.status(400).json({ error: "TOTP not setup" });

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isValid) return res.status(400).json({ error: "Invalid OTP" });

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful (TOTP verified)",
      token: jwtToken,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("❌ TOTP Verify Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Forgot Password - Send OTP
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    pendingOTP.set(email, otp); // Save OTP in memory

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "CanSat GCS - OTP for Password Reset",
      html: `<h3>Your OTP is: <b>${otp}</b></h3><p>This OTP is valid for 5 minutes.</p>`,
    });

    // Expire OTP after 5 minutes
    setTimeout(() => pendingOTP.delete(email), 5 * 60 * 1000);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ✅ Reset password using OTP
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const validOTP = pendingOTP.get(email);
    if (!validOTP || validOTP !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    pendingOTP.delete(email);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Reset error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Backend: telemetry filtering endpoint
app.get("/api/telemetry/filter", async (req, res) => {
  const { start, end } = req.query;

  try {
    const where = {};

    if (start && end) {
      where.timestamp = {
        [Sequelize.Op.between]: [new Date(start), new Date(end)],
      };
    } else if (start) {
      where.timestamp = {
        [Sequelize.Op.gte]: new Date(start),
      };
    } else if (end) {
      where.timestamp = {
        [Sequelize.Op.lte]: new Date(end),
      };
    }

    const data = await Telemetry.findAll({
      where,
      order: [["timestamp", "DESC"]],
      limit: 500,
    });

    res.json(data);
  } catch (err) {
    console.error("❌ Telemetry filter error:", err);
    res.status(500).json({ error: "Failed to fetch telemetry data" });
  }
});




app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

let connectedClients = 0;
io.on("connection", (socket) => {
  connectedClients++;
  console.log("🟢 Client connected", socket.id);

  socket.on("disconnect", () => {
    connectedClients--;
    console.log("🔴 Client disconnected", socket.id);
  });
});

setInterval(async () => {
  const telemetry = {
    temperature: parseFloat((20 + Math.random() * 5).toFixed(2)),
    pressure: parseFloat((1000 + Math.random() * 10).toFixed(2)),
    altitude: parseFloat((200 + Math.random() * 50).toFixed(2)),
    latitude: parseFloat((12.9716 + Math.random() * 0.001).toFixed(6)),
    longitude: parseFloat((77.5946 + Math.random() * 0.001).toFixed(6)),
    timestamp: new Date().toISOString(), // replaces new Date()
  };

  try {
    await Telemetry.create(telemetry);
    if (connectedClients > 0) {
      io.emit("telemetry", telemetry);
      console.log("📡 Sent:", telemetry);
    }
  } catch (err) {
    console.error("❌ Telemetry error:", err);
  }
}, 5000);

app.get("/", (req, res) => {
  res.send("🚀 CanSat GCS Backend is running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
