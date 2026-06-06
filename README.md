# MedSchedulerUZ — Client

> A modern, dark-themed hospital staff scheduling dashboard built with React 18, TypeScript, and Tailwind CSS.

---

## 📋 About the Project

**MedSchedulerUZ-Client** is the frontend interface for the MedSchedulerUZ platform. It provides a fully role-aware dashboard where different users (SuperAdmin, HospitalAdmin, DeptHead, Employee) see different navigation menus and features based on their access level.

This repository contains the **frontend (client)** of the project. The backend API is available here: [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ)

---

## ✨ Key Features

- 🔐 **Full Auth Flow** — Login → OTP verification → Dashboard, with Forgot/Reset password support
- 🔒 **Force Password Change** — redirects first-login users to change password before accessing the app
- 👥 **Role-based Sidebar** — dynamic navigation menu per role (SuperAdmin / HospitalAdmin / DeptHead / Employee)
- 📊 **Dashboard** — overview stats: hospitals, users, shifts, leave requests, swap requests, notifications
- 📅 **Schedule Management** — create, publish, archive weekly schedules with calendar view
- ⚡ **Auto-generate Shifts** — one-click shift generation for an entire week by department
- 📲 **QR Clock-in Page** — `/clock-in?shiftId=...&token=...` — employees scan QR and clock in/out
- 🔄 **Shift Swap** — request, accept, and approve shift swaps
- 🏖️ **Leave Requests** — submit and manage leave requests with approval workflow
- 🎓 **Certifications** — track and manage staff certifications per user
- 🔔 **Notifications** — real-time unread badge, mark as read / mark all as read
- 🔁 **Token Auto-refresh** — Axios interceptor silently refreshes expired JWT tokens
- 👤 **Profile Page** — view and update personal information

---

## 🏗️ Project Structure

```
MedSchedulerUZ-Client/
├── src/
│   ├── assets/                    # Static images and icons
│   ├── components/                # Shared UI components (Layout, icons)
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state: user, isAuthenticated, mustChangePassword
│   ├── pages/
│   │   ├── auth/                  # Login, OTP, ForgotPassword, ResetPassword, ChangePassword
│   │   ├── dashboard/             # DashboardLayout (sidebar + outlet), DashboardPage
│   │   ├── hospitals/             # Hospital CRUD
│   │   ├── departments/           # Department CRUD
│   │   ├── users/                 # User management
│   │   ├── specializations/       # Specialization management
│   │   ├── schedules/             # Schedules + calendar view + auto-week modal
│   │   ├── shifts/                # Shifts + auto-generate modal
│   │   ├── attendance/            # Attendance list + QR ClockInPage
│   │   ├── swaps/                 # Shift swap requests
│   │   ├── leaves/                # Leave requests
│   │   ├── certifications/        # Staff certifications
│   │   ├── notifications/         # Notification center
│   │   ├── reports/               # Reports page
│   │   └── profile/               # User profile
│   ├── services/
│   │   ├── api.ts                 # Axios instance + JWT interceptor + token refresh
│   │   └── index.ts               # All service modules (12 services)
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces and enums
│   ├── App.tsx                    # Route definitions + PrivateRoute + AuthRoute guards
│   └── main.tsx
├── .env                           # VITE_API_URL (not committed)
├── .gitignore
├── package.json
└── vite.config.ts
```

---

## 👥 Role-based Navigation

| Role | Available Pages |
|---|---|
| **SuperAdmin** | Dashboard, Hospitals, Departments, Users, Specializations, Schedules, Shifts, Attendance, Leaves, Swaps, Reports, Certifications |
| **HospitalAdmin** | Dashboard, Departments, Users, Specializations, Schedules, Shifts, Attendance, Leaves, Swaps, Certifications |
| **DeptHead** | Dashboard, Schedules, Shifts, Attendance, Leaves, Swaps |
| **Employee** | Dashboard, My Shifts, Leaves, Swaps, Profile |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| HTTP Client | Axios (with interceptors) |
| Routing | React Router DOM v6 |
| State | React Context API |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Backend API running — see [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ)

