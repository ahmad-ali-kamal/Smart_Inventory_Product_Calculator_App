# Quantix — Intelligent Salla Store Management Platform

Quantix is a comprehensive management platform that integrates with **Salla** — a leading e-commerce platform in the MENA region — to provide two specialized applications for merchants: **Harees** (Inventory & Batch Expiry Management) and **Qiasat** (Smart Measurement Calculator).

Built with Laravel on the backend and React (Inertia) on the frontend, Quantix extends Salla's native capabilities with advanced inventory tracking, automated discounting, smart measurement calculations, and real-time notifications.

---

## Features

### Harees — Inventory & Batch Expiry Management

- **Batch Lifecycle Tracking** — Monitor product batches through three status stages: **Green** (Safe), **Yellow** (Approaching Expiry — within configured threshold), **Red** (Expired). Status is calculated automatically based on expiry date and configurable thresholds.
- **Status Dashboard** — Visual dashboard with three summary StatCards (Expired / Approaching / Safe) and a paginated Monitored Products table with nested batch rows.
- **Per-Product Batch Support** — Each product tracks a single batch with expiry date, quantity, purchase price, and variant-level quantity distribution.
- **Variant Support** — Products with Salla options (colors, sizes, etc.) can distribute batch quantities across individual variants. A dedicated `batch_variants` table tracks variant-level split.
- **Auto-Discount System** — When auto-discounts are enabled in settings, batches transitioning to Yellow status automatically receive a configured discount percentage via the Salla API. Discounts are time-bound with a configurable duration. When the duration expires or the batch sells out, the discount is automatically reverted.
- **Manual Discounts** — Apply discounts manually to specific batches via a modal when auto-discounts are disabled. Includes percentage input, end-date picker, and validation.
- **Discount Types** — Each batch tracks its discount state: `pending` (no discount applied), `auto_discounted` (system-applied), `manually_discounted` (merchant-applied). Types are mutually exclusive.
- **Auto-Hide Expired Products** — Optionally hide products from the Salla store when all their batches are expired. Configurable with a pre-expiry hide window (hide N days before expiry).
- **Category Mapping** — Map Salla product categories with configurable expiry thresholds (long/medium/short-term buckets) to control which products are monitored.
- **Threshold Configuration** — Set custom expiry warning thresholds per category (days before expiry to trigger Yellow status).
- **Real-time Notifications** — Bell-ring notification system for batches transitioning to Yellow or Red status, with read/unread tracking and "mark all as read" support.
- **Product Synchronization** — Sync products from your Salla store via one-click API sync or triggered by Salla webhooks.
- **Search & Filter** — Filter monitored products by status (All / Safe / Approaching / Expired), search by product name or batch code.
- **Expiry Logging** — Detailed activity logging for batch status changes and discount applications.

### Qiasat — Smart Measurement Calculator

- **2D & 3D Measurement Calculation** — Toggle per-product between 2D (area-based: length × width) and 3D (volume-based: length × width × height) calculation modes via the `dimension_count` field. The toggle button cycles between 2 and 3 dimensions.
- **Waste Percentage** — Configure a waste percentage per product (or inherit from global settings) to account for cutting waste, breakage, or installation buffers. Editable inline per product row.
- **Coverage Per Unit** — Set how many square meters (or volume units) each product unit covers. Supports per-product override or global default inheritance with visual "Global" badge indicator.
- **Active Products Toggle** — Enable/disable products for calculation with instant visual feedback and animated transitions.
- **Active Products Dashboard** — Real-time dashboard showing active products with search and pagination.
- **Global Calculator Settings** — Configure default coverage per unit and default waste percentage that apply to all products unless overridden per product.
- **Product-Level Overrides** — Override coverage, waste percentage, and dimension count on individual products. Each override is visually marked to distinguish from inherited defaults.
- **Salla Sync** — One-click synchronization of products from your Salla store via API.
- **Search & Pagination** — Search and paginate through your product catalog with responsive table layout.
- **Variant Support** — Calculator settings apply at the product level with variant-aware quantity calculations.

---

## Landing Pages

Quantix includes three public-facing pages with a consistent brand identity:

