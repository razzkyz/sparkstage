import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Menu, ReceiptText, ShoppingCart, Ticket, UserRound, X, type LucideIcon } from 'lucide-react';
import Logo from './Logo';

type NavItem = {
  key: string;
  label: string;
  to: string;
  isPink?: boolean;
  icon?: LucideIcon;
};
// import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { useTicketCount } from '../hooks/useTicketCount';
import { useOrderCount } from '../hooks/useOrderCount';
import { useCart } from '../contexts/cartStore';
import { useLoyaltyPoints, getLoyaltyRankByTier } from '../hooks/useLoyaltyPoints';
import { getUserDisplayName } from '../utils/auth';

let previousDesktopStarPosition = 0;

const Navbar = () => {
  const { t } = useTranslation();
  const { user, signOut, isAdmin, loggingOut } = useAuth();
  const { count: ticketCount } = useTicketCount();
  const { count: orderCount } = useOrderCount();
  const { totalQuantity } = useCart();
  const { data: loyaltyData } = useLoyaltyPoints(user?.id);
  const loyaltyPoints = loyaltyData?.total_points ?? 0;
  const loyaltyTier = loyaltyData?.tier_level ?? 0;
  const loyaltyRank = getLoyaltyRankByTier(loyaltyTier);
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopStarPosition, setDesktopStarPosition] = useState(previousDesktopStarPosition);
  const [enableStarTransition, setEnableStarTransition] = useState(previousDesktopStarPosition !== 0);

  const desktopNavItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobileNavScrollerRef = useRef<HTMLDivElement | null>(null);

  const hasCenteredMobileItemRef = useRef(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeNavKey = (() => {
    const path = location.pathname;
    if (path === '/') return 'on-stage';
    if (path.startsWith('/on-stage')) return 'on-stage';
    if (path.startsWith('/events')) return 'event';
    if (path.startsWith('/shop') || path.startsWith('/glam') || path.startsWith('/beauty') || path.startsWith('/charm-bar') || path.startsWith('/chamr-bar')) return 'shop';
    if (path.startsWith('/dressing-room') || path.startsWith('/fashion')) return 'dressing-room';
    if (path.startsWith('/news')) return 'news';
    if (path.startsWith('/booking')) return 'booking';
    return '';
  })();

  const navItems: NavItem[] = [
    { key: 'on-stage', label: 'ON STAGE', to: '/on-stage' },
    { key: 'booking', label: 'BOOKING', to: '/booking', isPink: true, icon: Ticket },
    // { key: 'dressing-room', label: 'FASHION ON DEMAND', to: '/dressing-room' },
    { key: 'shop', label: 'SHOP', to: '/shop' },
    { key: 'event', label: 'EVENT', to: '/events' },
    { key: 'news', label: 'NEWS', to: '/news' },
  ];

  const activeIndex = Math.max(0, navItems.findIndex((item) => item.key === activeNavKey));
  // const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
  // const isIndonesian = currentLanguage.startsWith('id');

  const updateDesktopStarPosition = useCallback(() => {
    const activeItem = desktopNavItemsRef.current[activeIndex];
    if (!activeItem) return;

    const left = activeItem.offsetLeft + (activeItem.offsetWidth / 2);
    setDesktopStarPosition(left);
  }, [activeIndex]);

  const centerMobileActiveItem = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const scroller = mobileNavScrollerRef.current;
    const activeItem = desktopNavItemsRef.current[activeIndex];
    if (!scroller || !activeItem) return;

    const doScroll = () => {
      const s = mobileNavScrollerRef.current;
      const a = desktopNavItemsRef.current[activeIndex];
      if (!s || !a) return;

      const maxScrollLeft = Math.max(0, s.scrollWidth - s.clientWidth);
      const centeredLeft = a.offsetLeft - ((s.clientWidth - a.offsetWidth) / 2);
      const clampedLeft = Math.min(maxScrollLeft, Math.max(0, centeredLeft));
      try {
        s.scrollTo({ left: clampedLeft, behavior: behavior === 'auto' ? ('instant' as any) : behavior });
      } catch {
        // Safari fallback: scrollTo with options may throw in very old versions
        s.scrollLeft = clampedLeft;
      }
    };

    // Safari iOS needs a layout flush before offsetLeft is accurate.
    // Double-rAF ensures the browser has painted at least one frame.
    requestAnimationFrame(() => requestAnimationFrame(doScroll));
  }, [activeIndex]);

  useEffect(() => {
    updateDesktopStarPosition();
    const behavior: ScrollBehavior = hasCenteredMobileItemRef.current ? 'smooth' : 'auto';
    centerMobileActiveItem(behavior);
    hasCenteredMobileItemRef.current = true;
  }, [centerMobileActiveItem, updateDesktopStarPosition]);

  useEffect(() => {
    if (desktopStarPosition !== 0) {
      previousDesktopStarPosition = desktopStarPosition;
    }
  }, [desktopStarPosition]);

  useEffect(() => {
    // If it was a fresh load (position 0), enable transitions after initial jump
    if (previousDesktopStarPosition === 0) {
      const timer = setTimeout(() => setEnableStarTransition(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      updateDesktopStarPosition();
      centerMobileActiveItem('auto');
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [centerMobileActiveItem, updateDesktopStarPosition]);



  // const handleMobileLanguageToggle = () => {
  //   void i18n.changeLanguage(isIndonesian ? 'en' : 'id');
  // };


  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    if (loggingOut) return;
    setShowLogoutConfirm(false);
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const handleSignOutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Top Bar - Sticky */}
      <div className={`sticky top-0 bg-white z-[110] border-b border-gray-200 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 lg:py-3">
          <div className="w-1/3 flex items-center gap-3">
            {/* Desktop: Language Switcher + Stage 55 logo */}
            <div className="hidden lg:flex items-center">
              <img src="/images/landing/stage55.png" alt="Stage 55" className="h-10 w-auto md:h-12 object-contain" />
              {/* Language switcher disabled */}
              {/* <LanguageSwitcher /> */}
            </div>
            {/* Mobile/Tablet: Hamburger + Stage 55 logo */}
            <div className="lg:hidden flex items-center">
              {/* Hamburger button — triggers left sidebar */}
              <button
                id="navbar-hamburger-btn"
                type="button"
                aria-label="Buka menu navigasi"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 rounded-md text-gray-700 hover:text-[#ff4b86] hover:bg-pink-50 active:bg-pink-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <img src="/images/landing/stage55.png" alt="Stage 55" className="h-[2.5rem] w-auto object-contain" />
            </div>
          </div>

          <div className="w-1/3 flex justify-center">
            <Link to="/" className="inline-flex items-center" aria-label="Home">
              <Logo className="h-[2.5rem] md:h-[3.5rem]" />
            </Link>
          </div>

          <div className="ml-auto w-1/3 flex items-center justify-end gap-3 lg:gap-4">

            {user ? (
              <div className="hidden lg:flex items-center gap-5">
                <span className="text-sm font-medium text-gray-900">
                  {getUserDisplayName(user)}
                </span>

                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#ff4b86] text-white rounded-md hover:bg-[#e63d75] transition-colors shadow-sm"
                    title="Admin Dashboard"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Dashboard
                  </Link>
                )}

                <button
                  onClick={handleSignOutClick}
                  disabled={loggingOut}
                  className="text-gray-500 hover:text-primary transition-colors"
                  title={t('auth.signOut')}
                >
                  <LogOut className="h-5 w-5" />
                </button>

                {/* Loyalty Points Badge — Desktop */}
                <Link
                  to="/my-points"
                  className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-400/40"
                  style={{
                    background: 'linear-gradient(135deg, #ff2d72 0%, #ff4b86 50%, #ff6b9d 100%)',
                    boxShadow: '0 2px 10px rgba(255,75,134,0.4)',
                  }}
                  title={`SPARK CLUB · ${loyaltyRank.label} · ${loyaltyPoints.toLocaleString()} poin`}
                >
                  {/* Rank icon */}
                  <span className="text-sm leading-none">
                    {loyaltyRank.icon}
                  </span>
                  {/* Points count */}
                  <span className="text-xs font-black tracking-tight text-white">
                    {loyaltyPoints.toLocaleString()}
                  </span>
                  {/* pts label */}
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-wide">pts</span>
                  {/* Shine on hover */}
                  <span
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)' }}
                  />
                </Link>

                <Link
                  to="/my-tickets"
                  className="relative text-gray-500 hover:text-main-600 transition-colors"
                  title={t('nav.myTickets')}
                >
                  <Ticket className="h-5 w-5" />
                  {ticketCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {ticketCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/my-orders"
                  className="relative text-gray-500 hover:text-main-600 transition-colors"
                  title={t('nav.myOrders')}
                >
                  <ReceiptText className="h-5 w-5" />
                  {orderCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {orderCount}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative text-gray-500 hover:text-main-600 transition-colors" aria-label={t('nav.cart')}>
                  <ShoppingCart className="h-5 w-5" />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {totalQuantity}
                    </span>
                  )}
                </Link>

{/* Search disabled */}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest bg-[#ff4b86] text-white rounded-md hover:bg-[#e63d75] transition-colors shadow-sm"
                >
                  <UserRound className="h-4 w-4" />
                  {t('auth.signIn')}
                </Link>

                <Link to="/cart" className="relative p-2 text-gray-700 hover:text-main-600 transition-colors" aria-label={t('nav.cart')}>
                  <ShoppingCart className="h-5 w-5" />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {totalQuantity}
                    </span>
                  )}
                </Link>

{/* Search disabled */}
              </div>
            )}

            <div className="lg:hidden flex items-center gap-0.5">
              {!user && (
                <Link
                  to="/login"
                  className="p-2 rounded-md border border-gray-300 text-gray-700 active:bg-gray-50"
                  aria-label={t('auth.signIn')}
                  title={t('auth.signIn')}
                >
                  <UserRound className="h-[1.375rem] w-[1.375rem]" />
                </Link>
              )}

              {/* Mobile: Ticket icon */}
              {user && (
                <Link
                  to="/my-tickets"
                  className="relative p-1.5 text-gray-700 active:text-main-600"
                  aria-label={t('nav.myTickets')}
                  title={t('nav.myTickets')}
                >
                  <Ticket className="h-6 w-6" />
                  {ticketCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {ticketCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile: Orders icon */}
              {user && (
                <Link
                  to="/my-orders"
                  className="relative p-1.5 text-gray-700 active:text-main-600"
                  aria-label={t('nav.myOrders')}
                  title={t('nav.myOrders')}
                >
                  <ReceiptText className="h-6 w-6" />
                  {orderCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-main-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {orderCount}
                    </span>
                  )}
                </Link>
              )}

              <Link to="/cart" className="relative p-1.5 text-gray-700 active:text-main-600" aria-label={t('nav.cart')}>
                <ShoppingCart className="h-6 w-6" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-main-600 text-white text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
                    {totalQuantity}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Main Navigation - Non-sticky */}
      <nav className="hidden lg:block w-full relative z-[100] bg-white border-b border-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div 
            ref={mobileNavScrollerRef}
            className="relative py-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className={`absolute pointer-events-none ${
                enableStarTransition ? 'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''
              }`}
              style={{
                left: `${desktopStarPosition}px`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '64px',
                height: '64px',
                zIndex: 0,
              }}
            >
              <img
                src="/images/landing/ICON%20STAR-01.svg"
                alt="Active"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex lg:justify-evenly items-center relative z-10 min-w-max gap-2 sm:gap-4 lg:gap-0 px-2 lg:px-0">
              {navItems.map((item, idx) => {
                const isActive = idx === activeIndex;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    ref={(el) => (desktopNavItemsRef.current[idx] = el)}
                    to={item.to}
                    className={`text-sm font-semibold uppercase px-4 py-2 transition-colors flex items-center gap-2 z-10 relative ${
                      isActive ? 'text-black' : 'text-gray-600 hover:text-[#ff4b86]'
                    }`}
                  >
                    {Icon && (
                      <div className="bg-main-500 rounded-full p-1">
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </nav>

      {/* ── Mobile / Tablet Sidebar Drawer ────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <aside
        id="mobile-sidebar"
        aria-label="Menu navigasi"
        className={`lg:hidden fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-white z-[210] flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <img src="/images/landing/stage55.png" alt="Stage 55" className="h-9 w-auto object-contain" />
          <button
            id="sidebar-close-btn"
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-[#ff4b86] hover:bg-pink-50 active:bg-pink-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item, idx) => {
            const isActive = idx === activeIndex;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'text-[#ff4b86] bg-pink-50 border-r-4 border-[#ff4b86]'
                    : 'text-gray-700 hover:text-[#ff4b86] hover:bg-pink-50/60'
                }`}
              >
                {Icon ? (
                  <div className="bg-main-500 rounded-full p-1 flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-[#ff4b86]' : 'bg-gray-300'
                    }`}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — user profile */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {user ? (
            <>
              {/* User info row */}
              <div className="flex items-center gap-3">
                {/* Avatar initial */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-black"
                  style={{ background: 'linear-gradient(135deg, #ff2d72, #ff6b9d)' }}
                >
                  {getUserDisplayName(user).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{getUserDisplayName(user)}</p>
                  {/* Points badge */}
                  <Link
                    to="/my-points"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide active:scale-95 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #ff2d72, #ff6b9d)',
                      color: 'white',
                    }}
                  >
                    <span>{loyaltyRank.icon}</span>
                    <span>{loyaltyPoints.toLocaleString()}</span>
                    <span className="opacity-70 font-semibold text-[9px]">pts</span>
                  </Link>
                </div>
              </div>

              {/* Admin Dashboard button */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-white transition-colors active:scale-95"
                  style={{ background: '#ff4b86' }}
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Dashboard Admin
                </Link>
              )}

              {/* Sign Out */}
              <button
                type="button"
                onClick={() => { setSidebarOpen(false); handleSignOutClick(); }}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 py-2 text-sm font-semibold text-gray-500 hover:text-[#ff4b86] transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#ff4b86] transition-colors"
            >
              <UserRound className="h-4 w-4 flex-shrink-0" />
              {t('auth.signIn')}
            </Link>
          )}
        </div>
      </aside>

      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-[60] flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={handleSignOutCancel}
          >
            <div
              className="bg-white rounded-t-3xl md:rounded-xl shadow-2xl w-full md:max-w-sm md:w-full p-6 space-y-5 animate-slide-up md:animate-none"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                  <LogOut className="h-8 w-8 text-[#ff4b86]" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-gray-900">{t('auth.signOut')}</h3>
                  <p className="text-sm text-gray-600 mt-2">{t('auth.signOutConfirm')}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <button
                  onClick={handleSignOutCancel}
                  className="flex-1 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-colors order-2 md:order-1"
                  type="button"
                >
                  {t('auth.cancel')}
                </button>
                <button
                  onClick={handleSignOutConfirm}
                  disabled={loggingOut}
                  className="flex-1 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white bg-[#ff4b86] hover:bg-[#e63d75] active:bg-[#cc2f64] rounded-xl transition-colors disabled:opacity-50 order-1 md:order-2"
                  type="button"
                >
                  {t('auth.confirm')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
