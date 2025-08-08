# VMP Frontend

Vulnerability Management Platform Frontend - A React-based web application for managing security vulnerabilities across multiple applications and teams.

## Features

- **Dashboard**: Overview of vulnerabilities, reports, and key metrics
- **Vulnerability Management**: View, filter, and update vulnerability status
- **Report Management**: Import and view VAPT reports from Google Drive
- **Application Management**: Manage applications and their security assessments
- **Team Management**: Organize teams and assign responsibilities
- **Role-based Access Control**: Different permissions for Admin, Security, Dev, and Product Owner roles
- **Real-time Updates**: Live data updates with React Query
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Server state management
- **JWT Auth** - Authentication
- **Recharts** - Data visualization
- **date-fns** - Date utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables file:
```bash
cp env.example .env.local
```

4. Update the `.env.local` file with your API configuration:
```env
VITE_API_URL=http://localhost:3001/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Demo Mode

Demo flows and MSW have been removed. The app requires a running backend.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── app/                 # App configuration and providers
├── components/          # Shared UI components
│   ├── guards/         # Route guards and authentication
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── dashboard/     # Dashboard page
│   ├── vulns/         # Vulnerability management
│   ├── reports/       # Report management
│   ├── apps/          # Application management
│   ├── teams/         # Team management
│   └── users/         # User management
├── api/               # API client and endpoints
├── hooks/             # Custom React hooks
├── store/             # Global state management
├── types/             # Type definitions and models
├── mocks/             # MSW handlers and mock data
└── styles/            # Global styles
```

## Key Components

### Authentication
- JWT-based authentication with access and refresh tokens
- Role-based access control
- Protected routes

### Data Management
- React Query for server state
- Optimistic updates
- Error handling and retries

### UI Components
- Material-UI components
- Custom severity and status chips
- Responsive tables with pagination
- Filter components

### Mock Data
Mock data and MSW have been removed.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Integration

The frontend is designed to work with the VMP backend API. Key endpoints:

- `/api/vulns` - Vulnerability management
- `/api/reports` - Report management
- `/api/apps` - Application management
- `/api/teams` - Team management
- `/api/users` - User management

## Role-based Access

- **Admin**: Full access to all features
- **Security**: Access to vulnerabilities, reports, apps, and teams
- **Dev**: Access to assigned vulnerabilities and reports
- **Product Owner**: Access to team-specific data

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow the established naming conventions
4. Add tests for new features
5. Update documentation as needed

## License

This project is part of the VMP (Vulnerability Management Platform) and is proprietary software.
