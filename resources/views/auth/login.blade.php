@extends('layouts.guest')

@section('content')
<div class="w-full max-w-md px-6 py-12" style="position: relative; z-index: 10;">
    <div class="login-card p-10 md:p-12">

        {{-- Logo --}}
        <div class="flex flex-col items-center mb-10">
            <div class="logo-icon mb-4">
                <i class="bi bi-shop-window text-white" style="font-size: 1.25rem;"></i>
            </div>
            <h1 class="login-title font-serif text-2xl font-bold tracking-tight" style="color: var(--fg)">
                Smart<span style="color: var(--mauve)">Inventory</span>
            </h1>
        </div>

        {{-- Info Note --}}
            <div style="display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.75rem 1rem; border-radius: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border, rgba(255,255,255,0.08));">
                <i class="bi bi-shield-lock" style="color: var(--mauve); font-size: 0.85rem; flex-shrink: 0; margin-top: 0.1rem;"></i>
                <p style="color: var(--muted); font-size: 0.7rem; line-height: 1.65; margin: 0; font-family: inherit;">
                    You'll be redirected to Salla's account center to securely authorize access to your store.
                </p>
            </div>
        {{-- Error Alert --}}
        @if(session('error'))
            <div class="input-group ig-1 mb-4" style="border-color: #e06b5b;">
                <i class="bi bi-exclamation-circle input-icon-left" style="color: #e06b5b;"></i>
                <p class="input-field" style="color: #e06b5b; background: transparent; border: none; cursor: default;">
                    {{ session('error') }}
                </p>
            </div>
        @endif

        {{-- Divider --}}
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
            <div style="flex: 1; height: 1px; background: var(--border, rgba(255,255,255,0.08));"></div>
            <span style="color: var(--muted); font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase;">Secure Access</span>
            <div style="flex: 1; height: 1px; background: var(--border, rgba(255,255,255,0.08));"></div>
        </div>

        {{-- Salla OAuth Button --}}
        <div style="display: flex; flex-direction: column; gap: 0.875rem;">
            <a href="{{ route('auth.salla') }}" class="btn-signin" style="display: flex; align-items: center; justify-content: center; gap: 0.625rem; text-decoration: none;">
                <i class="bi bi-bag-check" style="font-size: 1rem; flex-shrink: 0;"></i>
                <span>Sign in with Salla</span>
                <i class="bi bi-arrow-right btn-arrow"></i>
            </a>
            {{-- Back link --}}
            <a href="{{ route('welcome') }}" style="text-align: center; font-size: 0.72rem; color: var(--muted); letter-spacing: 0.05em; text-decoration: none; margin-top: 0.25rem; transition: color 0.2s; font-family: inherit;"
               onmouseover="this.style.color='var(--mauve)'" onmouseout="this.style.color='var(--muted)'">
                ← Back to Home
            </a>
        </div>

    </div>
</div>
@endsection