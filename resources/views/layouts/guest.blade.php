<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'MerchantTools') }}</title>

    <script src="{{ asset('js/app.js') }}" defer></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- DaisyUI + Tailwind -->
    <link href="https://cdn.jsdelivr.net/npm/daisyui@1.14.5/dist/full.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2/dist/tailwind.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <style>
        :root {
            --mauve: hsl(282, 45%, 55%);
            --mauve-light: hsl(282, 60%, 85%);
            --mauve-deep: hsl(282, 50%, 40%);
            --apricot: hsl(25, 85%, 60%);
            --apricot-light: hsl(25, 90%, 85%);
            --apricot-deep: hsl(25, 70%, 45%);
            --fg: hsl(280, 20%, 18%);
            --muted: hsl(280, 10%, 40%);
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
            font-family: 'DM Sans', sans-serif;
            color: var(--fg);
            /* ✅ نفس خلفية الهوم بالضبط */
            background: linear-gradient(135deg,
                hsl(290,40%,92%) 0%,
                hsl(300,30%,90%) 25%,
                hsl(20,60%,90%) 50%,
                hsl(25,70%,88%) 75%,
                hsl(290,35%,90%) 100%);
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
        }

        .font-serif { font-family: 'Playfair Display', serif; }

        .glass {
            background: hsla(0,0%,100%,0.15);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid hsla(0,0%,100%,0.3);
            box-shadow: 0 8px 32px hsla(282,45%,55%,0.1);
        }
    </style>
</head>
<body>

    @yield('content')

</body>
</html>