@extends('layouts.app')

@section('title', 'تسجيل الدخول - Smart Inventory')

@section('content')
<div class="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200">
        <div class="card-body items-center text-center p-8">
            <div class="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <span class="text-4xl">📦</span>
            </div>

            <h2 class="card-title text-3xl font-bold text-primary mb-1">
                Smart Inventory
            </h2>
            <p class="text-base-content/60 mb-8 font-medium">
                بوابة التاجر لإدارة المنتجات والمخزون
            </p>

            @if(session('error'))
                <div class="alert alert-error mb-6 shadow-sm py-3 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            <div class="divider text-xs uppercase tracking-widest opacity-50">الدخول الآمن</div>

            <a 
                href="{{ route('auth.salla') }}" 
                class="btn btn-primary btn-lg w-full gap-3 shadow-lg hover:shadow-primary/30 transition-all duration-300 group"
            >
                <svg class="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>تسجيل الدخول بواسطة سلة</span>
            </a>

            <div class="mt-8 space-y-4">
                <div class="p-4 bg-base-200/50 rounded-xl flex items-start gap-3 text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-primary shrink-0 w-5 h-5 mt-0.5">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="text-xs text-base-content/70 leading-relaxed">
                        بالنقر على الزر أعلاه، سيتم توجيهك إلى مركز حسابات سلة للموافقة على صلاحيات الوصول لمتجرك بشكل آمن ومشفر.
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <a href="{{ route('welcome') }}" class="btn btn-ghost btn-sm text-base-content/50 hover:text-primary">
                        العودة للرئيسية
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection