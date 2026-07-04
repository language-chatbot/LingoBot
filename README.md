# LingoQuest - Full-Stack Language & Reading Platform

LingoQuest is a full-stack educational web application designed for students and educators. Students navigate through a structured map of learning activities (reading, listening, or watching media content), interact with custom vocabulary glossaries, and converse with a contextualized AI chatbot tutor (powered by OpenAI). Admins/teachers have a comprehensive dashboard to manage groups, author lessons, tag vocabulary terms using an interactive cursor-highlight tagger, and review detailed conversation history audits.

---

## Tech Stack

*   **Backend**: Node.js, Express.js, Multer (file processing)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **AI Engine**: OpenAI API (proxying completions with lesson context)
*   **Storage Service**: S3-compatible cloud storage SDK (fallbacks to local disk storage for local development)
*   **Authentication**: JWT-based session checks with Role-Based Access Control (Admin vs Student)
*   **Frontend**: React (Vite), React Router, Lucide Icons, and Vanilla CSS design tokens

---

## Project Structure

```
workspace/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL model structures
│   │   └── seed.js         # Initial mock database seed data
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/     # JWT & RBAC guards
│   │   ├── routes/         # Express API routing layout
│   │   ├── services/       # Storage engine fallback & OpenAI helpers
│   │   └── index.js        # Server bootstrap entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar and shared layout components
│   │   ├── pages/          # App views (Login, Checklist, Split-Pane, Admin)
│   │   ├── services/       # API endpoints client handler
│   │   ├── App.jsx         # Router & Route guards
│   │   ├── main.jsx
│   │   └── index.css       # Global design token stylesheets
│   ├── package.json
│   └── vite.config.js
├── uploads/                # Local uploads folder (media files storage fallback)
├── schema.sql              # Raw PostgreSQL database table definition
└── README.md               # Setup and deployment documentation
```

---

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   PostgreSQL server active (running on port 5432)

---

## Local Development Setup

### 1. Database Configuration
Make sure your PostgreSQL server is running. Create a database named `language_learning_platform` (or adjust your configuration connection url).

### 2. Environment Variables Configuration
Create a `.env` file in the `backend/` directory (you can copy `.env.example` as a template):
```bash
# Server configuration
PORT=5000
NODE_ENV=development

# Database connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/language_learning_platform?schema=public"

# Session validation
JWT_SECRET="super-secret-key-change-in-production"

# OpenAI Access key (Falls back to simulation mock responses if empty)
OPENAI_API_KEY="your-openai-api-key"

# Client origin CORS verification
CLIENT_URL="http://localhost:5173"

# S3 Storage Configuration (Optional - falls back to local uploads/ directory if empty)
# S3_BUCKET="your-s3-bucket"
# S3_REGION="us-east-1"
# S3_ACCESS_KEY_ID="your-s3-key-id"
# S3_SECRET_ACCESS_KEY="your-s3-secret"
```

### 3. Backend Setup & Seeding
Navigate to the `backend/` directory, install packages, and synchronize your DB:
```bash
cd backend
npm install

# Push Prisma schemas and auto-generate client bindings
npx prisma db push

# Populate groups, admin, student, reading passages, and glossary definitions
npm run prisma:seed
```

### 4. Frontend Setup
Navigate to the `frontend/` directory and install packages:
```bash
cd ../frontend
npm install
```

### 5. Running the Application
Start both the backend server and frontend dev environment in separate terminals:

*   **Run Backend** (starts on http://localhost:5000):
    ```bash
    cd backend
    npm run dev
    ```
*   **Run Frontend** (starts on http://localhost:5173):
    ```bash
    cd frontend
    npm run dev
    ```

---

## Testing Scenarios

1.  **Student Flow**:
    *   Log in at `http://localhost:5173` using:
        *   Email: `student@example.com`
        *   Password: `password123`
    *   Select the **Korean Middle School** cohort.
    *   Explore the step checklist map timeline.
    *   Open **Exploring Seoul: Reading Comprehension**:
        *   Click on highlighted glossary words to display definitions inline.
        *   Type messages in the right chatbot panel (questions, comprehension practices) and see replies.
        *   Click **Mark Done** at the top right to log completion.
    *   Test Listening and Video activities featuring embedded HTML5 controllers.
2.  **Admin Flow**:
    *   Log in using:
        *   Email: `admin@example.com`
        *   Password: `password123`
    *   Explore tabs in the Admin Panel sidebar:
        *   **Overview Stats**: Platform metrics showing completions.
        *   **Groups & Rosters**: Create new cohorts, select groups, assign/unassign student rosters.
        *   **Content Library**: Upload audio/video files or write articles.
        *   **Glossary Tagger**: Choose a reading passage, select/highlight text with your cursor, fill in definitions, and save to instant-link terms.
        *   **Activity Planner**: Assign content assets to cohorts and set step indices.
        *   **Logs & Audit**: Monitor completion timelines and browse full chatbot dialogue history logs filterable by cohort and student.

---

## Render Deployment Guide

### 1. Deploy Managed PostgreSQL Database
1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **PostgreSQL**.
3.  Fill in the name, choose region and tier, and click **Create Database**.
4.  Once database creation finishes, copy the **Internal Database URL** (for backend services deployed on Render) or **External Database URL** (for external tools).

### 2. Deploy Express Backend Web Service
1.  On Render, click **New +** and select **Web Service**.
2.  Connect your Git repository.
3.  Set the following settings:
    *   **Name**: `lingoquest-backend`
    *   **Language**: `Node`
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install && npx prisma generate`
    *   **Start Command**: `node src/index.js`
4.  Click **Advanced** and add these Environment Variables:
    *   `DATABASE_URL`: *Your Render database connection string (Internal)*
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `JWT_SECRET`: *A secure random string*
    *   `OPENAI_API_KEY`: *Your OpenAI API key*
    *   `CLIENT_URL`: *The URL of your deployed frontend (e.g. `https://lingoquest.onrender.com`)*
5.  Click **Create Web Service**.

### 3. Deploy React Frontend Service
Since we are using Vite, you can deploy the React app as a Static Site:
1.  On Render, click **New +** and select **Static Site**.
2.  Connect your Git repository.
3.  Set the following settings:
    *   **Name**: `lingoquest`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
4.  Add a redirect rule in Render (Settings > Redirects/Rewrites) to handle client-side routing fallback:
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: `Rewrite`
5.  Update your backend deployment `CLIENT_URL` env variable with this frontend URL.
