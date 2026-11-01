# 🏋️ FittR — Personal Fitness & Efficiency Platform

**FittR** is a full-stack personal fitness tracking and consistency web application. Define your own custom trackers, record daily habits and workouts, measure your daily efficiency score (0–100%), unlock milestone badges, and export customizable weekly, monthly, quarterly, and date-range reports in **PDF**, **CSV**, or **JSON**.

---

## ⚡ Tech Stack

* **Framework:** Next.js 14 (App Router, Server Actions, TypeScript)
* **Styling & UI:** Tailwind CSS, Lucide Icons, Shadcn-inspired modern dark mode
* **Database & ORM:** Prisma ORM with SQLite (local development) and PostgreSQL-ready for production (Supabase / Neon)
* **Authentication:** Stateless encrypted session tokens (jose + bcryptjs) with optional Invite/Registration key protection
* **Data Visualization:** Recharts (Adherence curves, weekly bar charts)
* **Reporting Engine:** Interactive Printable HTML-to-PDF reports & CSV spreadsheet exports
* **Deployment:** Optimized for 1-click **Vercel** hosting (100% Free Hobby Tier)

---

## 🚀 Features

1. **🔐 Authentication & User Isolation:**
   - Multi-device synchronized sign-up and sign-in.
   - Optional `REGISTRATION_CODE` environment variable so random web visitors cannot sign up on your hosted site.
   - 1-Click Demo Login button for instant local test-driving.

2. **🛠️ Dynamic Custom Tracker Engine:**
   - **Numeric / Target:** Body weight, body fat %, water intake, calories.
   - **Habits & Consistency:** 1-click daily toggle with streak counters and celebratory confetti.
   - **Counters / Incremental:** Push-ups, pull-ups, steps, water glasses with `+1`, `+5`, `+10` quick taps.
   - **Time & Duration:** Cardio sessions, meditation, run times with minutes presets.
   - **Workouts / Sets & Reps:** Log sets, reps, and weight loads for strength exercises.

3. **📊 Live Efficiency & Consistency Engine:**
   - Automatic **Daily Efficiency Score (0–100%)** calculated from target completion.
   - Consecutive day streak tracking with active flame counter.
   - 7-Day adherence bar chart.

4. **🏆 Milestones & Trophy Room:**
   - Automatic milestone achievements (*First Step, 7-Day Streak, Century Club*).
   - Custom milestone goalposts (e.g. *"Hit 100kg Bench Press"*, *"Run 50km this month"*) with real-time progress bars.

5. **📄 Reports & Export Hub:**
   - Timeframe presets: **Weekly**, **Monthly**, **Quarterly**, or **Custom Date Range**.
   - Custom tracker selection filter.
   - **Download PDF Report:** Styled printable document ready for clean 1-click browser printing/PDF saving.
   - **Download CSV:** Raw data spreadsheet export.
   - **Download JSON:** Offline backup file.

6. **📅 Historical Timeline:**
   - Backfill or review previous days with an interactive date navigator.

---

## 💻 Local Setup & Development

1. **Clone & Install Dependencies:**
   ```bash
   git clone <your-repo-url>
   cd FittR
   npm install
   ```

2. **Set Up Local Database:**
   ```bash
   npx prisma db push
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐙 How to Push to GitHub

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of FittR platform"
   ```

2. Create a new repository on [GitHub](https://github.com/new) (we recommend setting it to **Private**).

3. Link and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

---

## ☁️ Free Hosting on Vercel (Step-by-Step)

1. **Create a Free Database (Supabase or Neon):**
   - Go to [Supabase](https://supabase.com) or [Neon](https://neon.tech) and create a free project.
   - Copy your database connection string (e.g., `postgresql://postgres:...@...db.supabase.co:5432/postgres`).
   - In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.

2. **Deploy on Vercel:**
   - Go to [Vercel](https://vercel.com) and click **"Add New Project"** → **Import** your GitHub repository.
   - Under **Environment Variables**, add:
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `JWT_SECRET`: Any random 32-character string.
     - `REGISTRATION_CODE` *(Optional)*: A secret password needed to create accounts.
   - Click **Deploy**!
   - Every future `git push` to GitHub will automatically update your live site.