- **Homepage** (`/`) — Full-viewport hero section with parallax purple gradient background, noise texture overlay, orbiting glow blobs, animated split-text headline, and floating product widgets. Below the hero: Features section (three scroll-reveal cards) and Platforms section (Harees & Qiasat platform cards with login links).
- **Privacy Policy** (`/privacy-policy`) — Branded purple gradient hero with 9 content sections in card format, contact emails listing (contact@quantixapp.dev, support@quantixapp.dev, info@quantixapp.dev), and scroll-reveal animations.
- **FAQ** (`/faq`) — Branded purple gradient hero with 5 categorized accordion sections (General, Harees, Qiasat, Account & Billing, Security & Privacy), scroll-reveal animations, and a "Still have questions?" CTA section.

All three pages share a consistent design system: light lavender (`#F8F7FF`) section backgrounds, white cards with purple-tinted borders and shadows, the same Navbar (with route-based active state and mobile full-screen overlay menu) and Footer (4-column grid with contact emails and navigation links). Fully bilingual Arabic/English with RTL support.

---

## Batch Lifecycle

Batches in Harees progress through the following lifecycle:

```
                    ┌─────────────────────┐
                    │  Green (Safe)        │
                    │  status: 'green'     │
                    │  discount: 'pending' │
                    └──────────┬──────────┘
                               │ expiry date approaches threshold
                               ▼
                    ┌─────────────────────┐
                    │  Yellow (Approaching)│
                    │  status: 'yellow'   │
                    │  discount: varies   │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Auto-discount ON     │    │ Auto-discount OFF    │
    │ → auto_discounted    │    │ → pending (manual    │
    │   discount applied   │    │   discount available)│
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               ▼                           ▼
                    ┌─────────────────────┐
                    │  Red (Expired)       │
                    │  status: 'red'      │
                    └─────────────────────┘
```

### Statuses

- **Green (`green`)** — The batch has not yet reached the warning threshold. No discount is applicable. Inventory is stable.
- **Yellow (`yellow`)** — The batch is within the configured warning threshold (days before expiry). If auto-discounts are enabled, the system applies a discount automatically. If disabled, a manual discount can be applied.
- **Red (`red`)** — The batch has passed its expiry date. Requires immediate action.

### Discount Types

- **Pending (`pending`)** — No discount has been applied. The batch is eligible for auto-discount (if enabled) or manual discount.
- **Auto-Discounted (`auto_discounted`)** — The system automatically applied the configured discount percentage via the Salla API when the batch entered Yellow status. The discount has a configurable duration. When the duration expires or the batch is sold/removed, the discount is reverted.
- **Manually Discounted (`manually_discounted`)** — A merchant applied a discount manually via the discount modal. This overrides auto-discount behavior and prevents future auto-discount processing.

---

## Auto-Discount Workflow

1. **Configuration** — Merchant sets the auto-discount percentage, discount duration (days), and warning threshold in the Batch Settings page.
2. **Detection** — `CheckBatchExpiryJob` (scheduled via Laravel console kernel) checks all monitored batches daily. Batches whose remaining days fall below the threshold are marked Yellow.
3. **Processing** — `ApplyAutoDiscountToPendingBatches` job processes eligible Yellow batches with auto-discounts enabled:
   - Calculates the discounted price based on the configured percentage.
   - Calls the Salla API to update the product variant price.
   - Records the `applied_sale_price` on the batch.
   - Sets discount type to `auto_discounted`.
4. **Revert** — When the discount duration expires, or when the batch sells out or is removed, the discount is automatically reverted and the original price is restored via the Salla API.
5. **Manual Override** — If auto-discounts are disabled, a "Manual Discount" button appears on Yellow batches, opening a modal for percentage and end-date input.

---

## Project Structure

### Backend (Laravel)

