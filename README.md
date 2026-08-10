# Early Childhood Development Tracking System

A full-stack web application designed to help community health workers register children, record home visits, monitor growth, track immunizations, identify developmental concerns, and manage referrals.

## Project Information

**Project Name:** Early Childhood Development (ECD) Tracking System
**Proposed by:** NDARAMA Mark
**Project Type:** Full-Stack Web Application
**Target Users:** Community health workers, health center supervisors, and system administrators

## Project Quotes

> “There can be no keener revelation of a society’s soul than the way in which it treats its children.”
> — **Nelson Mandela**, launch of the Nelson Mandela Children’s Fund, 8 May 1995

> “The child is both a hope and a promise for mankind.”
> — **Maria Montessori**, *Education and Peace*

> “The best investment is in quality early childhood development from birth to five for disadvantaged children and their families.”
> — **James J. Heckman**, Nobel Prize–winning economist


## Overview

Many Early Childhood Development programs depend on community health workers to follow up with children and their families.

However, child records are often stored on paper, in notebooks, or across separate spreadsheets. This makes it difficult to monitor home visits, growth, nutrition, immunization, developmental milestones, and health concerns over time.

The Early Childhood Development Tracking System will provide a centralized and secure platform where community health workers can manage child records and follow-up activities.

The system will reduce paperwork, improve data accuracy, support timely interventions, and help health workers make better decisions for children under their care.

## Objectives

The main objectives of the system are to:

* Store child and family information in one secure location
* Reduce dependence on paper-based records
* Improve the tracking of home visits and follow-ups
* Monitor children’s height, weight, age, and overall growth
* Track nutrition, immunization, and developmental milestones
* Identify children who may require referrals or additional support
* Provide reminders for visits, vaccinations, and follow-up activities
* Generate reports for health center supervisors
* Improve communication between community health workers and supervisors

## Key Features

### Child Registration

Community health workers can:

* Register new children
* Record dates of birth, gender, and identification information
* Update child information when necessary
* View a complete child profile

### Family and Caregiver Management

The system will store:

* Parent or caregiver names
* Phone numbers
* Home addresses
* Relationship to the child
* Household information
* Emergency contact information

### Home Visit Tracking

Community health workers can:

* Record home visit dates
* Write observations and visit notes
* Schedule the next visit and follow-up date
* Review previous home visits
* Mark scheduled visits as completed or missed

### Growth Tracking

The system will track:

* Weight
* Height
* Age
* Growth history
* Measurement dates
* Growth trends using charts

This information will help health workers identify possible growth concerns.

### Nutrition Screening

Community health workers can record:

* Meal information
* Feeding habits
* Breastfeeding status
* Signs of malnutrition
* Nutrition concerns
* Recommended nutrition support

### Immunization Tracking

The system will allow users to:

* Record vaccines received
* Record vaccination dates
* Identify missed vaccines
* View upcoming vaccines
* Create persisted caregiver reminders for upcoming vaccines
* Monitor immunization completion

### Developmental Milestone Checks

Community health workers can monitor milestones related to:

* Communication
* Movement
* Learning
* Social interaction
* Emotional development
* Problem-solving skills

Any delayed or concerning milestone can be recorded for further follow-up.

### Referral Management

Children requiring additional support can be referred to:

* Health centers
* Nutrition specialists
* Child development specialists
* Social support services
* Other relevant service providers

Referral records may include:

* Reason for referral
* Referral date
* Destination
* Priority level
* Follow-up status
* Additional notes

### Reminders and Follow-Ups

The notification center provides reminders for:

* Upcoming scheduled home visits for the assigned CHW
* Overdue home-visit follow-ups
* Upcoming and overdue vaccinations
* Caregiver vaccine reminders stored in the database

Caregiver reminders currently store the caregiver name, phone number, vaccine, due date, and reminder message. SMS and email delivery are not configured.

### Community Health Worker Dashboard

The dashboard will display:

* Total registered children
* Growth and nutrition statistics
* Immunization status: given, pending, and overdue
* Upcoming home visits
* Missed visits
* Pending referrals
* Completed and scheduled visits
* Recent registered children

Supervisors and administrators can filter dashboard statistics by village, CHW, and date range. CHWs only see information for their assigned children.

### Reports

Supervisors will be able to generate reports for:

* Registered children
* Home visits
* Growth measurements
* Immunization status
* Nutrition concerns
* Developmental concerns
* Referrals
* Community health worker activity

Reports may be filtered by date, location, health worker, child, or status.

The implemented monthly report supports month, village, and CHW filters and can be printed from the browser. Report data is queried directly from Prisma and includes child registration, growth and nutrition, immunization, home visit, and referral statistics.

