

import { useEffect, useMemo, useState } from "react";
/* import { useRouter } from "react-router-dom"; */
import {
  BarChart3,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Pencil,
  Plus,
  Settings2,
  ShoppingBag,
  Star,
  Trash2,
  Users,
  X,
  Box,
  Tag,
  DollarSign,
  Upload
} from "lucide-react";
import Request_API from "../../service/api_request";
import { AdminModalProvider, alert, confirm, adminSidebarItems } from "../components/AdminModal";

type Product = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: any;
  category?: string;
  petTypes?: string[] | string;
  specifications?: any;
  images?: any[];
  thumbnail?: string;
  image?: string;
  imageUrl?: string;
};

type CreateProductFormState = {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  petTypes: string;
  specifications: string;
  images: File[];
  existingImages?: any[];
};

const emptyForm: CreateProductFormState = {
  name: "",
  category: "food",
  description: "",
  price: "",
  stock: "",
  petTypes: "dog,cat",
  specifications: "{}",
  images: [],
  existingImages: [],
};

const formatCurrency = (value?: number | string): string => {
  if (typeof value === "number") return `${value.toLocaleString("vi-VN")} VND`;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed) && parsed > 0) return `${parsed.toLocaleString("vi-VN")} VND`;
    return value || "0 VND";
  }
  return "—";
};

const categoryTranslations: Record<string, string> = {
  collar: "Vòng cổ",
  food: "Thức ăn",
  toy: "Đồ chơi",
  bed: "Giường/Nệm",
  grooming: "Chăm sóc/Làm đẹp",
  health: "Sức khỏe",
  clothing: "Quần áo",
  accessory: "Phụ kiện",
  other: "Khác",
};

const resolveProductImage = (raw: Product): string => {
  const firstImage = raw.images?.[0];
  const url = typeof firstImage === "object" && firstImage !== null && "url" in firstImage
    ? firstImage.url
    : typeof firstImage === "string" ? firstImage : null;

  return (
    url ??
    raw.image ??
    raw.imageUrl ??
    raw.thumbnail ??
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80"
  );
};

const getStockQuantity = (stock?: any): number => {
  if (typeof stock === "object" && stock !== null) {
    return Number(stock.quantity) || 0;
  }
  return Number(stock) || 0;
};

const petTypeOptions = [
  { value: "dog", label: "Chó" },
  { value: "cat", label: "Mèo" },
  { value: "bird", label: "Chim" },
  { value: "hamster", label: "Hamster" },
  { value: "rabbit", label: "Thỏ" },
  { value: "other", label: "Khác" },
];

