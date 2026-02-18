@extends('layouts.calcapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        [
            'url'         => route('welcome'),
            'icon'        => 'bi-house',
            'label'       => 'Home',
            'route_match' => 'welcome',
        ],
        [
            'url'         => route('calculator.settings'),
            'icon'        => 'bi-gear',
            'label'       => 'Settings',
            'route_match' => 'calculator.settings',
        ],
        [
            'url'         => route('calculator.products.index'),
            'icon'        => 'bi-box-seam',
            'label'       => 'Products',
            'route_match' => 'calculator.products.*',
        ],
    ],
])

<style>
    /* ── Stat cards ── */
    .stat-card {
        background: hsla(0,0%,100%,0.5);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid hsla(0,0%,100%,0.65);
        border-bottom-width: 4px;
        border-radius: 1.5rem;
        padding: 1.5rem;
        box-shadow: 0 8px 32px hsla(282,45%,45%,0.07);
        transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
    }
    .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 40px hsla(282,45%,45%,0.12);
    }
    .stat-card.card-1 { border-bottom-color: hsl(282,45%,62%); }
    .stat-card.card-2 { border-bottom-color: hsl(282,40%,65%); }
    .stat-card.card-3 { border-bottom-color: hsl(265,45%,62%); }

    /* ── Icon box ── */
    .icon-box {
        width: 2.75rem; height: 2.75rem;
        background: linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        border-radius: 0.875rem;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1.1rem;
        box-shadow: 0 4px 12px hsla(282,45%,55%,0.3);
        flex-shrink: 0;
        position: relative;
    }
    .icon-box::after {
        content: ''; position: absolute; inset: 0; border-radius: inherit;
        background: linear-gradient(135deg, hsla(0,0%,100%,0.2), transparent);
    }
    .icon-box.icon-2 { background: linear-gradient(135deg, hsl(282,40%,62%), hsl(270,45%,52%)); }
    .icon-box.icon-3 { background: linear-gradient(135deg, hsl(265,45%,58%), hsl(282,40%,50%)); }

    /* ── Stat number ── */
    .stat-num {
        font-size: 1.75rem; font-weight: 800;
        color: var(--fg); letter-spacing: -0.03em; line-height: 1;
    }
    .stat-label { font-size: 0.82rem; font-weight: 600; color: var(--fg); margin-bottom: 0.15rem; }
    .stat-sub   { font-size: 0.72rem; color: var(--muted); }

    /* ── Empty state card ── */
    .empty-card {
        background: hsla(0,0%,100%,0.5);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid hsla(0,0%,100%,0.65);
        border-radius: 1.5rem;
        padding: 3.5rem 2rem;
        text-align: center;
        box-shadow: 0 8px 32px hsla(282,45%,45%,0.07);
    }

    .empty-icon {
        width: 4rem; height: 4rem;
        background: var(--mauve-soft);
        border: 1px solid var(--mauve-border);
        border-radius: 1.25rem;
        display: flex; align-items: center; justify-content: center;
        color: var(--mauve); font-size: 1.5rem;
        margin: 0 auto 1.5rem;
    }

    .section-heading {
        font-size: 0.72rem; font-weight: 700;
        color: var(--muted); letter-spacing: 0.09em; text-transform: uppercase;
        margin-bottom: 1rem;
    }
</style>