## User Roles

### Community Health Worker

Community health workers can:

* Register and manage children
* Record home visits
* Add growth measurements
* Track immunizations
* Record nutrition information
* Complete milestone assessments
* Create referral notes
* View assigned reminders

### Supervisor

Supervisors can:

* Monitor community health worker activities
* Review child records
* View referrals
* Generate reports
* Monitor program performance
* Review children requiring additional support

### Administrator

Administrators can:

* Manage user accounts
* Assign user roles
* Manage system settings
* Control access permissions
* View system-wide reports
* Monitor system activity

## Technology Stack

| Area                 | Technology                           |
| -------------------- | ------------------------------------ |
| Full-Stack Framework | Next.js with TypeScript              |
| Frontend             | React                                |
| Styling              | Tailwind CSS                         |
| Backend              | Next.js API Routes or Server Actions |
| Database             | SQLite via Prisma libSQL adapter     |
| ORM                  | Prisma                               |
| Authentication       | NextAuth.js                          |
| Authorization        | Role-Based Access Control            |
| Version Control      | Git and GitHub                       |
| Deployment           | PM2 or another Node.js process manager |

## Suggested Project Structure

```text
ecd-tracking-system/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── children/
│   ├── visits/
│   ├── growth/
│   ├── nutrition/
│   ├── immunizations/
│   ├── milestones/
│   ├── referrals/
│   ├── reports/
│   └── users/
├── components/
│   ├── forms/
│   ├── charts/
│   ├── tables/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── permissions.ts
│   └── validations.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── types/
├── middleware.ts
├── next.config.js
├── package.json
└── README.md
```

## Main Data Models

The current Prisma schema includes the following database models:

* User
* Role
* Child
* Caregiver
* Household
* HomeVisit
* GrowthRecord
* Immunization
* Milestone
* Referral
* Reminder

## Getting Started

### Prerequisites

Install the following tools before running the project:

* Node.js 20 or newer
* npm, Yarn, pnpm, or Bun
* SQLite/libSQL (the default development database is `dev.db`)
* Git

### Clone the Repository

```bash
git clone https://github.com/ndarama/ecd-tracker.git
cd ecd-tracker
```

### Install Dependencies

Using npm:

```bash
npm install
```

Using pnpm:

```bash
pnpm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"

NEXTAUTH_URL="http://localhost:3000"

NEXTAUTH_SECRET="replace-with-a-secure-secret"
```

Do not commit the `.env` file to GitHub.

### Set Up the Database

Generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev
```

Optional: populate the database with initial data.

```bash
npm run db:seed
```

### Start the Development Server

```bash
npm run dev
```

Open the following address in your browser:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Checks the project for linting problems.

```bash
npm run db:migrate
```

Applies pending Prisma migrations.

```bash
npm run db:seed
```

Creates the development admin, supervisor, and CHW accounts.

```bash
npm run db:studio
```

Opens Prisma Studio for inspecting the local database.

```bash
npm run test:reporting
```

Runs database-backed smoke checks for reporting queries, including village, CHW, and inclusive date-range filters.

## Production Deployment with PM2

Create a production build:

```bash
npm run build
```

Start the application using PM2:

```bash
pm2 start npm --name "ecd-tracker" -- start
```

Save the PM2 process:

```bash
pm2 save
```

Configure PM2 to start automatically after a server restart:

```bash
pm2 startup
```

Follow the command displayed by PM2 to complete the startup configuration.

## Security Considerations

The system should include:

* Secure password handling
* Role-based authorization
* Protected application routes
* Server-side input validation
* Secure session management
* Activity logging
* Restricted access to child records
* Database backup procedures
* Environment variable protection

Because the system stores sensitive information about children and families, access should only be granted to authorized users.

## Future Improvements

Possible future improvements include:

* Offline data collection
* SMS reminders for caregivers
* Email notifications
* Mobile application support
* Multi-language support
* Geographic mapping
* Health center integration
* Automated growth-risk detection
* Exporting reports to PDF or Excel
* Data visualization for program managers
* Audit logs
* Two-factor authentication
* Advanced backup and recovery

## Expected Impact

The system is expected to:

* Reduce paperwork
* Improve the accuracy of child records
* Strengthen follow-up activities
* Support early identification of health and developmental concerns
* Improve communication between health workers and supervisors
* Help ensure that vulnerable children receive timely support
* Provide reliable information for planning and decision-making

## Project Status

The project is currently in the proposal and development-planning stage.

## Author

**NDARAMA Mark**

Software Engineer and Project Developer

## License

This project is intended for educational and community health development purposes. A suitable open-source or private license may be added before public deployment.