export default function ProductManagementPage() {
  const router = { push: (path: string) => window.location.href = path };
  const apiClient = useMemo(() => new Request_API(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<CreateProductFormState>(emptyForm);

  const loadProducts = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const payload = await apiClient.getProducts({ page: 1, limit: 100 });
      const items: Product[] = Array.isArray(payload)
        ? payload
        : payload?.data?.products || payload?.data || payload?.products || [];
      setProducts(items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const updateField = (field: keyof CreateProductFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditClick = (id: string) => {
    const product = products.find((s) => s._id === id || s.id === id);
    if (product) {
      setEditingProductId(id);
      setForm({
        name: product.name || "",
        category: product.category || "food",
        description: product.description || "",
        price: String(product.price || ""),
        stock: String(getStockQuantity(product.stock)),
        petTypes: Array.isArray(product.petTypes) ? product.petTypes.join(",") : (product.petTypes || "dog,cat"),
        specifications: typeof product.specifications === 'object' ? JSON.stringify(product.specifications) : (product.specifications || "{}"),
        images: [],
        existingImages: product.images || [],
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
      formData.append("description", form.description.trim());
      formData.append("price", String(Number(form.price)));

      const parsedStock = Number(form.stock);
      formData.append("stock", JSON.stringify({ quantity: isNaN(parsedStock) ? 0 : parsedStock }));
      formData.append("petTypes", form.petTypes.trim());

      if (form.specifications && form.specifications.trim() !== "") {
        formData.append("specifications", form.specifications.trim());
      }

      form.images.forEach((file) => {
        formData.append("images", file);
      });
      if (form.existingImages && form.existingImages.length > 0) {
        form.existingImages.forEach((img) => {
          formData.append("existingImages", typeof img === "object" ? JSON.stringify(img) : img);
        });
      } else if (editingProductId) {
        formData.append("existingImages", "[]");
      }

      if (editingProductId) {
        await apiClient.updateProduct(editingProductId, formData);
      } else {
        await apiClient.createProduct(formData);
      }

      setForm(emptyForm);
      setEditingProductId(null);
      setShowCreateForm(false);
      await loadProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    const confirmed = await confirm("Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.");
    if (!confirmed) {
      return;
    }
    setErrorMessage("");
    try {
      await apiClient.deleteProduct(id);
      await loadProducts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
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
                  <h2>Quản lý Kho hàng & Sản phẩm</h2>
                  <p>Thêm, sửa và quản lý sản phẩm cửa hàng</p>
                </div>
                <button type="button" className="primary-button" onClick={() => {
                  setEditingProductId(null);
                  setForm(emptyForm);
                  setShowCreateForm(true);
                }}>
                  <Plus size={16} /> Thêm sản phẩm
                </button>
              </div>


              {showCreateForm && (
                <div className="modal-overlay" onClick={() => { setShowCreateForm(false); setEditingProductId(null); setForm(emptyForm); }}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>{editingProductId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
                      <button type="button" className="modal-close" onClick={() => { setShowCreateForm(false); setEditingProductId(null); setForm(emptyForm); }}>
                        <X size={20} />
                      </button>
                    </div>
                    <form id="create-service-form" className="create-service-form-modal" onSubmit={handleSubmit}>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Tên sản phẩm</label>
                          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="VD: Hạt Royal Canin" />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Danh mục</label>
                          <select
                            value={form.category}
                            onChange={(e) => updateField("category", e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #dfe5ee", fontSize: "0.95rem", color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer", appearance: "auto" }}
                          >
                            {Object.entries(categoryTranslations).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Giá bán (VND)</label>
                          <input value={form.price} onChange={(event) => updateField("price", event.target.value)} inputMode="numeric" placeholder="VD: 400000" />
                        </div>
                        <div className="form-group">
                          <label>Số lượng tồn kho</label>
                          <input value={form.stock} onChange={(event) => updateField("stock", event.target.value)} inputMode="numeric" placeholder="100" />
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Các loại thú cưng phù hợp</label>
                        <div className="checkbox-group">
                          {petTypeOptions.map((option) => {
                            const isChecked = form.petTypes.split(",").map(t => t.trim()).includes(option.value);
                            return (
                              <label key={option.value} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const currentTypes = form.petTypes.split(",").map(t => t.trim()).filter(Boolean);
                                    if (currentTypes.includes(option.value)) {
                                      updateField("petTypes", currentTypes.filter(t => t !== option.value).join(","));
                                    } else {
                                      updateField("petTypes", [...currentTypes, option.value].join(","));
                                    }
                                  }}
                                />
                                {option.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {["collar", "clothing", "bed", "accessory", "toy"].includes(form.category) && (
                        <div className="form-row">
                          <div className="form-group">
                            <label>Kích cỡ (Size)</label>
                            <div className="checkbox-group" style={{ gap: "12px", marginTop: "4px" }}>
                              {["XS", "S", "M", "L", "XL"].map((sz) => {
                                let selectedSizes: string[] = [];
                                try {
                                  const specs = JSON.parse(form.specifications || "{}");
                                  if (Array.isArray(specs.size)) selectedSizes = specs.size;
                                  else if (typeof specs.size === "string") selectedSizes = specs.size.split(",").map((s: string) => s.trim()).filter(Boolean);
                                } catch { }

                                const isChecked = selectedSizes.includes(sz);

                                return (
                                  <label key={sz} className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        let specs: any = {};
                                        try { specs = JSON.parse(form.specifications || "{}"); } catch { }

                                        let currentSizes: string[] = [];
                                        if (Array.isArray(specs.size)) currentSizes = specs.size;
                                        else if (typeof specs.size === "string") currentSizes = specs.size.split(",").map((s: string) => s.trim()).filter(Boolean);

                                        if (currentSizes.includes(sz)) {
                                          currentSizes = currentSizes.filter(s => s !== sz);
                                        } else {
                                          currentSizes.push(sz);
                                        }

                                        if (currentSizes.length > 0) specs.size = currentSizes.join(", ");
                                        else delete specs.size;

                                        updateField("specifications", Object.keys(specs).length ? JSON.stringify(specs) : "");
                                      }}
                                    />
                                    {sz}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Màu sắc</label>
                            <input
                              value={(() => { try { return JSON.parse(form.specifications || "{}").color || ""; } catch { return ""; } })()}
                              onChange={(e) => {
                                try {
                                  const specs = JSON.parse(form.specifications || "{}");
                                  if (e.target.value) specs.color = e.target.value;
                                  else delete specs.color;
                                  updateField("specifications", Object.keys(specs).length ? JSON.stringify(specs) : "");
                                } catch {
                                  updateField("specifications", JSON.stringify({ color: e.target.value }));
                                }
                              }}
                              placeholder="VD: Đỏ, Xanh, Vàng..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="form-group full-width">
                        <label>Hình ảnh sản phẩm</label>
                        <input
                          id="product-image-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(event) => {
                            const newFiles = Array.from(event.target.files || []);
                            if (!newFiles.length) return;

                            setForm((current) => {
                              const totalExisting = current.existingImages?.length || 0;
                              const totalNew = current.images.length + newFiles.length;
                              if (totalExisting + totalNew > 5) {
                                alert("Bạn chỉ được tải lên tối đa 5 ảnh.");
                                return current;
                              }
                              return { ...current, images: [...current.images, ...newFiles] };
                            });
                            event.target.value = "";
                          }}
                        />
                        <label htmlFor="product-image-upload" className="file-upload-button">
                          <Upload size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                          Chọn ảnh tải lên...
                        </label>
                        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                          {form.existingImages?.map((img, i) => {
                            const url = typeof img === "object" && img !== null && "url" in img ? img.url : (typeof img === "string" ? img : null);
                            if (!url) return null;
                            return (
                              <div key={`existing-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                                <img src={url} alt="existing" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: "1px solid #dfe5ee" }} />
                                <button type="button" onClick={() => setForm(prev => ({ ...prev, existingImages: prev.existingImages?.filter((_, index) => index !== i) }))} style={{ position: "absolute", top: -6, right: -6, background: "#d74141", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}>&times;</button>
                              </div>
                            );
                          })}
                          {form.images.map((file, i) => {
                            const url = URL.createObjectURL(file);
                            return (
                              <div key={`new-${i}`} style={{ position: "relative", width: "80px", height: "80px" }}>
                                <img src={url} alt="new" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: "1px solid #dfe5ee" }} />
                                <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== i) }))} style={{ position: "absolute", top: -6, right: -6, background: "#d74141", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}>&times;</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Mô tả chi tiết sản phẩm</label>
                        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} placeholder="Mô tả sản phẩm..." />
                      </div>

                      {formError && <div className="create-service-form__error">⚠️ {formError}</div>}

                      <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => { setShowCreateForm(false); setEditingProductId(null); setForm(emptyForm); }}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? (editingProductId ? "Đang cập nhật..." : "Đang tạo...") : (editingProductId ? "Cập nhật sản phẩm" : "Thêm sản phẩm")}</button>
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
                  <div className="empty-state">Đang tải sản phẩm...</div>
                ) : products.length === 0 ? (
                  <div className="empty-state">Chưa có sản phẩm nào.</div>
                ) : (
                  products.map((item) => {
                    const imageUrl = resolveProductImage(item);
                    return (
                      <article key={item._id || item.id} className="service-card">
                        <div className="service-image-wrap">
                          <img className="service-image" src={imageUrl} alt={item.name} />
                        </div>
                        <div className="service-card__top">
                          <div className="service-title-wrap">
                            <div className="service-icon" style={{ background: "#e8e0fb", color: "#7c4ded" }}>
                              <Box size={20} />
                            </div>
                            <div>
                              <h3 style={{ lineHeight: 1.3 }}>{item.name}</h3>
                              <span className="service-badge" style={{ color: "#7c4ded", background: "#ece5ff" }}>
                                {categoryTranslations[item.category || ""] || item.category || "Sản phẩm"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="service-desc">{item.description}</p>

                        <div className="service-meta">
                          <strong>{formatCurrency(item.price)}</strong>
                          <span style={{ marginLeft: "auto", fontSize: "0.9rem" }}>
                            Tồn kho: <span style={{ color: getStockQuantity(item.stock) > 10 ? "#17a673" : "#ef4444" }}>{getStockQuantity(item.stock)}</span>
                          </span>
                        </div>

                        <div className="service-actions">
                          <button type="button" className="edit-btn" onClick={() => handleEditClick(item._id || item.id || "")}>
                            <Pencil size={15} /> Chỉnh sửa
                          </button>
                          <button type="button" className="delete-btn" aria-label={`Delete ${item.name}`} onClick={() => handleDeleteClick(item._id || item.id || "")}>
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
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 24px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-content::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #dfe5ee;
          border-radius: 10px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #b1bccd;
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

        .form-group input:not([type="checkbox"]):not([type="file"]),
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

        .form-group input:not([type="checkbox"]):not([type="file"]):focus,
        .form-group textarea:focus,
        .form-group select:focus {
          border-color: #08264a;
          box-shadow: 0 0 0 4px rgba(8, 38, 74, 0.06);
        }

        .file-upload-button {
          display: inline-block;
          border: 1px dashed #b1bccd;
          border-radius: 12px;
          padding: 14px;
          color: #5f6a7a;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          width: 100%;
          background: #f8fafc;
        }

        .file-upload-button:hover {
          background-color: #f1f5f9;
          border-color: #08264a;
          color: #08264a;
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.95rem;
          color: #102641;
          font-weight: 500;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #08264a;
          margin: 0;
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
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .service-meta strong {
          color: #f05a1a;
          font-size: 1.5rem;
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
          grid-column: 1 / -1;
          text-align: center;
          border: 1px dashed #dfe5ee;
          border-radius: 16px;
          margin-top: 20px;
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
