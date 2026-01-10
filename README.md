# 🟩 GitMaxer - GitHub Streak Guardian

![GitMaxer Banner](https://img.shields.io/badge/Status-Active-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-unstable-blue?style=for-the-badge) 

**GitMaxer** is a premium, automated AI assistant designed to keep your GitHub contribution graph active forever. It combines a powerful backend bot with a stunning, high-performance Next.js dashboard featuring dynamic themes, real-time analytics, and role-based access control.

---

## ✨ Key Features

### 🎨 Dynamic Premium Themes
Experience a dashboard that adapts to your status:
- **⚪ Default/Free:** Clean, minimalist white theme.
- **🔵 Pro Plan (HyperTech):** Cyberpunk aesthetic with moving 3D grids, binary rain, and holographic UI.
- **🟡 Enterprise Plan (Golden):** Luxurious gold gradients, particle effects, and premium typography.
- **🔴 Owner Mode (God Mode):** Exclusive Red/Black command center theme.

### 👑 Admin Command Center ("God Mode")
Owners get exclusive access to a real-time supervision dashboard:
- **Floating Access Button:** A discrete "Crown" button toggles the admin interface.
- **Live Traffic Stats:** Real-time tracking of page views and generated commits stats (Since Midnight).
- **User Management Table:** Live view of recent registrations, plans, and active status.
- **System Controls:** One-click buttons for Maintenance Mode, Emergency Kill, and Cache Clearing.
- **Live Terminal:** Real-time stream of bot activity logs.

### 🤖 Automation Core
- **Smart Commits:** Generates code in multiple languages (Python, JS, Rust, Go).
- **Schedule Control:** Customize commit frequency, time, and intensity.
- **Repo Management:** Automatically pushes to public or private repositories.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Payments:** [Razorpay](https://razorpay.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Razorpay Account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rishittandon7/Git-Maxer.git
   cd Git-Maxer/dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Required for Admin Stats
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Role-Based Access

| Role | Theme | Access Level |
|------|-------|--------------|
| **Free** | White | Basic Dashboard, Standard Bot Settings |
| **Pro** | Blue/Cyber | Priority Support, Faster Commits, **HyperTech UI** |
| **Enterprise** | Gold | Private Repos, Max Frequency, **Golden UI** |
| **Owner** | Red | **Full Admin Dashboard**, User Management, System Control |

---

Launching soon

---

### Developed by **Rishit Tandon**
*Keep your streak alive.*
