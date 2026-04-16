# Real-Hero 🩸

> **A Next-Generation Blood Donation Platform**

Real-Hero is a modern, real-time blood donation application designed to eliminate the friction between blood donors and recipients. By leveraging geolocation, AI-driven urgency classification, and an intuitive user interface, Real-Hero ensures that life-saving resources reach those in need faster than ever before.

---

## 🌟 Key Features

- **Smart Matching System:** Instantly notifies nearby blood donors when an emergency request is created based on real-time geolocation.
- **AI Urgency Classification:** Automatically analyzes hospital requests and patient descriptions to identify and prioritize critical cases.
- **Multi-lingual Support:** Breaking language barriers with seamless UI translations so anyone can use the app comfortably.
- **Secure Authentication:** JWT-based user verification with email OTP support to ensure all requests and donors are genuine.
- **Gamification & Rewards:** Donors earn "Life Coins" and unique profile badges upon successful donations to encourage consistent community help.
- **Responsive & Dynamic UI:** Built with an ultra-modern completely responsive dark-mode aesthetic utilizing Framer Motion and Material UI.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js
- **Styling:** Material UI (MUI), Vanilla CSS, Framer Motion
- **Mapping:** React-Leaflet, Carto Maps, Esri Satellite Imagery
- **State Management:** React Hooks

### Backend
- **Environment:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Real-Time Communication:** Socket.io
- **Security:** bcrypt, jsonwebtoken (JWT)
- **Email Service:** Nodemailer / SendGrid

## 🚀 How to Run Locally

### 1. Requirements
- Node.js (v18+)
- MongoDB Atlas Cluster or Local MongoDB
- API Keys for necessary integrations (Geoapify, Gemini/Groq, Email Provider)

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
*Ensure you create a `.env` file in the `backend` folder containing your secret keys (listed below in Environment Variables).*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
*The app will be available on `http://localhost:3000`*

## 🧑‍💻 The Team

Behind the architecture and development:
- **Dr. M. Arun:** Project Guide (Professor, Vel Tech University)
- **V. Lohin Reddy:** Lead Developer & Architect
- **G. Veera Saradhi:** Frontend Developer

---
*Built with passion and a commitment to saving lives.*
