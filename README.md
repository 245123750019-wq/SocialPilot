# SocialPilot — Intelligent Social Media Scheduling and Multi-Platform Campaign Management Platform

## 1. Project Overview

SocialPilot is a social media management platform designed to help users manage social media accounts, create and schedule posts, coordinate campaigns, and monitor social media performance from a centralized dashboard.

The platform integrates a web-based frontend with a Python backend and a relational database. It supports authentication, role-based access control, social account management, and platform-specific OAuth workflows.

## 2. Objectives

- Provide a centralized interface for managing social media accounts.
- Simplify social media post creation and publishing workflows.
- Support scheduling and campaign management.
- Provide dashboards and analytics for monitoring engagement and audience growth.
- Secure user access through authentication and role-based authorization.
- Integrate with supported social media platforms through their official APIs.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Shared database | Supabase PostgreSQL |
| ORM | SQLAlchemy |
| Database migrations | Alembic |
| Authentication | JWT / Bearer tokens |
| Social authentication | OAuth 2.0 |
| API documentation | FastAPI Swagger UI |
| Version control | Git and GitHub |

## 4. Key Features

### 4.1 Authentication and Authorization
- User registration and login.
- JWT-based authentication.
- Protected backend endpoints.
- Role-based access control for authorized actions.
- Restricted administrative registration.

### 4.2 Social Account Management
- Centralized social account dashboard.
- Connect and disconnect social media accounts.
- OAuth-based account authorization.
- Storage of connected account information in the database.
- Filtering of disconnected accounts from the connected-account list.

### 4.3 Multi-Platform Integration
The application includes integration workflows for:

- Instagram
- Facebook Pages
- X
- YouTube

Each platform uses its own authorization and API requirements. Successful authorization does not automatically guarantee that every publishing operation is available; required permissions and platform restrictions must also be satisfied.

### 4.4 Post and Campaign Management
- Create social media posts through the application.
- Manage post content and associated media.
- Support publishing and scheduling workflows.
- Organize social media activities around campaigns.

### 4.5 Analytics Dashboard
The project includes dashboard and analytics workflows intended to help users review campaign performance, engagement, audience growth, and publishing activity.

The available metrics depend on the connected platform, API permissions, and the data returned by its API.

## 5. System Architecture

SocialPilot follows a frontend–backend architecture.

1. **Frontend:** The Next.js application provides the user interface for authentication, social account management, post creation, and dashboards.
2. **Backend API:** FastAPI processes requests, validates authentication, applies authorization rules, and coordinates application workflows.
3. **Database:** PostgreSQL stores structured application data, including users, roles, social accounts, and other configured application records.
4. **ORM and migrations:** SQLAlchemy manages database interactions, while Alembic manages schema migrations.
5. **External APIs:** OAuth and platform APIs support social account authorization and supported publishing operations.

### Request Flow

```text
User
  |
  v
Next.js Frontend
  |
  v
FastAPI Backend
  |
  +---- JWT Authentication / Authorization
  |
  +---- SQLAlchemy ORM
  |          |
  |          v
  |     PostgreSQL / Supabase
  |
  +---- Social Media APIs
             |
             +---- Instagram
             +---- Facebook
             +---- X
             +---- YouTube
```

## 6. Project Structure

The main project directories are organized as follows:

```text
SocialPilot/
├── Backend/
│   ├── app/
│   │   ├── core/          # Security and core configuration
│   │   ├── database/      # Database connection and Base
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routes/        # API route handlers
│   │   ├── schemas/       # Request and response schemas
│   │   └── services/      # OAuth and business logic
│   ├── alembic/           # Database migrations
│   ├── .env               # Local configuration; not committed
│   └── requirements.txt   # Backend dependencies, if maintained
├── frontend/
│   ├── app/
│   │   ├── components/    # Shared UI components
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── profile/       # Profile page
│   │   ├── register/      # Registration page
│   │   ├── social-accounts/ # Social account management
│   │   └── create-post/   # Post creation page
│   ├── package.json
│   └── .env.local         # Frontend configuration; not committed
├── docs/
│   └── database-schema.md
└── README.md
```

The structure above describes the main areas of the application; individual files and directories may vary as development continues.

## 7. Prerequisites

Install the following before running the project:

- Python 3.12 or a compatible version.
- Node.js and npm.
- PostgreSQL, or access to the team's Supabase PostgreSQL database.
- Git.
- A Meta developer app and any other provider developer credentials required for the integrations you want to test.

## 8. Setup and Installation

