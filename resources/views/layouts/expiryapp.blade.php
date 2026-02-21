{{-- resources/views/layouts/calcApp.blade.php --}}
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
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- DaisyUI + Tailwind -->
    <link href="https://cdn.jsdelivr.net/npm/daisyui@1.14.5/dist/full.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2/dist/tailwind.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <style>
        /* =============================================
           TOKENS
        ============================================= */
        :root {
    --mauve:        hsl(28, 85%, 55%);
    --mauve-deep:   hsl(28, 85%, 35%);
    --mauve-soft:   hsla(28, 85%, 55%, 0.08);
    --mauve-border: hsla(28, 85%, 55%, 0.2);
    --fg:           hsl(25, 30%, 15%);
    --muted:        hsl(25, 10%, 50%);
}

        *, *::before, *::after { box-sizing: border-box; }

        body {
            font-family: 'DM Sans', sans-serif;
            color: var(--fg);
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;

            /* ── خلفية موف فاتحة جداً ── */
          
    background:
        linear-gradient(135deg,
            hsl(35, 90%, 95%) 0%,
            hsl(30, 80%, 93%) 20%,
            hsl(40, 75%, 94%) 40%,
            hsl(28, 70%, 95%) 60%,
            hsl(35, 80%, 93%) 80%,
            hsl(30, 75%, 95%) 100%
        );
    background-attachment: fixed;

            
        }

        .font-serif { font-family: 'DM Serif Display', serif; }

        /* =============================================
           GRAIN
        ============================================= */
        .grain {
            position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.03;
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
        .orb-1 { background: radial-gradient(circle, hsla(28,70%,70%,0.3), transparent 70%); }
.orb-2 { background: radial-gradient(circle, hsla(40,65%,72%,0.2), transparent 70%); }
.orb-3 { background: radial-gradient(circle, hsla(20,65%,68%,0.18), transparent 70%); }
        @keyframes orb-enter {
            0%   { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
        }

        /* =============================================
           CARD
        ============================================= */
        .login-card {
            background: hsla(0,0%,100%,0.5);
            backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
            border: 1px solid hsla(0,0%,100%,0.65);
            box-shadow:
                0 32px 64px -12px hsla(282,45%,45%,0.12),
                0 0 0 1px hsla(0,0%,100%,0.1) inset,
                0 2px 0 hsla(0,0%,100%,0.7) inset;
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
            box-shadow: 0 8px 24px hsla(282,45%,55%,0.35), 0 2px 0 hsla(0,0%,100%,0.3) inset;
            opacity: 0; position: relative;
            animation: logo-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards;
        }
        .logo-icon::after {
            content: ''; position: absolute; inset: 0; border-radius: inherit;
            background: linear-gradient(135deg, hsla(0,0%,100%,0.22), transparent);
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
            background: hsla(0,0%,100%,0.55);
            border: 1.5px solid hsla(0,0%,100%,0.65);
            border-radius: 1rem;
            font-size: 0.875rem;
            font-family: 'DM Sans', sans-serif;
            color: var(--fg); outline: none;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-field::placeholder { color: var(--muted); }
        .input-field:focus {
            background: hsla(0,0%,100%,0.85);
            border-color: var(--mauve);
            box-shadow: 0 0 0 4px hsla(282,45%,55%,0.12);
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
           FIELD CARDS (settings pages)
        ============================================= */
        .field-card {
            background: hsla(0,0%,100%,0.52);
            border: 1.5px solid hsla(0,0%,100%,0.65);
            border-radius: 1.25rem;
            padding: 1rem 1.25rem;
            opacity: 0;
            transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-card.fc-1 { animation: fade-up 0.5s ease-out 0.95s forwards; }
        .field-card.fc-2 { animation: fade-up 0.5s ease-out 1.05s forwards; }
        .field-card:focus-within {
            border-color: var(--mauve);
            box-shadow: 0 0 0 4px hsla(282,45%,55%,0.1);
            background: hsla(0,0%,100%,0.8);
        }

        .field-label {
            font-size: 0.68rem; font-weight: 700;
            color: var(--muted); letter-spacing: 0.07em;
            text-transform: uppercase; display: block; margin-bottom: 0.5rem;
        }

        .input-row { display: flex; align-items: center; gap: 0.5rem; }
        .input-row input {
            flex: 1; border: none; outline: none; background: transparent;
            font-family: 'DM Sans', sans-serif;
            font-size: 1rem; font-weight: 700; color: var(--fg);
        }
        .input-row input::placeholder { color: var(--muted); font-weight: 400; font-size: 0.875rem; }

        .input-unit {
            font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em;
            background: var(--mauve-soft); color: var(--mauve-deep);
            padding: 0.18rem 0.55rem; border-radius: 0.45rem;
        }

        /* =============================================
           PANELS
        ============================================= */
        .panel-info {
            background: var(--mauve-soft);
            border: 1px solid var(--mauve-border);
            border-radius: 1.1rem; padding: 1rem 1.25rem;
            opacity: 0; animation: fade-up 0.5s ease-out 0.85s forwards;
        }
        .panel-info h4 {
            font-size: 0.78rem; font-weight: 700;
            color: var(--mauve-deep); margin: 0 0 0.3rem;
        }
        .panel-info p { font-size: 0.78rem; color: var(--muted); margin: 0; line-height: 1.55; }

        .panel-live {
            background: hsla(0,0%,100%,0.4);
            border: 1px solid hsla(0,0%,100%,0.6);
            border-radius: 1.1rem; padding: 1.1rem 1.25rem;
            opacity: 0; animation: fade-up 0.5s ease-out 1.1s forwards;
        }
        .panel-live-label {
            font-size: 0.68rem; font-weight: 700; color: var(--muted);
            letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.75rem;
        }

        /* =============================================
           STEP CARDS (onboarding page)
        ============================================= */
        .step-card {
            background: hsla(0,0%,100%,0.52);
            border: 1px solid hsla(0,0%,100%,0.65);
            border-radius: 1.1rem; padding: 1rem 1.25rem;
            transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .step-card:hover {
            transform: translateY(-3px);
            border-color: var(--mauve);
            box-shadow: 0 8px 24px hsla(282,45%,55%,0.1);
        }
        .step-num {
            font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
            color: var(--mauve); text-transform: uppercase; margin-bottom: 0.3rem;
        }
        .step-text { font-size: 0.78rem; color: var(--muted); line-height: 1.5; }

        /* =============================================
           BUTTON
        ============================================= */
        .btn-signin {
            width: 100%; padding: 1rem;
            background: linear-gradient(135deg, var(--fg), hsl(280,25%,24%));
            color: #fff; border: none; border-radius: 1rem;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.9rem; font-weight: 700; letter-spacing: 0.02em;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 16px hsla(280,25%,18%,0.3);
            opacity: 0; animation: fade-up 0.5s ease-out 1.2s forwards;
            margin-top: 0.25rem;
        }
        .btn-signin:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px hsla(282,45%,55%,0.25);
        }
        .btn-signin:active { transform: scale(0.98); }
        .btn-arrow { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .btn-signin:hover .btn-arrow { transform: translateX(2px); }

        /* =============================================
           ALERTS
        ============================================= */
        .alert-success {
            background: hsla(150,60%,40%,0.1);
            border: 1px solid hsla(150,60%,40%,0.25);
            border-radius: 1rem; padding: 0.875rem 1rem;
            margin-bottom: 1rem; font-size: 0.82rem;
            color: hsl(150,45%,22%);
            display: flex; align-items: center; gap: 0.5rem;
            opacity: 0; animation: fade-up 0.5s ease-out 0.9s forwards;
        }

        /* =============================================
           TYPOGRAPHY HELPERS
        ============================================= */
        .login-title  { opacity: 0; animation: fade-up 0.5s ease-out 0.8s  forwards; }
        .page-title   { opacity: 0; animation: fade-up 0.5s ease-out 0.75s forwards; }
        .divider-line { opacity: 0; animation: fade-up 0.5s ease-out 1.25s forwards; }
        .register-link{ opacity: 0; animation: fade-up 0.5s ease-out 1.3s  forwards; }
        .register-link a {
            color: var(--mauve); font-weight: 600; text-decoration: none; position: relative;
        }
        .register-link a::after {
            content: ''; position: absolute; bottom: -1px; left: 0;
            width: 0%; height: 1.5px; background: var(--mauve); transition: width 0.25s ease;
        }
        .register-link a:hover::after { width: 100%; }

        .verify-msg {
            opacity: 0; animation: fade-up 0.5s ease-out 0.95s forwards;
            font-size: 0.875rem; color: var(--muted);
            line-height: 1.65; text-align: center; margin-bottom: 1.5rem;
        }
        .back-link { opacity: 0; animation: fade-up 0.5s ease-out 1.15s forwards; }
        .back-link a {
            color: var(--muted); font-size: 0.8rem; text-decoration: none;
            display: inline-flex; align-items: center; gap: 0.4rem; transition: color 0.2s;
        }
        .back-link a:hover { color: var(--mauve); }

        /* =============================================
           DIVIDER
        ============================================= */
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, hsla(282,35%,65%,0.2), transparent);
            opacity: 0; animation: fade-up 0.5s ease-out 1.1s forwards;
        }

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