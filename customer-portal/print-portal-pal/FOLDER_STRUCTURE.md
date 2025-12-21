# 📁 Project Folder Structure

## 🎯 Overview
This project follows a **feature-based architecture** for better scalability, maintainability, and developer experience.

## 🏗️ Structure

```
src/
├── features/              # Feature-based modules (self-contained)
│   ├── auth/             # Authentication feature
│   ├── dashboard/        # Dashboard & Portal
│   ├── orders/           # Order management
│   ├── requests/         # Order requests & wizard
│   ├── invoices/         # Invoice management
│   ├── support/          # Support & Chat
│   ├── notifications/    # Notifications system
│   ├── profile/          # User profile
│   └── products/         # Product library
│
├── shared/               # Shared across all features
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/      # Layout components
│   │   ├── common/      # Common components
│   │   └── admin/       # Admin-specific components
│   ├── hooks/           # Shared custom hooks
│   ├── lib/             # Utility libraries
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Helper functions
│
├── services/            # External services & API
│   ├── supabase/       # Supabase client & types
│   ├── api/            # API calls
│   └── storage/        # File storage utilities
│
├── assets/             # Static assets
│   ├── images/        # Images
│   ├── icons/         # Icons
│   └── locales/       # i18n translation files
│
├── core/              # Core app configuration
│   ├── config/       # App configuration
│   ├── constants/    # Constants
│   └── routes/       # Route configuration
│
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## 📂 Feature Module Structure

Each feature follows a consistent structure:

```
feature-name/
├── components/         # Feature-specific components
├── pages/             # Feature pages
├── hooks/             # Feature-specific hooks
├── types/             # Feature-specific types
├── lib/              # Feature-specific utilities
└── index.ts          # Public exports
```

### Example: Orders Feature
```
features/orders/
├── components/
│   ├── OrdersList.tsx
│   ├── Timeline.tsx
│   └── StatusTimeline.tsx
├── pages/
│   └── OrdersPage.tsx
├── hooks/
│   └── useTimeline.ts
├── types/
│   └── order.ts
└── index.ts
```

## 🎨 Import Conventions

### ✅ Good Practices

```typescript
// Import from feature index
import { OrdersPage, OrdersList } from '@/features/orders';

// Import from shared
import { Button, Card } from '@/shared/components/ui';
import { useToast } from '@/shared/hooks';

// Import from services
import { supabase } from '@/services/supabase/client';
```

### ❌ Avoid

```typescript
// Don't import directly from deep paths
import OrdersList from '@/features/orders/components/OrdersList';

// Don't use relative paths for features
import { Button } from '../../../shared/components/ui/button';
```

## 🚀 Benefits

### 1. **Scalability**
- Easy to add new features without affecting existing code
- Each feature is self-contained and independent

### 2. **Maintainability**
- Clear separation of concerns
- Easy to locate and modify code
- Consistent structure across features

### 3. **Developer Experience**
- Intuitive folder organization
- Easy onboarding for new developers
- Better IDE autocomplete support

### 4. **Code Reusability**
- Shared components in one place
- Feature-specific code stays isolated
- Easy to identify what can be reused

### 5. **Testing**
- Easy to write unit tests per feature
- Better test isolation
- Clear boundaries for integration tests

## 📝 Naming Conventions

### Files
- **Components**: PascalCase (e.g., `OrdersList.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useTimeline.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Types**: camelCase (e.g., `order.ts`)

### Folders
- **Features**: lowercase, hyphenated (e.g., `order-management`)
- **Components**: lowercase (e.g., `components/`)

## 🔧 Configuration Files

All configuration is centralized in `core/config/`:
- `i18n.ts` - Internationalization setup
- Future: `theme.ts`, `routes.ts`, etc.

## 📊 Migration from Old Structure

### Old → New Mapping

```
pages/CustomerAuth.tsx → features/auth/pages/AuthPage.tsx
pages/CustomerDashboard.tsx → features/dashboard/pages/DashboardPage.tsx
pages/CustomerOrdersPage.tsx → features/orders/pages/OrdersPage.tsx
components/customer/CustomerOrders.tsx → features/orders/components/OrdersList.tsx
components/ui/* → shared/components/ui/*
hooks/useNotifications.ts → features/notifications/hooks/useNotifications.ts
integrations/supabase/* → services/supabase/*
locales/* → assets/locales/*
```

## 🎯 Future Enhancements

- [ ] Add `core/routes/` for route configuration
- [ ] Add `shared/types/` for global TypeScript types
- [ ] Add `services/api/` for REST API calls
- [ ] Add feature-specific tests alongside code
- [ ] Consider adding `shared/contexts/` for React contexts

## 📖 References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Project Structure Best Practices](https://reactjs.org/docs/faq-structure.html)
- [TypeScript Project Structure](https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html)

---

**Last Updated**: December 21, 2025
**Version**: 2.0 (Refactored Structure)
