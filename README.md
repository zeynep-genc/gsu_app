# UniConnect — Full-Stack Architecture

UniConnect is a full-stack student club event management platform built with **React, Django REST Framework, and PostgreSQL**. The application follows a layered architecture that separates the frontend, backend, and database.

## Project Structure

```text
gsu_app/
├── backend/              # Django REST API and PostgreSQL configuration
├── frontend/             # React frontend built with Vite
└── README.md
```

### Frontend (React)

* UI components are organized into modular components under `frontend/src`.
* `src/api.js` communicates with backend REST endpoints using JSON.
* Components such as `StudentDashboard` and `ClubDashboard` provide separate interfaces for students and clubs.

### Backend (Django REST Framework)

* `backend/uniconnect_backend` contains the Django project configuration.
* The `events` application includes models and REST endpoints for clubs, students, events, and event participation.
* The `events/management/commands/seed_demo.py` command populates the PostgreSQL database with sample student, club, and event data.

## Getting Started

### Prerequisites

* Python 3
* Node.js and npm
* PostgreSQL

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Configure your PostgreSQL connection settings in .env

python manage.py migrate
python manage.py seed_demo  # Optional: load sample data
python manage.py runserver
```

The backend expects a PostgreSQL database named `uniconnect` running locally on port `5432` by default. Update the `POSTGRES_*` variables in `.env` to match your configuration.

### Frontend Setup

```bash
cd frontend
npm install

cp .env.example .env
# Optionally configure VITE_API_URL

npm run dev
```

The frontend runs at `http://localhost:5173` by default and sends API requests to `http://localhost:8000/api`. To use a different backend URL, set `VITE_API_URL` in the frontend `.env` file.

## Key Files

* `frontend/src/App.jsx`: Session management and API integration.
* `frontend/src/components/*.jsx`: Student and club dashboards, along with reusable UI components.
* `backend/events/models.py`: Data models for clubs, students, events, and participation.
* `backend/events/views.py`: REST endpoints for authentication, event CRUD operations, participation, and favorites.
* `backend/events/serializers.py`: Serializers for converting application data to and from JSON.

Favorite events are persisted in PostgreSQL through dedicated backend endpoints and can be managed through the frontend.
