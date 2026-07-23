import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchFirebaseAnalytics, memCache } from './service/api_request';

export default function FirebaseAnalytics() {
    const [data, setData] = useState<any>(memCache['analytics'] || null);
    const [loading, setLoading] = useState(!memCache['analytics']);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

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
                <div className="flex gap-2">
                    <button
                        onClick={fetchAnalytics}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                        Làm mới Analytics
                    </button>
                </div>
            </div>

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
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 px-1 border-b border-dashed border-slate-300 pb-2 inline-block">
                        Reports snapshot (30 Days)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 inline-block w-max">Active users</span>
                            <span className="text-4xl font-normal text-slate-800">{activeUsers}</span>
                        </div>
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 inline-block w-max">New users</span>
                            <span className="text-4xl font-normal text-slate-800">{newUsers}</span>
                        </div>
                        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center gap-2">
                            <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 inline-block w-max truncate">Average engagement time</span>
                            <span className="text-4xl font-normal text-slate-800">{avgEngagement}</span>
                        </div>
                        <div className="p-6 flex flex-col justify-center gap-2">
                            <span className="text-sm font-semibold text-slate-500 border-b border-dashed border-slate-300 pb-1 inline-block w-max">Event count</span>
                            <span className="text-4xl font-normal text-slate-800">{eventCount}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-semibold text-slate-700 border-b border-dashed border-slate-300 pb-1 inline-block">User activity over time</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-pointer text-xs">
                                </span>
                                <span className="text-xs text-slate-400">▼</span>
                            </div>
                        </div>
                        <div className="flex h-80">
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={displayActivityData} margin={{ right: 20 }}>
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
                                                30 DAYS
                                            </div>
                                            <div className="text-2xl text-slate-800 ml-4 font-normal">
                                                {formatNumber(data.userActivityOverTime[data.userActivityOverTime.length - 1].active30Days)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                                                <div className="w-2.5 h-2.5 bg-lime-500"></div>
                                                7 DAYS
                                            </div>
                                            <div className="text-2xl text-slate-800 ml-4 font-normal">
                                                {formatNumber(data.userActivityOverTime[data.userActivityOverTime.length - 1].active7Days)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                                                <div className="w-2.5 h-2.5 rotate-45 bg-pink-500"></div>
                                                1 DAY
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
                            <h3 className="text-sm font-semibold text-slate-700">Top pages and screens</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-pointer text-xs">
                                    ✓
                                </span>
                                <span className="text-xs text-slate-400">▼</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">PAGE TITLE AND SCREEN CLASS</span></th>
                                        <th className="px-6 py-4"><span className="border-b border-dashed border-slate-300 pb-1">VIEWS</span></th>
                                        <th className="px-6 py-4 text-right"><span className="border-b border-dashed border-slate-300 pb-1">ACTIVE USERS</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                                Chưa có dữ liệu về phân tích các màn hình
                                            </td>
                                        </tr>
                                    ) : (
                                        displayRows.map((row: any, idx: number) => {
                                            const vPct = (Number(row.screenPageViews) / maxViews) * 100;
                                            const aPct = (Number(row.activeUsers) / maxActive) * 100;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        {row.screenName === '(not set)' ? <span className="italic text-slate-400">Không xác định</span> : row.screenName}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                            <span>{formatNumber(row.screenPageViews)}</span>
                                                            <div className="w-full bg-transparent h-0.5">
                                                                <div className="bg-blue-500 h-0.5 rounded-full" style={{ width: `${vPct}%` }}></div>
                                                            </div>
                                                        </div>
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