```
app/
├── Actions/                     # Action classes (organized by domain)
│   ├── App/ Brand/ Cart/ Category/ Customer/ Miscellaneous/
│   ├── Order/ Product/ Shipping/ Specialoffer/ Store/
├── Console/
│   └── Commands/                # Artisan commands
│       ├── FetchSallaProducts.php
│       ├── Setup.php
│       └── ServeRemoteCommand.php
├── Exceptions/                  # Exception handler
├── Http/
│   ├── Controllers/
│   │   ├── Harees/              # Harees controllers (Dashboard, Product, Discount, etc.)
│   │   ├── Mustashar/           # Qiasat controllers (Dashboard, Settings, Product)
│   │   ├── Auth/                # Authentication controllers (Salla OAuth, Login, etc.)
│   │   ├── WebhookController    # Salla webhook handler
│   │   └── SallaWebhookController
│   ├── Middleware/               # Custom middleware (auth, admin, CSRF, etc.)
│   ├── Requests/                # Form request validation
│   └── Resources/               # API resource transformers
├── Jobs/                        # Queue jobs
│   ├── Harees/
│   ├── FetchProductsJob         # Syncs products from Salla
│   ├── CheckBatchExpiryJob      # Checks and updates batch expiry statuses
│   └── ApplyAutoDiscountToPendingBatches  # Applies auto-discounts
├── Models/                      # Eloquent models
│   ├── ActivityLog.php
│   ├── Batch.php
│   ├── BatchDiscount.php
│   ├── BatchSetting.php
│   ├── BatchVariant.php
│   ├── CategoryMapping.php
│   ├── Merchant.php
│   ├── MustasharSetting.php
│   ├── Notification.php
│   ├── Product.php
│   ├── ProductImage.php
│   ├── ProductMustashar.php
│   └── SallaApp.php
├── Notifications/               # Notification classes
├── Policies/                    # Authorization policies
├── Providers/                   # Service providers
└── Services/
    └── SallaApiService.php      # Salla REST API integration

routes/
├── web.php                      # Web routes (Inertia pages, Harees/Qiasat)
├── api.php                      # API routes (Harees/Qiasat REST endpoints)
├── console.php                  # Console route bindings
└── channels.php                 # Broadcasting channels

config/                          # Application configuration
database/
├── migrations/                  # 46 database migration files
├── factories/                   # Model factories
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
│   │   │   └── UI/               # Card, ProductAvatar, SplitText, Reveal
│   │   ├── Harees/               # Harees-specific components
│   │   │   ├── Dashboard/        # MonitoredProductsTable, ProductRow, BatchRow
│   │   │   ├── Products/         # InventoryProductRow, InventoryTable
│   │   │   ├── Settings/         # ThresholdCard, AutomationCard, CategoryMappingCard, DiscountSettingsCard
│   │   │   ├── ExpiryModal.jsx
│   │   │   ├── DiscountModal.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── Mustashar/            # Qiasat-specific components
│   │   │   ├── ProductTable.jsx
│   │   │   ├── ProductRow.jsx    # Inline editing: coverage, waste %, dimension toggle (2D/3D)
│   │   │   └── SettingsForm.jsx  # Global coverage & waste settings
│   │   ├── UI/                   # Generic UI components
│   │   └── Welcome/              # Landing page components
│   │       ├── Navbar.jsx
│   │       ├── Footer.jsx
│   │       ├── hero/
│   │       │   ├── HeroSection.jsx
│   │       │   └── HeroRight.jsx
│   │       └── sections/
│   │           ├── FeatureSection.jsx
│   │           └── PlatformsSection.jsx
│   ├── Context/                  # React contexts
│   ├── Hooks/                    # Custom React hooks (useProducts, useToggleWithToast, etc.)
│   ├── Layouts/                  # Page layouts (Guest, Login, App, Instructions)
│   ├── Pages/                    # Inertia page components
│   │   ├── Harees/               # Dashboard, Products, Settings, Login, Instructions
│   │   ├── Mustashar/            # Dashboard, Products, Settings, Login, Instructions
│   │   ├── Welcome.jsx           # Landing page
│   │   ├── PrivacyPolicy.jsx     # Privacy Policy page
│   │   └── FAQ.jsx               # FAQ page
│   ├── services/                 # API client & service modules
│   ├── constants/                # Shared constants (calculator validation rules)
│   ├── styles/                   # Global styles (injected CSS with brand variables)
│   └── translations/             # i18n JSON files (8 namespaces)
│       ├── welcome/              # Landing page (en + ar)
│       ├── privacy/              # Privacy Policy (en + ar)
│       ├── faq/                  # FAQ (en + ar)
│       ├── harees/               # Harees app (en + ar)
│       ├── harees-login/         # Harees login page (en + ar)
│       ├── mustashar/            # Qiasat app (en + ar)
│       ├── mustashar-login/      # Qiasat login page (en + ar)
│       └── shared/               # Shared UI translations (en + ar)
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
- A Salla merchant account with registered applications (Harees and/or Qiasat)

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

# 6. (Optional) Seed test data
php artisan db:seed

# 7. Build frontend assets
npm run build

# 8. Start the development server
php artisan serve
# In a separate terminal for hot-reload:
npm run dev
# In a third terminal for queue processing:
php artisan queue:work
```

### Route Caching

