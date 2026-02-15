@extends('layouts.guest')

@section('content')

<div class="w-full max-w-md px-6 py-12" style="position: relative; z-index: 10;">
    <div class="login-card p-10 md:p-12">

        {{-- Logo --}}
        <div class="flex flex-col items-center mb-10">
            <div class="logo-icon mb-4">
                <i class="bi bi-envelope-check text-white" style="font-size: 1.25rem;"></i>
            </div>
            <h1 class="login-title font-serif text-2xl font-bold tracking-tight" style="color: var(--fg)">
                Merchant<span style="color: var(--mauve)">Tools</span>
            </h1>
            <p class="login-title text-xs mt-1" style="color: var(--muted); letter-spacing: 0.08em;">
                VERIFY YOUR EMAIL
            </p>
        </div>

        {{-- Success alert --}}
        @if (session('resent'))
            <div class="alert-success">
                <i class="bi bi-check-circle-fill"></i>
                <span>A new verification link has been sent to your email address.</span>
            </div>
        @endif

        {{-- Message --}}
        <p class="verify-msg">
            Please check your email for a verification link.
            Didn't get it? Click below to resend.
        </p>

        {{-- Resend form --}}
        <form method="POST" action="{{ route('verification.resend') }}" style="display: flex; flex-direction: column; gap: 0.875rem;">
            @csrf
            <button type="submit" class="btn-signin">
                <span>Resend Verification Email</span>
                <i class="bi bi-arrow-right btn-arrow"></i>
            </button>
        </form>

        {{-- Back link --}}
        <div class="back-link text-center mt-6">
            <a href="{{ url('/') }}">
                <i class="bi bi-arrow-left" style="font-size: 0.75rem;"></i>
                Back to Home
            </a>
        </div>

    </div>
</div>

@endsection