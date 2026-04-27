@extends('layouts.app')

@section('content')

<section class="hero-section">

    {{-- Floating background icons --}}
    <div class="floating-icons">
        <div class="floating-icon icon-mauve anim-slow"   style="left:2%;  top:15%; animation-delay:0s">  <i class="bi bi-calculator"      style="font-size:2rem"></i></div>
        <div class="floating-icon icon-mauve anim-medium" style="left:6%;  top:35%; animation-delay:1.5s"><i class="bi bi-percent"           style="font-size:1.7rem"></i></div>
        <div class="floating-icon icon-mauve anim-fast"   style="left:10%; top:55%; animation-delay:0.8s"><i class="bi bi-tags"              style="font-size:2.1rem"></i></div>
        <div class="floating-icon icon-mauve anim-slow"   style="left:4%;  top:75%; animation-delay:3s">  <i class="bi bi-plus-slash-minus" style="font-size:1.8rem"></i></div>
        
        <div class="floating-icon icon-apricot anim-medium" style="left:86%; top:15%; animation-delay:0.5s"><i class="bi bi-box-seam"        style="font-size:2rem"></i></div>
        <div class="floating-icon icon-apricot anim-fast"   style="left:90%; top:35%; animation-delay:2s"> <i class="bi bi-bar-chart-line"   style="font-size:1.7rem"></i></div>
        <div class="floating-icon icon-apricot anim-slow"   style="left:88%; top:55%; animation-delay:1s"> <i class="bi bi-truck"            style="font-size:2.1rem"></i></div>
        <div class="floating-icon icon-apricot anim-medium" style="left:92%; top:75%; animation-delay:3.5s"><i class="bi bi-layers"           style="font-size:1.8rem"></i></div>
    </div>

    <div class="relative text-center mx-auto" style="max-width:48rem; z-index:10;">
        <h1 class="font-serif fade-in text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span class="gradient-text">Manage with Vision</span>
        </h1>
        <p class="fade-in delay-1 text-lg md:text-xl mb-10 mx-auto" style="color:var(--muted); max-width:36rem">
            Precision in calculations. Control in inventory.<br>
            Built for modern Salla merchants.
        </p>
        <div class="fade-in delay-2 flex flex-col sm:flex-row items-center justify-center gap-4">
           @if(!auth()->check())
                <a href="{{ route('auth.salla') }}" class="btn-hero-primary">Start Now with Salla</a>
           @else
                <a href="#tools" class="btn-hero-primary">Explore Your Tools</a>
           @endif
        </div>
    </div>

</section>

<section id="features" class="py-32 px-6">
    <div class="mx-auto" style="max-width:64rem">

        <h2 class="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Precision & Strategic Control
        </h2>
        <p class="text-center mb-16 mx-auto" style="color:var(--muted); max-width:32rem">
            Less guessing. More knowing.<br>
            Lean tools for high-growth businesses.
        </p>

        <div class="grid md:grid-cols-3 gap-6">

            <div class="feature-card glass">
                <div class="feature-icon fi-mauve">
                    <i class="bi bi-crosshair" style="font-size:1.5rem; color:var(--mauve)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Precision-Driven Logic</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Accurate quantity estimation powered by your own business rules — reducing waste and cost.
                </p>
            </div>

            <div class="feature-card glass">
                <div class="feature-icon fi-apricot">
                    <i class="bi bi-hourglass-split" style="font-size:1.5rem; color:var(--apricot)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Smart Expiry Control</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Monitor time-sensitive batches and act before products turn into preventable losses.
                </p>
            </div>

            <div class="feature-card glass">
                <div class="feature-icon fi-mauve">
                    <i class="bi bi-graph-up-arrow" style="font-size:1.5rem; color:var(--apricot-deep)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Maximized Profits</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Bridge precision and real-time inventory to optimize margins and eliminate inefficiency.
                </p>
            </div>

        </div>
    </div>
</section>

<section id="tools" class="py-32 px-6">
    <div class="mx-auto" style="max-width:64rem">

        <h2 class="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Your Operational Toolkit
        </h2>
        <p class="text-center mb-16 mx-auto" style="color:var(--muted); max-width:32rem">
            Two specialized tools designed to streamline your merchant workflow.
        </p>

        <div class="grid md:grid-cols-2 gap-8">

            {{-- 1. Harees (Inventory Management) --}}
            @if(!auth()->check() || auth()->user()->has_management)
            <div class="op-card glass inventory">
                <div class="op-icon">
                    <i class="bi bi-shield-check" style="font-size:1.75rem; color:var(--apricot)"></i>
                </div>
                <h3 class="font-serif text-2xl font-bold mb-3">Harees Inventory </h3>
                <p class="mb-6" style="color:var(--muted); line-height:1.6">
                    See the date. Control the fate.<br>
                    Monitor sensitive inventory and prevent loss with our smart automation system.
                </p>
                <a href="{{ route('inventory.dashboard') }}" class="btn-apricot">
                    Enter Harees <i class="bi bi-chevron-right"></i>
                </a>
            </div>
            @endif

            {{-- 2. Al-Mustashar (Smart Calculator) --}}
            @if(!auth()->check() || auth()->user()->has_calculator)
            <div class="op-card glass calculator">
                <div class="op-icon">
                    <i class="bi bi-lightbulb" style="font-size:1.75rem; color:var(--mauve)"></i>
                </div>
                <h3 class="font-serif text-2xl font-bold mb-3">Al-Mustashar Calculator </h3>
                <p class="mb-6" style="color:var(--muted); line-height:1.6">
                    Define your logic. Automate the rest.<br>
                    Configure your business rules once and let Al-Mustashar estimate the perfect quantities.
                </p>
                <a href="{{ route('calculator.dashboard') }}" class="btn-mauve">
                    Open Al-Mustashar <i class="bi bi-chevron-right"></i>
                </a>
            </div>
            @endif

        </div>

        {{-- Edge Case: Logged in but no apps assigned --}}
        @if(auth()->check() && !auth()->user()->has_management && !auth()->user()->has_calculator)
            <div class="text-center p-12 glass rounded-2xl mt-8">
                <p class="text-xl mb-4">It seems you haven't activated any apps yet.</p>
                <a href="https://salla.sa/apps" class="btn-hero-primary">Explore Apps on Salla</a>
            </div>
        @endif

    </div>
</section>

@endsection