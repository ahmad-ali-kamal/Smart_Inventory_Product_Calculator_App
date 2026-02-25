<header class="app-header">
    <div class="app-header-inner">

        <a href="{{ url('/') }}" class="app-logo">
            <div class="app-logo-icon">
                <i class="bi bi-calculator"></i>
            </div>
            <div class="app-logo-name">Merchant<span>Tools</span></div>
        </a>

        <div class="app-spacer"></div>

        <div class="app-actions">
            <nav class="app-nav">
                @foreach($headerNav ?? [] as $link)
                    <a href="{{ $link['url'] ?? '#' }}"
                       class="app-nav-link {{ request()->routeIs($link['route_match'] ?? '__none__') ? 'active' : '' }}">
                        <i class="bi {{ $link['icon'] }}"></i>
                        {{ $link['label'] }}
                    </a>
                @endforeach
            </nav>

            @if(!empty($headerCta))
                <a href="{{ $headerCta['url'] }}" class="app-btn-cta">
                    <i class="bi {{ $headerCta['icon'] }}"></i>
                    <span class="btn-label">{{ $headerCta['label'] }}</span>
                </a>
            @endif

            <div class="app-avatar" title="{{ auth()->user()->name ?? 'User' }}">
                {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
            </div>
        </div>

        <button class="app-menu-btn"><i class="bi bi-list"></i></button>
    </div>
</header>
<div class="app-header-divider"></div>