```bash
php artisan route:clear
php artisan route:cache
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_NAME` | Application name | Yes |
| `APP_ENV` | Environment (`local`, `production`) | Yes |
| `APP_KEY` | Laravel application key | Yes |
| `APP_DEBUG` | Enable/disable debug mode | Yes |
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

---

## Queue Jobs

### FetchProductsJob

Synchronizes products from a merchant's Salla store into the local database. Handles pagination through Salla's API, creates/updates product records, processes product images, and handles product options/variants. Dispatched on-demand via the sync button in the UI or triggered by the `salla/products/updated` webhook.

### CheckBatchExpiryJob

Periodic job (typically scheduled via the Laravel console kernel at `00:00` daily) that checks all monitored batches against their configured thresholds. Updates batch status to `yellow` (approaching) or `red` (expired) based on the number of days remaining. Triggers notification creation for status transitions.

### ApplyAutoDiscountToPendingBatches

Processes Yellow-status batches with auto-discounts enabled. For each eligible batch, calculates and applies the configured discount percentage via the Salla API, records the `applied_sale_price`, and sets discount type to `auto_discounted`. Reverts discounts when the configured duration expires.

---

## API Endpoints

### Harees — Inventory Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/harees/api/products` | List monitored products with batch data |
| `POST` | `/harees/api/products/sync` | Trigger product sync from Salla |
| `GET` | `/harees/api/stats` | Get dashboard statistics (counts by status) |
| `GET` | `/harees/api/settings` | Get batch/inventory settings |
| `POST` | `/harees/api/settings` | Update batch/inventory settings |
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
| `POST` | `/mustashar/api/products/{id}/coverage` | Update product coverage per unit |
| `POST` | `/mustashar/api/products/{id}/waste` | Update product waste percentage |
| `POST` | `/mustashar/api/products/{id}/dimension` | Toggle 2D/3D dimension mode |
| `GET` | `/mustashar/api/settings` | Get global calculator settings |
| `POST` | `/mustashar/api/settings` | Update global calculator settings |
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
- **`salla/app/uninstalled`** — Handles app uninstallation (merchant deauthorization and cleanup).

All webhook requests are verified using the configured `WEBHOOK_SECRET` before processing. Webhook endpoints are exempt from CSRF protection (configured in `VerifyCsrfToken` middleware).

### Sync Flow

1. Merchant clicks "Sync" button in the UI or Salla triggers a product update webhook.
2. Backend dispatches `FetchProductsJob` to the queue.
3. The job calls Salla's REST API to fetch all products with pagination.
4. Products are created or updated in the local database with images, options, and variant data.
5. For Harees: existing batches are preserved and linked to synced products.
6. For Qiasat: products become available for measurement configuration and calculation.

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **Laravel 11** | PHP backend framework |
| **React 18** | Frontend UI library |
| **Inertia.js** | Single-page app bridge (no full-page reloads) |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Vite** | Frontend build tool |
| **Framer Motion** | Animation library (scroll-reveal, accordion, parallax) |
| **MySQL** | Relational database |
| **Laravel Queue (Database)** | Async job processing |
| **Laravel Sanctum** | API token authentication |
| **Salla REST API** | E-commerce platform integration |
| **Salla Webhooks** | Real-time event updates |
| **i18next + react-i18next** | Internationalization (Arabic/English, 8 namespaces) |
| **TanStack React Query** | Server state management & caching |
| **React Hot Toast** | Toast notifications |
| **Cloudinary** | Image CDN |
| **Lucide React** | Icon library |
| **Guzzle HTTP** | PHP HTTP client for Salla API calls |
| **Ziggy** | Laravel route helper for Inertia |

---

## Contact

For general inquiries, partnerships, and collaboration requests:

- **General Inquiries** — [contact@quantixapp.dev](mailto:contact@quantixapp.dev)
- **Technical Support** — [support@quantixapp.dev](mailto:support@quantixapp.dev)
- **Information** — [info@quantixapp.dev](mailto:info@quantixapp.dev)

---

## Developers

### Project Leader

Ahmad Kamal
[ahmadalikamal11@gmail.com](mailto:ahmadalikamal11@gmail.com)

### Team Members

Ghala Alsaedi — [ghalalsaedi@gmail.com](mailto:ghalalsaedi@gmail.com)

Raneem Alqurashi — [r0908161@gmail.com](mailto:r0908161@gmail.com)

Jumana Alsaedi — [jmana.alsaedi@gmail.com](mailto:jmana.alsaedi@gmail.com)
