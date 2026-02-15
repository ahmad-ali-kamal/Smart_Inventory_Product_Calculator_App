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
                Merchant<span style="color: var(--mauve)">Tools</span>
            </h1>
            <p class="login-title text-xs mt-1" style="color: var(--muted); letter-spacing: 0.08em;">
                Welcome back
            </p>
        </div>

        {{-- Form --}}
        <form action="{{ route('login') }}" method="POST" style="display: flex; flex-direction: column; gap: 0.875rem;">
            @csrf

            {{-- Email --}}
            <div class="input-group ig-1">
                <i class="bi bi-envelope input-icon-left"></i>
                <input type="email" name="email" placeholder="Email Address"
                       value="{{ old('email') }}" class="input-field">
                @error('email')
                    <p class="text-xs mt-1" style="color: #e06b5b; padding-left: 0.25rem;">{{ $message }}</p>
                @enderror
            </div>
            {{-- Submit --}}
            <button type="submit" class="btn-signin">
                <span>Sign In</span>
                <i class="bi bi-arrow-right btn-arrow"></i>
            </button>
        </form>

    </div>
</div>

@endsection