### 8.1 Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd SocialPilot
```

Use the repository URL provided by your team.

### 8.2 Configure the Backend

Open a terminal in the project directory:

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

If the project does not currently maintain a `requirements.txt`, install the dependencies listed in the project's backend setup documentation and create a requirements file before sharing the project.

### 8.3 Configure Environment Variables

Create or update `Backend/.env` with the required local configuration. Use the variable names expected by the application.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secure_random_secret
FRONTEND_URL=http://localhost:3000

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token

META_INSTAGRAM_APP_ID=your_instagram_app_id
META_INSTAGRAM_APP_SECRET=your_instagram_app_secret
META_INSTAGRAM_REDIRECT_URI=https://your-public-https-domain/social-accounts/instagram/callback
META_FACEBOOK_REDIRECT_URI=https://your-public-https-domain/social-accounts/facebook/callback
```

The example values are placeholders. Do not commit real secrets, passwords, tokens, or database connection strings.

Add other provider-specific environment variables required by the existing X and YouTube integrations. The actual names must match the backend implementation.

For local Instagram OAuth testing, a temporary HTTPS tunnel can expose the backend callback. Configure the same callback URL in the Meta developer dashboard and the backend environment.

### 8.4 Configure the Database

Ensure that PostgreSQL or the shared Supabase database is accessible and that `DATABASE_URL` matches the application's database configuration.

Apply migrations from the `Backend` directory:

```bash
alembic upgrade head
```

This applies the available Alembic migrations to the configured database.

### 8.5 Start the Backend

From the `Backend` directory, with the virtual environment activated:

```bash
uvicorn app.main:app --reload
```

The backend API should be available at:

```text
http://127.0.0.1:8000
```

Open the interactive API documentation at:

```text
http://127.0.0.1:8000/docs
```

### 8.6 Configure the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Use the actual backend base URL if your configuration differs.

### 8.7 Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

Keep the backend running while using the frontend.

## 9. Database and Migrations

SQLAlchemy models define the application's relational data structures. Alembic tracks schema changes and applies migrations.

To generate a migration after a model change:

```bash
alembic revision --autogenerate -m "describe schema change"
```

Review the generated migration before applying it:

```bash
alembic upgrade head
```

Do not run schema migrations against a shared database without coordinating with the team.

## 10. Authentication and Security

- Authenticate users before accessing protected operations.
- Send JWT access tokens using the `Authorization: Bearer <token>` header.
- Enforce role-based permissions on the backend, not only in the frontend.
- Keep environment files and credentials out of Git.
- Use a strong, randomly generated `SECRET_KEY` outside local experimentation.
- Register exact OAuth callback URLs with the relevant provider.
- Request only the platform permissions needed by the application.
- Never expose provider secrets or access tokens in client-side code, screenshots, logs, or public repositories.

## 11. Testing and Verification

After starting the application, verify the following workflows:

1. Open the frontend and confirm that the application loads.
2. Register or log in with a valid user account.
3. Confirm that protected API endpoints require authentication.
4. Verify that role-based restrictions are enforced.
5. Open the Social Accounts page.
6. Test OAuth authorization for a supported platform using the configured developer credentials.
7. Confirm that a successful connection remains visible after refreshing the page.
8. Test post creation and publishing only when the relevant provider permissions and media requirements are satisfied.
9. Check the backend logs and API responses if an operation fails.

## 12. Troubleshooting

| Problem | What to check |
|---|---|
| Backend fails to start | Virtual environment, installed dependencies, imports, and environment variables |
| Database connection error | Database URL, credentials, network access, and database availability |
| Frontend cannot reach the backend | `NEXT_PUBLIC_API_URL` and whether the backend is running |
| Authentication fails | Token validity, login response, and Authorization header |
| OAuth redirect error | Exact callback URL, app ID, app secret, enabled login product, and requested permissions |
| Instagram token exchange fails | Correct Instagram-specific credentials, supported token-exchange parameters, and provider error details |
| Connected account is missing | Backend response, stored token state, database records, and frontend filtering |

## 13. Version Control

Check the working tree before committing:

```bash
git status
```

Review the changes:

```bash
git diff
git diff --cached
```

Stage the intended files, commit them, and push to the appropriate project branch. Never commit `.env`, `.env.local`, virtual environments, dependency folders, access tokens, or other credentials.

## 14. Future Enhancements

Potential improvements include:

- More robust post scheduling and retry handling.
- Additional analytics and campaign reporting.
- Better handling of expired or revoked social tokens.
- Improved error reporting for provider API failures.
- Automated tests for authentication, integrations, and publishing workflows.
- Additional supported social media platforms.

## 15. Project Status

SocialPilot is being developed incrementally as part of a collaborative project. Implemented features, provider permissions, and platform-specific publishing capabilities should be verified against the current source code and configured developer accounts.

## 16. License

Add the applicable license and attribution information according to the project's repository and team requirements.
