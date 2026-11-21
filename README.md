# Activity 7 Backend (ICT251)

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and edit the project/student details.
3. `npm start` then open http://localhost:3000 (API guide) and http://localhost:3000/health
   (Needs Node.js 22.5+ LTS. With no DATABASE_URL a local SQLite file `records.db` is created and seeded.)

## Deploy on Render
1. Push this folder to GitHub (`.env` and `node_modules` are ignored).
2. Render > New > PostgreSQL (free). Copy its **Internal Database URL**.
3. Render > New > Web Service > connect the repo. Build: `npm install`. Start: `npm start`.
4. Environment variables: `DATABASE_URL` (the URL above), `CLIENT_ORIGINS` (your frontend URL, comma separated),
   `PROJECT_NAME`, `STUDENT_NAME`, `STUDENT_NUMBER`, `SYSTEM_DESCRIPTION`.
5. Open `https://your-service.onrender.com/health`, then run the CRUD tests in Postman.
6. Submit the base URL: `https://your-service.onrender.com`

## Postman body (POST / PUT)
{ "title": "Extend loan on networking textbook", "category": "Borrowing",
  "description": "Requesting a seven-day renewal before the due date.", "status": "Pending" }
