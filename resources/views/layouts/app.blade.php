<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'MerchantTools') }}</title>

    <script src="{{ asset('js/app.js') }}" defer></script>

    <!-- Google Fonts: Playfair Display + DM Sans -->
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
            background: linear-gradient(135deg,
                hsl(290,40%,92%) 0%,
                hsl(300,30%,90%) 25%,
                hsl(20,60%,90%) 50%,
                hsl(25,70%,88%) 75%,
                hsl(290,35%,90%) 100%);
            background-attachment: fixed;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }

        .font-serif { font-family: 'Playfair Display', serif; }

        /* Glass */
        .glass {
            background: hsla(0,0%,100%,0.15);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid hsla(0,0%,100%,0.3);
            box-shadow: 0 8px 32px hsla(282,45%,55%,0.1);
        }
        .glass-strong {
            background: hsla(0,0%,100%,0.3) !important;
            backdrop-filter: blur(30px) !important;
            -webkit-backdrop-filter: blur(30px) !important;
            border: 1px solid hsla(0,0%,100%,0.4) !important;
        }

        /* ---- NAVBAR ---- */
        #site-navbar {
            position: fixed;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 50;
            width: 95%;
            max-width: 64rem;
            border-radius: 1rem;
            padding: 0.75rem 1.5rem;
            transition: all 0.5s;
        }

        .brand-icon {
            width: 2rem; height: 2rem;
            border-radius: 0.5rem;
            background: var(--mauve);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }

        .btn-nav-text {
            font-size: 0.875rem; font-weight: 500;
            color: var(--muted);
            background: none; border: none; cursor: pointer;
            padding: 0.5rem 1rem;
            transition: color 0.2s;
            text-decoration: none;
        }
        .btn-nav-text:hover { color: var(--fg); }

        .btn-nav-primary {
            font-size: 0.875rem; font-weight: 500;
            background: var(--mauve);
            color: #fff !important; border: none; cursor: pointer;
            padding: 0.5rem 1.25rem;
            border-radius: 0.75rem;
            transition: all 0.2s;
            text-decoration: none;
        }
        .btn-nav-primary:hover { opacity: 0.9; transform: scale(1.05); }

        /* ---- HERO ---- */
        .hero-section {
            position: relative;
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden;
            padding: 6rem 1.5rem 4rem;
        }

        .floating-icons { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .floating-icon {
            position: absolute;
            opacity: 0.15;
        }
        .icon-mauve  { color: var(--mauve-deep); }
        .icon-apricot { color: var(--apricot-deep); }

        @keyframes float-slow {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            33%      { transform: translateY(-15px) rotate(3deg); }
            66%      { transform: translateY(8px) rotate(-2deg); }
        }
        @keyframes float-medium {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            50%     { transform: translateY(-20px) rotate(-5deg); }
        }
        @keyframes float-fast {
            0%,100% { transform: translateY(0px) translateX(0px); }
            25%     { transform: translateY(-10px) translateX(5px); }
            75%     { transform: translateY(5px) translateX(-5px); }
        }
        .anim-slow   { animation: float-slow 8s ease-in-out infinite; }
        .anim-medium { animation: float-medium 6s ease-in-out infinite; }
        .anim-fast   { animation: float-fast 4s ease-in-out infinite; }

        @keyframes fade-in {
            0%   { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .fade-in   { animation: fade-in 0.6s ease-out forwards; }
        .delay-1   { animation-delay: 0.2s; opacity: 0; }
        .delay-2   { animation-delay: 0.4s; opacity: 0; }

        .gradient-text {
            background: linear-gradient(to right, var(--mauve), var(--apricot));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .btn-hero-primary {
            font-size: 1rem; font-weight: 600;
            background: var(--mauve);
            color: #fff; border: none; cursor: pointer;
            padding: 0.875rem 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 20px hsla(282,45%,55%,0.3);
            transition: all 0.2s;
        }
        .btn-hero-primary:hover { opacity: 0.9; transform: scale(1.05); }

        .btn-hero-glass {
            font-size: 1rem; font-weight: 600;
            color: var(--fg);
            border: none; cursor: pointer;
            padding: 0.875rem 2rem;
            border-radius: 1rem;
            transition: all 0.2s;
        }
        .btn-hero-glass:hover { transform: scale(1.05); }

        /* ---- FEATURE CARDS ---- */
        .feature-card {
            border-radius: 1rem;
            padding: 1.75rem;
            transition: all 0.3s;
        }
        .feature-card:hover {
            transform: scale(1.03);
            box-shadow: 0 20px 40px hsla(282,45%,55%,0.15);
        }
        .feature-icon {
            width: 3.5rem; height: 3.5rem;
            border-radius: 0.75rem;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 1.25rem;
        }
        .fi-mauve  { background: var(--mauve-light); }
        .fi-apricot { background: var(--apricot-light); }

        /* ---- OP CARDS ---- */
        .op-card {
            border-radius: 1.5rem;
            padding: 2rem;
            transition: all 0.5s;
            cursor: pointer;
        }
        .op-card:hover { transform: scale(1.02); }
        .op-card.inventory:hover  { box-shadow: 0 0 30px hsla(25,85%,60%,0.3), 0 0 60px hsla(25,85%,60%,0.1); }
        .op-card.calculator:hover { box-shadow: 0 0 30px hsla(282,45%,55%,0.3), 0 0 60px hsla(282,45%,55%,0.1); }

        .op-icon {
            width: 4rem; height: 4rem;
            border-radius: 1rem;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 1.5rem;
            transition: background 0.3s;
        }
        .op-card.inventory  .op-icon { background: hsla(25,85%,60%,0.1); }
        .op-card.inventory:hover  .op-icon { background: hsla(25,85%,60%,0.2); }
        .op-card.calculator .op-icon { background: hsla(282,45%,55%,0.1); }
        .op-card.calculator:hover .op-icon { background: hsla(282,45%,55%,0.2); }

        .btn-apricot {
            display: inline-flex; align-items: center; gap: 0.5rem;
            font-size: 1rem; font-weight: 600;
            background: var(--apricot);
            color: #fff; border: none; cursor: pointer;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-apricot:hover { opacity: 0.9; transform: scale(1.05); }

        .btn-mauve {
            display: inline-flex; align-items: center; gap: 0.5rem;
            font-size: 1rem; font-weight: 600;
            background: var(--mauve);
            color: #fff; border: none; cursor: pointer;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-mauve:hover { opacity: 0.9; transform: scale(1.05); }

        /* ---- FOOTER ---- */
        .site-footer { padding: 3rem 1.5rem; }
        .footer-inner {
            max-width: 64rem; margin: 0 auto;
            border-radius: 1.5rem; padding: 2rem;
        }
    </style>
</head>
<body>

<!-- ========== NAVBAR ========== -->
<nav id="site-navbar" class="glass">
    <div class="flex items-center justify-between">

        {{-- Brand --}}
        <a href="{{ url('/') }}" class="flex items-center gap-2 no-underline" style="color:var(--fg)">
            <div class="brand-icon">
                <i class="bi bi-box text-white" style="font-size:1rem"></i>
            </div>
            <span class="font-semibold text-lg">{{ config('app.name', 'MerchantTools') }}</span>
        </a>
{{-- Auth actions + links --}}
<div class="flex items-center gap-3">
    <div class="hidden md:flex items-center gap-2">
        <a href="#features" class="btn-nav-text">Features</a>
        <a href="#tools"    class="btn-nav-text">Tools</a>
    </div>
            @guest
                @if (Route::has('login'))
                    <a href="{{ route('login') }}" class="btn-nav-primary">Log In</a>
                @endif
            @else
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="cursor-pointer" style="
                        display: inline-flex; align-items: center; gap: 0.4rem;
                        padding: 0.4rem 0.85rem;
                        background: hsla(282,45%,55%,0.12);
                        border: 1.5px solid hsla(282,45%,55%,0.25);
                        border-radius: 0.65rem;
                        font-size: 0.8rem; font-weight: 700;
                        color: hsl(282, 50%, 40%);
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.background='hsl(282,45%,55%)'; this.style.color='white'; this.style.borderColor='hsl(282,45%,55%)';"
                    onmouseout="this.style.background='hsla(282,45%,55%,0.12)'; this.style.color='hsl(282,50%,40%)'; this.style.borderColor='hsla(282,45%,55%,0.25)';">
                        <i class="bi bi-person-circle" style="font-size:0.85rem"></i>
                        {{ auth()->user()->store_info['name'] ?? Auth::user()->name }}
                        <i class="bi bi-chevron-down" style="font-size:0.65rem; opacity:0.7"></i>
                    </label>
                    <ul tabindex="0" class="dropdown-content menu p-1 shadow bg-white rounded-box mt-2" style="min-width:unset; width:auto;">
                        <li>
                            <a href="{{ route('logout') }}"
                               onclick="event.preventDefault(); document.getElementById('logout-form').submit();"
                               style="font-size:0.8rem; font-weight:700; color: hsl(282,50%,40%); display:flex; align-items:center; gap:0.4rem; padding:0.4rem 0.85rem; border-radius:0.65rem; white-space:nowrap;">
                                <i class="bi bi-box-arrow-right" style="font-size:0.8rem;"></i> Logout
                            </a>
                        </li>
                    </ul>
                </div>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" class="hidden">@csrf</form>
            @endguest
        </div>

    </div>
</nav>

{{-- ========== MAIN CONTENT ========== --}}
<main>
    @yield('content')
</main>

{{-- ========== FOOTER ========== --}}
<footer class="site-footer">
    <div class="footer-inner glass flex flex-col md:flex-row items-center justify-between gap-6">

        <div class="flex items-center gap-2">
            <div class="brand-icon">
                <i class="bi bi-box text-white" style="font-size:1rem"></i>
            </div>
            <span class="font-semibold">{{ config('app.name', 'MerchantTools') }}</span>
        </div>

        <p class="text-sm" style="color:var(--muted)">&copy; {{ date('Y') }} MerchantTools. All rights reserved.</p>

        <div class="flex gap-6">
            <a href="#" class="text-sm no-underline transition-colors" style="color:var(--muted)">Privacy</a>
            <a href="#" class="text-sm no-underline transition-colors" style="color:var(--muted)">Terms</a>
            <a href="#" class="text-sm no-underline transition-colors" style="color:var(--muted)">Contact</a>
        </div>

    </div>
</footer>

<script>
    // Navbar scroll effect
    const nav = document.getElementById('site-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('glass-strong');
        } else {
            nav.classList.remove('glass-strong');
        }
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
</script>

</body>
</html>