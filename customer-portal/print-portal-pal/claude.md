# Global Rules & Guidelines

This section contains the master rules for the project. The AI assistant must adhere to these guidelines for all tasks.

## 1.1. Project Overview
**Project Name:** Print Portal Pal

**Purpose:** A web application for "Classic offset and cards" to manage print orders, invoices, and customer interactions. It serves as a portal for customers to track their orders, manage their profiles, and communicate with the business.

**Core User Groups:**

- **Customers:** Sign up, log in, place order requests, view order history and status, manage invoices, and update their profiles.
- **Business Administrators (Implied):** Manage orders, customers, payments, and business analytics through a separate (or future) admin interface.

## 1.2. Technology Stack
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Backend & Database:** Supabase (Authentication, Postgres Database, Storage)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, built on Radix UI.
- **Routing:** React Router DOM (v6)
- **State Management / Data Fetching:** React Query (@tanstack/react-query) for server state, useState and useEffect for component state.
- **Forms:** React Hook Form with Zod for validation.
- **Internationalization (i18n):** i18next and react-i18next for English and Tamil translations.

## 1.3. Coding Style & Conventions
**File Structure:**
- Pages are located in `src/pages/`.
- Reusable UI components are in `src/components/ui/`.
- Feature-specific components are in `src/components/customer/`.
- Hooks are in `src/hooks/`.
- Library/utility functions are in `src/lib/`.
- Supabase integration is in `src/integrations/supabase/`.
- Translation files are in `src/locales/`.

**Component Naming:** Use PascalCase for component files and function names (e.g., `CustomerOrders.tsx`, `function CustomerOrders()`).

**TypeScript:**
- Use the Supabase-generated types from `src/integrations/supabase/types.ts` whenever interacting with the database. For example, `type Customer = Tables<'customers'>;`.
- Define props for components using interfaces.
- Avoid using `any` unless absolutely necessary.

**React Best Practices:**
- Always use functional components with Hooks.
- Keep components small and focused on a single responsibility.
- Use `useEffect` for side effects, with specific dependency arrays.

**Styling:**
- Use Tailwind CSS classes for all styling.
- Use the `cn` utility from `src/lib/utils.ts` to conditionally apply classes.
- Adhere to the design system defined in `tailwind.config.ts` and `src/index.css`, including colors (primary, secondary, destructive, etc.) and spacing.

## 1.4. Key Integrations & Libraries
**Supabase Client:**
- The Supabase client is initialized in `src/integrations/supabase/client.ts`. Import it from there for any database or auth operations: `import { supabase } from '@/integrations/supabase/client';`.
- All database interactions must be asynchronous and handle potential errors with `try...catch` blocks.

**UI (shadcn/ui):**
- When creating new UI, first check if a suitable component exists in `src/components/ui/` (e.g., Button, Card, Input, Dialog).
- Use these components consistently to maintain a uniform look and feel.

**User Feedback (Toasts):**
- Use the `useToast` hook from `src/hooks/use-toast.ts` for user notifications (e.g., success messages, errors).
- Example: `toast({ title: "Success", description: "Profile updated successfully." });`
- For destructive actions or errors: `toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });`

**Internationalization (i18n):**
- Use the `useTranslation` hook from `react-i18next` for all user-facing text.
- Example: `const { t } = useTranslation(); <h1>{t('profile.title')}</h1>`
- All translation keys are stored in `src/locales/en.json` (English) and `src/locales/ta.json` (Tamil). When adding new text, add keys to both files.
