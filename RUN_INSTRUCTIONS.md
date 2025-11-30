# How to Run Social Sync

## 1. Prerequisites
- **Node.js** installed.
- **MongoDB** connection string (in your `.env` file).
- **Cloudinary** credentials (in your `.env` file).

## 2. Configuration Setup
The backend needs to find your `.env` file. Currently, it is in the root folder, but the backend runs from the `backend` folder.

**Option A: Move the .env file (Recommended)**
Move the `.env` file from the main folder into the `backend` folder.
```powershell
Move-Item .\.env .\backend\.env
```

**Option B: Copy the .env file**
Copy it so both frontend (if needed) and backend have access.
```powershell
Copy-Item .\.env .\backend\.env
```

## 3. Running the Backend
1. Open a terminal.
2. Navigate to the backend folder:
   ```powershell
   cd backend
   ```
3. Install dependencies (if you haven't already):
   ```powershell
   npm install
   ```
4. Start the server:
   ```powershell
   npm run dev
   ```
   *You should see: "Server running in development mode on port 3000" and "MongoDB Connected".*

## 4. Running the Frontend
1. Open a new terminal window.
2. You can simply open the `frontend/index.html` file in your browser.
   - **Right-click** `frontend/index.html` -> **Open with** -> **Google Chrome**.
3. Alternatively, if you want to use a local server (better for testing):
   ```powershell
   npx serve frontend
   ```

## 5. Troubleshooting
- **MongoDB Error**: If you see `MongoDB connection failed... undefined`, it means the `.env` file is not in the `backend` folder. See Step 2.
- **Module Not Found**: Make sure you run `npm install` inside the `backend` folder first.
