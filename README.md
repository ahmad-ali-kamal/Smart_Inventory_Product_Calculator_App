# Quantix — Intelligent Salla Store Management Platform

Quantix is a comprehensive management platform that integrates with **Salla** — a leading e-commerce platform in the MENA region — to provide two specialized applications for merchants: **Harees** (Inventory & Batch Management) and **Qiasat** (Smart Measurement Calculator).

Built with Laravel on the backend and React (Inertia) on the frontend, Quantix extends Salla's native capabilities with advanced inventory tracking, automated discounting, and intelligent quantity recommendation.

---

## Features

### Harees — Inventory & Batch Expiry Management

- **Batch Tracking** — Monitor product batches by expiry date, status, and quantity.
- **Expiry Status Dashboard** — Visual dashboard with three status categories: Safe, Approaching Expiry, and Expired.
- **Automatic Discounts** — Configure automatic discount percentages for batches approaching expiry; discount is applied via the Salla API.
- **Manual Discounts** — Apply discounts manually to specific batches with a single click.
- **Real-time Notifications** — Bell-ring notifications for expiring and expired batches with read/unread tracking.
- **Product Synchronization** — Sync products from your Salla store to Harees via API or webhook.
- **Category Mapping** — Map Salla product categories to control which products are monitored.
- **Threshold Configuration** — Set custom expiry warning thresholds (days before expiry).
- **Search & Filter** — Filter monitored products by status, search by name or batch code.

### Qiasat — Smart Measurement Calculator

- **Dimension-based Measurement Calculation** — Calculate required product quantities based on coverage area (m²), waste percentage, and product dimensions.
- **Product Toggle** — Enable/disable products for calculation with instant visual feedback.
- **Active Products Dashboard** — Real-time dashboard showing active products with animated transitions.
- **Settings Configuration** — Configure global coverage area, waste percentage, and default dimensions.
- **Search & Pagination** — Search and paginate through your product catalog.
- **Salla Sync** — One-click synchronization of products from your Salla store.

---

## Project Structure

### Backend (Laravel)

```
app/
├── Actions/                     # Action classes (organized by domain)
│   ├── Harees/
│   ├── Mustashar/
│   ├── Salla/
│   └── Auth/
├── Console/
│   └── Commands/                # Artisan commands (FetchSallaProducts, UpdateBatchStatus, etc.)
├── Exceptions/                  # Exception handler
├── Http/
│   ├── Controllers/
│   │   ├── Auth/                # Authentication & Salla OAuth controllers
│   │   ├── Harees/              # Harees API controllers
│   │   ├── Mustashar/           # Mustashar API controllers
│   │   └── WebhookController    # Salla webhook handler
│   ├── Middleware/               # Custom middleware (auth, admin, CSRF, etc.)
│   ├── Requests/                # Form request validation
│   └── Resources/               # API resource transformers
├── Jobs/                        # Queue jobs
│   ├── FetchProductsJob         # Syncs products from Salla
│   ├── CheckBatchExpiryJob      # Checks and updates batch expiry statuses
│   └── ApplyAutoDiscountToPendingBatches  # Applies auto-discounts
├── Models/                      # Eloquent models (Merchant, Product, Batch, etc.)
├── Notifications/               # Notification classes
├── Policies/                    # Authorization policies
├── Providers/                   # Service providers
└── Services/                    # API service layer
    └── SallaApiService.php      # Salla REST API integration

routes/
├── web.php                      # Web routes (Inertia pages, Harees/Qiasat)
├── api.php                      # API routes (Harees/Qiasat REST endpoints)
├── console.php                  # Console route bindings
└── channels.php                 # Broadcasting channels

config/                          # Application configuration
database/
├── migrations/                  # Database migrations (38 files)
└── seeders/                     # Database seeders

tests/                           # PHPUnit tests
```

### Frontend (React + Inertia)

