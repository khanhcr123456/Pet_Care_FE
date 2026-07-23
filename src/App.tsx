import { useState, Suspense, lazy } from 'react';
import { apiLogin, apiLogout } from './service/api_request';

const FcmReport = lazy(() => import('./FcmReport'));
const AuthUsers = lazy(() => import('./AuthUsers'));
const FirebaseAnalytics = lazy(() => import('./FirebaseAnalytics'));

function App() {
  // Global Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminAccessToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTabState] = useState<string>(localStorage.getItem('adminActiveTab') || 'analytics');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('adminActiveTab', tab);
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
    { id: 'analytics', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Quản lý người dùng', icon: '👥' },
    { id: 'fcm', label: 'Báo cáo FCM', icon: '🔔' },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: '📦' },
    { id: 'services', label: 'Dịch vụ & Giá cả', icon: '💰' },
    { id: 'products', label: 'Quản lý sản phẩm', icon: '🐾' },
    { id: 'revenue', label: 'Báo cáo doanh thu', icon: '📈' },
    { id: 'reviews', label: 'Xét duyệt đánh giá', icon: '⭐' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111827] text-slate-300 flex flex-col h-full shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl">
              🐾
            </div>
            <div>
              <h1 className="text-white font-bold tracking-wider text-sm">PAWRENT</h1>
              <p className="text-[#FFD700] text-xs font-semibold">Admin Panel</p>
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
                  ? 'bg-[#FFD700] text-slate-900 shadow-md'
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
            <p className="text-xs text-slate-400 mt-1 font-medium">PAWRENT Pet Care Management</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center text-slate-900 font-bold">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Admin</p>
                <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">

          {/* HEADER BANNER */}
          <div className="mb-8 rounded-2xl bg-[#111827] text-white p-8 shadow-sm flex items-center justify-between overflow-hidden relative">
            <div className="z-10">
              <h1 className="text-3xl font-bold sm:text-4xl mb-2">Xin chào, Admin!</h1>
              <p className="text-slate-400 text-sm">
                {activeTab === 'analytics' || activeTab === 'fcm' || activeTab === 'users'
                  ? 'Dữ liệu được lấy trực tiếp từ các dịch vụ của Firebase.'
                  : 'Đang tải dữ liệu dashboard...'}
              </p>
            </div>

            {/* Paw background decoration */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 text-[100px] select-none text-[#FFD700]">
              🐾
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
              {activeTab === 'users' && <AuthUsers />}
              {activeTab === 'fcm' && <FcmReport />}

              {/* placeholders for unfinished tabs */}
              {!['analytics', 'users', 'fcm'].includes(activeTab) && (
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
