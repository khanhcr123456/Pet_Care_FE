import { useEffect, useState } from 'react';
import { fetchFcmReport, sendBroadcastNotification, memCache } from '../../service/api_request';

type FcmTotals = {
    sends: number;
    received: number;
    impressions: number;
    openCount: number;
};

type FcmDaily = {
    date: string;
    sends: number;
    received: number;
    impressions: number;
    openCount: number;
};

export default function FcmReport() {
    const [totals, setTotals] = useState<FcmTotals | null>(memCache['fcmTotals'] || null);
    const [chartData, setChartData] = useState<FcmDaily[]>(memCache['fcmDaily'] || []);
    const [loading, setLoading] = useState(!memCache['fcmTotals']);
    const [error, setError] = useState<string | null>(null);

    // Notification State
    const [showNotifForm, setShowNotifForm] = useState(false);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifResult, setNotifResult] = useState<{ success: boolean, message: string } | null>(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            if (!memCache['fcmTotals']) setLoading(true);
            setError(null);

            const json = await fetchFcmReport();

            if (json.success && json.data) {
                memCache['fcmTotals'] = json.data.totals;
                memCache['fcmDaily'] = [...json.data.chartData].reverse();
                setTotals(memCache['fcmTotals']);
                setChartData(memCache['fcmDaily']);
            } else {
                throw new Error(json.message || 'Lỗi khi lấy dữ liệu');
            }
        } catch (err: any) {
            setError(err.message === 'Failed to fetch'
                ? 'Không thể kết nối đến Backend (localhost:5000). Vui lòng đảm bảo Backend đang chạy.'
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotifLoading(true);
        setNotifResult(null);

        try {
            const json = await sendBroadcastNotification({
                title: notifTitle,
                body: notifBody,
                type: 'SYSTEM_ANNOUNCEMENT'
            });

            if (json.success) {
                setNotifResult({ success: true, message: `Thành công: ${json.message}` });
                setNotifTitle('');
                setNotifBody('');
                // Refresh report after 2 seconds to see new sends count
                setTimeout(() => fetchReport(), 2000);
            } else {
                setNotifResult({ success: false, message: json.message || 'Gửi thất bại' });
            }
        } catch (err: any) {
            setNotifResult({ success: false, message: err.message });
        } finally {
            setNotifLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-2">
                <button
                    onClick={() => setShowNotifForm(!showNotifForm)}
                    className={`relative overflow-hidden rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition-all duration-300 flex items-center gap-2
                        ${showNotifForm
                        }`}
                >
                    {showNotifForm ? (
                        <><span>✕</span> Ẩn bảng điều khiển</>
                    ) : (
                        <><span>📢</span> Tạo chiến dịch thông báo</>
                    )}
                </button>
            </div>

            {showNotifForm && (
                <div className="rounded-[2rem] border border-white bg-white/70 backdrop-blur-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 transition-all relative overflow-hidden ring-1 ring-slate-900/5">
                    {/* Background blob decoration */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-10">
                        {/* Left Side: Info */}
                        <div className="md:w-1/3 flex flex-col justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-50 text-cyan-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-cyan-100">
                                🚀
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Kích hoạt chiến dịch</h3>
                            <p className="text-slate-500 mt-3 text-sm leading-relaxed font-medium">
                                Gửi thông báo đẩy (Push Notification) đồng loạt thẳng đến màn hình điện thoại của toàn bộ người dùng Ứng dụng. Rất thích hợp để nhắc nhở sự kiện, giảm giá hoặc tin tức khẩn cấp.
                            </p>
                        </div>

                        {/* Right Side: Form */}
                        <div className="md:w-2/3 bg-white p-7 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
                            {notifResult && (
                                <div className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 font-medium ${notifResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                                    <span className="text-xl mt-0.5">{notifResult.success ? '✅' : '⚠️'}</span>
                                    <span>{notifResult.message}</span>
                                </div>
                            )}

                            <form onSubmit={handleSendBroadcast} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tiêu đề thông báo</label>
                                    <input
                                        type="text"
                                        required
                                        value={notifTitle}
                                        onChange={e => setNotifTitle(e.target.value)}
                                        placeholder="Ví dụ: 🔥 Siêu giảm giá 50% hôm nay!"
                                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nội dung chi tiết</label>
                                    <textarea
                                        required
                                        value={notifBody}
                                        onChange={e => setNotifBody(e.target.value)}
                                        rows={3}
                                        placeholder="Nội dung sẽ hiện trên thanh thông báo điện thoại..."
                                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={notifLoading}
                                        className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/40 disabled:opacity-70 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {notifLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Đang kết nối Server...
                                            </>
                                        ) : (
                                            <>
                                                Phát Sóng Ngay (Broadcast) 📡
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="h-24 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                        <div className="h-24 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                        <div className="h-24 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                        <div className="h-24 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                    </div>
                    <div className="h-64 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
                    {error}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Dashboard Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Đã gửi (Sends)</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals?.sends}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Đã nhận (Received)</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals?.received}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Hiển thị (Impressions)</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals?.impressions}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">Đã mở (Opened)</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals?.openCount}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="px-6 py-5 sm:px-8 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900">Thống kê 90 ngày gần nhất (Dữ liệu từ Google Analytics & Backend)</h2>
                        </div>
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">Ngày</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap text-right">Gửi</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap text-right">Nhận</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap text-right">Hiển thị</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap text-right">Mở click</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {chartData.filter(d => d.sends > 0 || d.received > 0 || d.impressions > 0 || d.openCount > 0).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                Chưa có dữ liệu nào trong 90 ngày qua.
                                            </td>
                                        </tr>
                                    ) : (
                                        chartData
                                            .filter(d => d.sends > 0 || d.received > 0 || d.impressions > 0 || d.openCount > 0) // Chỉ hiển thị ngày có tương tác để đỡ rối
                                            .map((day) => (
                                                <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                        {day.date}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-600">
                                                        {day.sends}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-600">
                                                        {day.received}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-600">
                                                        {day.impressions}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-600 font-medium">
                                                        {day.openCount > 0 ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{day.openCount}</span>
                                                        ) : '0'}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
                            * Bảng chỉ hiển thị các ngày có phát sinh tối thiểu 1 thông báo. Những ngày không có dữ liệu (0) sẽ được ẩn đi.
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
