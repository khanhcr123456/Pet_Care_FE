

import { useEffect, useMemo, useState } from "react";
/* import { useRouter } from "react-router-dom"; */
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  Clock3,
  Eye,
  FlaskConical,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Pencil,
  Plus,
  Settings2,
  ShoppingBag,
  Star,
  Stethoscope,
  Syringe,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Request_API from "../../service/api_request";
import { AdminModalProvider, alert, confirm, adminSidebarItems } from "../components/AdminModal";

type ApiService = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  desc?: string;
  price?: number | string;
  promotion?: number | string;
  duration?: string | number;
  category?: string;
  type?: string;
  views?: number | string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  images?: string[] | Array<{ url?: string }>;
};

type IconKey = "stethoscope" | "syringe" | "flask" | "activity" | "heart";

type NormalizedService = {
  id: string;
  iconKey: IconKey;
  iconColor: string;
  iconBg: string;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  image: string;
  desc: string;
  price: string;
  duration: string;
  views: string;
};

type CreateServiceFormState = {
  name: string;
  category: string;
  serviceType: "vaccination" | "consultation";
  description: string;
  price: string;
  promotion: string;
  duration: string;
  images: File[];
};

const emptyForm: CreateServiceFormState = {
  name: "",
  category: "Khám tổng quát",
  serviceType: "consultation",
  description: "",
  price: "",
  promotion: "0",
  duration: "",
  images: [],
};

const formatCurrency = (value?: number | string): string => {
  if (typeof value === "number") return `${value.toLocaleString("vi-VN")} VND`;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed) && parsed > 0) return `${parsed.toLocaleString("vi-VN")} VND`;
    return value;
  }
  return "—";
};

const formatViews = (value?: number | string): string => {
  if (typeof value === "number") return `${value} lượt`;
  if (typeof value === "string") return value.includes("lượt") ? value : `${value} lượt`;
  return "0 lượt";
};

const resolveServiceIcon = (raw: ApiService) => {
  const typeStr = raw.type?.toLowerCase();

  if (typeStr === "vaccination") {
    return {
      iconKey: "syringe" as const,
      iconColor: "#17a673",
      iconBg: "#d6f4e8",
      badge: "Tiêm phòng",
      badgeColor: "#17a673",
      badgeBg: "#dcf7ec",
    };
  }

  if (typeStr === "consultation") {
    return {
      iconKey: "stethoscope" as const,
      iconColor: "#2f67d8",
      iconBg: "#dce9ff",
      badge: "Khám bệnh",
      badgeColor: "#4f7df1",
      badgeBg: "#e8f0ff",
    };
  }

  const text = `${raw.name ?? raw.title ?? raw.category ?? raw.type ?? ""}`.toLowerCase();
  if (text.includes("tiêm") || text.includes("vaccine") || text.includes("syringe")) {
    return {
      iconKey: "syringe" as const,
      iconColor: "#17a673",
      iconBg: "#d6f4e8",
      badge: "Tiêm phòng",
      badgeColor: "#17a673",
      badgeBg: "#dcf7ec",
    };
  }
  if (text.includes("xét nghiệm") || text.includes("xet nghiem") || text.includes("lab") || text.includes("máu")) {
    return {
      iconKey: "flask" as const,
      iconColor: "#7c4ded",
      iconBg: "#e8e0fb",
      badge: "Chẩn đoán",
      badgeColor: "#7c4ded",
      badgeBg: "#ece5ff",
    };
  }
  if (text.includes("x-quang") || text.includes("xray") || text.includes("siêu âm") || text.includes("sieu am") || text.includes("chẩn đoán")) {
    return {
      iconKey: "activity" as const,
      iconColor: "#7c4ded",
      iconBg: "#e8e0fb",
      badge: "Chẩn đoán",
      badgeColor: "#7c4ded",
      badgeBg: "#ece5ff",
    };
  }
  if (text.includes("phẫu thuật") || text.includes("phau thuat") || text.includes("triệt sản")) {
    return {
      iconKey: "heart" as const,
      iconColor: "#ef4444",
      iconBg: "#fde1e1",
      badge: "Phẫu thuật",
      badgeColor: "#ef4444",
      badgeBg: "#fee8e8",
    };
  }
  return {
    iconKey: "stethoscope" as const,
    iconColor: "#2f67d8",
    iconBg: "#dce9ff",
    badge: "Khám tổng quát",
    badgeColor: "#4f7df1",
    badgeBg: "#e8f0ff",
  };
};

