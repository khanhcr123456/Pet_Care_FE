import { useState, Suspense, lazy, useEffect } from 'react';
import { apiLogin, apiLogout, fetchRemoteConfigTheme } from './service/api_request';

// --- DECORATIONS COMPONENT ---
const ThemeDecorations = ({ theme }: { theme: string }) => {
  if (theme === 'NOEL') {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Snowflakes */}
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute text-slate-100/50 animate-fall text-xl" style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 5 + 4}s`,
            animationDelay: `${Math.random() * 3}s`
          }}>❄</div>
        ))}
      </div>
    );
  }
  if (theme === 'TET') {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Lanterns sticking from top corners */}
        <div className="absolute top-0 right-16 text-6xl drop-shadow-md opacity-90 animate-float" style={{ animationDelay: '0s' }}>🏮</div>
        <div className="absolute top-4 right-40 text-5xl drop-shadow-md opacity-70 animate-float" style={{ animationDelay: '1s' }}>🧧</div>

        {/* Falling cherry blossoms */}
        {[...Array(25)].map((_, i) => (
          <div key={i} className="absolute text-pink-400/30 animate-fall" style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 10 + 10}px`,
            animationDuration: `${Math.random() * 4 + 5}s`,
            animationDelay: `${Math.random() * 5}s`
          }}>🌸</div>
        ))}
      </div>
    );
  }
  if (theme === 'HALLOWEEN') {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Cobwebs top left */}
        <div className="absolute -top-6 left-64 text-8xl opacity-10 drop-shadow-md rotate-[120deg]">🕸️</div>
        <div className="absolute top-10 right-10 text-8xl opacity-10 drop-shadow-md -rotate-[30deg]">🕸️</div>
        {/* Bat flying */}
        <div className="absolute top-32 right-1/4 text-4xl animate-float opacity-30 drop-shadow-lg" style={{ animationDuration: '3s' }}>🦇</div>
        <div className="absolute top-64 right-10 text-3xl animate-float opacity-20 drop-shadow-lg" style={{ animationDuration: '4s' }}>🦇</div>
        {/* Pumpkins on bottom */}
        <div className="absolute bottom-4 right-20 text-6xl opacity-30 drop-shadow-lg animate-pulse">🎃</div>
      </div>
    );
  }
  return null;
}
// ----------------------------

const FcmReport = lazy(() => import('./admin/fcm/page'));
const AuthUsers = lazy(() => import('./admin/auth_users/page'));
const FirebaseAnalytics = lazy(() => import('./admin/analytics/page'));
const OrdersPage = lazy(() => import('./admin/orders/page'));
const UsersPage = lazy(() => import('./admin/users/page'));
const ProductsPage = lazy(() => import('./admin/products/page'));
const ServicesPage = lazy(() => import('./admin/services/page'));

function App() {
  // Global Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminAccessToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTabState] = useState<string>(localStorage.getItem('adminActiveTab') || 'analytics');
  const [appTheme, setAppTheme] = useState<string>(localStorage.getItem('adminAppTheme') || 'NORMAL');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  useEffect(() => {
    // Set synchronously first to avoid flashing default theme
    const savedTheme = localStorage.getItem('adminAppTheme') || 'NORMAL';
    document.body.className = `theme-${savedTheme}`;
    setAppTheme(savedTheme);

    const initTheme = async () => {
      try {
        const res = await fetchRemoteConfigTheme();
        let themeVal = res?.data?.parameters?.app_theme_event?.defaultValue?.value
          || res?.parameters?.app_theme_event?.defaultValue?.value
          || res?.data?.app_theme_event
          || res?.app_theme_event
          || res?.data?.theme
          || res?.theme;

        if (themeVal && typeof themeVal === 'string') {
          localStorage.setItem('adminAppTheme', themeVal);
          document.body.className = `theme-${themeVal}`;
          setAppTheme(themeVal);
        }
      } catch { }
    };

    initTheme();

    const handleThemeChange = (e: any) => {
      localStorage.setItem('adminAppTheme', e.detail);
      document.body.className = `theme-${e.detail}`;
      setAppTheme(e.detail);
    };

    window.addEventListener('themeChanged', handleThemeChange as any);
    return () => window.removeEventListener('themeChanged', handleThemeChange as any);
  }, []);

  const getThemeIcon = () => {
    switch (appTheme) {
      case 'TET': return '🌸';
      case 'NOEL': return '🎄';
      case 'HALLOWEEN': return '🎃';
      default: return '🐾';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const { res, data } = await apiLogin(email, password);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Sai tài khoản hoặc mật khẩu');
      }

      const accessToken = data.data.accessToken;
      setToken(accessToken);
      localStorage.setItem('adminAccessToken', accessToken);
    } catch (err: any) {
      setLoginError(err.message === 'Failed to fetch' ? 'Không thể kết nối Backend (localhost:5000)' : err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await apiLogout();
      } catch (err) {
        console.error("Lỗi khi đăng xuất trên server:", err);
      }
    }
    setToken(null);
    localStorage.removeItem('adminAccessToken');
  };

  // ----- RENDERING LOGIN SCREEN -----
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Pet Care Admin
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Hệ thống quản trị truy cập an toàn
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-[2rem] sm:px-10 border border-slate-100">
            {loginError && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {loginError}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Admin</label>
                <div className="mt-2">
                  <input
                    type="email"
                    required
                    className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 text-sm bg-slate-50"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    className="block w-full appearance-none rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 text-sm bg-slate-50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex w-full justify-center rounded-xl border border-transparent bg-cyan-600 py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ----- RENDERING DASHBOARD TABS -----
  const menuItems = [
    { id: 'analytics', label: 'Dashboard (Analytics)', icon: '📊' },
    { id: 'auth_users', label: 'Tài khoản Firebase', icon: '🔐' },
    { id: 'fcm', label: 'Báo cáo FCM', icon: '🔔' },
    { id: 'users', label: 'Danh sách khách hàng', icon: '👥' },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: '📦' },
    { id: 'services', label: 'Dịch vụ & Giá cả', icon: '💰' },
    { id: 'products', label: 'Quản lý sản phẩm', icon: '🐾' },
  ];

  return (
    <div className="flex h-screen bg-[var(--app-bg)] font-sans transition-colors duration-700 ease-in-out relative">

      {/* Decorative Overlays */}
      <ThemeDecorations theme={appTheme} />

      {/* SIDEBAR */}
      <aside className="w-64 bg-[var(--sidebar-bg)] text-slate-300 flex flex-col h-full shrink-0 transition-colors duration-700 ease-in-out shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--logo-bg)] rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl transition-all duration-700 ease-in-out shadow-lg">
              {getThemeIcon()}
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-bold tracking-wider text-sm">PETCARE</h1>
              <p className="text-[var(--paw-color)] text-xs font-semibold transition-colors duration-700 ease-in-out">Admin Panel</p>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 overflow-y-auto">
          <div className="px-6 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            MENU
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === item.id
                  ? 'bg-[var(--logo-bg)] text-slate-900 shadow-md'
                  : 'hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="text-lg opacity-80">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full text-left"
          >
            <span className="text-lg opacity-80">🚪</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* TOPBAR */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">PETCARE Management</p>
          </div>

        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">

          {/* HEADER BANNER */}
          <div className="mb-8 rounded-2xl bg-[var(--sidebar-bg)] text-white p-8 shadow-sm flex items-center justify-between overflow-hidden relative transition-colors duration-700 ease-in-out">
            <div className="z-10 relative">
              <h1 className="text-3xl font-bold sm:text-4xl mb-2">Xin chào, Admin!</h1>
            </div>

            {/* Paw background decoration */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 text-[100px] select-none text-[var(--paw-color)] transition-all duration-1000 ease-in-out">
              {getThemeIcon()}
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="w-full">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-16 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                <div className="h-64 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                <div className="h-32 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
              </div>
            }>
              {activeTab === 'analytics' && <FirebaseAnalytics />}
              {activeTab === 'auth_users' && <AuthUsers />}
              {activeTab === 'fcm' && <FcmReport />}
              {activeTab === 'users' && <UsersPage />}
              {activeTab === 'orders' && <OrdersPage />}
              {activeTab === 'products' && <ProductsPage />}
              {activeTab === 'services' && <ServicesPage />}

              {/* placeholders for unfinished tabs */}
              {!['analytics', 'users', 'auth_users', 'fcm', 'orders', 'products', 'services'].includes(activeTab) && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-12 text-center text-slate-500">
                  Tính năng "{menuItems.find(m => m.id === activeTab)?.label}" đang được phát triển...
                </div>
              )}
            </Suspense>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