```
resources/
├── js/
│   ├── Components/
│   │   ├── Common/               # Shared UI primitives
│   │   │   ├── Controls/         # TableToolbar, SearchInput, DropdownFilter, Pagination, SyncButton
│   │   │   ├── Feedback/         # ErrorState, LoadingState, SetupBanner, AppToaster
│   │   │   ├── Skeleton/         # TableSkeleton, FormSkeleton
│   │   │   └── UI/               # Card, ProductAvatar
│   │   ├── Harees/               # Harees-specific components
│   │   │   ├── Dashboard/        # MonitoredProductsTable, ProductRow, BatchRow
│   │   │   ├── Products/         # InventoryProductRow, InventoryTable
│   │   │   ├── Settings/         # ThresholdCard, AutomationCard, CategoryMappingCard, etc.
│   │   │   ├── ExpiryModal.jsx
│   │   │   ├── DiscountModal.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── Mustashar/            # Qiasat-specific components
│   │   │   ├── ProductTable.jsx
│   │   │   ├── ProductRow.jsx
│   │   │   └── SettingsForm.jsx
│   │   ├── UI/                   # Generic UI components
│   │   └── Welcome/              # Landing page components
│   ├── Context/                  # React contexts (Language, Theme)
│   ├── Hooks/                    # Custom React hooks
│   ├── Layouts/                  # Page layouts (Guest, Login, App, Instructions)
│   ├── Pages/                    # Inertia page components
│   │   ├── Harees/               # Harees pages (Dashboard, Products, Settings, Login, Instructions)
│   │   └── Mustashar/            # Qiasat pages (Dashboard, Products, Settings, Login, Instructions)
│   ├── services/                 # API client & service modules
│   ├── styles/                   # Global styles (injected CSS)
│   └── translations/             # i18n JSON files (ar/en for each namespace)
├── css/
│   └── app.css                   # Global CSS with Tailwind directives
└── views/
    └── app.blade.php             # Root Blade template (single-page entry point)
```

---

## Installation

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 18+
- MySQL 8.0+
- A Salla merchant account with one or more registered applications (Qiasat || Harees)

### Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd quantix

# 2. Install PHP dependencies
composer install

# 3. Install Node.js dependencies
npm install

# 4. Environment setup
cp .env.example .env
php artisan key:generate

# Edit .env with your database credentials and Salla app keys
# See "Environment Variables" section below

# 5. Run database migrations
php artisan migrate

# 6. Build frontend assets
npm run build

# 7. Start the development server
php artisan serve
# In a separate terminal:
npm run dev
# In a third terminal (for queue processing):
php artisan queue:work
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_NAME` | Application name | Yes |
| `APP_ENV` | Environment (`local`, `production`) | Yes |
| `APP_KEY` | Laravel application key (generate via `php artisan key:generate`) | Yes |
| `APP_DEBUG` | Enable/disable debug mode (`true`/`false`) | Yes |
| `APP_URL` | Application base URL | Yes |
| `DB_CONNECTION` | Database driver (`mysql`) | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | Database port | Yes |
| `DB_DATABASE` | Database name | Yes |
| `DB_USERNAME` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `QUEUE_CONNECTION` | Queue driver (`database`, `redis`, `sync`) | Yes |
| `SESSION_DRIVER` | Session driver (`file`, `cookie`, `redis`) | Yes |
| `SESSION_ENCRYPT` | Encrypt session data | No |
| `SALLA_MUSTASHAR_CLIENT_ID` | Salla OAuth client ID for Qiasat app | Yes |
| `SALLA_MUSTASHAR_CLIENT_SECRET` | Salla OAuth client secret for Qiasat app | Yes |
| `SALLA_MUSTASHAR_WEBHOOK_SECRET` | Webhook verification secret for Qiasat | Yes |
| `SALLA_HAREES_CLIENT_ID` | Salla OAuth client ID for Harees app | Yes |
| `SALLA_HAREES_CLIENT_SECRET` | Salla OAuth client secret for Harees app | Yes |
| `SALLA_HAREES_WEBHOOK_SECRET` | Webhook verification secret for Harees | Yes |
| `SALLA_OAUTH_CALLBACK_URL` | Salla OAuth callback URL | Yes |
| `AUTHORIZATION_MODE` | Authorization mode (`easy`) | No |
| `MAIL_MAILER` | Mail driver (`log`, `smtp`) | No |
| `MAIL_FROM_ADDRESS` | Sender email address | No |
| `AWS_ACCESS_KEY_ID` | AWS access key (for S3) | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No |
| `AWS_BUCKET` | S3 bucket name | No |
| `PUSHER_APP_ID` | Pusher app ID (for broadcasting) | No |

---

## Queue Jobs

### FetchProductsJob

Synchronizes products from a merchant's Salla store into the local database. Handles pagination through Salla's API, creates/updates product records, and processes product images. Dispatched on-demand via the sync button in the UI or triggered by the `salla/products/updated` webhook.

### CheckBatchExpiryJob

Periodic job (typically scheduled via the Laravel console kernel) that checks all monitored batches against their configured thresholds. Updates batch status to `approaching` or `expired` based on the number of days remaining. Also triggers automatic discount application for eligible batches.

### ApplyAutoDiscountToPendingBatches

Processes batches in `pending` status that are approaching their expiry date. For each eligible batch, calculates and applies the configured auto-discount percentage by calling the Salla API to update the product price. Transitions the batch status to `auto_discounted` upon success.

---

## API Endpoints

### Harees — Inventory Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/harees/api/products` | List monitored products with batch data |
| `POST` | `/harees/api/products/sync` | Trigger product sync from Salla |
| `GET` | `/harees/api/stats` | Get dashboard statistics (counts by status) |
| `GET` | `/harees/api/settings` | Get inventory settings |
| `POST` | `/harees/api/settings` | Update inventory settings |
| `GET` | `/harees/api/categories` | List mapped categories |
| `POST` | `/harees/api/categories/map` | Map a category for monitoring |
| `DELETE` | `/harees/api/categories/map/{id}` | Remove a category mapping |
| `GET` | `/harees/api/batches` | List batches with filtering |
| `POST` | `/harees/api/batches/{id}/discount` | Apply manual discount to a batch |
| `POST` | `/harees/api/discounts` | Configure auto-discount settings |
| `GET` | `/harees/api/notifications` | List notifications |
| `POST` | `/harees/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/harees/api/products/{id}/toggle` | Toggle product monitoring status |

