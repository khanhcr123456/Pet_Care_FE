import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchFirebaseAnalytics, memCache, fetchRemoteConfigTheme, updateRemoteConfigTheme } from '../../service/api_request';

export default function FirebaseAnalytics() {
    const [data, setData] = useState<any>(memCache['analytics'] || null);
    const [loading, setLoading] = useState(!memCache['analytics']);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<string>(localStorage.getItem('adminAppTheme') || 'NORMAL');
    const [updatingTheme, setUpdatingTheme] = useState(false);
    const [themeUpdateMessage, setThemeUpdateMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
        fetchTheme();
    }, []);

    const fetchTheme = async () => {
        try {
            const json = await fetchRemoteConfigTheme();
            const fetchedTheme = json?.data?.parameters?.app_theme_event?.defaultValue?.value
                || json?.parameters?.app_theme_event?.defaultValue?.value
                || json?.data?.app_theme_event
                || json?.app_theme_event
                || json?.data?.theme
                || json?.theme;

            if (fetchedTheme) {
                setTheme(fetchedTheme);
                localStorage.setItem('adminAppTheme', fetchedTheme);
            }
        } catch (err) {
            console.error("Failed to fetch remote config", err);
        }
    };

    const handleChangeTheme = async (newTheme: string) => {
        if (updatingTheme) return; // Không cho click đè khi đang lưu
        const previousTheme = theme;
        try {
            // FIRE AND FORGET: Cập nhật giao diện lập tức, không block tương tác!
            setTheme(newTheme);
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));

            setUpdatingTheme(true);
            setThemeUpdateMessage(`Đang đồng bộ giao diện [${newTheme === 'NORMAL' ? 'MẶC ĐỊNH' : newTheme}] lên Server...`);

            // Chạy API ngầm dưới nền, hoàn toàn không chặn UI
            updateRemoteConfigTheme(newTheme).then((success) => {
                if (!success) throw new Error();
                setThemeUpdateMessage('✅ Đồng bộ đổi theme thành công!');
                setTimeout(() => setThemeUpdateMessage(null), 2500);
            }).catch(() => {
                // Nếu rớt mạng ngầm thì lùi lại
                setTheme(previousTheme);
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: previousTheme }));
                setThemeUpdateMessage('⚠️ Lỗi kết nối: Không thể đổi giao diện!');
                setTimeout(() => setThemeUpdateMessage(null), 2500);
            }).finally(() => {
                setUpdatingTheme(false);
            });

        } catch (error) {
            console.error('Lỗi khi đổi giao diện:', error);
            setUpdatingTheme(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            if (!memCache['analytics']) setLoading(true);
            setError(null);

            const json = await fetchFirebaseAnalytics();

            if (json.success) {
                memCache['analytics'] = json.data;
                setData(json.data);
            } else {
                throw new Error(json.message || 'Lỗi khi lấy dữ liệu Analytics');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: any) => {
        if (num === undefined || num === null || isNaN(num)) return '-';
        const n = Number(num);
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n;
    };

    const formatTime = (timeStr: any) => {
        if (!timeStr || isNaN(timeStr)) return '0s';
        const totalSeconds = Number(timeStr);
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    };

    // Safe data extraction based on new BE structure
    const overview = data?.overview || {};
    const activeUsers = formatNumber(overview.activeUsers_30Days) || '0';
    const newUsers = formatNumber(overview.newUsers_30Days) || '0';
    const avgEngagement = formatTime(overview.averageEngagementSeconds);
    const eventCount = formatNumber(overview.totalEventCount_30Days) || '0';

    const displayRows = data?.topScreens || [];

    // Realtime
    const activeNow = data?.realtimeData?.usersInLast30Minutes || 0;

    // Determine max values for the little inline blue bars
    const maxViews = Math.max(...displayRows.map((r: any) => Number(r.screenPageViews) || 0), 1);
    const maxActive = Math.max(...displayRows.map((r: any) => Number(r.activeUsers) || 0), 1);
    const maxEvents = Math.max(...displayRows.map((r: any) => Number(r.eventCount) || 0), 1);

    const safeFormatBounceRate = (val: any) => {
        if (val === null || val === undefined || val === 'NaN' || val === '') return '-';
        if (typeof val === 'string' && val.includes('%')) return val;

        const n = Number(val);
        if (Number.isNaN(n)) return '-';

        if (n > 1) return n.toFixed(1) + '%';
        return (n * 100).toFixed(1) + '%';
    };

    // Pad time series data to 30 days exactly
    const getPaddedActivityData = () => {
        const rawData = data?.userActivityOverTime || [];
        if (rawData.length === 0) return [];

        // Find latest date in rawData
        const latestStr = rawData[rawData.length - 1].date;
        const latestDate = new Date(`${latestStr.substring(0, 4)}-${latestStr.substring(4, 6)}-${latestStr.substring(6, 8)}`);

        const padded = [];
        // Go back 29 days from latest (30 days total)
        for (let i = 29; i >= 0; i--) {
            const d = new Date(latestDate);
            d.setDate(d.getDate() - i);

            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd}`;

            const existing = rawData.find((r: any) => r.date === dateStr);
            if (existing) {
                padded.push(existing);
            } else {
                padded.push({ date: dateStr, active1Day: 0, active7Days: 0, active30Days: 0 });
            }
        }
        return padded;
    };

    const displayActivityData = getPaddedActivityData();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-slate-900">{activeNow}</span> người dùng đang hoạt động (30 phút qua)
                </div>
            </div>

            {/* Notification Toast */}
            {themeUpdateMessage && (
                <div className="fixed bottom-12 right-12 z-[100] bg-slate-900 border-2 border-slate-700 text-white px-8 py-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 transition-all duration-300">
                    {updatingTheme ? (
                        <div className="w-8 h-8 border-[4px] border-white/20 border-t-emerald-400 rounded-full animate-spin"></div>
                    ) : null}
                    <span className="font-bold text-lg tracking-wide">{themeUpdateMessage}</span>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    <div className="h-48 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                    <div className="h-64 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                    <div className="h-64 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
                    {error}
                </div>
            ) : !data ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm text-center">
                    Chưa có dữ liệu.
                </div>
            ) : (
                <div className="space-y-6">
                    {/* PREMIUM REMOTE CONFIG SELECTION */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-xl mt-2 mb-8">
                        {/* Decorative background blobs */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>

                        <div className="relative flex flex-col xl:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5 w-full xl:w-auto">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md border border-white/10">
                                    <span className="text-3xl shadow-black drop-shadow-md">✨</span>
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Cấu trúc Giao diện Mobile</h2>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-sm text-slate-300">Đang bật cho khách hàng:</span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            {theme}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/5 p-2.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                                {['NORMAL', 'NOEL', 'TET', 'HALLOWEEN'].map((t) => {
                                    let btnStyle = "";
                                    let icon = "";

                                    if (t === 'NORMAL') { btnStyle = "from-blue-500 to-cyan-500 shadow-blue-500/40"; icon = "🐾"; }
                                    if (t === 'NOEL') { btnStyle = "from-emerald-500 to-teal-500 shadow-emerald-500/40"; icon = "🎄"; }
                                    if (t === 'TET') { btnStyle = "from-rose-500 to-red-500 shadow-rose-500/40"; icon = "🌸"; }
                                    if (t === 'HALLOWEEN') { btnStyle = "from-orange-500 to-amber-500 shadow-orange-500/40"; icon = "🎃"; }

                                    const isActive = theme === t;

                                    return (
                                        <button
                                            key={t}
                                            onClick={() => handleChangeTheme(t)}
                                            disabled={isActive}
                                            className={`relative group px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ease-out flex items-center gap-2 min-w-[120px] justify-center active:scale-95
                                                ${isActive
                                                    ? `bg-gradient-to-r ${btnStyle} text-white shadow-lg ring-2 ring-white/20 scale-105 active:scale-105`
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/20 hover:text-white border border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <span className={`text-lg ${isActive ? 'animate-bounce drop-shadow-md' : 'group-hover:scale-125 transition-transform'}`}>
                                                {icon}
                                            </span>
                                            {t === 'NORMAL' ? 'MẶC ĐỊNH' : t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 px-1 border-b border-dashed border-slate-300 pb-2 inline-block mt-4">
                        Báo cáo tổng quan (30 Ngày)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <div className="group relative inline-block w-max">
                                <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 cursor-help">Người dùng HĐ</span>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-50 shadow-xl text-center leading-relaxed font-medium">
                                    Số lượng người dùng đã có tương tác với ứng dụng (trong 30 ngày).
                                    <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                            <span className="text-3xl md:text-4xl font-normal text-slate-800">{activeUsers}</span>
                        </div>
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <div className="group relative inline-block w-max">
                                <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 cursor-help">Người dùng mới</span>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-50 shadow-xl text-center leading-relaxed font-medium">
                                    Tổng lượng người dùng mới cài đặt, đăng ký hoặc lần đầu sử dụng.
                                    <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                            <span className="text-3xl md:text-4xl font-normal text-slate-800">{newUsers}</span>
                        </div>
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <div className="group relative inline-block w-max">
                                <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 cursor-help truncate block">TG tương tác TB</span>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-50 shadow-xl text-center leading-relaxed font-medium">
                                    Thời gian trung bình người dùng dành ra để lướt và xem màn hình ứng dụng mỗi phiên.
                                    <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                            <span className="text-3xl md:text-4xl font-normal text-slate-800">{avgEngagement}</span>
                        </div>
                        <div className="p-6 flex flex-col justify-center gap-2">
                            <div className="group relative inline-block w-max">
                                <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 cursor-help">Lượt sự kiện</span>
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-50 shadow-xl text-center leading-relaxed font-medium">
                                    Tổng số lần click thao tác/sự kiện ứng dụng ghi nhận được.
                                    <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                            <span className="text-3xl md:text-4xl font-normal text-slate-800">{eventCount}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 border-b border-dashed border-slate-300 pb-1 inline-block">Hoạt động người dùng theo thời gian</h3>
                        </div>
                        <div className="flex h-80">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={displayActivityData} margin={{ top: 20, right: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            interval={6}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            tickFormatter={(value: any) => {
                                                if (value && value.length === 8) {
                                                    const m = new Date(`${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`).toLocaleString('default', { month: 'short' });
                                                    return `${value.substring(6, 8)}\n${m}`;
                                                }
                                                return value;
                                            }}
                                        />
                                        <YAxis
                                            orientation="right"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                            labelFormatter={(value: any) => {
                                                if (value && value.length === 8) {
                                                    return `${value.substring(6, 8)}/${value.substring(4, 6)}/${value.substring(0, 4)}`;
                                                }
                                                return value;
                                            }}
                                        />
                                        <Line type="monotone" name="30 Days" dataKey="active30Days" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} activeDot={{ r: 7 }} />
                                        <Line type="monotone" name="7 Days" dataKey="active7Days" stroke="#84cc16" strokeWidth={2} dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#84cc16' }} activeDot={{ r: 7 }} />
                                        <Line type="monotone" name="1 Day" dataKey="active1Day" stroke="#ec4899" strokeWidth={2} dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#ec4899' }} activeDot={{ r: 7 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="w-24 pl-4 flex flex-col justify-start pt-6 gap-6">
                                {data?.userActivityOverTime?.length > 0 && (
                                    <>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                                30 NGÀY
                                            </div>
                                            <div className="text-2xl text-slate-800 ml-4 font-normal">
                                                {formatNumber(data.userActivityOverTime[data.userActivityOverTime.length - 1].active30Days)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                                                <div className="w-2.5 h-2.5 bg-lime-500"></div>
                                                7 NGÀY
                                            </div>
                                            <div className="text-2xl text-slate-800 ml-4 font-normal">
                                                {formatNumber(data.userActivityOverTime[data.userActivityOverTime.length - 1].active7Days)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                                                <div className="w-2.5 h-2.5 rotate-45 bg-pink-500"></div>
                                                1 NGÀY
                                            </div>
                                            <div className="text-2xl text-slate-800 ml-4 font-normal">
                                                {formatNumber(data.userActivityOverTime[data.userActivityOverTime.length - 1].active1Day)}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-sm font-semibold text-slate-700">Màn hình tiêu biểu nhất</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">TÊN MÀN HÌNH</span></th>
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">LƯỢT XEM</span></th>
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">LƯỢT SỰ KIỆN</span></th>
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">TỶ LỆ THOÁT</span></th>
                                        <th className="px-6 py-4 text-right"><span className="border-b border-dashed border-slate-300 pb-1">NGƯỜI DÙNG</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                Chưa có dữ liệu về phân tích các màn hình
                                            </td>
                                        </tr>
                                    ) : (
                                        displayRows.map((row: any, idx: number) => {
                                            const vPct = (Number(row.screenPageViews) / maxViews) * 100;
                                            const aPct = (Number(row.activeUsers) / maxActive) * 100;
                                            const ePct = (Number(row.eventCount) / maxEvents) * 100;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        {row.screenName === '(not set)' ? <span className="italic text-slate-400">Không xác định</span> : row.screenName}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="flex flex-col gap-1.5 max-w-[120px]">
                                                            <span>{formatNumber(row.screenPageViews)}</span>
                                                            <div className="w-full bg-transparent h-0.5">
                                                                <div className="bg-blue-500 h-0.5 rounded-full" style={{ width: `${vPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="flex flex-col gap-1.5 max-w-[120px]">
                                                            <span>{formatNumber(row.eventCount) || '-'}</span>
                                                            <div className="w-full bg-transparent h-0.5">
                                                                <div className="bg-purple-500 h-0.5 rounded-full" style={{ width: `${ePct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <span>{safeFormatBounceRate(row.bounceRate)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 text-right">
                                                        <div className="flex flex-col gap-1.5 items-end">
                                                            <span>{formatNumber(row.activeUsers)}</span>
                                                            <div className="w-[100px] bg-transparent h-0.5 flex justify-end">
                                                                <div className="bg-blue-500 h-0.5 rounded-full" style={{ width: `${aPct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6">
                        {/* Event breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                                <h3 className="text-sm font-semibold text-blue-800">Sự kiện tương tác (Events)</h3>
                                <p className="text-xs text-blue-500 mt-1">Các hành vi sự kiện nổi bật của người dùng trên ứng dụng</p>
                            </div>
                            <ul className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                                {data.eventscount?.map((evt: any, i: number) => (
                                    <li key={i} className="px-6 py-4 flex justify-between items-center hover:bg-blue-50/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex justify-center items-center text-blue-600 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium text-sm text-slate-700">{evt.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{formatNumber(evt.count)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
