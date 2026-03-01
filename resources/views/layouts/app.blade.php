<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'MerchantTools') }}</title>

    {{-- Google Fonts: Playfair Display + DM Sans --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    {{-- DaisyUI + Tailwind --}}
<link href="https://cdn.jsdelivr.net/npm/daisyui@1.14.5/dist/full.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2/dist/tailwind.min.css" rel="stylesheet">

    {{-- Bootstrap Icons --}}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    {{-- App styles (compiled via Laravel Mix) --}}
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">

    {{-- Page-specific styles --}}
    @stack('styles')
</head>
<body>

{{-- ========== NAVBAR ========== --}}
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

{{-- Shared JS (navbar scroll + smooth scroll) --}}
<script src="{{ mix('js/app.js') }}"></script>

{{-- Page-specific scripts --}}
@stack('scripts')

</body>
</html>