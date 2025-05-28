require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

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

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "operator", "viewer"), defaultValue: "viewer" },
  totpSecret: { type: DataTypes.STRING, allowNull: true },
});

async function promoteUserToAdmin(email) {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`User with email ${email} not found.`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();
    console.log(`User ${email} promoted to admin successfully.`);
    process.exit(0);
  } catch (error) {
    console.error("Error promoting user:", error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log("Usage: node scripts/promote_user_to_admin.js hemanth872124965@gmaile.com");
  process.exit(1);
}

promoteUserToAdmin(email);
