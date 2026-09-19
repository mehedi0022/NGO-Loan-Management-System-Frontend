# NGO Loan Management System Frontend

Frontend foundation for an NGO loan and savings management system. The application is designed for clear, repeatable financial operations and uses Ant Design as its primary component library.

## Technology

- React 19 with Vite
- JavaScript and ESLint
- Ant Design and Ant Design Icons
- Redux Toolkit and RTK Query
- React Router
- Tailwind CSS is available for utility styling
- Manrope for the Latin UI and Tiro Bangla for Bengali text
- Day.js
- Zod for future validation schemas

React Compiler and React Hook Form are intentionally not enabled yet.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local `.env` file from `.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Start the development server:

```bash
npm run dev
```

The app is available at `http://localhost:5173` by default.

## Commands

```bash
npm run dev       # Start the Vite development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run preview   # Preview the production build
```

## Current Features

### Application foundation

- Responsive dashboard layout
- Collapsible sidebar navigation
- Header search, date, notifications, profile menu, and theme toggle
- Light and dark modes persisted in local storage
- Centralized Ant Design theme tokens
- Redux store and RTK Query base API with cookie credentials
- Reusable page, table, form, modal, state, and status components

### Authentication screen

- Premium responsive login page at `/login`
- Email and password validation
- Branded light/dark presentation
- Local autofill preview-friendly form behavior

### Members

- Member list at `/members`
- Search by name, member ID, or phone
- Status and loan-due filters
- Member profile at `/members/:memberId`
- Detailed profile tabs for overview, loans, installments, savings, and transactions
- Loan summary modal with installment schedule
- Create member form at `/members/new`
- Edit member form at `/members/:memberId/edit`
- Profile image selection and local preview
- Personal details, Father Home Address, and Granter Address fields

## Routes

| Route                     | Screen                         |
| ------------------------- | ------------------------------ |
| `/login`                  | Login                          |
| `/`                       | Dashboard                      |
| `/members`                | Members list                   |
| `/members/new`            | Create member                  |
| `/members/:memberId`      | Member profile                 |
| `/members/:memberId/edit` | Edit member                    |
| `/loans`                  | Loans placeholder              |
| `/loans/overdue`          | Due and overdue placeholder    |
| `/collections`            | Collections placeholder        |
| `/savings`                | Savings placeholder            |
| `/income-expense`         | Income and expense placeholder |
| `/reports`                | Reports placeholder            |
| `/users`                  | Users and roles placeholder    |
| `/settings`               | Settings placeholder           |

## Project Structure

```text
src/
├── app/
│   ├── providers/
│   ├── router/
│   └── store/
├── components/
├── constants/
├── layouts/
├── modules/
│   ├── auth/
│   ├── dashboard/
│   ├── members/
│   └── shared/
├── services/
│   └── baseApi.js
├── styles/
└── utils/
```

## API Status

The Express backend is a separate application. The frontend currently contains the reusable RTK Query foundation in `src/services/baseApi.js`, configured with:

- `VITE_API_BASE_URL`
- `credentials: "include"`
- Shared cache tag types
- A reserved location for refresh-token handling

Member and dashboard data is currently static placeholder data. Business API endpoints, authentication requests, persistence, and server-side uploads will be added in later phases.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
