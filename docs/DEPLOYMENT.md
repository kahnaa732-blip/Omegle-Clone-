# 🚀 Omnexlo (Omegle Clone) - Internet Deployment Guide

This repository contains the complete full-stack codebase for **Omnexlo**, featuring a high-performance React + Vite frontend and a Node.js + Socket.io WebRTC signaling server with SQLite persistence.

---

## ⚡ Option 1: 1-Click Free Cloud Deployment (Recommended)

Because WebRTC video chat and random matchmaking require a live WebSocket server with HTTPS (required by browsers for camera/microphone access), the easiest way to deploy Omnexlo with 100% working functionality is on **Render** or **Railway**.

### Deploy on Render (100% Free, Zero Config)
1. Fork or push this repository to your GitHub account:
   `https://github.com/kahnaa732-blip/Omegle-Clone-`
2. Go to **[Render.com](https://render.com/)** and sign in with GitHub.
3. Click **New +** and select **Web Service**.
4. Choose your repository: **`Omegle-Clone-`**.
5. Render will automatically detect [`render.yaml`](../render.yaml) or configure:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Click **Deploy Web Service**.
7. Once deployed, Render gives you a secure live HTTPS link:
   `https://your-service-name.onrender.com`
   - The React frontend, WebSockets signaling, and WebRTC video chat all run seamlessly under this single domain!

---

## 🌐 Option 2: GitHub Pages (Static Client Hosting)

The compiled static production build has already been pushed to the **`gh-pages`** branch of this repository.

### To Enable GitHub Pages:
1. Go to your repository on GitHub:
   `https://github.com/kahnaa732-blip/Omegle-Clone-`
2. Navigate to **Settings** > **Pages** (under Code and automation).
3. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: Select **`gh-pages`** and folder **`/ (root)`**
4. Click **Save**.
5. Within 1–2 minutes, your website will be live at:
   `https://kahnaa732-blip.github.io/Omegle-Clone-/`

> **Note**: For matchmaking and live WebRTC signaling when hosted on GitHub Pages, connect your frontend to your deployed backend by setting `VITE_SERVER_URL` in your build environment to your live backend domain (e.g. `https://your-service-name.onrender.com`).

---

## 🐳 Option 3: Docker Deployment

You can deploy the full stack with Docker or Docker Compose on any VPS (DigitalOcean, AWS, GCP, Linode, Hetzner):

```bash
# Clone the repository
git clone https://github.com/kahnaa732-blip/Omegle-Clone-.git
cd Omegle-Clone-

# Run the full stack with Docker Compose
docker compose up -d
```

This starts:
- Frontend Client on port `3000` (or reverse-proxied)
- Matchmaking Signaling Server on port `4000`
- Optional Coturn STUN/TURN Server on port `3478` / `5349`
