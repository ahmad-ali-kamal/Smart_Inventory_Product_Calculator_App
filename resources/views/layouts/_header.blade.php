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
                @if($link['icon'] === 'bi-bell-fill')
                @auth
                <div class="notif-wrap" id="notifWrap">
                    <button class="app-nav-link notif-btn" id="notifBtn">
                        <i class="bi bi-bell-fill"></i>
                        @if(auth()->user()->unreadNotifications->count() > 0)
                            <span class="notif-badge" id="notifBadge">
                                {{ auth()->user()->unreadNotifications->count() }}
                            </span>
                        @endif
                    </button>
                    <div class="notif-dropdown" id="notifDropdown" style="display:none;">
                        <div class="notif-header">
                            <span>Notifications</span>
                            <button class="notif-read-all" id="notifReadAll">Mark all as read</button>
                        </div>
                        <div class="notif-list" id="notifList">
                            <div class="notif-loading">Loading...</div>
                        </div>
                    </div>
                </div>
                @endauth
            @else
                <a href="{{ $link['url'] ?? '#' }}"
                   class="app-nav-link {{ request()->routeIs($link['route_match'] ?? '__none__') ? 'active' : '' }}">
                    <i class="bi {{ $link['icon'] }}"></i>
                    {{ $link['label'] }}
                </a>
            @endif
            @endforeach
            </nav>

            @if(!empty($headerCta))
                <a href="{{ $headerCta['url'] }}" class="app-btn-cta">
                    <i class="bi {{ $headerCta['icon'] }}"></i>
                    <span class="btn-label">{{ $headerCta['label'] }}</span>
                </a>
            @endif

@auth
<div class="dropdown dropdown-end">
    <label tabindex="0" class="app-avatar" style="cursor:pointer">
        {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
    </label>
    <ul tabindex="0" class="dropdown-content menu p-1 shadow bg-white rounded-box mt-2" style="min-width:unset; width:auto;">
        <li>
            <a href="{{ route('logout') }}"
               onclick="event.preventDefault(); document.getElementById('logout-form').submit();"
               style="font-size:0.8rem; font-weight:700; color:hsl(210, 11%, 71%); display:flex; align-items:center; gap:0.4rem; padding:0.4rem 0.85rem; border-radius:0.65rem; white-space:nowrap;">
                <i class="bi bi-box-arrow-right" style="font-size:0.8rem;"></i> Logout
            </a>
        </li>
    </ul>
</div>
<form id="logout-form" action="{{ route('logout') }}" method="POST" class="hidden">@csrf</form>
@endauth

        <button class="app-menu-btn"><i class="bi bi-list"></i></button>
    </div>
</header>
<div class="app-header-divider"></div>