import React, { useEffect, useState, useMemo } from 'react';
import Request_API from '../../service/api_request';
import UsersClient, { NormalizedUser, PaginationInfo } from './UsersClient';

const apiToRoleLabel: Record<string, string> = {
    admin: "Admin",
    vet: "Nhân viên",
    user: "Khách hàng",
    hotel_owner: "Chủ khách sạn",
};

export default function UsersPage() {
    const [users, setUsers] = useState<NormalizedUser[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ totalUsers: 0, totalPages: 1, currentPage: 1, limit: 100 });
    const [summary, setSummary] = useState({ total: 0, admin: 0, staff: 0, customer: 0, active: 0, blocked: 0 });
    const [error, setError] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const apiClient = useMemo(() => new Request_API(), []);

    useEffect(() => {
        apiClient.getAdminUsers(1, 100)
            .then((payload) => {
                const apiUsers = payload?.data?.users || payload?.data || [];
                const pag = payload?.data?.pagination || { total: apiUsers.length, totalPages: 1, page: 1, limit: 100 };

                const normalized: NormalizedUser[] = apiUsers.map((u: any) => {
                    const fullName = u.fullName || u.name || "Unknown";
                    return {
                        id: u._id || u.id,
                        initials: fullName.substring(0, 1).toUpperCase() || "U",
                        name: fullName,
                        email: u.email || "",
                        phone: u.phone || u.phoneNumber || "",
                        role: apiToRoleLabel[u.role] || u.role || "Khách hàng",
                        bookings: u.bookings || u.appointmentsCount || 0,
                        registered: u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—",
                        status: (u.isActive === false || u.status === "blocked") ? "Bị khóa" : "Hoạt động",
                    };
                });

                setUsers(normalized);
                setPagination({
                    totalUsers: pag.total || normalized.length,
                    totalPages: pag.totalPages || 1,
                    currentPage: pag.page || 1,
                    limit: pag.limit || 100
                });

                setSummary({
                    total: normalized.length,
                    admin: normalized.filter((u) => u.role === "Admin").length,
                    staff: normalized.filter((u) => u.role === "Nhân viên").length,
                    customer: normalized.filter((u) => u.role === "Khách hàng").length,
                    active: normalized.filter((u) => u.status === "Hoạt động").length,
                    blocked: normalized.filter((u) => u.status === "Bị khóa").length,
                });
            })
            .catch(err => {
                console.error("Lỗi khi fetch users:", err);
                setError(err.message || "Không thể lấy dữ liệu người dùng.");
            })
            .finally(() => setLoading(false));
    }, [apiClient]);

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Đang tải dữ liệu người dùng...
            </div>
        );
    }

    return (
        <UsersClient
            initialUsers={users}
            pagination={pagination}
            summary={summary}
            error={error}
        />
    );
}
