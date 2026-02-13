Salla Merchant App
Smart Inventory Management & Calculator for Salla Merchants

An advanced Laravel application designed for Salla merchants that provides smart inventory tracking and automated quantity calculations.

✨ Features

⏰ Smart Inventory Management

Track product expiry dates

Automatically schedule discounts

Protect safe products from unnecessary discounts

🧮 Smart Calculator

Automatically calculate required quantities

Apply waste percentage

Enable per-product customization

📋 Requirements

PHP 8.1+

Composer

Node.js 16+ & npm

MySQL 8.0+ or MariaDB 10.3+

Salla Merchant Account

🔧 Installation
1️⃣ Clone the Repository
git clone <https://github.com/ahmad-ali-kamal/Smart_Inventory_Product_Calculator_App>
cd salla-merchant-app

2️⃣ Install Dependencies
# Install PHP dependencies
composer install

# Install JS dependencies
npm install

3️⃣ Environment Setup
cp .env.example .env
php artisan key:generate

4️⃣ Configure Database

Update your .env file:

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=salla_merchant_app
DB_USERNAME=root
DB_PASSWORD=

5️⃣ Configure Salla OAuth

Go to Salla Developers Dashboard

Create a new application

Get your Client ID and Client Secret

Add them to .env:

SALLA_CLIENT_ID=your_client_id
SALLA_CLIENT_SECRET=your_client_secret
SALLA_REDIRECT_URI=http://localhost:8000/auth/salla/callback

6️⃣ Run Migrations
php artisan migrate

7️⃣ Compile Assets
# Development
npm run dev

# Production
npm run prod

8️⃣ Start the Server
php artisan serve


App will run at:

http://localhost:8000

📁 Project Structure
app/
 ├── Models/             # Eloquent Models
 ├── Http/Controllers/   # Controllers
 ├── Services/           # Business Logic
 ├── Actions/            # Lorisleiva Actions
 └── Jobs/               # Background Jobs

database/
 └── migrations/         # Database Migrations

resources/
 ├── js/
 │   ├── Pages/          # Vue (Inertia) Pages
 │   └── Components/     # Reusable Components
 └── css/                # Styles

routes/
 ├── web.php             # Web Routes
 └── api.php             # API Routes

config/
 └── salla.php           # Salla Configuration

🎯 Core Features
1️⃣ Smart Inventory Management
Expiry Tracking

🟢 Green — Safe (60+ days remaining)

🟡 Yellow — Warning (15–60 days remaining)

🔴 Red — Expired or near expiry (< 15 days)

Discount Scheduling

Smart discount suggestions for yellow products

Automatic discount application via Salla API

Protection for green products

Product Actions

Hide expired products

Restock products

Full activity logs

2️⃣ Smart Calculator
General Settings

Coverage per unit (meters / m²)

Waste percentage

Formula
Required Units = (Customer Requirement × (1 + Waste Percentage)) ÷ Coverage per Unit

Application

Enable/disable per product

Automatically displayed on product page

🔄 Background Jobs
Scheduled Jobs (Cron)

Add to crontab:

* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1

Scheduled Tasks

Hourly: Sync products from Salla

Daily: Check near-expiry products

Every 15 minutes: Apply scheduled discounts

Queue Workers
php artisan queue:work --tries=3 --timeout=90

🔐 Security

✅ Encrypted Access Tokens

✅ CSRF Protection

✅ Rate Limiting (Salla API)

✅ Input Validation (Form Requests)

✅ Authorization via Policies

🧪 Testing
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=InventoryTest

📊 Database Tables

merchants

products

product_batches

product_discounts

calculator_settings

product_calculator

activity_logs

🚀 Production Setup
Performance Optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache

composer dump-autoload --optimize

Production Environment Variables
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

QUEUE_CONNECTION=database   # or redis
CACHE_DRIVER=redis          # or memcached

SSL

Ensure HTTPS is enabled on your server.

🐛 Common Issues
Expired Access Token

The app automatically refreshes tokens. Ensure Refresh Token is valid.

Product Sync Failure

Check:

Access Token validity

Salla API rate limits

Logs in storage/logs

📞 Support

Email: support@example.com

Documentation: https://docs.example.com

📝 License

MIT License

👨‍💻 Developer

Developed by []

⚠️ This project uses Salla API v2.
