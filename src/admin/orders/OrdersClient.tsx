

import React, { useEffect, useMemo, useState } from "react";
/* import { useRouter } from "react-router-dom"; */
import {
    Bell,
    ChevronDown,
    LogOut,
    Menu,
    PawPrint,
    Search,
    Settings2,
    X,
    Package,
    PencilLine,
    ChevronUp
} from "lucide-react";
import Request_API from "../../service/api_request";
import { adminSidebarItems, AdminModalProvider, alert } from "../components/AdminModal";

type Props = {
    initialInvoices: Record<string, unknown>[];
};

export default function OrdersClient({ initialInvoices }: Props) {
    const router = { push: (path: string) => window.location.href = path };
    const [menuOpen, setMenuOpen] = useState(true);
    const [orders, setOrders] = useState(initialInvoices);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [fetchedImages, setFetchedImages] = useState<Record<string, string>>({});

    const apiClient = useMemo(() => new Request_API(), []);

    useEffect(() => {
        setOrders(initialInvoices);
    }, [initialInvoices, apiClient]);

    useEffect(() => {
        const fetchMissingImages = async () => {
            if (!orders || orders.length === 0) return;
            const newFetched = { ...fetchedImages };
            let hasChanges = false;

            const fetchPromises = [];

            for (const order of orders) {
                const items = Array.isArray(order.items) ? order.items : [];
                for (const item of items as any[]) {
                    const refId = item.refId;
                    // Prevent re-fetching or empty IDs
                    if (item.type === 'product' && refId && newFetched[refId] === undefined) {
                        newFetched[refId] = ""; // default empty string to mark as fetched
                        fetchPromises.push(
                            apiClient.request(`products/${refId}`, { method: 'GET' })
                                .then(res => {
                                    const images = res?.data?.images;
                                    if (Array.isArray(images) && images.length > 0) {
                                        const url = typeof images[0] === 'string' ? images[0] : (images[0]?.url || "");
                                        if (url) {
                                            newFetched[refId] = url;
                                            hasChanges = true;
                                        }
                                    }
                                })
                                .catch(() => { /* skip errors */ })
                        );
                    }
                }
            }

            if (fetchPromises.length > 0) {
                await Promise.all(fetchPromises);
                setFetchedImages(newFetched);
            }
        };

        fetchMissingImages();
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const id = (order._id as string) || (order.id as string) || "";
            const no = id; // Theo yêu cầu: lấy id của hóa đơn
            const user = order.user as Record<string, string> | undefined;
            const userName = user?.fullName || user?.name || "";
            const phone = user?.phone || user?.phoneNumber || "";

            const matchesSearch =
                !searchQuery ||
                no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                phone.includes(searchQuery);

            const status = (order.orderStatus as string) || (order.status as string) || "";
            const matchesStatus =
                statusFilter === "all" || status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setBusyOrderId(orderId);
        try {
            await apiClient.updateOrderStatus(orderId, newStatus);
            setOrders((current) =>
                current.map((o) =>
                    ((o._id as string) || (o.id as string)) === orderId ? { ...o, orderStatus: newStatus, status: newStatus } : o
                )
            );
        } catch (err: unknown) {
            console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
            const errorMsg = err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng";
            alert(errorMsg);
        } finally {
            setBusyOrderId(null);
        }
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        apiClient.logout().catch((err) => console.error("Logout error:", err));
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    const formatCurrency = (amount: unknown) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount) || 0);
    };

    const formatDate = (dateStr: unknown) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr as string).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            });
        } catch {
            return "—";
        }
    };

    const statusSequence = ["awaiting_confirmation", "confirmed", "preparing", "shipping", "delivered", "completed"];

    const normalizeStatus = (val: string) => {
        const s = val.toLowerCase();
        if (s === "pending" || s === "chờ_xác_nhận") return "awaiting_confirmation";
        if (s === "đã_xác_nhận") return "confirmed";
        if (s === "đang_chuẩn_bị") return "preparing";
        if (s === "đang_giao") return "shipping";
        if (s === "đã_giao") return "delivered";
        if (s === "hoàn_thành" || s === "success") return "completed";
        if (s === "đã_hủy" || s === "cancelled") return "cancelled";
        if (s === "paid" || s === "đã_thanh_toán") return "paid";
        if (s === "awaiting_payment" || s === "chờ_thanh_toán") return "awaiting_payment";
        return s;
    };

    const orderStatusMeta: Record<string, { label: string, actionLabel: string, colorClass: string }> = {
        "awaiting_confirmation": { label: "Chờ xác nhận", actionLabel: "Xác nhận", colorClass: "status-chip--pending" },
        "confirmed": { label: "Đã xác nhận", actionLabel: "Chuẩn bị", colorClass: "status-chip--confirmed" },
        "preparing": { label: "Đang chuẩn bị", actionLabel: "Giao hàng", colorClass: "status-chip--preparing" },
        "shipping": { label: "Đang giao", actionLabel: "Đã giao", colorClass: "status-chip--shipping" },
        "delivered": { label: "Đã tới nơi", actionLabel: "Hoàn tất", colorClass: "status-chip--delivered" },
        "completed": { label: "Hoàn thành", actionLabel: "", colorClass: "status-chip--completed" },
        "paid": { label: "Đã thanh toán", actionLabel: "Xác nhận", colorClass: "status-chip--confirmed" },
        "awaiting_payment": { label: "Chờ thanh toán", actionLabel: "", colorClass: "status-chip--pending" },
        "cancelled": { label: "Đã hủy", actionLabel: "", colorClass: "status-chip--blocked" },
        "return_requested": { label: "Y/C hoàn trả", actionLabel: "Nhận hàng hoàn", colorClass: "status-chip--pending" },
        "returned": { label: "Đã hoàn trả", actionLabel: "", colorClass: "status-chip--blocked" },
    };

    const getNextStatus = (current: string) => {
        const currentIndex = statusSequence.indexOf(current);
        if (currentIndex >= 0 && currentIndex < statusSequence.length - 1) {
            return statusSequence[currentIndex + 1];
        }
        if (current === "paid") return "confirmed";
        if (current === "return_requested") return "returned";
        return null;
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(prev => prev === orderId ? null : orderId);
    };

    return (
        <AdminModalProvider>
            <div className="content">


                <section className="content">


                    <div className="main-grid">
                        <section className="panel orders-panel">
                            <div className="orders-panel__header">
                                <div>
                                    <h2>Danh sách đơn hàng</h2>
                                    <p>Quản lý trạng thái và theo dõi đơn hàng sản phẩm</p>
                                </div>
                            </div>

                            <div className="filters-row">
                                <label className="search-field" aria-label="Search orders">
                                    <Search size={16} />
                                    <input
                                        type="search"
                                        placeholder="Mã đơn, Tên KH, SĐT..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </label>
                                <select
                                    aria-label="Filter by status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="awaiting_confirmation">Chờ xác nhận</option>
                                    <option value="confirmed">Đã xác nhận</option>
                                    <option value="preparing">Đang chuẩn bị</option>
                                    <option value="shipping">Đang giao</option>
                                    <option value="delivered">Đã giao</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="cancelled">Đã hủy</option>
                                    <option value="return_requested">Y/C hoàn trả</option>
                                    <option value="returned">Đã hoàn trả</option>
                                </select>
                            </div>

                            <div className="table-wrap">
                                <table className="data-table user-table">
                                    <thead>
                                        <tr>
                                            <th>Mã Đơn</th>
                                            <th>Người đặt</th>
                                            <th>Địa chỉ</th>
                                            <th>Tổng tiền</th>
                                            <th>Ngày đặt</th>
                                            <th>Trạng thái</th>
                                            <th style={{ width: 150, textAlign: "right" }}>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                                                    Không tìm thấy đơn hàng nào phù hợp.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order) => {
                                                const id = (order._id as string) || (order.id as string) || "";
                                                const displayId = id; // Chỉ lấy id theo yêu cầu mới nhất
                                                const rawStatus = (order.orderStatus as string) || (order.status as string) || "awaiting_confirmation";
                                                let status = normalizeStatus(rawStatus);

                                                const user = order.user as Record<string, string> | undefined;
                                                const userName = user?.fullName || user?.name || "Khách lạ";
                                                const phone = user?.phone || user?.phoneNumber || "----";
                                                const address = (order.address as string) || "----";

                                                const pm = String(order.paymentMethod || order.paymentType || "Chưa rõ");
                                                const paymentMethodLabel = pm.toLowerCase().includes("cod") ? "COD (Tiền mặt)" : pm.toLowerCase().includes("bank") ? "Chuyển khoản (Bank)" : pm;
                                                const initials = userName.substring(0, 1).toUpperCase() || "O";
                                                const isExpanded = expandedOrderId === id;

                                                const isBank = pm.toLowerCase().includes("bank") || pm.toLowerCase().includes("chuyển khoản");
                                                const paymentStatusRaw = String(order.paymentStatus || "").toLowerCase();
                                                const statusStrCheck = String(order.status || "").toLowerCase();
                                                const isPaid = ["paid", "đã_thanh_toán", "da_thanh_toan", "success", "completed"].includes(paymentStatusRaw) ||
                                                    ["paid", "đã_thanh_toán", "da_thanh_toan", "success", "completed"].includes(statusStrCheck);

                                                if (isBank && !isPaid && status === "awaiting_confirmation") {
                                                    status = "awaiting_payment";
                                                }

                                                const statusInfo = orderStatusMeta[status] || { label: rawStatus, actionLabel: "", colorClass: "status-chip--pending" };
                                                const nextStatus = getNextStatus(status);

                                                let hideAdvanceAction = false;
                                                if (status === "awaiting_payment" || (status === "awaiting_confirmation" && isBank && !isPaid)) {
                                                    hideAdvanceAction = true;
                                                }

                                                const itemsArray = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];

                                                // Tính tổng tiền dựa trên cộng dồn từng sản phẩm
                                                const calculatedTotal = itemsArray.reduce((acc, item) => {
                                                    const prod = item.product as Record<string, unknown> | undefined;
                                                    const price = Number(item.price || prod?.price || 0);
                                                    const quantity = Number(item.quantity || 1);
                                                    return acc + (price * quantity);
                                                }, 0);

                                                return (
                                                    <React.Fragment key={id}>
                                                        <tr className={isExpanded ? "row-expanded" : ""} style={{ background: isExpanded ? "#fbfcfe" : "#fff" }}>
                                                            <td>
                                                                <span className="order-id-chip">{displayId.length > 8 ? displayId.slice(0, 8) : displayId}</span>
                                                            </td>
                                                            <td>
                                                                <div className="user-main">
                                                                    <span className="avatar-circle">{initials}</span>
                                                                    <div>
                                                                        <strong>{userName}</strong>
                                                                        <small>{phone}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="address-cell" title={address}>
                                                                    {address}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                    <strong style={{ color: "#ef4444", fontSize: "1.05rem", lineHeight: 1 }}>
                                                                        {formatCurrency(calculatedTotal)}
                                                                    </strong>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                        <small className="payment-method-chip" title="Phương thức thanh toán">
                                                                            {paymentMethodLabel}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{formatDate(order.createdAt).split(' ')[1] || formatDate(order.createdAt)}</td>
                                                            <td>
                                                                <span className={`status-chip ${statusInfo.colorClass}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                <div className="row-actions">
                                                                    {nextStatus && !hideAdvanceAction && (
                                                                        <button
                                                                            type="button"
                                                                            className="action-btn--advance"
                                                                            title={`Chuyển trạng thái sang: ${orderStatusMeta[nextStatus]?.label || nextStatus}`}
                                                                            disabled={busyOrderId === id}
                                                                            onClick={() => handleUpdateStatus(id, nextStatus)}
                                                                        >
                                                                            {statusInfo.actionLabel}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className={`row-action-icon ${isExpanded ? "active" : ""}`}
                                                                        title="Xem chi tiết"
                                                                        onClick={() => toggleExpand(id)}
                                                                    >
                                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {isExpanded && (
                                                            <tr className="expansion-row">
                                                                <td colSpan={7} style={{ padding: 0 }}>
                                                                    <div className="expansion-content">
                                                                        <div className="expansion-header">
                                                                            <h4>Chi tiết đơn hàng</h4>
                                                                        </div>
                                                                        <table className="products-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th style={{ width: 60 }}>Hình</th>
                                                                                    <th>Sản phẩm</th>
                                                                                    <th style={{ textAlign: "center" }}>Số lượng</th>
                                                                                    <th style={{ textAlign: "right" }}>Đơn giá</th>
                                                                                    <th style={{ textAlign: "right" }}>Thành tiền</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {itemsArray.map((item, idx) => {
                                                                                    const prod = item.product as Record<string, unknown> | undefined;
                                                                                    const Name = (prod?.name as string) || (item.name as string) || "Sản phẩm";
                                                                                    const Price = Number(item.price || prod?.price || 0);
                                                                                    const Qty = Number(item.quantity || 1);

                                                                                    const imagesList = prod?.images as any;
                                                                                    const refId = (item.refId as string) || "";

                                                                                    let imageSrc = (item.image as string) || (prod?.image as string) || fetchedImages[refId] || null;
                                                                                    if (!imageSrc && Array.isArray(imagesList) && imagesList.length > 0) {
                                                                                        imageSrc = typeof imagesList[0] === "string" ? imagesList[0] : imagesList[0]?.url;
                                                                                    }

                                                                                    const hasImage = !!imageSrc;

                                                                                    return (
                                                                                        <tr key={idx}>
                                                                                            <td>
                                                                                                {hasImage ? (
                                                                                                    <img src={imageSrc as string} alt="" className="product-thumb" />
                                                                                                ) : (
                                                                                                    <div className="product-thumb placeholder"><Package size={16} /></div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td>
                                                                                                <strong>{Name}</strong>
                                                                                                {(Boolean(item.color) || Boolean(item.size)) && (
                                                                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                                                                                                        {Boolean(item.color) && <span>Màu: {String(item.color)}</span>}
                                                                                                        {Boolean(item.color) && Boolean(item.size) && <span> | </span>}
                                                                                                        {Boolean(item.size) && <span>Size: {String(item.size)}</span>}
                                                                                                    </div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ textAlign: "center" }}>{Qty}</td>
                                                                                            <td style={{ textAlign: "right", color: "#64748b" }}>{formatCurrency(Price)}</td>
                                                                                            <td style={{ textAlign: "right", color: "#ef4444", fontWeight: "bold" }}>
                                                                                                {formatCurrency(Price * Qty)}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
          transition: transform 0.24s ease, opacity 0.24s ease, visibility 0.24s ease, width 0.24s ease;
          width: 288px;
        }

        .admin-page:not(.menu-open) .sidebar {
          opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(-18px);
        }

        .sidebar__brand {
          display: flex; align-items: center; gap: 12px; padding: 4px 8px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .brand-mark {
          width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: #f6d400; color: #102641;
        }

        .sidebar__brand strong { display: block; font-size: 1.1rem; }
        .sidebar__brand span { display: block; margin-top: 2px; color: #f6d400; font-size: 0.9rem; font-weight: 700; }
        .sidebar__section-label { padding: 6px 12px; color: rgba(255, 255, 255, 0.4); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.18em; }
        
        .sidebar__nav { display: grid; gap: 8px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 14px; border-radius: 16px; color: rgba(255, 255, 255, 0.86); text-decoration: none; font-weight: 600; font-size: 1rem; }
        .nav-item svg { width: 18px; height: 18px; flex: 0 0 auto; }
        .nav-item--active { background: #f6d400; color: #102641; }
        .sidebar__bottom { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.12); display: grid; gap: 8px; }
        .nav-item--bottom { color: rgba(255, 255, 255, 0.78); }

        .content { min-width: 0; min-height: 100vh; }
        .topbar { height: 86px; padding: 0 24px; background: #ffffff; border-bottom: 1px solid #e5e9f0; display: flex; align-items: center; justify-content: space-between; }
        .topbar__left, .topbar__right { display: flex; align-items: center; gap: 18px; }
        .topbar__left h1 { margin: 0; font-size: 2rem; font-weight: 800; line-height: 1; }
        .topbar__left p { margin: 6px 0 0; color: #9aa4b2; font-size: 0.95rem; }
        .topbar__icon-button { width: 36px; height: 36px; border: 0; border-radius: 999px; background: transparent; display: grid; place-items: center; color: #5f6a7a; cursor: pointer; position: relative; }
        .topbar__icon-button--notif span { position: absolute; top: 7px; right: 7px; width: 8px; height: 8px; border-radius: 50%; background: #f28c28; border: 2px solid #fff; }
        .profile-chip { border: 0; background: transparent; display: flex; align-items: center; gap: 10px; padding: 0; cursor: pointer; color: #102641; }
        .profile-chip__avatar { width: 38px; height: 38px; border-radius: 50%; background: #f6d400; display: grid; place-items: center; font-weight: 800; }
        .profile-chip__meta { display: grid; text-align: left; }
        .profile-chip__meta strong { font-size: 0.95rem; }
        .profile-chip__meta small { color: #97a1b1; font-size: 0.82rem; }

        .main-grid { padding: 18px 22px; }
        .panel { background: #fff; border: 1px solid #e5e9f0; border-radius: 18px; padding: 18px; }
        .orders-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .orders-panel__header h2 { margin: 0; font-size: 1.8rem; line-height: 1.2; color: #1a2b4a; }
        .orders-panel__header p { margin: 4px 0 0; color: #64748b; font-size: 0.95rem; }

        .filters-row { border: 1px solid #e6ebf2; border-radius: 16px; background: #fff; padding: 12px; display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 12px; margin-bottom: 14px; }
        .search-field { display: flex; align-items: center; gap: 10px; border: 1px solid #dfe5ee; border-radius: 14px; padding: 8px 12px; color: #8d98a8; }
        .search-field input { border: none; background: transparent; outline: none; flex: 1; font-size: 0.95rem; color: #102641; font-family: inherit; }
        .filters-row select { border: 1px solid #dfe5ee; border-radius: 14px; padding: 8px 12px; font-size: 0.95rem; color: #2f3a48; outline: none; background: #fff; cursor: pointer; font-family: inherit; }

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
        
        .user-table tr.row-expanded td {
          border-bottom: none;
        }

        .user-table th {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #748195;
          background: #fbfcfe;
        }

        .order-id-chip {
          display: inline-block;
          padding: 6px 10px;
          background: #e9eefe;
          color: #2f5ed7;
          border-radius: 8px;
          font-weight: 700;
          font-family: monospace;
          font-size: 0.9rem;
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

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 6px 12px;
          background: #f4f5f8;
          color: #647388;
        }

        .status-chip--pending { background: #fef5ee; color: #c4681c; }
        .status-chip--confirmed { background: #eef3ff; color: #2f5ed7; }
        .status-chip--preparing { background: #fdf2f8; color: #db2777; }
        .status-chip--shipping { background: #ecfdf5; color: #059669; }
        .status-chip--delivered { background: #e0f2fe; color: #0284c7; }
        .status-chip--completed { background: #eaf6ee; color: #169352; }
        .status-chip--blocked { background: #fdecee; color: #d13045; }

        .address-cell {
          max-width: 200px;
          font-size: 0.9rem;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .payment-method-chip {
          display: inline-block;
          padding: 2px 6px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          align-self: flex-start;
        }

        .row-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .row-action-icon {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f4f7fa;
          color: #697a8e;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .row-action-icon:hover, .row-action-icon.active {
          background: #2f5ed7;
          color: #fff;
        }

        .row-action-icon:disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .action-btn--advance {
          background: #2f5ed7;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.24s;
          white-space: nowrap;
        }
        .action-btn--advance:hover:not(:disabled) {
          background: #1e4bb8;
        }
        .action-btn--advance:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Expando Content CSS */
        .expansion-row td {
            background: #fbfcfe;
            border-bottom: 1px solid #eef2f6 !important;
            padding: 0 20px 20px;
        }
        
        .expansion-content {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .expansion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 12px;
        }

        .expansion-header h4 {
            margin: 0;
            color: #102641;
            font-size: 1.1rem;
        }

        .expansion-address {
            color: #475569;
            font-size: 0.9rem;
        }

        .products-table {
            width: 100%;
            border-collapse: collapse;
        }

        .products-table th {
            text-align: left;
            padding: 8px;
            color: #64748b;
            font-size: 0.85rem;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }

        .products-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            color: #1e293b;
        }

        .products-table tr:last-child td {
            border-bottom: none;
        }

        .product-thumb {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid #e2e8f0;
        }
        
        .product-thumb.placeholder {
            background: #f8fafc;
            display: grid;
            place-items: center;
            color: #94a3b8;
        }

        @media (max-width: 980px) {
          .admin-page { grid-template-columns: 1fr; }
          .admin-page.menu-open { grid-template-columns: 288px minmax(0, 1fr); }
        }
      `}</style>
        </AdminModalProvider>
    );
}
