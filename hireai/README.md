# HireAI — AI Interview Platform

Industry-ready MERN Stack project with AI evaluation, real-time proctoring, and Razorpay payments.

---

## 🚀 Quick Start (5 Steps)

### Step 1 — Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Create free account
2. Build Database → FREE (M0) → Select Mumbai region → Create
3. Database Access → Add User → Username + Password (save these)
4. Network Access → Add IP → Allow from Anywhere (0.0.0.0/0)
5. Database → Connect → Drivers → Copy connection string

### Step 3 — Configure Backend .env

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — paste your MongoDB Atlas connection string (replace <password>)
- `JWT_SECRET` — run this to generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from https://dashboard.razorpay.com → Settings → API Keys → Test Mode

### Step 4 — Run the App

```bash
# Terminal 1: Backend
cd backend
npm run dev
# → Server running on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm start
# → App running on http://localhost:3000
```

### Step 5 — Open Browser

Go to: http://localhost:3000
- Register as HR
- Create an interview
- Copy the invite link
- Open it in another tab as a candidate

---

## 📁 Project Structure

```
hireai/
├── backend/
│   ├── config/
│   │   └── db.js               ← MongoDB connection
│   ├── middleware/
│   │   └── auth.js             ← JWT protect + hrOnly
│   ├── models/
│   │   ├── User.js             ← HR user schema
│   │   ├── Interview.js        ← Interview + questions
│   │   ├── Session.js          ← Candidate attempt + answers
│   │   └── Payment.js          ← Razorpay payment records
│   ├── routes/
│   │   ├── auth.js             ← Register, Login, Profile
│   │   ├── interview.js        ← Create, Join, Submit, Complete
│   │   ├── payment.js          ← Razorpay order + verify + webhook
│   │   └── result.js           ← Stats, PDF download
│   ├── server.js               ← Express + Socket.io entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html          ← Razorpay script included here
    └── src/
        ├── api/
        │   └── axios.js        ← Axios instance with JWT interceptor
        ├── context/
        │   └── AuthContext.jsx ← Login, Register, Logout state
        ├── components/
        │   └── Layout.jsx      ← Sidebar navigation shell
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx       ← HR stats + interview list
        │   ├── CreateInterview.jsx ← JD input → AI generates questions
        │   ├── InterviewDetail.jsx ← Candidate list + shortlist
        │   ├── InterviewRoom.jsx   ← Live candidate interview (camera + speech)
        │   ├── Results.jsx         ← Full report + PDF download
        │   └── Pricing.jsx         ← Razorpay payment integration
        ├── App.jsx             ← Routes
        └── index.css           ← Global design system
```

---

## 🔑 API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Create HR account |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Get current user |
| PUT  | /api/auth/profile | Update profile |

### Interview (HR)
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/interview/create | Create interview (uses 1 credit, AI generates questions) |
| GET  | /api/interview/ | Get all HR's interviews |
| GET  | /api/interview/:id | Interview + all candidate sessions |
| PUT  | /api/interview/:id/status | Open/close interview |
| DELETE | /api/interview/:id | Delete interview |
| PUT  | /api/interview/session/:id/shortlist | Shortlist/unshortlist candidate |

### Interview (Candidate — no auth needed)
| Method | URL | Description |
|--------|-----|-------------|
| GET  | /api/interview/join/:token | Get interview by invite token |
| POST | /api/interview/session/start | Start a candidate session |
| POST | /api/interview/session/answer | Submit answer → AI evaluates |
| POST | /api/interview/session/anticheat | Log tab switch / face detection event |
| POST | /api/interview/session/complete | Finish interview → AI summary |

### Payment (Razorpay)
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/payment/create-order | Create Razorpay order |
| POST | /api/payment/verify | Verify payment signature → add credits |
| POST | /api/payment/webhook | Razorpay server webhook (backup) |
| GET  | /api/payment/history | User's payment history |

### Results
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/result/stats | HR dashboard stats |
| GET | /api/result/session/:id | Full session report |
| GET | /api/result/pdf/:sessionId | Download PDF report |

---

## 🌐 Deployment

### Frontend → Vercel (Free)
```bash
cd frontend
npm run build
# Upload /build folder to Vercel OR:
npx vercel --prod
```

### Backend → Render.com (Free)
1. Push backend folder to GitHub
2. Go to render.com → New Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all .env variables in Render → Environment tab

### After Deploy
- Update `FRONTEND_URL` in backend .env to your Vercel URL
- Update Razorpay Webhook URL to: `https://your-render-url.com/api/payment/webhook`
- Update `REACT_APP_API_URL` in frontend to your Render backend URL

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6 |
| Styling | Custom CSS (no Tailwind needed) |
| Charts | Recharts (Radar chart for scores) |
| State | React Context + useState |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.io |
| AI | OpenAI GPT-4o (question gen + evaluation) |
| Payment | Razorpay (India) |
| PDF | PDFKit |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Speech | Web Speech API (browser-native) |

---

## 💡 Key Features

- ✅ HR creates interview → AI generates questions from JD
- ✅ Unique invite link sent to candidates
- ✅ Candidate opens link → enters name/email → starts interview
- ✅ Live speech-to-text transcription (Web Speech API)
- ✅ GPT-4o evaluates each answer in real-time
- ✅ Anti-cheat: tab switch detection
- ✅ Interview complete → AI summary + recommendation
- ✅ HR sees full report with radar chart
- ✅ Download PDF report
- ✅ Shortlist candidates
- ✅ Razorpay payment for credits
- ✅ Socket.io real-time updates

---

Built with ❤️ using MERN Stack + OpenAI + Razorpay
