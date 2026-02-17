@extends('layouts.app')

@section('content')

<section class="hero-section">

    {{-- Floating background icons --}}
    <div class="floating-icons" id="hero-icons"></div>

    <div class="relative text-center mx-auto" style="max-width:48rem; z-index:10;">
        <h1 class="font-serif fade-in text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span class="gradient-text">Manage with Vision</span>
        </h1>
        <p class="fade-in delay-1 text-lg md:text-xl mb-10 mx-auto" style="color:var(--muted); max-width:36rem">
            Precision in calculations. Control in inventory.<br>
            Built for modern merchants.
        </p>
        <div class="fade-in delay-2 flex flex-col sm:flex-row items-center justify-center gap-4">
           <a href="#tools" class="btn-hero-primary">Explore</a>
        </div>
    </div>

</section>

<section id="features" class="py-32 px-6">
    <div class="mx-auto" style="max-width:64rem">

        <h2 class="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Precision &amp; Strategic Control
        </h2>
        <p class="text-center mb-16 mx-auto" style="color:var(--muted); max-width:32rem">
            Less guessing. More knowing.
            Lean tools for lean businesses.
        </p>

        <div class="grid md:grid-cols-3 gap-6">

            {{-- Feature 1: precision = bullseye / crosshair --}}
            <div class="feature-card glass">
                <div class="feature-icon fi-mauve">
                    <i class="bi bi-crosshair" style="font-size:1.5rem; color:var(--mauve)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Precision-Driven Calculations</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Accurate quantity estimation powered by your own business rules — reducing guesswork and improving customer satisfaction.
                </p>
            </div>

            {{-- Feature 2:hourglass --}}
            <div class="feature-card glass">
                <div class="feature-icon fi-apricot">
                    <i class="bi bi-hourglass-split" style="font-size:1.5rem; color:var(--apricot)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Expiry-Aware Inventory Control</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Monitor batches, detect risk early, and act before products turn into losses.
                </p>
            </div>

            {{-- Feature 3:  graph up --}}
            <div class="feature-card glass">
                <div class="feature-icon fi-mauve">
                    <i class="bi bi-graph-up-arrow" style="font-size:1.5rem; color:var(--apricot-deep)"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Maximized Profitability</h3>
                <p style="font-size:.875rem; color:var(--muted); line-height:1.6">
                    Bridge precision and real-time inventory to optimize profit and eliminate preventable loss.
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

            {{-- Inventory --}}
            <div class="op-card glass inventory">
                <div class="op-icon">
                    <i class="bi bi-boxes" style="font-size:1.75rem; color:var(--apricot)"></i>
                </div>
                <h3 class="font-serif text-2xl font-bold mb-3">Inventory Management</h3>
                <p class="mb-6" style="color:var(--muted); line-height:1.6">
                    See the date. Control the fate.<br>
                    Monitor time-sensitive inventory and prevent avoidable loss
                    with smart, expiry-aware action.
                </p>
                {{-- ✅ تم التعديل: التوجيه لداشبورد المخزون --}}
                <a href="{{ route('inventory.dashboard') }}" class="btn-apricot">
                    Manage Inventory <i class="bi bi-chevron-right"></i>
                </a>
            </div>

            {{-- Calculator --}}
            <div class="op-card glass calculator">
                <div class="op-icon">
                    <i class="bi bi-calculator" style="font-size:1.75rem; color:var(--mauve)"></i>
                </div>
                <h3 class="font-serif text-2xl font-bold mb-3">Smart Calculator</h3>
                <p class="mb-6" style="color:var(--muted); line-height:1.6">
                    Stop the guess, clear the mess.<br>
                    Define your calculation logic once and apply it across selected products —
                    ensuring accurate quantities, every time.
                </p>
                {{-- ✅ تم التعديل: التوجيه لداشبورد الحاسبة --}}
                <a href="{{ route('calculator.dashboard') }}" class="btn-mauve">
                    Open Calculator <i class="bi bi-chevron-right"></i>
                </a>
            </div>

        </div>
    </div>
</section>

<script>
    const heroIcons = document.getElementById('hero-icons');

    const calcIcons  = ['bi-calculator','bi-percent','bi-tags','bi-plus-slash-minus'];
    const invIcons   = ['bi-box-seam','bi-bar-chart-line','bi-truck','bi-layers'];
    const anims      = ['anim-slow','anim-medium','anim-fast'];

    calcIcons.forEach((ic, i) => {
        const div = document.createElement('div');
        div.className = `floating-icon icon-mauve ${anims[i % 3]}`;
        div.innerHTML = `<i class="bi ${ic}" style="font-size:${1.5 + Math.random()}rem"></i>`;
        div.style.left = (2 + Math.random() * 13) + '%';
        div.style.top  = (15 + i * 20 + Math.random() * 10) + '%';
        div.style.animationDelay = (Math.random() * 5) + 's';
        heroIcons.appendChild(div);
    });

    invIcons.forEach((ic, i) => {
        const div = document.createElement('div');
        div.className = `floating-icon icon-apricot ${anims[i % 3]}`;
        div.innerHTML = `<i class="bi ${ic}" style="font-size:${1.5 + Math.random()}rem"></i>`;
        div.style.left = (85 + Math.random() * 13) + '%';
        div.style.top  = (15 + i * 20 + Math.random() * 10) + '%';
        div.style.animationDelay = (Math.random() * 5) + 's';
        heroIcons.appendChild(div);
    });
</script>

@endsection