<section class="min-h-screen py-12 px-4" style="position: relative; z-index: 10;">
<div class="max-w-4xl mx-auto space-y-6">
    {{-- Stats row --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4"
         style="opacity:0; animation: fade-up 0.5s ease-out 0.55s forwards;">

        {{-- Total Products --}}
        <div class="stat-card card-1">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <div class="icon-box">
                    <i class="bi bi-box-seam"></i>
                </div>
                <div>
                    <div class="stat-label">Total Products</div>
                    <div class="stat-sub">in your store</div>
                </div>
            </div>
            {{-- ✅ تم جلب الرقم من متغير stats القادم من الكنترولر --}}
            <div class="stat-num">{{ $stats['total_products'] }}</div>
        </div>

        {{-- Activated Products --}}
        <div class="stat-card card-2">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <div class="icon-box icon-2">
                    <i class="bi bi-check2-circle"></i>
                </div>
                <div>
                    <div class="stat-label">Activated Products</div>
                    <div class="stat-sub">Calculator enabled</div>
                </div>
            </div>
            {{-- ✅ تم جلب الرقم من متغير stats القادم من الكنترولر --}}
            <div class="stat-num">{{ $stats['enabled_products'] }}</div>
        </div>

        {{-- Current Settings --}}
        <div class="stat-card card-3">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <div class="icon-box icon-3">
                    <i class="bi bi-gear"></i>
                </div>
                <div>
                    <div class="stat-label">Current Settings</div>
                    <div class="stat-sub">Calculator defaults</div>
                </div>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                {{-- ✅ عرض الإعدادات الحقيقية للتاجر --}}
                <span style="font-size:0.78rem; font-weight:700; background:var(--mauve-soft); color:var(--mauve-deep); border:1px solid var(--mauve-border); padding:0.2rem 0.65rem; border-radius:0.5rem;">
                    {{ $settings->coverage_per_unit }} sqm
                </span>
                <span style="font-size:0.78rem; font-weight:700; background:var(--mauve-soft); color:var(--mauve-deep); border:1px solid var(--mauve-border); padding:0.2rem 0.65rem; border-radius:0.5rem;">
                    {{ $settings->waste_percentage }}% waste
                </span>
                {{-- زر سريع لتعديل الإعدادات --}}
                <a href="{{ route('calculator.settings') }}" style="font-size:0.7rem; color:var(--mauve); text-decoration:none; align-self:center; margin-left:auto;">Edit</a>
            </div>
        </div>

    </div>

    {{-- Empty state (يظهر فقط إذا لم يكن هناك منتجات مفعلة) --}}
    @if($stats['enabled_products'] == 0)
    <div class="empty-card"
         style="opacity:0; animation: fade-up 0.5s ease-out 0.7s forwards;">

        <div class="empty-icon">
            <i class="bi bi-box-seam"></i>
        </div>

        <h2 class="font-serif" style="font-size:1.25rem; font-weight:700; color:var(--fg); margin-bottom:0.6rem;">
            No Activated Products Yet
        </h2>

        <p style="font-size:0.875rem; color:var(--muted); line-height:1.65; max-width:380px; margin:0 auto 2rem;">
            You haven't activated any products yet. Add your first product and let the smart calculator handle the math.
        </p>

        {{-- ✅ تم تصحيح الاسم إلى calculator.products.index --}}
        <a href="{{ route('calculator.products.index') }}" class="btn-signin" style="max-width:280px; margin:0 auto; text-decoration:none;">
            <i class="bi bi-plus-circle"></i>
            <span>Add Product</span>
            <i class="bi bi-arrow-right btn-arrow"></i>
        </a>
    </div>
    @else
        <div>
            <p class="section-heading" style="padding: 1.5rem 1.75rem 0;">Activated Products</p>
            <div style="background:hsla(0,0%,100%,0.5); backdrop-filter:blur(16px); border:1px solid hsla(0,0%,100%,0.65); border-radius:1.5rem; overflow:hidden; box-shadow:0 8px 32px hsla(282,45%,45%,0.07);">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--mauve-soft); border-bottom:1px solid var(--mauve-border);">
                            <th style="padding:1rem 1.75rem; font-size:0.68rem; font-weight:700; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; text-align:left;">Product</th>
                            <th style="padding:1rem 1.75rem; font-size:0.68rem; font-weight:700; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; text-align:left;">Category</th>
                            <th style="padding:1rem 1.75rem; font-size:0.68rem; font-weight:700; color:var(--muted); letter-spacing:0.1em; text-transform:uppercase; text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($enabledProducts as $product)
                        <tr style="border-bottom:1px solid hsla(282,30%,70%,0.1); transition:background 0.2s;"
                            onmouseover="this.style.background='hsla(282,45%,55%,0.04)'"
                            onmouseout="this.style.background='transparent'">
                            <td style="padding:0 1.75rem; height:72px; vertical-align:middle;">
                                <div style="display:flex; align-items:center; gap:0.875rem;">
                                    <div style="width:2.5rem; height:2.5rem; border-radius:0.75rem; background:var(--mauve-soft); border:1px solid var(--mauve-border); color:var(--mauve); display:flex; align-items:center; justify-content:center; font-size:1rem;">
                                        <i class="bi bi-box"></i>
                                    </div>
                                    <span style="font-size:0.875rem; font-weight:600; color:var(--fg);">{{ $product->name }}</span>
                                </div>
                            </td>
                            <td style="padding:0 1.75rem; height:72px; vertical-align:middle;">
                                <span style="display:inline-block; padding:0.2rem 0.65rem; background:var(--mauve-soft); border:1px solid var(--mauve-border); border-radius:0.5rem; font-size:0.7rem; font-weight:700; color:var(--mauve-deep);">
                                    {{ $product->category ?? 'General' }}
                                </span>
                            </td>
                            <td style="padding:0 1.75rem; height:72px; vertical-align:middle; text-align:center;">
                                <span style="display:inline-flex; align-items:center; gap:0.35rem; padding:0.25rem 0.75rem; background:hsla(150,60%,45%,0.1); border:1px solid hsla(150,60%,45%,0.25); border-radius:2rem; font-size:0.68rem; font-weight:700; color:hsl(150,50%,28%); letter-spacing:0.05em; text-transform:uppercase;">
                                    <span style="width:6px; height:6px; border-radius:50%; background:hsl(150,55%,42%); animation:pulse-dot 2s infinite;"></span>
                                    Active
                                </span>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @endif
</div>
</section>

@endsection