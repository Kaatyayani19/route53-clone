# AWS Route53 Clone

A functional clone of the AWS Route53 console - hosted zones and DNS records management, with mocked authentication.

## Tech Stack
- Frontend: Next.js (TypeScript) + Tailwind CSS
- Backend: FastAPI
- Database: SQLite

## Project Structure
```
route53-clone/
├── backend/          FastAPI app (auth, hosted zones, DNS records)
│   └── app/
│       ├── main.py
│       ├── models.py       SQLAlchemy models
│       ├── schemas.py      Pydantic request/response schemas
│       ├── database.py     SQLite connection
│       ├── auth.py         Cookie-based mock session auth
│       └── routers/        API route handlers
└── frontend/         Next.js app (App Router, TypeScript, Tailwind)
```

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API runs at http://localhost:8000. Docs at http://localhost:8000/docs
Default mock login: username `admin`, password `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at http://localhost:3000

## API Overview
- `POST /api/auth/login` - login, sets session cookie
- `POST /api/auth/logout` - clears session
- `GET /api/auth/me` - current session user
- `GET /api/hosted-zones?search=` - list/search hosted zones
- `POST /api/hosted-zones` - create hosted zone (auto-seeds NS + SOA records)
- `GET/PUT/DELETE /api/hosted-zones/{id}` - manage a hosted zone
- `GET /api/hosted-zones/{id}/records?search=&type=` - list/search records
- `POST/PUT/DELETE /api/hosted-zones/{id}/records/{record_id}` - manage records

## Database Schema
- `users` - mock credentials
- `sessions` - active session tokens (cookie-based)
- `hosted_zones` - id (AWS-style, e.g. Z1PA6795UKMFR9), domain_name, type, comment, created_at
- `dns_records` - id, hosted_zone_id (FK), name, type, value, ttl, created_at
