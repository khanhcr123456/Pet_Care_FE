

import { useEffect, useMemo, useState } from "react";
/* import { useRouter } from "react-router-dom"; */
import {
  BarChart3,
  Bell,
  ChevronDown,
  Lock,
  LogOut,
  Menu,
  PawPrint,
  PencilLine,
  Search,
  Settings2,
  Shield,
  ShoppingBag,
  Star,
  Users,
  X,
  LayoutDashboard,
} from "lucide-react";
import Request_API from "../../service/api_request";
import { AdminModalProvider, alert, confirm, prompt, adminSidebarItems } from "../components/AdminModal";

export type ApiUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  appointmentsCount?: number;
  bookings?: number;
};

export type NormalizedUser = {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bookings: number;
  registered: string;
  status: string;
};

export type PaginationInfo = {
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

type Props = {
  initialUsers: NormalizedUser[];
  pagination: PaginationInfo;
  summary: {
    total: number;
    admin: number;
    staff: number;
    customer: number;
    active: number;
    blocked: number;
  };
  error?: string;
};

const roleToApiValue: Record<string, string> = {
  Admin: "admin",
  "Nhân viên": "vet",
  "Khách hàng": "user",
  "Chủ khách sạn": "hotel_owner",
};

const apiToRoleLabel: Record<string, string> = {
  admin: "Admin",
  vet: "Nhân viên",
  user: "Khách hàng",
  hotel_owner: "Chủ khách sạn",
};

function computeSummary(users: NormalizedUser[]) {
  return {
    total: users.length,
    admin: users.filter((u) => u.role === "Admin").length,
    staff: users.filter((u) => u.role === "Nhân viên").length,
    customer: users.filter((u) => u.role === "Khách hàng").length,
    active: users.filter((u) => u.status === "Hoạt động").length,
    blocked: users.filter((u) => u.status === "Bị khóa").length,
  };
}

export default function UsersClient({ initialUsers, pagination, summary, error }: Props) {
  const router = { push: (path: string) => window.location.href = path };
  const [menuOpen, setMenuOpen] = useState(true);
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const apiClient = useMemo(() => new Request_API(), []);

  useEffect(() => {
    setUsers(initialUsers.filter(u => u.role !== "Admin"));
  }, [initialUsers]);

  const summaryData = useMemo(() => computeSummary(users), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "staff" && user.role === "Nhân viên") ||
        (roleFilter === "customer" && user.role === "Khách hàng");

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.status === "Hoạt động") ||
        (statusFilter === "blocked" && user.status === "Bị khóa");

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const summaryItems = [
    { label: "Tổng cộng", value: summaryData.total },
    { label: "Nhân viên", value: summaryData.staff },
    { label: "Khách hàng", value: summaryData.customer },
    { label: "Hoạt động", value: summaryData.active },
    { label: "Bị khóa", value: summaryData.blocked },
  ];

  const updateUser = async (userId: string, payload: Record<string, unknown>) => {
    setBusyUserId(userId);
    try {
      await apiClient.updateAdminUser(userId, payload);
      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
              ...user,
              ...(typeof payload.role === "string"
                ? { role: apiToRoleLabel[payload.role as string] ?? (payload.role as string) }
                : {}),
              ...(typeof payload.status === "string"
                ? { status: payload.status === "blocked" ? "Bị khóa" : "Hoạt động" }
                : {}),
            }
            : user
        )
      );
    } catch (err) {
      console.error("Failed to update user", err);
      alert(err instanceof Error ? err.message : "Không thể cập nhật người dùng");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleLock = async (user: NormalizedUser) => {
    const isBlocked = user.status === "Bị khóa";
    const confirmed = await confirm(
      isBlocked ? `Mở khóa tài khoản ${user.name}?` : `Khóa tài khoản ${user.name}?`
    );

    if (!confirmed) return;

    await updateUser(user.id, {
      status: isBlocked ? "active" : "blocked",
      isActive: isBlocked,
    });
  };

  const handleEditRole = async (user: NormalizedUser) => {
    const nextRole = await prompt(
      `Nhập role mới cho ${user.name} (admin, staff, customer):`,
      roleToApiValue[user.role] ?? "customer"
    );

    if (!nextRole) return;

    const normalizedRole = nextRole.trim().toLowerCase();
    const allowedRoles = ["admin", "staff", "customer"];

    if (!allowedRoles.includes(normalizedRole)) {
      alert("Role không hợp lệ. Chỉ nhận admin, staff hoặc customer.");
      return;
    }

    await updateUser(user.id, { role: normalizedRole });
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    apiClient.logout().catch((err) => console.error("Logout error:", err));
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return (
    <AdminModalProvider>
      <div className="content">
        

        <section className="content">
          

          <div className="main-grid">
            <section className="panel users-panel">
              <div className="users-panel__header">
                <div>
                  <h2>Quản lý người dùng</h2>
                  <p>Phân quyền và kiểm soát tài khoản khách hàng &amp; nhân viên</p>
                </div>
                <button type="button" className="primary-button">+ Thêm người dùng</button>
              </div>

              {error && (
                <div className="error-banner" role="alert">
                  ⚠️ {error}
                </div>
              )}

              <div className="summary-grid">
                {summaryItems.map((item) => (
                  <article key={item.label} className="summary-card">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>

              <div className="filters-row">
                <label className="search-field" aria-label="Search users">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Tìm kiếm tên, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="staff">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="blocked">Bị khóa</option>
                </select>
              </div>

              <div className="table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Liên hệ</th>
                      <th>Vai trò</th>
                      <th>Ngày đăng ký</th>
                      <th>Trạng thái</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          {initialUsers.length === 0
                            ? "Chưa có người dùng nào."
                            : "Không tìm thấy người dùng phù hợp."}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-main">
                              <span className="avatar-circle">{user.initials}</span>
                              <div>
                                <strong>{user.name}</strong>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <span>{user.email}</span>
                              <small>{user.phone}</small>
                            </div>
                          </td>
                          <td>
                            <label className={
                              user.role === "Nhân viên"
                                ? "role-chip role-chip--staff"
                                : user.role === "Admin"
                                  ? "role-chip role-chip--admin"
                                  : user.role === "Chủ khách sạn"
                                    ? "role-chip role-chip--hotel"
                                    : user.role === "Khách hàng"
                                      ? "role-chip role-chip--customer"
                                      : "role-chip"
                            }>
                              <Shield size={13} />
                              <span style={{ marginLeft: 8, fontWeight: 700 }}>
                                {user.role}
                              </span>
                            </label>
                          </td>
                          <td>{user.registered}</td>
                          <td>
                            <span
                              className={
                                user.status === "Bị khóa"
                                  ? "status-chip status-chip--blocked"
                                  : "status-chip"
                              }
                            >
                              • {user.status}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions" aria-label={`Actions for ${user.name}`}>
                              <button
                                type="button"
                                className="row-action-icon"
                                aria-label={`Khóa tài khoản ${user.name}`}
                                title="Khóa / mở khóa"
                                disabled={busyUserId === user.id}
                                onClick={() => handleToggleLock(user)}
                              >
                                <Lock size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <span className="pagination__info">
                    Trang {pagination.currentPage} / {pagination.totalPages} —{" "}
                    {pagination.totalUsers} người dùng
                  </span>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <style>{`
        .admin-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 0 minmax(0, 1fr);
          background: #f3f5f8;
          color: #102641;
          transition: grid-template-columns 0.24s ease;
        }

        .admin-page.menu-open {
          grid-template-columns: 288px minmax(0, 1fr);
        }

        .sidebar {
          background: linear-gradient(180deg, #0b1e34 0%, #123256 100%);
          padding: 18px 14px 16px;
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 0;
          align-self: start;
          height: 100vh;
          overflow: hidden;
          overscroll-behavior: contain;
          transition: transform 0.24s ease, opacity 0.24s ease, visibility 0.24s ease, width 0.24s ease;
          box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
          width: 288px;
        }

        .admin-page:not(.menu-open) .sidebar {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(-18px);
        }

        .topbar__menu-toggle {
          cursor: pointer;
          background: transparent;
          border: 0;
          color: #5f6a7a;
        }

        .sidebar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 8px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #f6d400;
          color: #102641;
          flex: 0 0 auto;
        }

        .sidebar__brand strong {
          display: block;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
        }

        .sidebar__brand span {
          display: block;
          margin-top: 2px;
          color: #f6d400;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .sidebar__section-label {
          padding: 6px 12px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .sidebar__nav {
          display: grid;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px;
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.86);
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          white-space: nowrap;
        }

        .nav-item svg {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
        }

        .nav-item--active {
          background: #f6d400;
          color: #102641;
        }

        .sidebar__bottom {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: grid;
          gap: 8px;
        }

        .nav-item--bottom {
          color: rgba(255, 255, 255, 0.78);
        }

        .sidebar__bottom .nav-item {
          width: 100%;
          justify-content: flex-start;
          min-height: 44px;
          border-radius: 16px;
        }

        .content {
          min-width: 0;
          min-height: 100vh;
        }

        .topbar {
          height: 86px;
          padding: 0 24px;
          background: #ffffff;
          border-bottom: 1px solid #e5e9f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .topbar__left,
        .topbar__right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .topbar__left h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .topbar__left p {
          margin: 6px 0 0;
          color: #9aa4b2;
          font-size: 0.95rem;
        }

        .topbar__icon-button {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          display: grid;
          place-items: center;
          color: #5f6a7a;
          position: relative;
          cursor: pointer;
        }

        .topbar__icon-button--notif span {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f28c28;
          border: 2px solid #fff;
        }

        .profile-chip {
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0;
          color: #102641;
          cursor: pointer;
        }

        .profile-chip__avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f6d400;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .profile-chip__meta {
          display: grid;
          text-align: left;
        }

        .profile-chip__meta strong {
          font-size: 0.95rem;
        }

        .profile-chip__meta small {
          color: #97a1b1;
          font-size: 0.82rem;
        }

        .main-grid {
          padding: 18px 22px;
        }

        .panel {
          background: #fff;
          border: 1px solid #e5e9f0;
          border-radius: 18px;
          padding: 18px;
        }

        .users-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .users-panel__header h2 {
          margin: 0;
          font-size: 2.4rem;
          line-height: 1;
        }

        .users-panel__header p {
          margin: 8px 0 0;
          color: #7f8a9a;
          font-size: 1rem;
        }

        .primary-button {
          border: 0;
          border-radius: 14px;
          background: #08264a;
          color: #f6d400;
          font-weight: 800;
          padding: 12px 20px;
          font-size: 1.05rem;
          cursor: pointer;
          white-space: nowrap;
        }

        .error-banner {
          background: #fde7e7;
          color: #d74141;
          border: 1px solid #f5c6c6;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 14px;
          font-weight: 600;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .summary-card {
          border: 1px solid #e6ebf2;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          background: #fff;
        }

        .summary-card strong {
          display: block;
          font-size: 2rem;
          line-height: 1;
          margin-bottom: 8px;
        }

        .summary-card span {
          color: #8e99a9;
        }

        .filters-row {
          border: 1px solid #e6ebf2;
          border-radius: 16px;
          background: #fff;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 140px 160px;
          gap: 12px;
          margin-bottom: 14px;
        }

        .search-field {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #dfe5ee;
          border-radius: 14px;
          padding: 10px 12px;
          color: #8d98a8;
        }

        .search-field input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          font: inherit;
          color: #102641;
        }

        .filters-row select {
          border: 1px solid #dfe5ee;
          border-radius: 14px;
          padding: 10px 12px;
          font: inherit;
          color: #2f3a48;
          background: #fff;
          cursor: pointer;
        }

        .table-wrap {
          border: 1px solid #e6ebf2;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
        }

        .user-table {
          width: 100%;
          border-collapse: collapse;
        }

        .user-table th,
        .user-table td {
          padding: 14px 14px;
          text-align: left;
          border-bottom: 1px solid #eef2f6;
          vertical-align: middle;
        }

        .user-table tr:last-child td {
          border-bottom: none;
        }

        .user-table th {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #748195;
          background: #fbfcfe;
        }

        .user-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f6d400;
          color: #102641;
          display: grid;
          place-items: center;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .user-main strong {
          display: block;
          font-size: 0.98rem;
          color: #2a3544;
        }

        .user-main small {
          color: #8e99a9;
        }

        .contact-cell span,
        .contact-cell small {
          display: block;
        }

        .contact-cell span {
          color: #3a4657;
        }

        .contact-cell small {
          color: #8e99a9;
          margin-top: 4px;
        }

        .role-chip,
        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .role-chip {
          background: #f0f2f5;
          color: #3f4b5d;
        }

        .role-chip--staff {
          background: #e6eeff;
          color: #2a64d5;
        }

        .role-chip--admin {
          background: #fff0cc;
          color: #9a6c00;
        }

        .role-chip--customer {
          background: #f3f6f9;
          color: #384754;
        }

        .role-chip--hotel {
          background: #eef9f6;
          color: #0f6b56;
        }

        .status-chip {
          background: #dff5e8;
          color: #1f9a52;
        }

        .status-chip--blocked {
          background: #fde7e7;
          color: #d74141;
        }

        .row-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .row-action-icon {
          border: 0;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #eef2f7;
          color: #59708b;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        .row-action-icon:hover {
          background: #dce7f3;
          color: #1d4e89;
          transform: translateY(-1px);
        }

        .row-action-icon:disabled {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        .empty-state {
          text-align: center;
          padding: 40px !important;
          color: #8e99a9;
          font-size: 1rem;
        }

        .pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-top: 14px;
          gap: 12px;
        }

        .pagination__info {
          color: #8e99a9;
          font-size: 0.95rem;
        }

        @media (max-width: 980px) {
          .admin-page.menu-open {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters-row {
            grid-template-columns: 1fr;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .user-table {
            min-width: 920px;
          }
        }
      `}</style>
    </AdminModalProvider>
  );
}
