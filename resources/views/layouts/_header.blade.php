<style>
    .app-header {
        position: sticky; top: 0; z-index: 100;
        padding: 0.75rem 1.75rem;
        background: hsla(0, 0%, 100%, 0.55);
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        border-bottom: 1px solid var(--mauve-border);
        box-shadow: 0 1px 0 hsla(0,0%,100%,0.7) inset, 0 4px 24px hsla(0,0%,0%,0.04);
        animation: header-slide-in 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    @keyframes header-slide-in {
        from { opacity:0; transform: translateY(-8px); }
        to   { opacity:1; transform: translateY(0); }
    }
    .app-header-inner {
        max-width: 1200px; margin: 0 auto;
        display: flex; align-items: center; gap: 1rem;
    }
    .app-logo { display:flex; align-items:center; gap:0.7rem; text-decoration:none; flex-shrink:0; }
    .app-logo-icon {
        width:2.2rem; height:2.2rem;
        background: linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        border-radius:0.7rem; display:flex; align-items:center; justify-content:center;
        color:white; font-size:0.9rem; box-shadow:0 4px 12px hsla(0,0%,0%,0.15);
        position:relative; flex-shrink:0;
    }
    .app-logo-icon::after {
        content:''; position:absolute; inset:0; border-radius:inherit;
        background: linear-gradient(135deg, hsla(0,0%,100%,0.25), transparent);
    }
    .app-logo-name { font-family:'DM Serif Display',serif; font-size:1.05rem; color:var(--fg); line-height:1; }
    .app-logo-name span { color: var(--mauve); }

    .app-spacer { flex: 1; }  /* هذا يدفع كل شيء بعده لليمين */

    .app-nav { display:flex; align-items:center; gap:0.15rem; }
    .app-nav-link {
        display:inline-flex; align-items:center; gap:0.4rem;
        padding:0.5rem 0.9rem; border-radius:0.75rem;
        font-size:0.82rem; font-weight:600; color:var(--muted);
        text-decoration:none; transition:background 0.2s, color 0.2s; white-space:nowrap;
    }
    .app-nav-link i { font-size:0.85rem; transition:transform 0.2s; }
    .app-nav-link:hover { background:var(--mauve-soft); color:var(--mauve-deep); }
    .app-nav-link:hover i { transform:scale(1.15); }
    .app-nav-link.active { background:var(--mauve-soft); color:var(--mauve-deep); position:relative; }
    .app-nav-link.active::after {
        content:''; position:absolute; bottom:5px; left:50%; transform:translateX(-50%);
        width:18px; height:2px; background:var(--mauve); border-radius:2px;
    }

    .app-actions { display:flex; align-items:center; gap:0.6rem; flex-shrink:0; }
    .app-btn-cta {
        display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem;
        background:linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        color:white !important; border-radius:0.75rem;
        font-size:0.8rem; font-weight:700; text-decoration:none; border:none; cursor:pointer;
        transition:transform 0.2s, box-shadow 0.2s; box-shadow:0 4px 14px hsla(0,0%,0%,0.15);
    }
    .app-btn-cta:hover { transform:translateY(-1px); box-shadow:0 6px 18px hsla(0,0%,0%,0.2); color:white !important; text-decoration:none; }

    .app-avatar {
        width:2rem; height:2rem; background:var(--mauve-soft); border:1.5px solid var(--mauve-border);
        border-radius:0.65rem; display:flex; align-items:center; justify-content:center;
        color:var(--mauve-deep); font-size:0.7rem; font-weight:800; cursor:pointer; transition:all 0.2s;
    }
    .app-avatar:hover { background:var(--mauve); color:white; border-color:var(--mauve); transform:scale(1.05); }
    .app-header-divider { height:1px; background:linear-gradient(90deg, transparent, var(--mauve-border), transparent); }

    .app-menu-btn {
        display:none; background:var(--mauve-soft); border:1px solid var(--mauve-border);
        border-radius:0.65rem; padding:0.45rem 0.6rem; cursor:pointer; color:var(--mauve-deep); font-size:1.05rem;
    }
    @media (max-width: 768px) {
        .app-nav { display:none; }
        .app-menu-btn { display:flex; align-items:center; }
        .app-btn-cta .btn-label { display:none; }
        .app-btn-cta { padding:0.5rem 0.65rem; }
        .app-page-title { display:none; }
    }
</style>

<header class="app-header">
    <div class="app-header-inner">

        {{-- الشعار على اليسار --}}
        <a href="{{ route('calculator.dashboard') }}" class="app-logo">
            <div class="app-logo-icon">
                <i class="bi bi-calculator"></i>
            </div>
            <div class="app-logo-name">Merchant<span>Tools</span></div>
        </a>

      

        {{-- فراغ يدفع الباقي لليمين ← هذا هو الحل --}}
        <div class="app-spacer"></div>

        {{-- الروابط + الزر + الأفاتار — كلهم على اليمين --}}
        <div class="app-actions">

            <nav class="app-nav">
                @if(!empty($headerNav))
                    @foreach($headerNav as $link)
                        <a href="{{ $link['url'] }}"
                           class="app-nav-link {{ request()->fullUrlIs($link['url']) || request()->routeIs($link['route_match'] ?? '__none__') ? 'active' : '' }}">
                            <i class="bi {{ $link['icon'] }}"></i>
                            {{ $link['label'] }}
                        </a>
                    @endforeach
                @endif
            </nav>

            @if(!empty($headerCta))
                <a href="{{ $headerCta['url'] }}" class="app-btn-cta">
                    <i class="bi {{ $headerCta['icon'] }}"></i>
                    <span class="btn-label">{{ $headerCta['label'] }}</span>
                </a>
            @endif

           <div class="app-avatar" style="width:auto; padding: 0 0.75rem; font-size:0.75rem; display:flex; align-items:center; gap:0.35rem;">
    <i class="bi bi-person-circle" style="font-size:0.85rem;"></i>
    {{ auth()->user()->store_info['name'] ?? 'User' }}
</div>

        </div>

        <button class="app-menu-btn"><i class="bi bi-list"></i></button>
    </div>
</header>
<div class="app-header-divider"></div>