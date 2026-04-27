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
<div class="app-user-menu" id="userMenuWrap">
    <button class="app-user-btn" id="userMenuBtn" type="button">
        <i class="bi bi-person-circle"></i>
    </button>
    <div class="app-user-dropdown" id="userMenuDropdown">
        <div class="app-user-dropdown__name">
            <i class="bi bi-person"></i>
            {{ auth()->user()->store_info['name'] ?? Auth::user()->name }}
        </div>
        <div class="app-user-dropdown__divider"></div>
        <button class="app-user-dropdown__logout"
                onclick="document.getElementById('logout-form').submit();">
            <i class="bi bi-box-arrow-right"></i> Logout
        </button>
    </div>
</div>
<form id="logout-form" action="{{ route('logout') }}" method="POST" class="hidden">@csrf</form>
@endauth


    
    </div>
</header>
<div class="app-header-divider"></div>