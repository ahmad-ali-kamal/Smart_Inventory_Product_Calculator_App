<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>Quantix</title>
    
    @viteReactRefresh
    @vite('resources/js/app.jsx') {{-- نكتفي بملف واحد فقط هنا --}}
    @inertiaHead
</head>
<body class="font-sans antialiased bg-[#0A0A0A] text-white">
    @inertia
</body>
</html>