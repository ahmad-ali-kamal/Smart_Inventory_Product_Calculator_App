<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain'   => env('MAILGUN_DOMAIN'),
        'secret'   => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Salla OAuth Integration (Multi-App Support)
    |--------------------------------------------------------------------------
    */

    // 1. تطبيق المستشار (Calculator App)
    'salla_calculator' => [
        'client_id'      => env('SALLA_CALCULATOR_CLIENT_ID'),
        'client_secret'  => env('SALLA_CALCULATOR_CLIENT_SECRET'),
        'webhook_secret' => env('SALLA_CALCULATOR_WEBHOOK_SECRET'),
        'redirect'       => env('SALLA_OAUTH_CALLBACK_URL'),
    ],

    // 2. تطبيق حريص (Management / Inventory App)
    'salla_management' => [
        'client_id'      => env('SALLA_MANAGEMENT_CLIENT_ID'),
        'client_secret'  => env('SALLA_MANAGEMENT_CLIENT_SECRET'),
        'webhook_secret' => env('SALLA_MANAGEMENT_WEBHOOK_SECRET'),
        'redirect'       => env('SALLA_OAUTH_CALLBACK_URL'),
    ],

    // الإعداد الافتراضي (للتوافق مع الأكواد القديمة إن وجدت)
    'salla' => [
        'client_id'          => env('SALLA_OAUTH_CLIENT_ID'),
        'client_secret'      => env('SALLA_OAUTH_CLIENT_SECRET'),
        'callback_url'       => env('SALLA_OAUTH_CALLBACK_URL'),
        'webhook_secret'     => env('SALLA_WEBHOOK_SECRET'),
        'authorization_mode' => env('SALLA_AUTHORIZATION_MODE', 'easy'),
    ],

];