### Installation

```bash
# Clone the repository
git clone https://github.com/esanboyevjavohir/MedSchedulerUZ-Client.git
cd MedSchedulerUZ-Client

# Install dependencies
npm install

# Configure environment
# Create .env file and set:
# VITE_API_URL=https://localhost:5001

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📸 Screenshots

### 🔐 Login Page
<img width="1857" height="901" alt="image" src="https://github.com/user-attachments/assets/b0119660-ec25-41a7-a2f9-1d495b01d60b" />

### 📊 Dashboard
<img width="1892" height="906" alt="image" src="https://github.com/user-attachments/assets/9164c82b-aba5-4831-9301-6851cbe17c8d" />

### 🏥 Hospitals Management
<img width="1890" height="906" alt="image" src="https://github.com/user-attachments/assets/ba1a7f0f-e9c3-42ba-be04-55a2d356b21e" />

### 🏢 Departments Management
<img width="1868" height="895" alt="image" src="https://github.com/user-attachments/assets/7233a8cc-65a9-41d3-b430-7a56d7a00f2e" />

### 👥 Users Management
<img width="1881" height="892" alt="image" src="https://github.com/user-attachments/assets/1c67a5f3-2e7c-4361-a13d-bc480b90cff4" />

### 🔬 Specializations Management
<img width="1881" height="905" alt="image" src="https://github.com/user-attachments/assets/d8d2fc1a-c0b4-4f31-a8d3-823716f6969f" />

### 📅 Schedules Management
<img width="1884" height="905" alt="image" src="https://github.com/user-attachments/assets/5a6182f0-6040-42d2-a923-004436d8526b" />

### ⚡ Auto-Generate Weekly Schedule Modal
<img width="597" height="809" alt="image" src="https://github.com/user-attachments/assets/01a5657a-0ed9-47df-ae82-7d5ab1855a9e" />

### 📆 Schedule Calendar View
<img width="1916" height="689" alt="image" src="https://github.com/user-attachments/assets/ce520445-9680-4e60-b3fd-38adaf9c0aaa" />

### 🕐 Shifts Management
<img width="1886" height="891" alt="image" src="https://github.com/user-attachments/assets/64427390-94d6-4b01-a540-bf40e31b61d1" />

### 📲 QR Code Attendance
<img width="517" height="711" alt="image" src="https://github.com/user-attachments/assets/450ee656-bc51-4a00-b995-90ce0816c58b" />

### 🏖️ Leave Requests
<img width="1894" height="882" alt="image" src="https://github.com/user-attachments/assets/fb31f16b-505a-44eb-a0d0-f3a888994562" />

### ✅ Leave Request Approval Modal
<img width="532" height="444" alt="image" src="https://github.com/user-attachments/assets/717a8b68-7feb-4195-abaa-44e8a577de8b" />

### 🔄 Shift Swap Requests
<img width="1856" height="841" alt="image" src="https://github.com/user-attachments/assets/87cf6513-8eab-4fbf-ae26-999cd62db2c5" />

### 🔄 Shift Swap Detail Modal
<img width="734" height="860" alt="image" src="https://github.com/user-attachments/assets/bb87367c-6f67-4514-9f06-10320ae807b2" />

### 🎓 Certifications
<img width="1887" height="884" alt="image" src="https://github.com/user-attachments/assets/9ea6d3a4-cb57-4476-98b9-94fd2e9a8736" />

---

## 🔗 Related

- ⚙️ Backend Repository: [MedSchedulerUZ](https://github.com/esanboyevjavohir/MedSchedulerUZ)

---

## 👤 Author

**Esanboyev Javohir**
GitHub: [@esanboyevjavohir](https://github.com/esanboyevjavohir)
