# Authentication Setup Instructions

## Environment Variables

Create a `.env` file in the Server directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stocks_db

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret (change this to a secure random string in production)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Client URL for CORS
CLIENT_URL=http://localhost:5173

# Server Port
PORT=3001

# Environment
NODE_ENV=development
```

## Database Setup

1. Make sure PostgreSQL is running
2. Create a database named `stocks_db` (or update the DATABASE_URL accordingly)
3. The server will automatically create the users table with the proper schema

## Running the Application

1. Install dependencies: `npm install`
2. Start the server: `npm run dev` or `npm start`
3. The server will run on port 3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (requires authentication)
- `PUT /api/auth/profile` - Update user profile (requires authentication)
- `GET /api/auth/verify` - Verify JWT token

### Users (existing)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Frontend Features

- User registration with email, password, and optional profile fields
- User login with email and password
- Protected routes that require authentication
- Session management with JWT tokens
- User profile display in navbar
- Logout functionality
