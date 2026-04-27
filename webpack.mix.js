const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | CSS Files:
 |   app.css       → layouts/app.blade.php       (welcome page)
 |   guest.css     → layouts/guest.blade.php     (login page)
 |   calcapp.css   → layouts/calcapp.blade.php   (calculator tool)
 |   expiryapp.css → layouts/expiryapp.blade.php (expiry tool — كل styles فيه)
 |
 | JS Files:
 |   app.js            → shared
 |   products.js       → calculator products page
 |   settings.js       → calculator settings page
 |   inv-expiryform.js → expiry form partial
 |   inv-dashboard.js  → inventory dashboard
 |   inv-products.js   → inventory products
 |   inv-settings.js   → inventory settings
 |
 */

const postCssPlugins = [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
];

mix
    // ── Shared JS ──
    .js('resources/js/app.js',            'public/js')

    // ── Calculator JS ──
    .js('resources/js/products.js',       'public/js')
    .js('resources/js/settings.js',       'public/js')
    // ── Inventory JS ──
    mix.js('resources/js/inventory-dashboard.js', 'public/js')
       .js('resources/js/inventory-settings.js', 'public/js')
       .js('resources/js/inventory-products.js', 'public/js')
       .js('resources/js/inventory-discountform.js', 'public/js')
       .js('resources/js/inventory-dateform.js', 'public/js')
       .js('resources/js/notifications.js', 'public/js')

    // ── CSS ──
    .postCss('resources/css/app.css',       'public/css', postCssPlugins)
    .postCss('resources/css/guest.css',     'public/css', postCssPlugins)
    .postCss('resources/css/calcapp.css',   'public/css', postCssPlugins)
    .postCss('resources/css/expiryapp.css', 'public/css', postCssPlugins)
    .postCss('resources/css/shared.css', 'public/css', postCssPlugins);