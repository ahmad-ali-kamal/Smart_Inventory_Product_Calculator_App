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

    // 1. تطبيق المستشار (Mustashar App)
    'salla_mustashar' => [
        'client_id'      => env('SALLA_MUSTASHAR_CLIENT_ID'),
        'client_secret'  => env('SALLA_MUSTASHAR_CLIENT_SECRET'),
        'webhook_secret' => env('SALLA_MUSTASHAR_WEBHOOK_SECRET'),
        'redirect'       => env('SALLA_OAUTH_CALLBACK_URL'),
    ],

    // 2. تطبيق حريص (Harees App)
    'salla_harees' => [
        'client_id'      => env('SALLA_HAREES_CLIENT_ID'),
        'client_secret'  => env('SALLA_HAREES_CLIENT_SECRET'),
        'webhook_secret' => env('SALLA_HAREES_WEBHOOK_SECRET'),
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

    'quantix' => [
        'harees_url'        => env('HAREES_APP_URL', env('APP_URL', 'http://localhost:8000') . '/harees/login'),
        'qiyast_url'        => env('QIYAST_APP_URL', env('APP_URL', 'http://localhost:8000') . '/qiasat/login'),
        'support_url'       => env('QUANTIX_SUPPORT_URL', 'https://quantixapp.dev/'),
        'harees_support_url'=> env('HAREES_SUPPORT_URL', env('QUANTIX_SUPPORT_URL', 'https://quantixapp.dev/')),
        'qiyast_support_url'=> env('QIYAST_SUPPORT_URL', env('QUANTIX_SUPPORT_URL', 'https://quantixapp.dev/')),
    ],

];