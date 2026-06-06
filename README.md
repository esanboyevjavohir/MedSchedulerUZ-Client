# MedSchedulerUZ — Client

> Frontend for the MedSchedulerUZ hospital/clinic schedule management system.

---

## 📋 About the Project

**MedSchedulerUZ-Client** is the frontend interface for the MedSchedulerUZ platform. It provides a modern, responsive dashboard for managing hospital schedules — including creating, filtering, publishing, and archiving doctor timetables.

This repository contains the **frontend** (client) of the project. The backend API is available here: [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ)

---

## ✨ Features

- 🔐 Login & role-based access control
- 📅 Schedule management (create, edit, publish, archive)
- 🔍 Search and filter by department, doctor, or status
- 👥 User management panel
- 📊 Dashboard with overview statistics
- 🌙 Dark-themed UI with clean design

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| HTTP Client | Axios |
| Routing | React Router DOM |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Backend API running (see [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ))

### Installation

```bash
# Clone the repository
git clone https://github.com/esanboyevjavohir/MedSchedulerUZ-Client.git
cd MedSchedulerUZ-Client

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Set your API base URL in .env:
# VITE_API_URL=https://localhost:5001

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
MedSchedulerUZ-Client/
├── src/
│   ├── assets/            # Images, icons
│   ├── components/        # Reusable UI components
│   ├── context/           # React context (auth, etc.)
│   ├── pages/             # Page components
│   │   ├── dashboard/
│   │   ├── schedules/     # SchedulesPage, etc.
│   │   ├── users/
│   │   └── ...
│   ├── services/          # API call functions
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx
│   └── main.tsx
├── .env                   # Environment variables (not committed)
├── .gitignore
├── package.json
└── vite.config.ts
```

---

## 📸 Screenshots

<!-- Add your screenshots here -->
<!-- Example:
![Dashboard](assets/dashboard.png)
![Schedules Page](assets/schedules.png)
![Login Page](assets/login.png)
-->

*Screenshots coming soon*

---

## 🔗 Related

- ⚙️ Backend Repository: [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ)

---

## 👤 Author

**Esanboyev Javohir**  
GitHub: [@esanboyevjavohir](https://github.com/esanboyevjavohir)
