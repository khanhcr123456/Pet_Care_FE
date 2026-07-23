

import { useMemo } from "react";
/* import { useRouter } from "react-router-dom"; */
import Request_API from "../service/api_request";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Settings2,
  ShoppingBag,
  Star,
  Stethoscope,
  Syringe,
  Users,
  X,
  TrendingUp,
  FlaskConical,
  Activity,
  Heart,
} from "lucide-react";
import { adminSidebarItems } from "./components/AdminModal";

// Metadata removed to support Client Component

const stats = [
  {
    title: "Tổng người dùng",
    value: "3,248",
    change: "+12.5%",
    positive: true,
    icon: Users,
    iconBg: "#f5cd00",
    iconColor: "#102641",
  },
  {
    title: "Doanh thu tháng",
    value: "52M đ",
    change: "+18.2%",
    positive: true,
    icon: TrendingUp,
    iconBg: "#09274a",
    iconColor: "#f5cd00",
  },
  {
    title: "Đơn dịch vụ",
    value: "235",
    change: "+8.1%",
    positive: true,
    icon: ShoppingBag,
    iconBg: "#ef5a1c",
    iconColor: "#ffffff",
  },
  {
    title: "Đánh giá chờ duyệt",
    value: "14",
    change: "-3 so với hôm qua",
    positive: false,
    icon: Star,
    iconBg: "#17bd8a",
    iconColor: "#09274a",
  },
];

const topServices = [
  { name: "Khám tổng quát", value: 235, color: "#f5cd00" },
  { name: "Tiêm phòng", value: 189, color: "#09274a" },
  { name: "Xét nghiệm máu", value: 156, color: "#ef5a1c" },
  { name: "Chụp X-quang", value: 142, color: "#17bd8a" },
  { name: "Siêu âm", value: 98, color: "#8b5cf6" },
];

const quickServices = [
  { icon: Stethoscope, title: "Khám tổng quát", subtitle: "Khung giờ trống: 12", color: "#2f67d8", bg: "#dce9ff" },
  { icon: Syringe, title: "Tiêm phòng", subtitle: "Khung giờ trống: 9", color: "#17a673", bg: "#d6f4e8" },
  { icon: FlaskConical, title: "Xét nghiệm", subtitle: "Khung giờ trống: 6", color: "#7c4ded", bg: "#e8e0fb" },
  { icon: Activity, title: "Chẩn đoán hình ảnh", subtitle: "Khung giờ trống: 4", color: "#7c4ded", bg: "#ece5ff" },
  { icon: Heart, title: "Phẫu thuật", subtitle: "Lịch kín 70%", color: "#ef4444", bg: "#fee8e8" },
];

