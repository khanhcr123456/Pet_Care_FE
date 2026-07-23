import { useState, useEffect } from 'react';
import { fetchFirebaseUsers, toggleUserStatus, deleteFirebaseUser, memCache } from '../../service/api_request';

type FirebaseAuthUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    emailVerified: boolean;
    disabled: boolean;
    createdAt: string;
    lastSignedIn: string;
    providerData: any[];
};

export default function AuthUsers() {
    const [users, setUsers] = useState<FirebaseAuthUser[]>(memCache['users'] || []);
    const [loading, setLoading] = useState(!memCache['users']);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            if (!memCache['users']) setLoading(true);
            setError(null);

            const json = await fetchFirebaseUsers();

            if (json.success) {
                memCache['users'] = json.data;
                setUsers(json.data);
            } else {
                throw new Error(json.message || 'Lỗi khi lấy danh sách users');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (uid: string, currentStatusDisabled: boolean) => {
        try {
            const json = await toggleUserStatus(uid, !currentStatusDisabled);
            if (json.success) {
                // Update local state instead of refetching for better UX
                setUsers(users.map(u => u.uid === uid ? { ...u, disabled: !currentStatusDisabled } : u));
            } else {
                throw new Error(json.message);
            }
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (window.confirm('Bạn có CỰC KỲ CHẮC CHẮN muốn xoá vĩnh viễn tài khoản Firebase này không? Hành động này sẽ không thể khôi phục!')) {
            try {
                const json = await deleteFirebaseUser(uid);
                if (json.success) {
                    setUsers(users.filter(u => u.uid !== uid));
                    alert('Đã xoá tài khoản thành công!');
                } else {
                    throw new Error(json.message || 'Xóa thất bại');
                }
            } catch (err: any) {
                alert('Lỗi khi xoá: ' + err.message);
            }
        }
    };

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="space-y-4">
                    <div className="h-16 w-full rounded-2xl bg-slate-200 animate-pulse"></div>
                    <div className="h-32 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                    <div className="h-32 w-full rounded-3xl bg-slate-200 animate-pulse"></div>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
                    {error}
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Người dùng Firebase Auth</h2>
                            <p className="mt-1 text-sm text-slate-500">Hiển thị tối đa 100 tài khoản cuối (Lấy từ Firebase Admin SDK qua Backend).</p>
                        </div>
                        <div className="text-2xl font-bold text-cyan-600">{users.length}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Hình / Người dùng</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Firebase UID</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Ngày tạo</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Không tìm thấy người dùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={u.photoURL || `https://ui-avatars.com/api/?name=${u.email || 'User'}&background=random`}
                                                        alt="avatar"
                                                        className="h-8 w-8 rounded-full border border-slate-200"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-slate-900">{u.displayName || '(Trống)'}</div>
                                                        <div className="text-xs text-slate-500">{u.email || u.phoneNumber || 'Không có email'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                                {u.uid}
                                            </td>
                                            <td className="px-6 py-3">
                                                {u.disabled ? (
                                                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-700/10">Bị khóa</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Bình thường</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right text-xs text-slate-500">
                                                {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(u.uid, u.disabled)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${u.disabled
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200'
                                                            }`}
                                                    >
                                                        {u.disabled ? 'Mở Khóa' : 'Tạm Khóa'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.uid)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                                                    >
                                                        Xoá
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
