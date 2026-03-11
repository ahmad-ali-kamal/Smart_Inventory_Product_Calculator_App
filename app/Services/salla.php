<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Salla OAuth Configuration
    |--------------------------------------------------------------------------
    */

    'client_id' => env('SALLA_CLIENT_ID'),
    'client_secret' => env('SALLA_CLIENT_SECRET'),
    'redirect_uri' => env('SALLA_REDIRECT_URI', env('APP_URL') . '/auth/salla/callback'),

    /*
    |--------------------------------------------------------------------------
    | Salla OAuth URLs
    |--------------------------------------------------------------------------
    */

    'authorization_url' => 'https://accounts.salla.sa/oauth2/authorize',
    'token_url' => 'https://accounts.salla.sa/oauth2/token',
    'api_url' => 'https://api.salla.dev/admin/v2',

    /*
    |--------------------------------------------------------------------------
    | Salla Webhooks
    |--------------------------------------------------------------------------
    */

    'webhook_secret' => env('SALLA_WEBHOOK_SECRET'),

];