const resolveServiceImage = (raw: ApiService): string => {
  const firstImage = raw.images?.[0];
  const imageFromImages =
    typeof firstImage === "string"
      ? firstImage
      : firstImage && typeof firstImage === "object"
        ? firstImage.url
        : undefined;

  return (
    imageFromImages ??
    raw.image ??
    raw.imageUrl ??
    raw.thumbnail ??
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80"
  );
};

const normalizeService = (item: ApiService): NormalizedService => {
  const visuals = resolveServiceIcon(item);
  const title = item.name ?? item.title ?? "Dịch vụ";
  const image = resolveServiceImage(item);

  return {
    id: item._id?.toString() || item.id?.toString() || title,
    iconKey: visuals.iconKey,
    iconColor: visuals.iconColor,
    iconBg: visuals.iconBg,
    title,
    badge: visuals.badge,
    badgeColor: visuals.badgeColor,
    badgeBg: visuals.badgeBg,
    image,
    desc: item.description ?? item.desc ?? "—",
    price: formatCurrency(item.price),
    duration: typeof item.duration === "number" ? `${item.duration} phút` : item.duration ?? "—",
    views: formatViews(item.views),
  };
};

export default function ServiceManagementPage() {
  const router = { push: (path: string) => window.location.href = path };
  const apiClient = useMemo(() => new Request_API(), []);
  const [rawServices, setRawServices] = useState<ApiService[]>([]);
  const [services, setServices] = useState<NormalizedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<CreateServiceFormState>(emptyForm);

  const loadServices = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const payload = await apiClient.getServices(1, 20, "-createdAt");
      const items: ApiService[] = Array.isArray(payload)
        ? payload
        : payload?.data?.services || payload?.data || payload?.services || [];
      setRawServices(items);
      setServices(items.map(normalizeService));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách dịch vụ.");
      setRawServices([]);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const updateField = (field: keyof CreateServiceFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditClick = (id: string) => {
    const service = rawServices.find((s) => s._id === id || s.id === id);
    if (service) {
      setEditingServiceId(id);
      setForm({
        name: service.name || service.title || "",
        category: service.category || service.type || "Khám tổng quát",
        serviceType: (service.type === "vaccination" || service.type === "consultation") ? service.type as "vaccination" | "consultation" : "consultation",
        description: service.description || service.desc || "",
        price: String(service.price || ""),
        promotion: String(service.promotion || "0"),
        duration: String(service.duration || ""),
        images: [],
      });
      setShowCreateForm(true);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("category", form.category.trim());
      formData.append("type", form.serviceType);
      formData.append("description", form.description.trim());
      formData.append("price", String(Number(form.price)));
      formData.append("promotion", String(Number(form.promotion || 0)));
      if (form.duration) {
        formData.append("duration", String(Number(form.duration)));
      }
      form.images.forEach((file) => {
        formData.append("images", file);
      });

      if (editingServiceId) {
        await apiClient.updateService(editingServiceId, formData);
      } else {
        await apiClient.createService(formData);
      }

      setForm(emptyForm);
      setEditingServiceId(null);
      setShowCreateForm(false);
      await loadServices();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu dịch vụ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    const confirmed = await confirm("Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này không thể hoàn tác.");
    if (!confirmed) {
      return;
    }
    setErrorMessage("");
    try {
      await apiClient.deleteService(id);
      await loadServices();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa dịch vụ.");
    }
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
            <section className="services-panel">
              <div className="services-panel__head">
                <div>
                  <h2>Quản lý Dịch vụ & Giá cả</h2>
                  <p>Thêm, sửa dịch vụ và tạo mã giảm giá Voucher</p>
                </div>
                <button type="button" className="primary-button" onClick={() => {
                  setEditingServiceId(null);
                  setForm(emptyForm);
                  setShowCreateForm(true);
                }}>
                  <Plus size={16} /> Thêm dịch vụ
                </button>
              </div>



              {showCreateForm && (
                <div className="modal-overlay" onClick={() => { setShowCreateForm(false); setEditingServiceId(null); setForm(emptyForm); }}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>{editingServiceId ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}</h3>
                      <button type="button" className="modal-close" onClick={() => { setShowCreateForm(false); setEditingServiceId(null); setForm(emptyForm); }}>
                        <X size={20} />
                      </button>
                    </div>
                    <form id="create-service-form" className="create-service-form-modal" onSubmit={handleSubmit}>
                      <div className="form-group full-width">
                        <label>Tên dịch vụ (bắt buộc, max 100 ký tự) *</label>
                        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} maxLength={100} placeholder="VD: Khám sức khỏe cao cấp" required />
                      </div>
                      <div className="form-group full-width">
                        <label>Loại dịch vụ</label>
                        <select
                          value={form.serviceType}
                          onChange={(e) => updateField("serviceType", e.target.value)}
                        >
                          <option value="consultation">Khám bệnh</option>
                          <option value="vaccination">Tiêm phòng</option>
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Giá dịch vụ (VND, bắt buộc) *</label>
                        <input value={form.price} onChange={(event) => updateField("price", event.target.value)} inputMode="numeric" placeholder="VD: 400000" required />
                      </div>

                      <div className="form-group full-width">
                        <label>Mức khuyến mãi (%, mặc định 0)</label>
                        <input value={form.promotion} onChange={(event) => updateField("promotion", event.target.value)} inputMode="numeric" placeholder="0" />
                      </div>

                      <div className="form-group full-width">
                        <label>Hình ảnh dịch vụ (có thể upload tối đa 10 ảnh)</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(event) => {
                            const files = Array.from(event.target.files || []);
                            if (files.length > 10) {
                              alert("Chỉ được upload tối đa 10 ảnh.");
                              return;
                            }
                            setForm((current) => ({ ...current, images: files }));
                          }}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Mô tả chi tiết dịch vụ (bắt buộc, max 2000 ký tự) *</label>
                        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} maxLength={2000} placeholder="Mô tả dịch vụ..." required />
                      </div>

                      {formError && <div className="create-service-form__error">⚠️ {formError}</div>}

                      <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => { setShowCreateForm(false); setEditingServiceId(null); setForm(emptyForm); }}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? (editingServiceId ? "Đang cập nhật..." : "Đang tạo...") : (editingServiceId ? "Cập nhật dịch vụ" : "Thêm dịch vụ")}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="error-banner" role="alert">
                  ⚠️ {errorMessage}
                </div>
              )}

              <section className="service-grid">
                {isLoading ? (
                  <div className="empty-state">Đang tải dịch vụ...</div>
                ) : services.length === 0 ? (
                  <div className="empty-state">Chưa có dịch vụ nào.</div>
                ) : (
                  services.map((item) => {
                    const Icon =
                      item.iconKey === "syringe"
                        ? Syringe
                        : item.iconKey === "flask"
                          ? FlaskConical
                          : item.iconKey === "activity"
                            ? Activity
                            : item.iconKey === "heart"
                              ? Heart
                              : Stethoscope;

                    return (
                      <article key={item.id} className="service-card">
                        <div className="service-image-wrap">
                          <img className="service-image" src={item.image} alt={item.title} />
                        </div>
                        <div className="service-card__top">
                          <div className="service-title-wrap">
                            <div className="service-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3>{item.title}</h3>
                              <span className="service-badge" style={{ color: item.badgeColor, background: item.badgeBg }}>
                                {item.badge}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="service-desc">{item.desc}</p>

                        <div className="service-meta">
                          <strong>{item.price}</strong>
                        </div>

                        <div className="service-actions">
                          <button type="button" className="edit-btn" onClick={() => handleEditClick(item.id)}>
                            <Pencil size={15} /> Chỉnh sửa
                          </button>
                          <button type="button" className="delete-btn" aria-label={`Delete ${item.title}`} onClick={() => handleDeleteClick(item.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            </section>
          </div>
        </section>
      </div>

      <style>{`
        .admin-menu-toggle {
          position: fixed;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .admin-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 288px minmax(0, 1fr);
          background: #f3f5f8;
          color: #102641;
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
          overflow-y: auto;
          overscroll-behavior: contain;
          transition: transform 0.24s ease, opacity 0.24s ease, visibility 0.24s ease;
          box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
        }

        .topbar__menu-toggle {
          cursor: pointer;
        }

        .admin-menu-toggle:not(:checked) ~ .admin-page {
          grid-template-columns: 0 minmax(0, 1fr);
        }

        .admin-menu-toggle:not(:checked) ~ .admin-page .sidebar {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(-18px);
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

        .services-panel__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .services-panel__head h2 {
          margin: 0;
          font-size: 2.2rem;
          line-height: 1.05;
        }

        .services-panel__head p {
          margin: 8px 0 0;
          color: #7f8a9a;
          font-size: 1rem;
        }

        .primary-button {
          border: 0;
          border-radius: 16px;
          background: #08264a;
          color: #f6d400;
          font-weight: 800;
          padding: 12px 20px;
          font-size: 1.05rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .tabs-row {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .tab-button {
          border: 1px solid #dfe5ee;
          border-radius: 16px;
          background: #fff;
          color: #69788e;
          padding: 10px 16px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
        }

        .tab-button--active {
          background: #08264a;
          color: #f6d400;
          border-color: transparent;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(16, 38, 65, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 24px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #102641;
          font-weight: 700;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: #7f8a9a;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background-color: #f3f5f8;
          color: #102641;
        }

        .create-service-form-modal {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          color: #102641;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          border: 1px solid #dfe5ee;
          border-radius: 12px;
          padding: 12px 14px;
          font: inherit;
          outline: none;
          color: #102641;
          font-size: 0.95rem;
          background: #fdfdfe;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        
        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #97a1b1;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #08264a;
          box-shadow: 0 0 0 4px rgba(8, 38, 74, 0.06);
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper select {
          appearance: none;
          padding-right: 40px;
          cursor: pointer;
        }

        .select-wrapper .select-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #5f6a7a;
          pointer-events: none;
        }

        .create-service-form__error,
        .error-banner {
          padding: 10px 12px;
          border-radius: 12px;
          background: #fde7e7;
          color: #d74141;
          border: 1px solid #f5c6c6;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 0.92rem;
        }

        .modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-cancel {
          border: 1px solid #dfe5ee;
          background: #ffffff;
          color: #102641;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-cancel:hover {
          background: #f8fafc;
        }

        .btn-submit {
          border: none;
          background: #08264a;
          color: #f6d400;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-submit:hover {
          background: #0b1e34;
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .service-card {
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #fff;
          padding: 14px;
          box-shadow: 0 4px 10px rgba(16, 38, 65, 0.04);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .service-image-wrap {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 14px;
          overflow: hidden;
          background: #eef2f7;
          margin-bottom: 12px;
        }

        .service-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .service-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }

        .service-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .service-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .service-card h3 {
          margin: 0;
          font-size: 1.03rem;
          color: #2f3a48;
        }

        .service-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.86rem;
          font-weight: 700;
        }

        .toggle-btn {
          width: 32px;
          height: 18px;
          border: 2px solid #0dc087;
          border-radius: 999px;
          background: #fff;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 2px;
          cursor: pointer;
        }

        .toggle-btn span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0dc087;
          display: block;
        }

        .service-desc {
          color: #6e7c90;
          font-size: 0.92rem;
          line-height: 1.45;
          margin: 10px 0 12px;
          min-height: 54px;
          flex: 1;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .service-meta strong {
          color: #f05a1a;
          font-size: 2rem;
          line-height: 1;
        }

        .service-meta span {
          color: #8a95a6;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .service-actions {
          display: grid;
          grid-template-columns: 1fr 42px;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #edf1f6;
          margin-top: auto;
        }

        .edit-btn {
          border: 0;
          background: #f1d200;
          color: #112a47;
          border-radius: 14px;
          height: 38px;
          font-size: 1rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .delete-btn {
          border: 1px solid #fde0e0;
          background: #fff;
          color: #ff5858;
          border-radius: 14px;
          height: 38px;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .empty-state {
          padding: 24px;
          color: #7f8a9a;
        }

        @media (max-width: 980px) {
          .admin-page {
            grid-template-columns: 1fr;
          }

          .service-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .services-panel__head {
            flex-direction: column;
            align-items: stretch;
          }

          .form-row,
          .service-grid {
            grid-template-columns: 1fr;
          }

          .topbar {
            height: auto;
            padding: 14px 18px;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .main-grid {
            padding: 14px;
          }
        }
      `}</style>
    </AdminModalProvider>
  );
}
