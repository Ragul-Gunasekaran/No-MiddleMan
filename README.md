# NO MIDDLE MAN 🌾

NO MIDDLE MAN connects farmers directly with buyers. The platform helps farmers discover buyers, compare bids side-by-side alongside market reference prices, and negotiate directly via chat, without the platform acting as an intermediary.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Ragul-Gunasekaran/No-MiddleMan)

---

## Live Deployment Instructions

You can host this project on **Render** (free tier) with one click using the button above. The project contains a `render.yaml` specification that automatically builds and deploys both the FastAPI API and the React production build as a single unified service.

### Manual Render Setup:
1. Log in to [Render](https://render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository `https://github.com/Ragul-Gunasekaran/No-MiddleMan`.
4. Render will deploy the application. It will output a public URL (e.g., `https://no-middle-man.onrender.com`).
5. Open the link to access the complete application!

---

## Local Development Startup

To run the application locally on your machine, follow these steps:

### 1. Run the Backend API
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*The FastAPI backend will start on `http://localhost:8000`.*

### 2. Run the Frontend React Site
```bash
cd frontend
npm install
npm run dev
```
*The Vite server will start on `http://localhost:5173`.*
