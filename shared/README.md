# @classic-offset/shared

Shared code between Classic Offset main app and customer portal.

## Installation

This is a local package. Add it to your app's `package.json`:

### For Main App (`/package.json`)
```json
{
  "dependencies": {
    "@classic-offset/shared": "file:./shared"
  }
}
```

### For Customer Portal (`/customer-portal/print-portal-pal/package.json`)
```json
{
  "dependencies": {
    "@classic-offset/shared": "file:../../shared"
  }
}
```

Then run `npm install` in each app.

## Usage

### Types & Enums

```typescript
import {
  ORDER_STATUS,
  type OrderStatus,
  PAYMENT_STATUS,
  type Customer,
  type Order,
  type Notification,
} from '@classic-offset/shared';

// Use status constants
const status: OrderStatus = ORDER_STATUS.PENDING;

// Type your data
const customer: Customer = { ... };
```

### API Utilities

```typescript
import {
  getSupabase,
  getCustomerOrders,
  sendNotification,
  updateOrderStatus,
} from '@classic-offset/shared';

// Get Supabase client
const supabase = getSupabase();

// Fetch customer orders
const orders = await getCustomerOrders(customerId);

// Send notification
await sendNotification({
  customerId,
  type: 'order_update',
  title: 'Order Updated',
  message: 'Your order status has changed',
});
```

### Hooks

```typescript
import {
  useRealtimeNotifications,
  useRealtimeOrders,
  useAuth,
} from '@classic-offset/shared';

function MyComponent() {
  // Real-time notifications
  const { notifications, unreadCount } = useRealtimeNotifications(customerId);
  
  // Real-time orders
  const { orders, loading } = useRealtimeOrders(customerId);
  
  // Auth state
  const { user, session, loading, signOut } = useAuth();
}
```

### Utilities

```typescript
import {
  formatCurrency,
  formatDate,
  isValidEmail,
  validateOrderForm,
  getStatusColor,
  createAppError,
  parseError,
} from '@classic-offset/shared';

// Format currency
formatCurrency(1500); // "₹1,500.00"

// Format date
formatDate('2024-01-15'); // "15 Jan 2024"

// Validate email
if (isValidEmail(email)) { ... }

// Get status color classes
const { bg, text } = getStatusColor('pending');

// Error handling
try {
  // ...
} catch (error) {
  const appError = parseError(error);
  logError(appError);
}
```

### Components

```typescript
import {
  StatusBadge,
  LoadingSpinner,
  ErrorDisplay,
  ConfirmDialog,
  useConfirmDialog,
} from '@classic-offset/shared';

function MyComponent() {
  const { confirm, dialogProps } = useConfirmDialog();
  
  const handleDelete = () => {
    confirm({
      title: 'Delete Order?',
      message: 'This action cannot be undone.',
      onConfirm: () => deleteOrder(orderId),
      variant: 'danger',
    });
  };
  
  return (
    <>
      <StatusBadge status="pending" />
      <LoadingSpinner size="lg" />
      <ErrorDisplay error={error} onRetry={refetch} />
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
```

## Module Structure

```
shared/
├── index.ts              # Main export file
├── package.json          # Package configuration
├── types/
│   ├── index.ts          # Types export
│   ├── enums.ts          # Status enums and constants
│   └── database.ts       # Database entity types
├── api/
│   ├── index.ts          # API export
│   ├── supabaseClient.ts # Supabase client factory
│   ├── orders.ts         # Order CRUD operations
│   ├── customers.ts      # Customer CRUD operations
│   └── notifications.ts  # Notification operations
├── hooks/
│   ├── index.ts          # Hooks export
│   ├── useAuth.ts        # Authentication hook
│   ├── useRealtimeNotifications.ts
│   └── useRealtimeOrders.ts
├── utils/
│   ├── index.ts          # Utils export
│   ├── formatters.ts     # Currency, date, text formatters
│   ├── validators.ts     # Email, phone, form validators
│   ├── constants.ts      # App constants and colors
│   └── errorHandler.ts   # Error parsing and logging
├── components/
│   ├── index.ts          # Components export
│   ├── StatusBadge.tsx   # Status badge component
│   ├── LoadingSpinner.tsx # Loading states
│   ├── ErrorDisplay.tsx  # Error display component
│   └── ConfirmDialog.tsx # Confirmation dialog
└── order-timeline/       # Existing shared component
    ├── OrderTimeline.tsx
    ├── createOrderTimelineHook.ts
    └── types.ts
```

## Direct Module Imports

You can also import from specific modules:

```typescript
// Import only types
import { Customer, Order } from '@classic-offset/shared/types';

// Import only API functions
import { sendNotification } from '@classic-offset/shared/api';

// Import only hooks
import { useAuth } from '@classic-offset/shared/hooks';

// Import only utilities
import { formatCurrency } from '@classic-offset/shared/utils';

// Import only components
import { StatusBadge } from '@classic-offset/shared/components';
```

## Environment Variables

Both apps must have these environment variables configured:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes the shared package:

```json
{
  "compilerOptions": {
    "paths": {
      "@classic-offset/shared": ["./shared/index.ts"],
      "@classic-offset/shared/*": ["./shared/*"]
    }
  }
}
```

For the customer portal, adjust paths accordingly:

```json
{
  "compilerOptions": {
    "paths": {
      "@classic-offset/shared": ["../../shared/index.ts"],
      "@classic-offset/shared/*": ["../../shared/*"]
    }
  }
}
```

## Contributing

When adding new shared code:

1. Add types to `types/` directory
2. Add API functions to `api/` directory
3. Add hooks to `hooks/` directory
4. Add utilities to `utils/` directory
5. Add components to `components/` directory
6. Export from the module's `index.ts`
7. Export from main `index.ts`
8. Update this README

## License

Private - Classic Offset internal use only.
