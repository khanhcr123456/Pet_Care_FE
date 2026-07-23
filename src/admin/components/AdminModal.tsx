

import { useEffect, useRef, useState } from "react";
import { X, LayoutDashboard, Users, ShoppingBag, Box, BarChart3, Star, Receipt } from "lucide-react";

export const adminSidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", key: "dashboard" },
  { label: "Quản lý người dùng", icon: Users, href: "/admin/users", key: "users" },
  { label: "Quản lý đơn hàng", icon: Receipt, href: "/admin/orders", key: "orders" },
  { label: "Dịch vụ & Giá cả", icon: ShoppingBag, href: "/admin/services", key: "services" },
  { label: "Quản lý sản phẩm", icon: Box, href: "/admin/products", key: "products" },
  { label: "Báo cáo doanh thu", icon: BarChart3, href: "/admin/revenue", key: "revenue" },
  { label: "Xét duyệt đánh giá", icon: Star, href: "/admin/reviews", key: "reviews" },
];

type ModalMode = "alert" | "confirm" | "prompt";

type ModalState = {
  mode: ModalMode;
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
};

type OpenModal = {
  alert: (message: string, title?: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
};

let modalController: OpenModal | null = null;
let setModal: React.Dispatch<React.SetStateAction<ModalState | null>> | null = null;

export function openAdminModal(
  type: "alert",
  message: string,
  title?: string
): void;
export function openAdminModal(
  type: "confirm",
  message: string,
  title?: string
): Promise<boolean>;
export function openAdminModal(
  type: "prompt",
  message: string,
  defaultValue?: string,
  title?: string
): Promise<string | null>;
export function openAdminModal(
  type: ModalMode,
  message: string,
  defaultOrTitle?: string,
  title?: string
): void | Promise<boolean> | Promise<string | null> {
  if (!setModal) return;

  if (type === "prompt") {
    return new Promise<string | null>((resolve) => {
      setModal!({
        mode: "prompt",
        title: (title ?? defaultOrTitle) ?? "Nhập thông tin",
        message,
        defaultValue: defaultOrTitle && !title ? defaultOrTitle : defaultOrTitle,
        onConfirm: (value) => resolve(value ?? null),
        onCancel: () => resolve(null),
      });
    });
  }

  if (type === "confirm") {
    return new Promise<boolean>((resolve) => {
      setModal!({
        mode: "confirm",
        title: defaultOrTitle ?? "Xác nhận",
        message,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }

  setModal!({
    mode: "alert",
    title: title ?? defaultOrTitle ?? "Thông báo",
    message,
    onConfirm: () => setModal?.(null),
    onCancel: () => setModal?.(null),
  });
}

export function AdminModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModalState] = useState<ModalState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setModal = setModalState;
    return () => {
      setModal = null;
    };
  }, []);

  useEffect(() => {
    if (modal) {
      setInputValue(modal.defaultValue ?? "");
    }
  }, [modal?.defaultValue]);

  if (!modal) return <>{children}</>;

  const handleConfirm = () => {
    modal.onConfirm?.(modal.mode === "prompt" ? inputValue : undefined);
    setModalState(null);
  };

  const handleCancel = () => {
    modal.onCancel?.();
    setModalState(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      handleCancel();
    }
  };

  return (
    <>
      {children}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(16, 38, 65, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
          animation: "adminModalFadeIn 0.15s ease-out",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            width: "100%",
            maxWidth: modal.mode === "prompt" ? 440 : 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            padding: "24px 24px 20px",
            animation: "adminModalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            margin: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#102641",
                lineHeight: 1.3,
              }}
            >
              {modal.title}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9aa4b2",
                padding: 4,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          <p
            style={{
              margin: "0 0 18px",
              color: "#4f5d70",
              fontSize: "0.95rem",
              lineHeight: 1.5,
            }}
          >
            {modal.message}
          </p>

          {modal.mode === "prompt" && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") handleCancel();
              }}
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid #dfe5ee",
                borderRadius: 12,
                fontSize: "0.95rem",
                outline: "none",
                color: "#102641",
                boxSizing: "border-box",
                marginBottom: 18,
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#08264a")}
              onBlur={(e) => (e.target.style.borderColor = "#dfe5ee")}
            />
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            {modal.mode !== "alert" && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "1.5px solid #dfe5ee",
                  background: "#fff",
                  color: "#102641",
                  fontWeight: 600,
                  fontSize: "0.93rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7fa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "#08264a",
                color: "#f6d400",
                fontWeight: 700,
                fontSize: "0.93rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0b1e34")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#08264a")}
            >
              {modal.mode === "confirm" ? "Xác nhận" : modal.mode === "prompt" ? "Đồng ý" : "Đã hiểu"}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes adminModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes adminModalSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

export function alert(message: string, title?: string) {
  return openAdminModal("alert", message, title);
}

export function confirm(message: string, title?: string) {
  return openAdminModal("confirm", message, title) as Promise<boolean>;
}

export function prompt(message: string, defaultValue?: string, title?: string) {
  return openAdminModal("prompt", message, defaultValue, title) as Promise<string | null>;
}
