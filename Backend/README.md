# AttachHub - Backend

This is the Django backend for the AttachHub application. It provides the REST API for the Student Attachment Flow (Placements, Opportunities, Applications, Analytics, Documents, and Supervision).

## Prerequisites

- Python 3.10+
- pip (Python package installer)

## Setup Instructions

### 1. Create a Virtual Environment (Optional but Recommended)

Navigate into the `Backend` directory and create a virtual environment to isolate the project dependencies.

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

Once the virtual environment is activated, install the required packages:

```bash
pip install -r requirements.txt
```

### 3. Apply Database Migrations

Set up your local SQLite database by running the Django migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create a Superuser (Optional)

If you need to access the Django Admin panel (`/admin`), create a superuser account:

```bash
python manage.py createsuperuser
```

### 5. Run the Development Server

Start the local development server:

```bash
python manage.py runserver 8000
```

The backend API will be available at `http://127.0.0.1:8000/`.

## Architecture Overview

The backend is built with Django and Django REST Framework. Key modules include:

- **`users`**: User profiles (Students, Companies, Coordinators, Supervisors) and Roles.
- **`opportunities`**: Attachment opportunity listings.
- **`applications`**: Student applications to opportunities and placement tracking.
- **`documents`**: Document uploads (CVs, Logbooks) and tracking.
- **`supervision`**: Academic and workplace supervision reports and final evaluations.
- **`analytics`**: Data aggregation endpoints for dashboard charts and metrics.
