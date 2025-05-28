# CanSat Ground Control Station (GCS)

## Overview

This project is a full-stack web application for the CanSat Ground Control Station (GCS). It provides real-time telemetry data visualization, user management, and secure authentication with two-factor authentication (TOTP). The backend is built with Node.js, Express, Sequelize ORM, and PostgreSQL. The frontend is a React application with interactive charts, maps, and user interfaces.

---

## Features

### Backend

- **User Authentication & Authorization**
  - Signup and login with email and password.
  - Two-factor authentication (TOTP) setup and verification.
  - JWT-based authentication with token verification middleware.
  - Role-based access control (admin, operator, viewer).
  - Password reset via OTP sent to email.
- **User Management**
  - Admin routes to list, approve, disable, update roles, and delete users.
- **Telemetry Data**
  - Real-time telemetry data generation and broadcasting via Socket.io.
  - Telemetry data storage in PostgreSQL.
  - API endpoint to filter telemetry data by date range.
- **Security & Performance**
  - Rate limiting on API endpoints.
  - CORS headers configured for frontend-backend communication.
  - Error handling middleware for consistent API responses.

### Frontend

- **React SPA with Routing**
  - Pages: About, Signup, Login, Dashboard, Forgot Password, Reset Password, Manage Users.
  - Protected routes requiring authentication.
- **Dashboard**
  - Real-time telemetry data visualization with charts (temperature, altitude, pressure).
  - Interactive map showing telemetry location.
  - CSV export of telemetry data.
  - Dark mode toggle.
  - Pagination, sorting, and filtering of telemetry data.
- **User Management**
  - Admin-only Manage Users page to approve, disable, update roles, and delete users.
- **Authentication**
  - Login and signup forms.
  - TOTP setup and verification during login.
  - Password reset workflow.

---

## Project Structure

```
.
├── backend
│   ├── server.js                 # Main Express server and Socket.io setup
│   ├── config/
│   │   ├── config.js             # Database configuration
│   │   └── database.js           # Sequelize instance setup
│   ├── middleware/               # Express middleware (auth, CORS, error handling, roles)
│   ├── models/                   # Sequelize models (User, Telemetry)
│   ├── migrations/               # Sequelize migrations for DB schema
│   ├── seeders/                  # Seed data for initial users
│   ├── routes/                   # API route handlers (admin, auth, telemetry, user)
│   └── scripts/                  # Utility scripts (generate admin token, promote user)
├── frontend/
│   ├── public/                   # Static assets and HTML template
│   ├── src/
│   │   ├── components/           # Reusable React components (NavBar, ProtectedRoute)
│   │   ├── pages/                # React pages (Dashboard, Login, Signup, ManageUsers, etc.)
│   │   ├── services/             # API service calls (authService)
│   │   ├── App.js                # React Router setup and main app component
│   │   └── index.js              # React app entry point
│   ├── package.json              # Frontend dependencies and scripts
│   └── README.md                 # Frontend-specific documentation
├── package.json                 # Backend dependencies and scripts
└── README.md                    # This file
```

---

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Backend Setup

1. Clone the repository and navigate to the project root.

2. Create a `.env` file in the root directory with the following environment variables:

```
JWT_SECRET=your_jwt_secret_key
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=cansatdb
DB_HOST=localhost
DB_PORT=5432
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_or_app_password
CLIENT_URL=http://localhost:3000
PORT=5000
```

3. Install backend dependencies:

```bash
npm install
```

4. Run database migrations and seeders:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

5. Start the backend server:

```bash
npm start
```

The backend server will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the `frontend` directory:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start the React development server:

```bash
npm start
```

The frontend will run on `http://localhost:3000`.

---

## Usage

- Access the frontend at `http://localhost:3000`.
- Signup or login with existing credentials.
- Admin users can manage users via the Manage Users page.
- View real-time telemetry data on the Dashboard.
- Use the password reset feature if needed.

---

## Scripts

- `node scripts/generate_admin_token.js <admin_email>`: Generate a JWT token for an admin user.
- `node scripts/promote_user_to_admin.js <user_email>`: Promote an existing user to admin role.

---

## Technologies Used

- Backend: Node.js, Express, Sequelize, PostgreSQL, Socket.io, JWT, bcrypt, nodemailer, speakeasy (TOTP)
- Frontend: React, React Router, Axios, Recharts, React Leaflet, Leaflet, CSS

---

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or support, please contact the project maintainer.
