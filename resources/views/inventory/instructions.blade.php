@extends('layouts.expiryApp')
@section('content')

<section class="min-h-screen flex items-center justify-center py-16 px-4"
         style="position: relative; z-index: 10;">

    <div class="w-full max-w-lg">
        <div class="login-card p-10 md:p-12">

            {{-- Header --}}
            <div class="flex flex-col items-center mb-10">
                <div class="logo-icon mb-4">
                    <i class="bi bi-calendar-check text-white" style="font-size: 1.25rem;"></i>
                </div>
                <h1 class="page-title font-serif text-2xl font-bold tracking-tight" style="color: var(--fg)">
                    Merchant<span style="color: var(--orange)">Tools</span>
                </h1>
                <p class="page-title text-xs mt-1" style="color: var(--muted); letter-spacing: 0.08em;">
                    EXPIRY TRACKER
                </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">

                {{-- Info panel --}}
                <div class="panel-info">
                    <h4>Three simple steps</h4>
                    <p>
                        Track product expiry dates intelligently. Set up categories once and let
                        the system monitor everything and suggest optimal discounts automatically.
                    </p>
                </div>

                {{-- Steps --}}
                <div class="step-card" style="opacity:0; animation: fade-up 0.5s ease-out 0.85s forwards;">
                    <div class="step-num">Step 1 — Classify Products</div>
                    <div class="step-text">Categorize your products: long-term, medium-term, or short-term</div>
                </div>

                <div class="step-card" style="opacity:0; animation: fade-up 0.5s ease-out 0.95s forwards;">
                    <div class="step-num">Step 2 — Set Alert Periods</div>
                    <div class="step-text">Define when you want to be notified before expiration</div>
                </div>

                <div class="step-card" style="opacity:0; animation: fade-up 0.5s ease-out 1.05s forwards;">
                    <div class="step-num">Step 3 — Discount Suggestions</div>
                    <div class="step-text">Get automatic recommendations for appropriate discounts</div>
                </div>

                {{-- Divider --}}
                <div class="divider"></div>

                {{-- CTA --}}
                <a  class="btn-signin" style="text-decoration:none;">
                    <i class="bi bi-gear-fill"></i>
                    <span>Start Setup</span>
                    <i class="bi bi-arrow-right btn-arrow"></i>
                </a>

                {{-- Note --}}
                <p class="page-title" style="text-align:center; font-size:0.72rem; color:var(--muted); display:flex; align-items:center; justify-content:center; gap:0.35rem;">
                    <i class="bi bi-shield-check" style="color:var(--orange);"></i>
                    Smart tracking for all products with expiration dates
                </p>

            </div>
        </div>
    </div>
</section>

@endsection