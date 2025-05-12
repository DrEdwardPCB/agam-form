# Agam Form

Agam Form is a modern, user-friendly form builder that lets you create, manage, and fill out forms with ease. It’s designed to be simple yet powerful, making it perfect for collecting data without the hassle.

This task was first design by design.md before anything start please refer to [design.md](./design.md).

## What’s Inside

### Form Creation and Management

- Design your own forms with a variety of input types, including text fields, dropdowns, and file uploads.
- Manage your forms effortlessly: view, edit, delete, or toggle them on and off.

### Filling Out Forms

- Intuitive interface for filling out forms.
- Built-in form validation to ensure accurate submissions.
- Quick success confirmation after submission.

### Data Handling

- Your forms, questions, and responses are all securely stored in a SQLite database.
- Smooth data management with Prisma ORM.

## How It Works

### Frontend

- Built with Next.js for a fast, responsive experience.
- React for interactive UI components.
- Styled with Tailwind CSS and Shadcn/UI for a modern look.
- Form handling with React Hook Form, validated by Zod.

### Backend

- Next.js API Routes provide a clean, RESTful interface.
- SQLite database for quick, local data storage.
- Prisma ORM to keep database interactions smooth and efficient.

### Testing

- Cypress for end-to-end testing, ensuring the UI works flawlessly. (noted that this is just for demo purpose that I know Cypress, sophisticate test case requires fine tune which are not sth doable within short time-frame)
- Jest for unit testing critical functions, catching issues before they hit production. (noted that this is just for demo purpose that I know Cypress, sophisticate test case requires fine tune which are not sth doable within short time-frame)

## UX Idea added :

### Drag-and-Drop Form Builder

Agam Form takes the hassle out of creating forms with a drag-and-drop interface:

- Rearrange questions and dropdown options by simply dragging them.
- Visual feedback ensures you always know what you’re moving.

### response table

Agam form keeps data consumer in mind with Print and Copy to CSV function

- Allowing printing of response table with all the questions and response
- Copying CSV to clipboard, allow seamless data sharing

## Secure by Design

For a secure experience, Agam Form uses NextAuth.js for user authentication:

- Sign up and log in with secure email/password.
- Only logged-in users can manage forms.
- Secure password hashing with bcrypt.

## How to Get Started

### Prerequisites

- Node.js (v18.18.0 or higher)
- SQLite database

### Installation

**By Running Locally**

1. Clone this repository:

```bash
git clone https://github.com/DrEdwardPCB/agam-form
cd agam-form
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
```

4. Run the development server:

```bash
npm run dev
```

**By Running on Docker**

1. Clone this repository:

```bash
git clone https://github.com/DrEdwardPCB/agam-form
cd agam-form
```

2. Set up your environment variables:

```bash
cp .env.example .env
```

3. Start docker:

```bash
docker compose up -d
```

either way project will be started on `http://localhost:3000`

## Project Layout

```
src/
├── app/           # Next.js pages and API routes
├── components/    # Reusable UI components
├── lib/           # Utility functions and shared code
├── types/         # TypeScript type definitions
└── __tests__/     # Test files
```

## Future Plans

We’re just getting started! Here’s what’s next for Agam Form:

- Role-based access control for advanced form management.
- PostgreSQL migration for scalable data handling.
- S3 integration for secure file uploads.
- Enhanced drag-and-drop customization.

## Questions? Feedback?

Feel free to reach out if you have any questions or want to suggest improvements.
