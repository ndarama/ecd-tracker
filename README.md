# Early Childhood Development Tracking System

A full-stack web application for community health workers to register children, record home visits, monitor growth, track immunizations, manage referrals, and generate reports.

## Overview

ECD Tracker centralizes child health records, household and caregiver data, visit follow-up, and reminder workflows in a secure Next.js application.

The app reduces paper-based record keeping, improves visibility into growth and immunization status, and enables supervisors to review program activity and produce operational reports.

## Completed Features

* Role-based access control for CHWs, supervisors, and administrators
* Credential-based login with NextAuth
* Child registration with linked caregiver and household records
* Growth recording and nutrition screening
* Immunization tracking with vaccine reminders
* Developmental milestone tracking
* Home visit scheduling and follow-up notes
* Referral management with status tracking
* Email reminder delivery via SMTP
* Monthly reports with village, CHW, and date filters
* Printable report view and CSV export
* Administrative user management

## User Roles

### Community Health Worker (CHW)

* Register and manage children
* Log growth, nutrition, immunization, and milestone data
* Record home visits and follow-up actions
* Create referrals and review reminders

### Supervisor

* Review child and home visit records
* Monitor CHW activity and follow-ups
* Generate filtered reports

### Administrator

* Manage user accounts and roles
* Access system-wide reports
* Control application permissions

## Technology Stack

| Area                 | Technology                          |
| -------------------- | ----------------------------------- |
| Framework            | Next.js with TypeScript             |
| Frontend             | React + Tailwind CSS                |
| Backend              | Next.js App Router + server actions |
| Database             | PostgreSQL                          |
| ORM                  | Prisma                              |
| Authentication       | NextAuth.js                         |
| Email Delivery       | Nodemailer                          |
| Scripts              | tsx                                 |

## Project Structure

```text
ecd-tracker/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── cron/
│   │   └── reports/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── account/
│   │   ├── children/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── users/
│   │   └── visits/
│   └── globals.css
├── components/
│   ├── layout/
│   └── reports/
├── lib/
│   ├── auth.config.ts
│   ├── auth.ts
│   ├── prisma.ts
│   ├── reminders.ts
│   └── reporting.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── send-reminders.ts
│   └── verify-reporting.ts
├── src/generated/prisma/
├── types/
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## Main Data Models

* `User`
* `Child`
* `Caregiver`
* `Household`
* `GrowthRecord`
* `NutritionScreening`
* `Immunization`
* `Milestone`
* `HomeVisit`
* `Referral`
* `Reminder`

## Getting Started

### Prerequisites

* Node.js 20 or newer
* npm
* PostgreSQL or compatible libSQL database
* Git

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecd_tracker?schema=public"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-secure-secret"
CRON_SECRET="replace-with-a-cron-secret"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="smtp-user"
SMTP_PASSWORD="smtp-password"
SMTP_FROM="ECD Tracker <noreply@example.com>"
```

Do not commit `.env` to source control.

### Database Setup

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npm run db:migrate
```

Optional: seed development data:

```bash
npm run db:seed
```

### Run Locally

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```
Start the development server.

```bash
npm run build
```
Build the application and generate Prisma client.

```bash
npm run start
```
Start the production server.

```bash
npm run lint
```
Run ESLint.

```bash
npm run db:migrate
```
Apply Prisma migrations.

```bash
npm run db:seed
```
Seed development data.

```bash
npm run db:studio
```
Open Prisma Studio.

```bash
npm run test:reporting
```
Run reporting checks.

```bash
npm run reminders:send
```
Send pending reminder emails.

## Reminder Delivery

The project supports scheduled reminder delivery by email. Trigger reminders with `npm run reminders:send` or via the protected `/api/cron/reminders` endpoint using `Authorization: Bearer $CRON_SECRET`.

## Security Notes

* Credentials-based authentication with NextAuth
* Role-based access control for CHWs, supervisors, and admins
* Server-side validation and protected API routes
* Secure session handling and secret management

## Team

- NDARAMA Mark — Software Engineer & Project Developer
- Kironde T Edward Sekirangi — Backend Engineer

## Project Status

This repository contains a working ECD Tracker application with completed record management, visit tracking, immunization reminders, reporting, and administrative controls.