### Qiasat — Measurement Calculator

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mustashar/api/products` | List products with calculation data |
| `POST` | `/mustashar/api/products/sync` | Trigger product sync from Salla |
| `POST` | `/mustashar/api/products/{id}/toggle` | Toggle product active status |
| `GET` | `/mustashar/api/settings` | Get calculator settings |
| `POST` | `/mustashar/api/settings` | Update calculator settings |
| `GET` | `/mustashar/api/calculations` | Calculate required quantities |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/salla/redirect` | Redirect to Salla OAuth authorization page |
| `GET` | `/auth/salla/callback` | Handle Salla OAuth callback |
| `POST` | `/logout` | Logout and clear session |

### Webhooks (CSRF-exempt)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/salla` | Handle Salla webhook events |
| `POST` | `/webhooks/salla` | Alternative webhook endpoint |

---

## Webhooks

Salla sends real-time events to Quantix via webhooks. The following events are handled:

- **`salla/products/updated`** — Triggers `FetchProductsJob` to re-sync product data.
- **`salla/app/uninstalled`** — Handles app uninstallation (merchant deauthorization).

All webhook requests are verified using the configured `WEBHOOK_SECRET` before processing. Webhook endpoints are exempt from CSRF protection (configured in `VerifyCsrfToken` middleware) since Salla's servers do not send CSRF tokens.

### Sync Flow

1. Merchant clicks "Sync" button in the UI.
2. Frontend sends a POST request to the sync endpoint.
3. Backend dispatches `FetchProductsJob` to the queue.
4. The job calls Salla's REST API to fetch all products.
5. Products are created/updated in the local database.
6. For Harees, batches are created or updated with expiry dates.
7. For Qiasat, products are available for measurement calculation.

---

## Batch Lifecycle

Batches in Harees progress through the following lifecycle:

```
pending → auto_discounted
       → manually_discounted
```

### Statuses

- **`pending`** — The batch is newly created or synchronized. It is being monitored for expiry but no discount has been applied yet. The system checks expiry thresholds and determines if a discount is needed.

- **`auto_discounted`** — The batch approached its expiry threshold and the system automatically applied a discount (configured via auto-discount settings). The Salla API was called to update the product price. Further automatic discounts are suppressed.

- **`manually_discounted`** — A merchant manually applied a discount to this batch via the discount modal. Manual discounts override auto-discount behavior; the batch will not be processed by `ApplyAutoDiscountToPendingBatches` again.

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **Laravel 11** | PHP backend framework |
| **React 18** | Frontend UI library |
| **Inertia.js** | Single-page app bridge (no full-page reloads) |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Vite** | Frontend build tool |
| **Framer Motion** | Animation library |
| **MySQL** | Relational database |
| **Laravel Queue (Database)** | Async job processing |
| **Laravel Sanctum** | API token authentication |
| **Salla REST API** | E-commerce platform integration |
| **Salla Webhooks** | Real-time event updates |
| **i18next** | Internationalization (Arabic/English) |
| **React Query (TanStack)** | Server state & caching |
| **Cloudinary** | Image CDN |
| **Lucide React** | Icon library |

---

## Developers

### Project Leader

Ahmad Kamal
[ahmadalikamal11@gmail.com](mailto:ahmadalikamal11@gmail.com)

### Team Members

Ghala Alsaedi
[ghalalsaedi@gmail.com](mailto:ghalalsaedi@gmail.com)

Raneem Alqurashi
[r0908161@gmail.com](mailto:r0908161@gmail.com)

Jumana Alsaedi
[jmana.alsaedi@gmail.com](mailto:jmana.alsaedi@gmail.com)
