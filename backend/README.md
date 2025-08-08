# VMP Backend API

A secure, scalable backend API for the Vulnerability Management Platform built with Fastify, MongoDB, and JWT authentication.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **Database**: MongoDB with Mongoose-like models
- **API Endpoints**: Complete CRUD operations for all entities
- **Error Handling**: Comprehensive error handling and logging
- **Data Seeding**: Automated database seeding with sample data

## Tech Stack

- **Framework**: Fastify 4.x
- **Database**: MongoDB 6.x
- **Authentication**: JSON Web Tokens (access + refresh tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Language**: JavaScript (ES Modules)

## Prerequisites

- Node.js 18.x or higher
- MongoDB Atlas account or local MongoDB instance
  

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://admin:Uu6ORZ0WwksY0MkO@cluster0.zt3bn9u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   DB_NAME=vmp
   
   # JWT Configuration
   JWT_ACCESS_SECRET=change-me-access
   JWT_REFRESH_SECRET=change-me-refresh
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d
   SEED_USER_PASSWORD=password123
   
   # Rate Limiting
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW_MS=900000
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Seed the Database**
   ```bash
   npm run seed
   ```

4. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
Auth endpoints:
- `POST /api/auth/login` → returns `{ user, accessToken, refreshToken }`
- `POST /api/auth/refresh` → returns `{ accessToken, refreshToken }`
- `POST /api/auth/logout` → revokes the provided refresh token

All protected endpoints require an access token in the Authorization header:
```
Authorization: Bearer <access-token>
```

### Health Check
- `GET /health` - Server health status
- `GET /api/status` - API status

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/me` - Get current user
- `GET /api/users/:id` - Get user by ID (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PATCH /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Teams
- `GET /api/teams` - Get all teams (Admin, Security only)
- `GET /api/teams/:id` - Get team by ID (Admin, Security only)
- `POST /api/teams` - Create team (Admin, Security only)
- `PATCH /api/teams/:id` - Update team (Admin, Security only)
- `DELETE /api/teams/:id` - Delete team (Admin, Security only)
- `GET /api/teams/platform/:platform` - Get teams by platform (Admin, Security only)

### Applications
- `GET /api/apps` - Get all applications (Admin, Security only)
- `GET /api/apps/:id` - Get application by ID (Admin, Security only)
- `POST /api/apps` - Create application (Admin, Security only)
- `PATCH /api/apps/:id` - Update application (Admin, Security only)
- `DELETE /api/apps/:id` - Delete application (Admin, Security only)
- `GET /api/apps/team/:teamId` - Get applications by team (Admin, Security only)
- `GET /api/apps/platform/:platform` - Get applications by platform (Admin, Security only)

### Reports
- `GET /api/reports` - Get all reports with pagination
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports` - Create report (Admin, Security only)
- `PATCH /api/reports/:id` - Update report (Admin, Security only)
- `DELETE /api/reports/:id` - Delete report (Admin, Security only)
- `POST /api/reports/import` - Import report from Google Drive (Admin, Security only)
- `GET /api/reports/application/:applicationId` - Get reports by application
- `PATCH /api/reports/:id/parse` - Mark report as parsed (Admin, Security only)

### Vulnerabilities
- `GET /api/vulns` - Get all vulnerabilities with pagination and filters
- `GET /api/vulns/:id` - Get vulnerability by ID
- `POST /api/vulns` - Create vulnerability (Admin, Security only)
- `PATCH /api/vulns/:id` - Update vulnerability (Admin, Security, or assigned user)
- `DELETE /api/vulns/:id` - Delete vulnerability (Admin, Security only)
- `POST /api/vulns/bulk` - Bulk create vulnerabilities (Admin, Security only)
- `GET /api/vulns/application/:applicationId` - Get vulnerabilities by application
- `GET /api/vulns/report/:reportId` - Get vulnerabilities by report
- `GET /api/vulns/status/:status` - Get vulnerabilities by status
- `GET /api/vulns/severity/:severity` - Get vulnerabilities by severity
- `GET /api/vulns/assigned/:userId` - Get vulnerabilities by assignee
- `GET /api/vulns/overdue` - Get overdue vulnerabilities
- `GET /api/vulns/due-this-week` - Get vulnerabilities due this week
- `GET /api/vulns/upcoming-retests` - Get upcoming retests
- `GET /api/vulns/stats` - Get vulnerability statistics

## Data Models

### User
```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'Admin' | 'Security' | 'Dev' | 'ProductOwner',
  teamIds: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Team
```javascript
{
  id: string,
  name: string,
  platform: 'Web' | 'iOS' | 'Android',
  applicationIds: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Application
```javascript
{
  id: string,
  name: string,
  platform: 'Web' | 'iOS' | 'Android',
  teamId: string,
  description: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Report
```javascript
{
  id: string,
  driveFileId: string,
  fileName: string,
  vendorName: string,
  applicationId: string,
  dateUploaded: Date,
  reportDate: Date,
  parsed: boolean,
  vulnerabilityIds: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Vulnerability
```javascript
{
  id: string,
  applicationId: string,
  reportId: string,
  title: string,
  description: string,
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  cvssScore: number,
  cvssVector: string,
  cwe: string[],
  cve: string[],
  status: 'New' | 'Open' | 'In Progress' | 'Fixed' | 'Reopened' | 'Closed',
  discoveredDate: Date,
  dueDate: Date,
  resolvedDate: Date,
  assignedToUserId: string,
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints and data
- **Security**: Access to teams, applications, reports, and vulnerabilities
- **Dev**: Access to assigned vulnerabilities and related data
- **ProductOwner**: Access to team-specific data and reports

## Security Features

- **Authentication**: JWT access and refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Configurable rate limiting per IP
- **CORS**: Cross-origin resource sharing protection
- **Helmet**: Security headers
- **Error Handling**: Secure error responses

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Seeding
```bash
npm run seed
```

### Environment Variables
- Copy `env.example` to `.env`
- Update with your MongoDB and JWT credentials

## Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set up Firebase Admin SDK credentials
   - Update CORS origin to production domain

2. **Security Considerations**
   - Change default JWT secret
   - Use strong MongoDB passwords
   - Enable MongoDB authentication
   - Configure proper CORS origins
   - Set up proper rate limiting

3. **Monitoring**
   - Enable logging
   - Set up health checks
   - Monitor API performance
   - Track error rates

## API Documentation

The API follows RESTful conventions with consistent response formats:

### Success Response
```javascript
{
  "id": "string",
  "name": "string",
  // ... other fields
}
```

### Error Response
```javascript
{
  "error": "Error Type",
  "message": "Human readable error message"
}
```

### Paginated Response
```javascript
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## License

ISC License 