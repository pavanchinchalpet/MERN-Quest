# 🎓 CodeSprint - Learning Platform

A comprehensive gamified learning platform built using the MERN stack with Supabase integration. Interactive quiz system where you can create, take, and manage quizzes with real-time tracking.

## 🔗 Live Links

- **GitHub Repository**: [https://github.com/pavanchinchalpet/learn-mern](https://github.com/pavanchinchalpet/learn-mern)
- **Live Demo**: [https://learn-mern-pied.vercel.app](https://learn-mern-pied.vercel.app)

## 🚀 Features

### User Features
- ✅ **New: Proctored Assessment Environment** - Fullscreen enforcement with auto-submission on tab-switch.
- ✅ **New: Topic-Based Certifications** - Specialized exams for React, JS, Node, SQL, and more.
- ✅ **New: Modern UI** - Horizontal card-based layout for both Practice and Certification portals.
- ✅ JWT-based authentication with OTP support
- ✅ Interactive quiz system with multiple categories
- ✅ Progress tracking and analytics dashboard
- ✅ Gamification system (points, levels, badges)
- ✅ Global leaderboard
- ✅ Profile management with achievements
- ✅ Daily streaks for consistent learning

### Admin Features
- ✅ Complete quiz management (CRUD operations)
- ✅ Bulk question import via CSV/JSON
- ✅ Real-time session monitoring
- ✅ Advanced analytics dashboard
- ✅ User management system
- ✅ Question editor with explanations

## 🛠 Tech Stack

**Frontend:**
- React.js, Tailwind CSS, Framer Motion (for smooth transitions).

**Backend:**
- Node.js, Express.js, **Supabase** (PostgreSQL), JWT, Socket.IO.

## 📂 Project Structure

```
mern-quest/
├── api/                    # Backend API (Supabase Integration)
│   ├── data/              # Seed data (Quizzes, Practices)
│   ├── controllers/       # Business logic
│   ├── routes/           # Express routes
│   └── deduplicate.sql    # Data integrity script
├── web/                   # Frontend React app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Quiz.js, Assessments.js, Practice.js
│   │   └── context/      # Auth & Application State
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Data Integrity

1. **Clone the repository**
   ```bash
   git clone https://github.com/pavanchinchalpet/learn-mern.git
   cd learn-mern
   ```

2. **Clean & Seed Database** (Important for first-time setup)
   ```bash
   cd api
   # Run deduplication to ensure unique entries
   # (Execute deduplicate.sql in Supabase Console)
   npm run seed
   ```

3. **Install dependencies**
   ```bash
   npm run install-all
   ```

4. **Environment Setup**
   
   Create `.env` file in the `api/` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Supabase Configuration
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   
   # JWT Configuration
   JWT_SECRET=your-jwt-secret
   
   # Client URL
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or separately:
   # Backend
   cd api && npm run dev
   
   # Frontend (new terminal)
   cd web && npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🎯 Key Features

### 🛡️ Proctored Assessment Environment
- **Security First**: Fullscreen enforcement with automatic submission if the user switches tabs or exits the window.
- **Smart Header**: Real-time progress bar, question counter, and a precise countdown timer.
- **Navigation Sidebar**: Interactive 5-column grid to jump between questions, with visual indicators for answered and flagged questions.
- **Micro-interactions**: Smooth transitions and card-based options for a premium testing experience.

### 📜 Certification Center
- **Topic-Based Exams**: Standardized assessments for domains like **React**, **Javascript**, **Node.js**, **SQL**, and **Git**.
- **Professional Layout**: Clean, horizontal certification cards providing clear visibility into question counts, XP rewards, and time limits.
- **Deep Linking**: Direct access to specific certifications via URL parameters.

### 🎮 Gamification & Progress
- **XP System**: Earn points based on question complexity (Easy: 10, Medium: 20, Hard: 30).
- **Leveling**: Progress through levels as you master new technologies.
- **Streaks & Leaderboard**: Stay motivated with daily streaks and compete on the global leaderboard.

### 🛠 Admin & Management
- **Dashboard**: Full control over quizzes, users, and real-time session monitoring.
- **Bulk Import**: Rapidly scale your question bank via CSV/JSON imports.
- **Data Integrity**: Built-in deduplication and unique constraint handling for Supabase/PostgreSQL.

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- Protected routes
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**Happy Learning! 🎮📚**