export default function AdminDashboardPage() {
  const router = { push: (path: string) => window.location.href = path };
  const apiClient = useMemo(() => new Request_API(), []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    apiClient.logout().catch((err) => console.error("Logout error:", err));
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return (
    <>
      <div className="content admin-page">


        <section className="content">


          <div className="main-grid">
            <section className="hero-card">
              <div>
                <h2>Xin chào, Admin! 👋</h2>
                <p>
                  Hôm nay có <strong>14 đánh giá</strong> chờ duyệt và <strong>3 mặt hàng</strong> sắp hết kho.
                </p>
              </div>
              <div className="hero-card__paw">
                <PawPrint size={88} strokeWidth={2.2} />
              </div>
            </section>

            <section className="stats-grid">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="stat-card">
                    <div>
                      <p className="stat-card__title">{item.title}</p>
                      <h3>{item.value}</h3>
                      <span className={item.positive ? "stat-card__change is-up" : "stat-card__change is-down"}>
                        {item.positive ? "↗" : "↘"} {item.change}
                      </span>
                    </div>
                    <div className="stat-card__icon" style={{ background: item.iconBg, color: item.iconColor }}>
                      <Icon size={22} />
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel__head">
                  <div>
                    <h3>Doanh thu 7 tháng gần đây</h3>
                    <p>So sánh doanh thu và số đơn</p>
                  </div>
                  <button type="button" className="pill-button">Tháng</button>
                </div>

                <div className="chart-wrap" aria-hidden="true">
                  <svg viewBox="0 0 920 340" className="chart-svg">
                    <defs>
                      <linearGradient id="areaFillDash" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f5cd00" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#f5cd00" stopOpacity="0.04" />
                      </linearGradient>
                    </defs>
                    <g stroke="#edf0f5" strokeWidth="1">
                      {[0, 1, 2, 3, 4].map((line) => (
                        <line key={line} x1="54" y1={40 + line * 68} x2="900" y2={40 + line * 68} />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                        <line key={col} x1={86 + col * 118} y1="40" x2={86 + col * 118} y2="312" strokeDasharray="4 6" />
                      ))}
                    </g>
                    <path
                      d="M54 230 C120 212, 160 206, 210 218 C260 230, 304 256, 358 228 C412 200, 456 182, 512 172 C568 162, 614 142, 664 148 C714 154, 760 132, 812 110 C864 88, 888 78, 900 68"
                      fill="none"
                      stroke="#f5cd00"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M54 230 C120 212, 160 206, 210 218 C260 230, 304 256, 358 228 C412 200, 456 182, 512 172 C568 162, 614 142, 664 148 C714 154, 760 132, 812 110 C864 88, 888 78, 900 68 L900 312 L54 312 Z"
                      fill="url(#areaFillDash)"
                    />
                    <g fill="#9ea7b7" fontSize="16" fontFamily="inherit">
                      <text x="8" y="44">60M</text>
                      <text x="8" y="112">45M</text>
                      <text x="8" y="180">30M</text>
                      <text x="8" y="248">15M</text>
                      <text x="26" y="316">0M</text>
                      {["T1", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, index) => (
                        <text key={label} x={78 + index * 118} y="336">
                          {label}
                        </text>
                      ))}
                    </g>
                  </svg>
                </div>
              </article>

              <article className="panel services-panel">
                <div className="panel__head panel__head--tight">
                  <h3>🔥 Dịch vụ nổi bật</h3>
                </div>

                <div className="services-list">
                  {topServices.map((item, index) => (
                    <div key={item.name} className="service-row">
                      <div className="service-row__label">
                        <span className="service-row__rank" style={{ background: item.color }}>{index + 1}</span>
                        <span>{item.name}</span>
                      </div>
                      <strong>{item.value}</strong>
                      <div className="service-row__bar">
                        <span style={{ width: `${Math.min((item.value / 235) * 100, 100)}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="panel quick-panel">
              <div className="panel__head panel__head--tight">
                <h3>Lịch vận hành dịch vụ hôm nay</h3>
              </div>
              <div className="quick-grid">
                {quickServices.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="quick-card">
                      <span className="quick-card__icon" style={{ background: item.bg, color: item.color }}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.subtitle}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="quick-footer">
                <span><CalendarDays size={16} /> Hôm nay: 128 lịch hẹn</span>
                <span><Clock3 size={16} /> Tỷ lệ kín lịch: 72%</span>
              </div>
            </section>
          </div>
        </section>

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

        .topbar__menu-icon--open {
          display: none;
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

        .admin-menu-toggle:not(:checked) ~ .admin-page .topbar__menu-icon--close {
          display: none;
        }

        .admin-menu-toggle:not(:checked) ~ .admin-page .topbar__menu-icon--open {
          display: block;
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
          display: grid;
          gap: 14px;
        }

        .hero-card {
          min-height: 126px;
          border-radius: 20px;
          background: linear-gradient(90deg, #132d4d 0%, #102641 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 26px;
          overflow: hidden;
        }

        .hero-card h2 {
          margin: 0 0 8px;
          font-size: 2rem;
          line-height: 1.1;
        }

        .hero-card p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.02rem;
        }

        .hero-card p strong {
          color: #f6d400;
        }

        .hero-card__paw {
          color: rgba(246, 212, 0, 0.28);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #fff;
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .stat-card__title {
          margin: 0;
          color: #7f8a9a;
          font-size: 0.95rem;
        }

        .stat-card h3 {
          margin: 8px 0;
          font-size: 2rem;
          line-height: 1;
          color: #263243;
        }

        .stat-card__change {
          font-size: 1rem;
          font-weight: 700;
        }

        .stat-card__change.is-up {
          color: #1ba55f;
        }

        .stat-card__change.is-down {
          color: #dc4f4f;
        }

        .stat-card__icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
          gap: 12px;
        }

        .panel {
          border: 1px solid #e6ebf2;
          border-radius: 18px;
          background: #fff;
          padding: 16px;
        }

        .panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .panel__head--tight {
          margin-bottom: 10px;
        }

        .panel h3 {
          margin: 0;
          font-size: 1.4rem;
          color: #2a3544;
        }

        .panel__head p {
          margin: 6px 0 0;
          color: #8e99a9;
          font-size: 0.95rem;
        }

        .pill-button {
          border: 0;
          border-radius: 999px;
          background: #f5cd00;
          color: #102641;
          padding: 8px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .chart-wrap {
          overflow: hidden;
          border-radius: 12px;
        }

        .chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .services-list {
          display: grid;
          gap: 12px;
        }

        .service-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto auto;
          gap: 8px 10px;
          align-items: center;
        }

        .service-row__label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4d5868;
          font-weight: 600;
        }

        .service-row strong {
          color: #7c8798;
          font-size: 0.95rem;
          min-width: 42px;
          text-align: right;
        }

        .service-row__rank {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: inline-grid;
          place-items: center;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .service-row__bar {
          grid-column: 1 / -1;
          height: 6px;
          border-radius: 999px;
          background: #eef2f7;
          overflow: hidden;
        }

        .service-row__bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .quick-card {
          border: 1px solid #e8edf4;
          border-radius: 14px;
          padding: 10px;
          display: flex;
          gap: 9px;
          align-items: center;
          background: #fcfdff;
        }

        .quick-card__icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .quick-card strong {
          display: block;
          color: #2f3a48;
          font-size: 0.95rem;
        }

        .quick-card p {
          margin: 4px 0 0;
          color: #8a95a6;
          font-size: 0.86rem;
        }

        .quick-footer {
          margin-top: 10px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          color: #6f7b8f;
          font-weight: 600;
        }

        .quick-footer span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 980px) {
          .admin-page {
            grid-template-columns: 1fr;
          }

          .admin-menu-toggle:not(:checked) ~ .admin-page {
            grid-template-columns: 0 minmax(0, 1fr);
          }

          .stats-grid,
          .quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .topbar__left {
            gap: 14px;
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

          .stats-grid,
          .quick-grid {
            grid-template-columns: 1fr;
          }

          .hero-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
      </div>
    </>
  );
}
