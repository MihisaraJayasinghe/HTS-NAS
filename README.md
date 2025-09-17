# HTS NAS

HTS NAS is a lightweight network-attached storage dashboard that pairs an Express
backend with a React frontend. The backend exposes a REST API for managing a
storage directory on the host machine, while the frontend presents a file
explorer interface for browsing, organizing, and locking content.

## Features

### Backend (Node.js/Express)
- List files and folders for any path inside the configured NAS root
- Create new folders
- Upload files via multipart form data
- Rename and delete files/folders with path validation
- Lock and unlock items with bcrypt-hashed passwords stored alongside metadata
- Serve the production React build in single-port deployments

### Frontend (React + Vite)
- Modern dashboard-style interface for browsing NAS contents
- Breadcrumb navigation and quick "Up" control
- Create, rename, delete, upload, and lock/unlock actions
- Visual feedback for locked items and operation results
- Responsive layout that adapts to tablets and phones

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm 9+ (or a compatible alternative)

### Backend

```bash
cd backend
npm install
npm run start # or: node src/server.js
```

Environment variables:
- `PORT` – Port for the API server (defaults to `5000`)
- `NAS_ROOT` – Directory to manage. Defaults to `<repo>/nas_storage`

### Frontend

```bash
cd frontend
npm install
npm run dev # launches Vite dev server on http://localhost:3000
```

The dev server proxies API requests to `http://localhost:5000`.

### Production Build

```bash
cd frontend
npm run build
```

Copy the generated `frontend/dist` folder into a location served by the backend
(e.g., leave it within the repo). The Express server automatically serves the
build output when it exists, enabling a single deployment port.

## Folder Structure

```
backend/   Express server and NAS management logic
frontend/  React/Vite application for the user interface
nas_storage/  Default location for managed files (created on demand)
```

## Notes

- Locked items cannot be deleted or renamed without providing the correct
  password.
- When deleting a folder, any locks for nested items are also cleaned up.
- Uploading files respects locks; uploads attempting to overwrite locked items
  are rejected.

## License

This project is provided as-is for internal HTS NAS experimentation.
