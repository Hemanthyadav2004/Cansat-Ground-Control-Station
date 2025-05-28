require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.DB_PORT,
    logging: false,
  }
);

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'operator', 'viewer'), defaultValue: 'viewer' },
  totpSecret: { type: DataTypes.STRING, allowNull: true },
  isApproved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isDisabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

async function generateAdminToken(email) {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    if (user.role !== 'admin') {
      console.error('User is not an admin');
      process.exit(1);
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Admin JWT token:', token);
    process.exit(0);
  } catch (err) {
    console.error('Error generating token:', err);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node generate_admin_token.js <admin_email>');
  process.exit(1);
}

generateAdminToken(email);
