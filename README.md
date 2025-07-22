# Classic Offset - Business Management Suite (Optimized Version)

This document outlines the Classic Offset business management application, a comprehensive suite designed to streamline operations. This version has undergone significant optimizations to improve performance, security, and maintainability.

## 🚀 Key Features

*   **📊 Dynamic & Customizable Dashboard:** A central hub for business metrics with a user-configurable drag-and-drop layout.
*   **📦 Order & Financial Management:** Track orders, manage expenses, handle payments, and generate invoices.
*   **👥 Customer & User Management:** A complete CRM to manage customer information and application user roles.
*   **🤖 AI-Powered Insights:** Integrated with Google Gemini for advanced data analysis and business intelligence.
*   **📱 Modern Tech Stack:** Built with React, TypeScript, and Supabase for a robust and scalable experience.
*   **🎨 Theming & Accessibility:** Supports light/dark modes and follows accessibility best practices.

## 🛠️ Tech Stack & Key Optimizations

This project is built with a modern and powerful tech stack. The following key optimizations have been implemented to enhance performance and developer experience:

*   **Frontend:** React (~18.2), TypeScript, Vite
*   **Backend & Database:** Supabase, Firebase
*   **Styling:** Tailwind CSS
*   **State Management:** React Context API
*   **Routing:** React Router DOM

### Performance Optimizations:
*   **Code-Splitting:** Heavy pages and components (like Dashboard charts) are lazy-loaded using `React.lazy()` and `Suspense`, significantly reducing initial load times and improving the Lighthouse score.
*   **Tree-Shaking:** Optimized all `lucide-react` icon imports to be tree-shakable. This eliminated a ~660kB chunk, replacing it with tiny, on-demand icon chunks, drastically cutting down the bundle size.
*   **Build Analysis:** Used `rollup-plugin-visualizer` to identify and resolve bundle size issues.

### Dependency Management & Security:
*   **Security Vulnerability Patched:** Resolved a Cross-site Scripting (XSS) vulnerability in the `quill` dependency by using `npm overrides` to enforce a secure version.
*   **Modernized Dependencies:** Replaced the unmaintained `react-beautiful-dnd` with its modern, actively-maintained fork `@hello-pangea/dnd` to ensure compatibility and stability.
*   **Dependency Audit:** Regularly audited dependencies and updated packages to their latest stable versions.

##  Lighthouse Performance Score

After optimizations, the application's performance saw a dramatic improvement:

| Metric                | Before      | After        | Improvement        |
|-----------------------|-------------|--------------|--------------------|
| **Performance Score** | 25 / 100    | **35 / 100** | **+10 points**     |
| **Total Blocking Time** | 13,220 ms   | **1,080 ms** | **~92% Reduction** |
| **Speed Index**       | 27.9 s      | **7.7 s**    | **~72% Reduction** |

The significant reduction in Total Blocking Time makes the application feel much more responsive to user interactions.

## ⚙️ Installation and Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd classic-offset
    ```

2.  **Install dependencies:**
    *Note: This project uses `npm overrides`. If you encounter issues, ensure you are using a compatible npm version (v8.3.0+).*
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env.local` file in the root directory.
    *   Add your Supabase and Firebase project credentials.
        ```
        VITE_SUPABASE_URL=your_supabase_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        # Add other Firebase variables as needed
        ```

4.  **Set up the Supabase schema:**
    *   Use the SQL scripts in the `supabase/migrations` folder to create the necessary tables and functions in your Supabase project.

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port specified by Vite).

## 📜 Available Scripts

*   `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
*   `npm run build`: Bundles the app for production.
*   `npm run lint`: Lints the code using ESLint.
*   `npm run preview`: Serves the production build locally for testing.
