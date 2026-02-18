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
        /* =============================================
           TOKENS & BASE — shared across all auth pages
        ============================================= */
        :root {
            --mauve:       hsl(282, 45%, 55%);
            --mauve-light: hsl(282, 60%, 85%);
            --mauve-deep:  hsl(282, 50%, 40%);
            --apricot:      hsl(25, 85%, 60%);
            --apricot-light:hsl(25, 90%, 85%);
            --apricot-deep: hsl(25, 70%, 45%);
            --fg:   hsl(280, 20%, 18%);
            --muted:hsl(280, 10%, 40%);
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
            font-family: 'DM Sans', sans-serif;
            color: var(--fg);
            background: linear-gradient(135deg,
                hsl(290,40%,92%) 0%,
                hsl(300,30%,90%) 25%,
                hsl(20,60%,90%)  50%,
                hsl(25,70%,88%)  75%,
                hsl(290,35%,90%) 100%);
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
        }

        .font-serif { font-family: 'Playfair Display', serif; }

        /* =============================================
           GRAIN
        ============================================= */
        .grain {
            position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            background-size: 200px 200px;
        }

        /* =============================================
           ORBS
        ============================================= */
        .orb {
            position: fixed; border-radius: 50%;
            filter: blur(80px); opacity: 0; pointer-events: none;
            animation: orb-enter 1.2s ease-out forwards;
        }
        .orb-1 {
            width: 400px; height: 400px;
            background: radial-gradient(circle, hsla(282,45%,65%,0.35), transparent 70%);
            top: -100px; left: -100px; animation-delay: 0s;
        }
        .orb-2 {
            width: 350px; height: 350px;
            background: radial-gradient(circle, hsla(25,85%,65%,0.3), transparent 70%);
            bottom: -80px; right: -80px; animation-delay: 0.2s;
        }
        .orb-3 {
            width: 250px; height: 250px;
            background: radial-gradient(circle, hsla(282,40%,70%,0.2), transparent 70%);
            top: 40%; left: 60%; animation-delay: 0.4s;
        }
        @keyframes orb-enter {
            0%   { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }

        /* =============================================
           CARD
        ============================================= */
        .login-card {
            background: hsla(0,0%,100%,0.18);
            backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
            border: 1px solid hsla(0,0%,100%,0.45);
            box-shadow:
                0 32px 64px -12px hsla(282,45%,40%,0.15),
                0 0 0 1px hsla(0,0%,100%,0.1) inset,
                0 2px 0 hsla(0,0%,100%,0.6) inset;
            border-radius: 2.5rem;
            opacity: 0; transform: translateY(24px) scale(0.98);
            animation: card-enter 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
        }
        @keyframes card-enter {
            0%   { opacity: 0; transform: translateY(24px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* =============================================
           LOGO ICON
        ============================================= */
        .logo-icon {
            width: 3.5rem; height: 3.5rem;
            background: linear-gradient(135deg, var(--mauve), var(--mauve-deep));
            border-radius: 1.25rem;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 24px hsla(282,45%,55%,0.4), 0 2px 0 hsla(0,0%,100%,0.3) inset;
            opacity: 0; position: relative;
            animation: logo-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards;
        }
        .logo-icon::after {
            content: ''; position: absolute; inset: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, hsla(0,0%,100%,0.2), transparent);
        }
        @keyframes logo-drop {
            0%   { opacity: 0; transform: translateY(-12px) scale(0.8); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* =============================================
           INPUTS
        ============================================= */
        .input-group { position: relative; opacity: 0; }
        .input-group.ig-1 { animation: fade-up 0.5s ease-out 0.95s forwards; }
        .input-group.ig-2 { animation: fade-up 0.5s ease-out 1.05s forwards; }

        .input-field {
            width: 100%;
            padding: 1rem 3rem 1rem 3rem;
            background: hsla(0,0%,100%,0.5);
            border: 1.5px solid hsla(0,0%,100%,0.6);
            border-radius: 1rem;
            font-size: 0.875rem;
            font-family: 'DM Sans', sans-serif;
            color: var(--fg); outline: none;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .input-field::placeholder { color: var(--muted); }
        .input-field:focus {
            background: hsla(0,0%,100%,0.75);
            border-color: var(--mauve);
            box-shadow: 0 0 0 4px hsla(282,45%,55%,0.12), 0 4px 12px hsla(282,45%,55%,0.1);
            transform: translateY(-1px);
        }

        .input-icon-left {
            position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
            color: var(--muted); font-size: 1rem; pointer-events: none; transition: color 0.2s;
        }
        .input-group:focus-within .input-icon-left { color: var(--mauve); }

        .eye-toggle {
            position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
            color: var(--muted); font-size: 1rem; cursor: pointer;
            background: none; border: none; padding: 0; line-height: 1; transition: color 0.2s;
        }
        .eye-toggle:hover { color: var(--mauve); }

        /* =============================================
           BUTTON
        ============================================= */
        .btn-signin {
            width: 100%; padding: 1rem;
            background: linear-gradient(135deg, var(--fg), hsl(280,25%,22%));
            color: #fff; border: none; border-radius: 1rem;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.9rem; font-weight: 700; letter-spacing: 0.02em;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 16px hsla(280,25%,18%,0.35);
            opacity: 0; animation: fade-up 0.5s ease-out 1.15s forwards;
            margin-top: 0.5rem;
        }
        .btn-signin:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px hsla(282,45%,55%,0.25);
        }
        .btn-signin:active { transform: translateY(0px) scale(0.98); }
        .btn-arrow { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .btn-signin:hover .btn-arrow { transform: translateX(2px); }

        /* =============================================
           TYPOGRAPHY HELPERS
        ============================================= */
        .login-title   { opacity: 0; animation: fade-up 0.5s ease-out 0.8s  forwards; }
        .divider-line  { opacity: 0; animation: fade-up 0.5s ease-out 1.25s forwards; }
        .register-link { opacity: 0; animation: fade-up 0.5s ease-out 1.3s  forwards; }
        .register-link a {
            color: var(--mauve); font-weight: 600; text-decoration: none; position: relative;
        }
        .register-link a::after {
            content: ''; position: absolute; bottom: -1px; left: 0;
            width: 0%; height: 1.5px; background: var(--mauve); transition: width 0.25s ease;
        }
        .register-link a:hover::after { width: 100%; }

        /* =============================================
           ALERTS
        ============================================= */
        .alert-success {
            background: hsla(150,60%,40%,0.1);
            border: 1px solid hsla(150,60%,40%,0.25);
            border-radius: 1rem;
            padding: 0.875rem 1rem;
            margin-bottom: 1rem;
            font-size: 0.82rem;
            color: hsl(150, 45%, 22%);
            display: flex; align-items: center; gap: 0.5rem;
            opacity: 0; animation: fade-up 0.5s ease-out 0.9s forwards;
        }

        /* =============================================
           VERIFY PAGE HELPERS
        ============================================= */
        .verify-msg {
            opacity: 0; animation: fade-up 0.5s ease-out 0.95s forwards;
            font-size: 0.875rem; color: var(--muted);
            line-height: 1.65; text-align: center;
            margin-bottom: 1.5rem;
        }
        .back-link { opacity: 0; animation: fade-up 0.5s ease-out 1.15s forwards; }
        .back-link a {
            color: var(--muted); font-size: 0.8rem; text-decoration: none;
            display: inline-flex; align-items: center; gap: 0.4rem;
            transition: color 0.2s;
        }
        .back-link a:hover { color: var(--mauve); }

        /* =============================================
           KEYFRAMES
        ============================================= */
        @keyframes fade-up {
            0%   { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    </style>

    @stack('styles')
</head>
<body>

    {{-- Shared background elements --}}
    <div class="grain"></div>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    @yield('content')

    @stack('scripts')
</body>
</html>