# HabitTrack | Track Your Consistency

HabitTrack is a modern, AI-powered habit tracking application built with Next.js, Tailwind CSS, and Supabase. It features daily, weekly, monthly, and yearly views, real-time synchronization, and AI-driven habit analysis.

## ✨ Features

- **AI Insights**: Automated analysis of your habit patterns and milestone tracking.
- **Multiple Views**: Navigate through Daily, Weekly (horizontal grid), Monthly (calendar), and Yearly (heatmap) views.
- **Real-time Sync**: Instant updates across devices using Supabase Realtime.
- **Social Sharing**: Share read-only dashboard views with friends via unique share codes.
- **Beautiful UI**: Modern, dark-mode first design using Shadcn UI and Framer Motion.
- **Production Ready**: Secure RLS policies and global middleware protection.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/habit-attendance.git
   cd habit-attendance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase project URL and Anon Key.

4. Set up the database:
   - Run the contents of `schema.sql` in your Supabase SQL Editor.
   - Run `security_fixes.sql` to apply production security.

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validation**: Zod

## 🔒 Security

This project implements:
- **Row Level Security (RLS)** in Supabase to protect user data.
- **Next.js Middleware** for global route protection.
- **Server Actions** for secure data mutation with server-side validation.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
