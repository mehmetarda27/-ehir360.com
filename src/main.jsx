import React, { Suspense, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coffee,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  Heart,
  Hotel,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tags,
  Trash2,
  Upload,
  Users,
  XCircle
} from "lucide-react";
import { businesses as seedBusinesses, campaigns, categories as seedCategories, cities as seedCities, events, jobs, pharmacies, reviews } from "./data.js";
import "./styles.css";

const CityContext = createContext(null);
const AppDataContext = createContext(null);
const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

const defaultUsers = [];

const getStored = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

const slugify = (value) => value
  .toString()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || `isletme-${Date.now()}`;

function getSession() {
  return getStored("sehir-paneli-session", null);
}

function getToken() {
  return localStorage.getItem("sehir-paneli-token");
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Islem basarisiz");
  return data;
}

async function fetchJson(path) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `${path} yuklenemedi`);
  return data;
}

function useCity() {
  return useContext(CityContext);
}

function CityProvider({ children }) {
  const [city, setCity] = useState(() => localStorage.getItem("sehir-paneli-city") || "Mersin");
  const value = useMemo(() => ({
    city,
    setCity: (nextCity) => {
      localStorage.setItem("sehir-paneli-city", nextCity);
      setCity(nextCity);
    }
  }), [city]);
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

function setMeta(title, description) {
  document.title = title;
  document.querySelector("meta[name='description']")?.setAttribute("content", description);
}

function IconButton({ children, label, onClick, active }) {
  return <button className={`icon-button ${active ? "active" : ""}`} aria-label={label} onClick={onClick}>{children}</button>;
}

function Badge({ children, tone = "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Rating({ value, count }) {
  return <span className="rating"><Star size={16} fill="currentColor" /> <b>{value}</b>{count ? <small>({count})</small> : null}</span>;
}

function Header() {
  const { city } = useCity();
  const [open, setOpen] = useState(false);
  const links = [
    ["Ana Sayfa", "/home"],
    ["Kategoriler", "/categories"],
    ["Kampanyalar", "/campaigns"],
    ["Etkinlikler", "/events"]
  ];
  return (
    <header className="site-header">
      <nav className="container header-inner">
        <Link className="brand" to="/home"><span>Şehir</span> Paneli</Link>
        <div className={`nav-links ${open ? "show" : ""}`}>
          {links.map(([label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>)}
        </div>
        <div className="header-actions">
          <Link className="city-chip" to="/home"><MapPin size={17} /> {city}</Link>
          <IconButton label="Bildirimler"><Bell size={20} /></IconButton>
          <Link className="btn btn-primary small" to="/login">Giriş Yap</Link>
          <IconButton label="Menü" onClick={() => setOpen(!open)}><Menu size={22} /></IconButton>
        </div>
      </nav>
    </header>
  );
}

function AppHeader() {
  const { city } = useCity();
  const { notifications, markNotificationsRead } = useAppData();
  const [open, setOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const navigate = useNavigate();
  const links = [
    ["Ana Sayfa", "/home"],
    ["Kategoriler", "/categories"],
    ["Kampanyalar", "/campaigns"],
    ["Etkinlikler", "/events"]
  ];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const logout = () => {
    localStorage.removeItem("sehir-paneli-session");
    localStorage.removeItem("sehir-paneli-token");
    setSession(null);
    navigate("/home");
  };
  return (
    <header className="site-header">
      <nav className="container header-inner">
        <Link className="brand" to="/home"><span>Şehir</span>360</Link>
        <div className={`nav-links ${open ? "show" : ""}`}>
          {links.map(([label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>)}
          {session?.role === "business" && <NavLink to="/business-panel" onClick={() => setOpen(false)}>Isletme Panel</NavLink>}
          {session?.role === "customer" && <NavLink to="/favorites" onClick={() => setOpen(false)}>Favoriler</NavLink>}
        </div>
        <div className="header-actions">
          <Link className="city-chip" to="/home"><MapPin size={17} /> {city}</Link>
          <div className="notification-wrap">
            <IconButton label="Bildirimler" active={noticeOpen} onClick={() => { setNoticeOpen(!noticeOpen); markNotificationsRead(); }}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notice-dot">{unreadCount}</span>}
            </IconButton>
            {noticeOpen && (
              <div className="notification-menu">
                <div className="notification-head"><b>Bildirimler</b><small>{notifications.length} kayit</small></div>
                {notifications.map((item) => (
                  <Link key={item.id} to={item.to || "/home"} onClick={() => setNoticeOpen(false)}>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                    <small>{item.time}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {session ? (
            <div className="user-chip">
              <span>{session.name}</span>
              <button type="button" aria-label="Cikis yap" onClick={logout}><LogOut size={16} /></button>
            </div>
          ) : <Link className="btn btn-primary small" to="/login">Giris Yap</Link>}
          <IconButton label="Menu" active={open} onClick={() => setOpen(!open)}><Menu size={22} /></IconButton>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" to="/home"><span>Şehir</span>360</Link>
          <p>Mersin'in dijital rehberi. Yerel işletmeleri, fırsatları ve şehir yaşamını modern bir panelde toplar.</p>
        </div>
        <FooterCol title="Keşfet" items={["Restoranlar", "Nöbetçi Eczaneler", "Etkinlikler", "İş İlanları"]} />
        <FooterCol title="İşletmeler" items={["Profil Sahiplen", "Paketler", "Kampanya Yayınla", "Destek Merkezi"]} />
        <FooterCol title="Platform" items={["Admin Paneli", "KVKK", "Kullanım Koşulları", "API Hazırlığı"]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return <div><h4>{title}</h4>{items.map((item) => <a key={item} href="#top">{item}</a>)}</div>;
}

function PageShell({ children, className = "" }) {
  return <><AppHeader /><main id="top" className={className}>{children}</main><Footer /></>;
}

function CitySelect() {
  setMeta("Şehir Seçimi | Şehir360", "Şehir360'nde şehir seçin ve yerel rehberi kişiselleştirin.");
  const { setCity } = useCity();
  const navigate = useNavigate();
  const choose = (name) => {
    setCity(name);
    navigate("/home");
  };
  return (
    <main className="city-page">
      <AppHeader />
      <section className="city-hero">
        <div className="container">
          <p className="eyebrow">Dijital şehir rehberi</p>
          <h1>Keşfetmeye nereden başlıyoruz?</h1>
          <p>Size en yakın işletmeleri, kampanyaları, etkinlikleri ve günlük şehir servislerini gösterebilmemiz için bir şehir seçin.</p>
          <div className="search-panel city-search"><Search /><input placeholder="Şehir ismi yazın: Mersin, İstanbul, Ankara..." /></div>
        </div>
      </section>
      <section className="container section">
        <div className="section-head"><div><h2>Popüler şehirler</h2><p>Aktif ve yakında açılacak bölgeler</p></div><Badge tone="green">Canlı: Mersin</Badge></div>
        <div className="city-grid">
          {seedCities.map((item) => (
            <button className={`city-card ${item.active ? "active" : "muted"}`} key={item.id} onClick={() => item.active && choose(item.name)}>
              <img src={item.image} alt={`${item.name} şehir manzarası`} />
              <span>{item.active ? "Aktif şehir" : "Yakında"}</span>
              <h3>{item.name}</h3>
              <p>{item.active ? `${item.businessCount}+ işletme yayında` : "Hazırlanıyor"}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Home() {
  const { city } = useCity();
  const { businesses, categories } = useAppData();
  setMeta(`${city} Dijital Rehberi | Şehir360`, `${city} işletmeleri, kampanyaları, etkinlikleri, nöbetçi eczaneleri ve iş ilanları.`);
  const featuredPool = businesses.filter((b) => b.featured || b.isSponsored || b.sponsored || b.verified || b.isVerified);
  const featured = (featuredPool.length ? featuredPool : businesses).slice(0, 3);
  return (
    <PageShell>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">{city} için premium şehir rehberi</p>
            <h1>{city}'in kalbinde ne aramıştınız?</h1>
            <p>Restoranlardan sağlığa, etkinliklerden kampanyalara kadar şehirdeki güvenilir noktaları tek panelden keşfedin.</p>
            <SearchBar />
            <div className="popular-tags">{categories.slice(0, 5).map((c) => <Link to={`/categories/${c.slug}`} key={c.id}>{c.name}</Link>)}</div>
          </div>
          <img className="hero-photo" src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80" alt="Akdeniz şehir sahili" />
        </div>
      </section>
      <QuickLinks />
      <section className="container section">
        <div className="section-head"><div><h2>Öne çıkan işletmeler</h2><p>{city}'de doğrulanmış ve yüksek puanlı yerel işletmeler.</p></div><Link className="link-arrow" to="/categories">Hepsini gör <ArrowRight size={18} /></Link></div>
        <div className="business-grid">{featured.map((item) => <BusinessCard key={item.id} business={item} />)}</div>
      </section>
      <CategoryStrip />
      <HomeFeed />
      <section className="container section">
        <div className="cta-panel">
          <div>
            <h2>İşletmenizi Şehir360'ne ekleyin</h2>
            <p>Profilinizi sahiplenin, kampanyalarınızı yayınlayın, yorumları yönetin ve şehirde daha görünür olun.</p>
          </div>
          <div className="cta-actions"><Link className="btn btn-green" to="/login?role=business">İşletme Girişi</Link><Link className="btn btn-light" to="/login?role=business">Paketleri İncele</Link></div>
        </div>
      </section>
    </PageShell>
  );
}

function AppDataProvider({ children }) {
  const [businessList, setBusinessList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [users, setUsers] = useState(() => {
    const saved = getStored("sehir-paneli-users", []);
    return [...defaultUsers, ...saved.filter((item) => !defaultUsers.some((user) => user.email === item.email))];
  });
  const [notifications, setNotifications] = useState(() => getStored("sehir-paneli-notifications", [
    { id: "n1", title: "Yeni restoran eklendi", text: "Gaziantep Mutfağı yayında, denemek ister misin?", to: "/business/gaziantep-mutfagi-pozcu", time: "Az önce", read: false },
    { id: "n2", title: "Yeme & İçme fırsatı", text: "Kategoride yeni kampanyalar var.", to: "/categories/yeme-icme", time: "Bugün", read: false },
    { id: "n3", title: "Etkinlik önerisi", text: "Bu hafta şehirde yeni etkinlikler listelendi.", to: "/events", time: "Bugün", read: false }
  ]));

  const refreshBusinesses = async (query = "") => {
    try {
      const separator = query ? `${query}&` : "?";
      const data = await apiFetch(`/businesses${separator}autofetch=1`);
      if (!Array.isArray(data.businesses)) throw new Error("Isletme API yaniti gecersiz");
      setBusinessList(data.businesses);
    } catch (error) {
      console.warn("Isletme verisi API'den alinamadi, statik DB snapshot deneniyor.", error);
      try {
        const snapshot = await fetchJson("/db-snapshot.json");
        const rows = Array.isArray(snapshot.businesses) ? snapshot.businesses : seedBusinesses;
        setBusinessList(rows);
      } catch (snapshotError) {
        console.warn("Statik DB snapshot yuklenemedi, son fallback korunuyor.", snapshotError);
        setBusinessList(seedBusinesses);
      }
    }
  };

  const refreshCategories = async () => {
    try {
      const data = await apiFetch("/categories");
      if (!Array.isArray(data.categories)) throw new Error("Kategori API yaniti gecersiz");
      setCategoryList(data.categories);
    } catch (error) {
      console.warn("Kategori verisi API'den alinamadi, statik DB snapshot deneniyor.", error);
      try {
        const snapshot = await fetchJson("/db-snapshot.json");
        if (Array.isArray(snapshot.categories)) {
          const businesses = Array.isArray(snapshot.businesses) ? snapshot.businesses : [];
          setCategoryList(snapshot.categories.map((category) => ({
            ...category,
            count: businesses.filter((business) => (
              business.categoryId === category.id ||
              business.categorySlug === category.slug ||
              slugify(business.category) === slugify(category.name)
            )).length
          })));
        } else {
          setCategoryList(seedCategories);
        }
      } catch (snapshotError) {
        console.warn("Statik DB snapshot yuklenemedi, son kategori fallback korunuyor.", snapshotError);
        setCategoryList(seedCategories);
      }
    }
  };

  const refreshNotifications = async () => {
    if (!getToken()) return;
    try {
      const data = await apiFetch("/notifications");
      setNotifications((data.notifications || []).map((item) => ({ ...item, time: item.createdAt ? "Az once" : item.time })));
    } catch {
      // Local fallback korunur.
    }
  };

  useEffect(() => {
    refreshCategories();
    refreshBusinesses();
    refreshNotifications();
  }, []);

  const persistUsers = (nextUsers) => {
    const customUsers = nextUsers.filter((item) => !defaultUsers.some((user) => user.email === item.email));
    localStorage.setItem("sehir-paneli-users", JSON.stringify(customUsers));
    setUsers(nextUsers);
  };

  const pushNotification = (notification) => {
    setNotifications((current) => {
      const next = [{ id: `n-${Date.now()}`, read: false, time: "Az önce", ...notification }, ...current].slice(0, 12);
      localStorage.setItem("sehir-paneli-notifications", JSON.stringify(next));
      return next;
    });
  };

  const addBusiness = async (formValues = {}) => {
    try {
      const data = await apiFetch("/businesses", {
        method: "POST",
        body: JSON.stringify({ name: formValues.businessName || formValues.name, ...formValues })
      });
      setBusinessList((current) => [data.business, ...current.filter((item) => item.id !== data.business.id)]);
      await refreshCategories();
      await refreshNotifications();
      return data.business;
    } catch (error) {
      throw error;
    }
  };

  const updateBusiness = async (id, updates) => {
    try {
      const data = await apiFetch(`/businesses/${id}`, { method: "PUT", body: JSON.stringify(updates) });
      setBusinessList((current) => current.map((item) => item.id === id ? data.business : item));
      await refreshCategories();
      return data.business;
    } catch (error) {
      throw error;
    }
  };

  const deleteBusiness = async (id) => {
    await apiFetch(`/businesses/${id}`, { method: "DELETE" });
    setBusinessList((current) => current.filter((item) => item.id !== id && item.slug !== id));
    await refreshCategories();
  };

  const addCategory = async (values) => {
    const data = await apiFetch("/categories", { method: "POST", body: JSON.stringify(values) });
    await refreshCategories();
    return data.category;
  };

  const updateCategory = async (id, values) => {
    const data = await apiFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify(values) });
    await refreshCategories();
    await refreshBusinesses();
    return data.category;
  };

  const deleteCategory = async (id) => {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    await refreshCategories();
  };

  const value = useMemo(() => ({
    businesses: businessList,
    categories: categoryList,
    users,
    registerUser: (user) => persistUsers([...users, user]),
    addBusiness,
    updateBusiness,
    deleteBusiness,
    addCategory,
    updateCategory,
    deleteCategory,
    notifications,
    pushNotification,
    refreshBusinesses,
    refreshCategories,
    refreshNotifications,
    markNotificationsRead: async () => {
      try {
        await apiFetch("/notifications/read", { method: "PATCH", body: JSON.stringify({}) });
      } catch {
        // Local fallback korunur.
      }
      const next = notifications.map((item) => ({ ...item, read: true }));
      localStorage.setItem("sehir-paneli-notifications", JSON.stringify(next));
      setNotifications(next);
    }
  }), [businessList, categoryList, users, notifications]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

function useAppData() {
  return useContext(AppDataContext);
}

function AuthPage() {
  setMeta("Giriş Yap / Kayıt Ol | Şehir360", "Şehir360 müşteri ve işletme giriş ekranı.");
  const navigate = useNavigate();
  const initialRole = new URLSearchParams(window.location.search).get("role");
  const [role, setRole] = useState(initialRole === "business" ? "business" : "customer");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name") || form.get("email") || (role === "business" ? "İşletme kullanıcısı" : "Müşteri");
    localStorage.setItem("sehir-paneli-session", JSON.stringify({ role, name, email: form.get("email"), mode }));
    setMessage(mode === "login" ? "Giriş başarılı, yönlendiriliyorsunuz." : "Kayıt oluşturuldu, yönlendiriliyorsunuz.");
    window.setTimeout(() => navigate(role === "business" ? "/business-panel" : "/home"), 350);
  };

  return (
    <PageShell className="auth-main">
      <section className="container auth-layout">
        <aside className="auth-role-panel">
          <p className="eyebrow">Hesap türü</p>
          <h1>Nasıl devam etmek istiyorsunuz?</h1>
          <p>İşletme sahipleri panel araçlarına, müşteriler ise şehir rehberi deneyimine yönlendirilir.</p>
          <div className="role-options">
            <button className={role === "business" ? "selected" : ""} type="button" onClick={() => setRole("business")}>
              <Building2 />
              <span><b>İşletmeyim</b><small>Profil, kampanya, yorum ve paket yönetimi</small></span>
            </button>
            <button className={role === "customer" ? "selected" : ""} type="button" onClick={() => setRole("customer")}>
              <Users />
              <span><b>Müşteriyim</b><small>Favoriler, yorumlar ve şehir keşfi</small></span>
            </button>
          </div>
        </aside>
        <section className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Giriş Yap</button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Kayıt Ol</button>
          </div>
          <h2>{role === "business" ? "İşletme hesabı" : "Müşteri hesabı"}</h2>
          <p>{mode === "login" ? "Hesabınıza giriş yapın." : "Yeni hesabınızı oluşturun."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <label>Ad Soyad / İşletme Yetkilisi<input name="name" required placeholder="Adınız ve soyadınız" /></label>}
            <label>E-posta<input name="email" type="email" required placeholder="ornek@mail.com" /></label>
            <label>Şifre<input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" /></label>
            {mode === "register" && role === "business" && <label>İşletme Adı<input name="businessName" required placeholder="İşletmenizin adı" /></label>}
            <button className="btn btn-primary" type="submit">{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</button>
          </form>
          {message && <p className="auth-message">{message}</p>}
        </section>
      </section>
    </PageShell>
  );
}

function AuthPageFixed() {
  setMeta("Giris Yap / Kayit Ol | Şehir360", "Şehir360 musteri ve isletme giris ekrani.");
  const navigate = useNavigate();
  const { users, registerUser, addBusiness, pushNotification } = useAppData();
  const initialRole = new URLSearchParams(window.location.search).get("role");
  const [role, setRole] = useState(initialRole === "business" ? "business" : "customer");
  const [mode, setMode] = useState("login");
  const [packageType, setPackageType] = useState("free");
  const [message, setMessage] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    if (mode === "login") {
      const user = users.find((item) => item.email.toLowerCase() === email && item.password === password && item.role === role);
      if (!user) {
        setMessage("E-posta, sifre veya hesap turu hatali. Rastgele giris kabul edilmiyor.");
        return;
      }
      localStorage.setItem("sehir-paneli-session", JSON.stringify({ role: user.role, name: user.name, email: user.email, packageType: user.packageType }));
      setMessage("Giris basarili, yonlendiriliyorsunuz.");
      window.setTimeout(() => navigate(user.role === "admin" ? "/admin" : user.role === "business" ? "/business-panel" : "/home"), 350);
      return;
    }

    if (users.some((item) => item.email.toLowerCase() === email)) {
      setMessage("Bu e-posta ile zaten hesap var. Giris yapmayi deneyin.");
      return;
    }

    const name = String(form.get("name") || form.get("businessName") || email);
    const user = { role, name, email, password, packageType: role === "business" ? packageType : undefined };
    registerUser(user);
    let business = null;
    if (role === "business") {
      business = addBusiness({
        businessName: String(form.get("businessName") || name),
        phone: String(form.get("phone") || ""),
        category: "Restoran",
        packageType,
        status: packageType === "premium" ? "Onaylı" : "Beklemede"
      });
    }
    localStorage.setItem("sehir-paneli-session", JSON.stringify({ role, name, email, packageType, businessId: business?.id }));
    pushNotification({
      title: role === "business" ? "Yeni restoran kaydi" : "Yeni musteri kaydi",
      text: role === "business" ? `${business?.name || name} sisteme katildi.` : `${name} sehir rehberine katildi.`,
      to: role === "business" && business ? `/business/${business.slug}` : "/home"
    });
    setMessage(role === "business" ? "Kayit tamam. Paket secildi, ana sayfaya yonlendiriliyorsunuz." : "Kayit tamam, ana sayfaya yonlendiriliyorsunuz.");
    window.setTimeout(() => navigate("/home"), 450);
  };

  return (
    <PageShell className="auth-main">
      <section className="container auth-layout">
        <aside className="auth-role-panel">
          <p className="eyebrow">Hesap turu</p>
          <h1>Nasil devam etmek istiyorsunuz?</h1>
          <p>Isletmeler panel araclarina, musteriler sehir rehberine yonlendirilir.</p>
          <div className="role-options">
            <button className={role === "business" ? "selected" : ""} type="button" onClick={() => setRole("business")}>
              <Building2 />
              <span><b>Isletmeyim</b><small>Profil, kampanya, yorum ve paket yonetimi</small></span>
            </button>
            <button className={role === "customer" ? "selected" : ""} type="button" onClick={() => setRole("customer")}>
              <Users />
              <span><b>Musteriyim</b><small>Favoriler, yorumlar ve sehir kesfi</small></span>
            </button>
            <button className={role === "admin" ? "selected" : ""} type="button" onClick={() => setRole("admin")}>
              <LayoutDashboard />
              <span><b>Admin</b><small>Onay, kategori, kampanya ve kullanici yonetimi</small></span>
            </button>
          </div>
        </aside>
        <section className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Giris Yap</button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Kayit Ol</button>
          </div>
          <h2>{role === "business" ? "Isletme hesabi" : role === "admin" ? "Admin hesabi" : "Musteri hesabi"}</h2>
          <p>{mode === "login" ? "Hesabiniza giris yapin." : "Yeni hesabinizi olusturun."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <label>Ad Soyad / Yetkili<input name="name" required placeholder="Adiniz ve soyadiniz" /></label>}
            <label>E-posta<input name="email" type="email" required placeholder="ornek@mail.com" /></label>
            <label>Sifre<input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" /></label>
            {mode === "register" && role === "business" && <label>Isletme Adi<input name="businessName" required placeholder="Restoran adi" /></label>}
            {mode === "register" && role === "business" && <label>Telefon<input name="phone" placeholder="+90 324 000 00 00" /></label>}
            {mode === "register" && role === "business" && (
              <div className="package-choice">
                <button type="button" className={packageType === "free" ? "selected" : ""} onClick={() => setPackageType("free")}>
                  <b>Ucretsiz</b><span>Temel profil ve bekleyen onay</span>
                </button>
                <button type="button" className={packageType === "premium" ? "selected" : ""} onClick={() => setPackageType("premium")}>
                  <b>Premium</b><span>One cikan restoran ve sponsor rozet</span>
                </button>
              </div>
            )}
            <button className="btn btn-primary" type="submit">{mode === "login" ? "Giris Yap" : "Kayit Ol"}</button>
          </form>
          {message && <p className={`auth-message ${message.includes("hatali") || message.includes("zaten") ? "error" : ""}`}>{message}</p>}
        </section>
      </section>
    </PageShell>
  );
}

function AuthPageApi() {
  setMeta("Giriş Yap / Kayıt Ol | Şehir360", "Şehir360 müşteri ve işletme giriş ekranı.");
  const navigate = useNavigate();
  const { refreshBusinesses, refreshNotifications } = useAppData();
  const initialRole = new URLSearchParams(window.location.search).get("role");
  const [role, setRole] = useState(["business", "customer", "admin"].includes(initialRole) ? initialRole : "customer");
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || form.get("businessName") || email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMessage("Geçerli bir e-posta yazın.");
    if (password.length < 6) return setMessage("Şifre en az 6 karakter olmalı.");
    try {
      const payload = mode === "login"
        ? await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ role, email, password }) })
        : await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            role,
            name,
            email,
            password,
            businessName: String(form.get("businessName") || name),
            phone: String(form.get("phone") || "")
          })
        });
      localStorage.setItem("sehir-paneli-token", payload.token);
      localStorage.setItem("sehir-paneli-session", JSON.stringify(payload.user));
      await refreshBusinesses();
      await refreshNotifications();
      setMessage(mode === "login" ? "Giriş başarılı, yönlendiriliyorsunuz." : "Kayıt tamam, yönlendiriliyorsunuz.");
      const target = payload.user.role === "admin" ? "/admin" : payload.user.role === "business" && !payload.user.packageType ? "/package-select" : payload.user.role === "business" ? "/business-panel" : "/home";
      window.setTimeout(() => navigate(target), 350);
    } catch (error) {
      setMessage(error.message || "İşlem başarısız.");
    }
  };

  return (
    <PageShell className="auth-main">
      <section className="container auth-layout">
        <aside className="auth-role-panel">
          <p className="eyebrow">Hesap türü</p>
          <h1>Nasıl devam etmek istiyorsunuz?</h1>
          <p>İşletmeler panel araçlarına, müşteriler şehir rehberine yönlendirilir.</p>
          <div className="role-options">
            <button className={role === "business" ? "selected" : ""} type="button" onClick={() => setRole("business")}>
              <Building2 /><span><b>İşletmeyim</b><small>Profil, kampanya, yorum ve paket yönetimi</small></span>
            </button>
            <button className={role === "customer" ? "selected" : ""} type="button" onClick={() => setRole("customer")}>
              <Users /><span><b>Müşteriyim</b><small>Favoriler, yorumlar ve şehir keşfi</small></span>
            </button>
          </div>
        </aside>
        <section className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>Giriş Yap</button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>Kayıt Ol</button>
          </div>
          <h2>{role === "business" ? "İşletme hesabı" : role === "admin" ? "Admin hesabı" : "Müşteri hesabı"}</h2>
          <p>{mode === "login" ? "Hesabınıza giriş yapın." : "Yeni hesabınızı oluşturun."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <label>Ad Soyad / Yetkili<input name="name" required placeholder="Adınız ve soyadınız" /></label>}
            <label>E-posta<input name="email" type="email" required placeholder="ornek@mail.com" /></label>
            <label>Şifre<input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" /></label>
            {mode === "register" && role === "business" && <label>İşletme Adı<input name="businessName" required placeholder="Restoran adı" /></label>}
            {mode === "register" && role === "business" && <label>Telefon<input name="phone" placeholder="+90 324 000 00 00" /></label>}
            <button className="btn btn-primary" type="submit">{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</button>
          </form>
          {message && <p className={`auth-message ${message.includes("hatalı") || message.includes("zaten") || message.includes("başarısız") ? "error" : ""}`}>{message}</p>}
        </section>
      </section>
    </PageShell>
  );
}

function PackageSelectPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const session = getSession();
  if (session?.role !== "business") return <Navigate to="/login?role=business" replace />;
  if (session?.packageType) return <Navigate to="/business-panel" replace />;
  const choosePackage = async (packageType) => {
    try {
      const data = await apiFetch("/auth/package", { method: "POST", body: JSON.stringify({ packageType }) });
      localStorage.setItem("sehir-paneli-session", JSON.stringify(data.user));
      setMessage("Paket kaydedildi, işletme paneline yönlendiriliyorsunuz.");
      window.setTimeout(() => navigate("/business-panel"), 350);
    } catch (error) {
      setMessage(error.message || "Paket kaydedilemedi.");
    }
  };
  return (
    <PageShell className="auth-main">
      <section className="container auth-layout">
        <aside className="auth-role-panel">
          <p className="eyebrow">Paket seçimi</p>
          <h1>İşletmeniz nasıl görünsün?</h1>
          <p>Paket seçmeden işletme paneli açılmaz. Seçiminiz veritabanına kaydedilir.</p>
        </aside>
        <section className="auth-card">
          <h2>Paketinizi seçin</h2>
          <div className="package-choice">
            <button type="button" onClick={() => choosePackage("free")}><b>Ücretsiz</b><span>Temel profil ve bekleyen onay</span></button>
            <button type="button" onClick={() => choosePackage("premium")}><b>Premium</b><span>Öne çıkan restoran ve sponsor rozet</span></button>
          </div>
          {message && <p className="auth-message">{message}</p>}
        </section>
      </section>
    </PageShell>
  );
}

function SearchBar() {
  const { city, setCity } = useCity();
  const navigate = useNavigate();
  return (
    <form className="search-panel" onSubmit={(event) => { event.preventDefault(); navigate("/categories"); }}>
      <Search />
      <input placeholder="İşletme, kategori veya hizmet arayın..." />
      <select value={city} onChange={(event) => setCity(event.target.value)}>{seedCities.map((item) => <option key={item.id}>{item.name}</option>)}</select>
      <button className="btn btn-primary">Ara</button>
    </form>
  );
}

function QuickLinks() {
  const items = [
    [<ShieldCheck />, "Nöbetçi Eczaneler", "Size en yakın açık eczaneler", "/pharmacies"],
    [<BriefcaseBusiness />, "İş İlanları", "Mersin geneli yeni ilanlar", "/jobs"],
    [<CalendarDays />, "Etkinlikler", "Konser, sergi ve festivaller", "/events"],
    [<Tags />, "Kampanyalar", "Yerel işletme fırsatları", "/campaigns"]
  ];
  return <section className="container quick-grid">{items.map(([icon, title, text, to]) => <Link className="quick-card" to={to} key={title}>{icon}<div><h3>{title}</h3><p>{text}</p></div></Link>)}</section>;
}

function CategoryStrip() {
  const { categories } = useAppData();
  return (
    <section className="section section-white">
      <div className="container">
        <div className="section-head centered"><div><h2>Sektöre göre keşfedin</h2><p>Şehir yaşamındaki ana ihtiyaçlar tek düzenli kategoride.</p></div></div>
        <div className="category-grid">{categories.map((item) => <Link className="category-tile" to={`/categories/${item.slug}`} key={item.id}><span>{item.icon}</span><h3>{item.name}</h3><p>{item.count} kayıt</p></Link>)}</div>
      </div>
    </section>
  );
}

function HomeFeed() {
  const { businesses } = useAppData();
  return (
    <section className="container section split-feed">
      <div>
        <h2>Son yorumlar</h2>
        <div className="review-list">{reviews.slice(0, 3).map((r) => <ReviewItem key={r.id} review={r} />)}</div>
      </div>
      <div>
        <h2>Yeni eklenenler</h2>
        <div className="mini-list">{businesses.slice(3, 7).map((b) => <Link to={`/business/${b.slug}`} key={b.id}><img src={getBusinessImage(b)} alt={b.name} /><div><b>{b.name}</b><small>{b.category} · {b.district}</small></div><Badge tone="green">Yeni</Badge></Link>)}</div>
      </div>
    </section>
  );
}

function getBusinessImage(business) {
  return business.image || business.cover || business.logo || business.gallery?.[0] || business.photos?.[0] || "";
}

function getBusinessCover(business) {
  return business.cover || business.image || business.gallery?.[0] || business.photos?.[0] || business.logo || "";
}

function getBusinessLogo(business) {
  return business.logo || business.image || business.gallery?.[0] || business.photos?.[0] || business.cover || "";
}

function BusinessCard({ business }) {
  return (
    <article className="business-card">
      <div className="card-media">
        <img src={getBusinessImage(business)} alt={business.name} />
        <div className="media-badges">
          {business.verified && <Badge tone="green"><ShieldCheck size={14} /> Doğrulanmış</Badge>}
          {business.sponsored && <Badge tone="gold"><Sparkles size={14} /> Sponsorlu</Badge>}
        </div>
        <button className="favorite" aria-label={`${business.name} favorilere ekle`}><Heart size={19} /></button>
      </div>
      <div className="card-body">
        <div className="card-title-row"><div><Badge>{business.category}</Badge><h3>{business.name}</h3></div><Rating value={business.rating} /></div>
        <p><MapPin size={16} /> {business.district}, {business.city}</p>
        <div className="card-footer"><span className={business.open ? "open" : "closed"}>{business.open ? "Şu an açık" : "Kapalı"}</span><Link className="btn btn-outline small" to={`/business/${business.slug}`}>Detaylar</Link></div>
      </div>
    </article>
  );
}

function CategoriesPage() {
  const { city } = useCity();
  const { businesses, categories } = useAppData();
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlySponsored, setOnlySponsored] = useState(false);
  const category = categories.find((c) => c.slug === slug || c.id === slug);
  const normalizedQuery = query.trim() ? slugify(query) : "";
  const filtered = businesses.filter((business) => {
    const matchesCategory = !category || business.categorySlug === category.slug || business.categoryId === category.id || slugify(business.category) === slugify(category.name);
    const matchesQuery = !normalizedQuery || slugify(`${business.name} ${business.category} ${business.district} ${business.address}`).includes(normalizedQuery);
    const matchesVerified = !onlyVerified || business.verified || business.isVerified;
    const matchesOpen = !onlyOpen || business.open || business.isOpen;
    const matchesSponsored = !onlySponsored || business.sponsored || business.isSponsored;
    return matchesCategory && matchesQuery && matchesVerified && matchesOpen && matchesSponsored;
  });
  setMeta(`${category ? category.name : "Kategoriler"} | Şehir360`, `${city} işletme listeleme ve kategori keşfi.`);
  return (
    <PageShell>
      <section className="container page-top">
        <div className="breadcrumbs"><Link to="/home">Ana Sayfa</Link><ChevronRight size={15} /><span>{category?.name || "Kategoriler"}</span></div>
        <div className="listing-layout">
          <aside className="filter-panel">
            <h3>Filtrele</h3>
            <label><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İşletme ara" /></label>
            <label><input type="checkbox" checked={onlyVerified} onChange={(event) => setOnlyVerified(event.target.checked)} /> Doğrulanmış</label>
            <label><input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} /> Şu an açık</label>
            <label><input type="checkbox" checked={onlySponsored} onChange={(event) => setOnlySponsored(event.target.checked)} /> Sponsorlu</label>
            <button className="btn btn-primary" type="button" onClick={() => { setQuery(""); setOnlyVerified(false); setOnlyOpen(false); setOnlySponsored(false); }}>Filtreleri Temizle</button>
          </aside>
          <section>
            <div className="section-head"><div><h1>{category ? `${category.name} işletmeleri` : `${city} işletmeleri`}</h1><p>{filtered.length} kayıt listeleniyor.</p></div><select><option>En popüler</option><option>En yüksek puan</option><option>En yeni</option></select></div>
            {filtered.length ? <div className="business-grid">{filtered.map((item) => <BusinessCard business={item} key={item.id} />)}</div> : <EmptyState title="Kayıt bulunamadı" text="Bu filtrelerde işletme yok. Filtreleri temizleyip tekrar deneyin." />}
          </section>
        </div>
      </section>
    </PageShell>
  );
}

function BusinessDetail() {
  const { slug } = useParams();
  const { businesses } = useAppData();
  const [remoteBusiness, setRemoteBusiness] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const business = remoteBusiness || businesses.find((b) => b.slug === slug || b.id === slug);

  useEffect(() => {
    setNotFound(false);
    apiFetch(`/businesses/${slug}`)
      .then((data) => setRemoteBusiness(data.business))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (!business && !notFound) {
    return <PageShell><section className="container page-top"><Loading /></section></PageShell>;
  }

  if (!business) {
    return <PageShell><section className="container page-top"><EmptyState title="İşletme bulunamadı" text="Bu işletme kaydı veritabanında bulunamadı." /></section></PageShell>;
  }

  const services = business.services?.length ? business.services : [];
  const hours = business.hours?.length ? business.hours : business.openingHours?.map((line) => ({ day: line.split(":")[0], time: line.split(":").slice(1).join(":").trim() })) || [];
  const gallery = business.gallery?.length ? business.gallery : business.photos?.length ? business.photos : [getBusinessImage(business)].filter(Boolean);
  const cover = getBusinessCover(business);
  const logo = getBusinessLogo(business);
  setMeta(`${business.name} | Şehir360`, `${business.name} adres, telefon, yorumlar, kampanyalar ve çalışma saatleri.`);
  return (
    <PageShell>
      <section className="container detail-page">
        <div className="detail-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,35,111,.86)), url(${cover})` }}>
          <img className="detail-logo" src={logo} alt={`${business.name} logo`} />
          <div>
            <div className="detail-badges"><Badge tone="green"><ShieldCheck size={14} /> Doğrulanmış</Badge>{business.sponsored && <Badge tone="gold">Sponsorlu</Badge>}</div>
            <h1>{business.name}</h1>
            <p><Rating value={business.rating} count={business.reviewCount} /> · {business.category} · {business.district}</p>
          </div>
          <div className="detail-actions"><a className="btn btn-green" href={`https://wa.me/${business.whatsapp}`}><MessageCircle size={18} /> WhatsApp</a><a className="btn btn-primary" href={`tel:${business.phone}`}><Phone size={18} /> Ara</a></div>
        </div>
        <div className="action-grid">
          <a href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}><Navigation /> Yol tarifi</a>
          <a href={business.website}><ExternalLink /> Web sitesi</a>
          <button><Heart /> Favorilere ekle</button>
          <button><MessageCircle /> Paylaş</button>
        </div>
        <div className="detail-grid">
          <div className="stack">
            <Panel title="Hakkında"><p>{business.description}</p></Panel>
            <Panel title="Hizmetler / Menü"><div className="service-grid">{services.map((s) => <span key={s}><CheckCircle2 /> {s}</span>)}</div></Panel>
            <Panel title="Kampanyalar"><div className="campaign-list">{campaigns.filter((c) => c.businessId === business.id).map((c) => <div key={c.id}><Badge tone="gold">{c.discount}</Badge><b>{c.title}</b><p>{c.description}</p></div>)}</div></Panel>
            <Panel title="Yorumlar"><div className="review-list">{(business.reviews || []).map((r) => <ReviewItem key={r.id} review={r} />)}</div></Panel>
          </div>
          <aside className="stack">
            <Panel title="Çalışma saatleri">{hours.map((h) => <div className="hours-row" key={`${h.day}-${h.time}`}><span>{h.day}</span><b>{h.time}</b></div>)}</Panel>
            <Panel title="İletişim"><p><MapPin /> {business.address}</p><p><Phone /> {business.phone}</p><p><ExternalLink /> {business.website ? business.website.replace("https://", "") : "-"}</p></Panel>
            <Panel title="Galeri"><div className="gallery-grid">{gallery.map((img) => <img key={img} src={img} alt={`${business.name} galeri`} />)}</div></Panel>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function ReviewItem({ review }) {
  return <article className="review-item"><img src={review.avatar} alt={review.name} /><div><div className="review-head"><b>{review.name}</b><Rating value={review.rating} /></div><p>{review.text}</p><small>{review.date}</small></div></article>;
}

function DataListPage({ type }) {
  const map = {
    campaigns: ["Kampanyalar", campaigns, Tags],
    events: ["Etkinlikler", events, CalendarDays],
    pharmacies: ["Nöbetçi Eczaneler", pharmacies, ShieldCheck],
    jobs: ["İş İlanları", jobs, BriefcaseBusiness]
  };
  const [title, rows, Icon] = map[type];
  setMeta(`${title} | Şehir360`, `Şehir360 ${title.toLowerCase()} sayfası.`);
  return (
    <PageShell>
      <section className="container page-top">
        <div className="section-head"><div><h1>{title}</h1><p>Boş sayfa yok: her modül backend'e bağlanmaya hazır veri modeliyle gösteriliyor.</p></div><Icon size={38} className="page-icon" /></div>
        <div className="module-grid">{rows.map((item) => <article className="module-card" key={item.id}><Badge tone={type === "pharmacies" ? "green" : "blue"}>{item.status || item.discount || item.type || item.company}</Badge><h3>{item.title || item.name}</h3><p>{item.description || item.address}</p><small>{item.date || item.district || item.salary}</small></article>)}</div>
      </section>
    </PageShell>
  );
}

function AdminPanel() {
  const session = JSON.parse(localStorage.getItem("sehir-paneli-session") || "null");
  if (session?.role !== "admin") return <Navigate to="/login?role=admin" replace />;
  setMeta("Admin Paneli | Şehir360", "Şehir360 yönetim paneli, işletme onayı, kategori, kampanya ve kullanıcı yönetimi.");
  const stats = [["Toplam İşletme", "1.248", Store], ["Bekleyen Onay", "42", Clock3], ["Aktif Kampanya", "86", Tags], ["Aylık Gelir", "₺142.800", CircleDollarSign]];
  return (
    <DashboardShell title="Şehir360" role="Yönetim Merkezi" items={["Genel Bakış", "İşletme Listesi", "Yeni İşletme Ekle", "Onay Bekleyenler", "Kategori Yönetimi", "Şehir Yönetimi", "Kampanya Yönetimi", "Kullanıcı Yönetimi", "Paket / Abonelik"]}>
      <DashboardHeader title="Genel Bakış" text="Mersin şehir rehberi operasyon durumu." />
      <StatsGrid stats={stats} />
      <div className="dashboard-grid">
        <Panel title="İşletme Listesi ve Onay Bekleyenler"><AdminTable /></Panel>
        <Panel title="Yönetim Kısayolları"><div className="manage-grid">{["Kategori yönetimi", "Şehir yönetimi", "Kampanya yönetimi", "Kullanıcı yönetimi", "Paket yönetimi", "Raporlar"].map((x) => <button key={x}><LayoutDashboard />{x}</button>)}</div></Panel>
      </div>
      <Panel title="Yeni İşletme Ekleme"><FormGrid fields={["İşletme adı", "Kategori", "Şehir", "Telefon", "Paket", "Durum"]} button="Taslak İşletme Oluştur" /></Panel>
    </DashboardShell>
  );
}

function AdminPanelFixed() {
  const session = getSession();
  const navigate = useNavigate();
  const { businesses, categories, addBusiness, updateBusiness, deleteBusiness, addCategory, updateCategory, deleteCategory, pushNotification } = useAppData();
  const [active, setActive] = useState("Genel Bakis");
  const [message, setMessage] = useState("");
  if (session?.role !== "admin") return <Navigate to="/login" replace />;
  setMeta("Admin Paneli | Şehir360", "Şehir360 yonetim paneli.");
  const pending = businesses.filter((item) => !item.verified).length;
  const stats = [["Toplam Isletme", businesses.length, Store], ["Bekleyen Onay", pending, Clock3], ["Aktif Kampanya", campaigns.length, Tags], ["Aylik Gelir", "142.800 TL", CircleDollarSign]];
  const items = ["Genel Bakis", "Isletme Listesi", "Yeni Isletme Ekle", "Onay Bekleyenler", "Kategori Yonetimi", "Kampanya Yonetimi", "Kullanici Yonetimi", "Paket / Abonelik"];

  const createBusiness = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const business = await addBusiness({
        businessName: String(form.get("businessName") || "").trim(),
        categoryId: String(form.get("categoryId") || ""),
        city: String(form.get("city") || "Mersin"),
        district: String(form.get("district") || ""),
        phone: String(form.get("phone") || ""),
        packageType: String(form.get("packageType") || "free"),
        status: String(form.get("status") || "Beklemede")
      });
      pushNotification({ title: "Yeni isletme", text: `${business.name} ana sayfaya eklendi.`, to: `/business/${business.slug}` });
      setMessage(`${business.name} olusturuldu ve veritabanina kaydedildi.`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error.message || "Isletme kaydedilemedi.");
    }
  };

  const approve = async (business) => {
    await updateBusiness(business.id, { verified: true, approved: true });
    pushNotification({ title: "Restoran onaylandi", text: `${business.name} artik yayinda.`, to: `/business/${business.slug}` });
    setMessage(`${business.name} onaylandi.`);
  };

  const reject = async (business) => {
    await updateBusiness(business.id, { verified: false, approved: false, open: false });
    setMessage(`${business.name} beklemeye alindi.`);
  };

  const removeBusiness = async (business) => {
    try {
      await deleteBusiness(business.id);
      setMessage(`${business.name} silindi.`);
    } catch (error) {
      setMessage(error.message || "Isletme silinemedi.");
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const category = await addCategory({
        name: String(form.get("name") || "").trim(),
        slug: String(form.get("slug") || "").trim(),
        icon: String(form.get("icon") || "📍")
      });
      setMessage(`${category.name} kategorisi eklendi.`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error.message || "Kategori kaydedilemedi.");
    }
  };

  const renameCategory = async (category) => {
    const nextName = window.prompt("Kategori adi", category.name);
    if (!nextName || nextName === category.name) return;
    try {
      const updated = await updateCategory(category.id, { name: nextName });
      setMessage(`${updated.name} kategorisi guncellendi.`);
    } catch (error) {
      setMessage(error.message || "Kategori guncellenemedi.");
    }
  };

  const removeCategory = async (category) => {
    try {
      await deleteCategory(category.id);
      setMessage(`${category.name} kategorisi silindi.`);
    } catch (error) {
      setMessage(error.message || "Kategori silinemedi.");
    }
  };

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link to="/home" className="brand"><span>Şehir</span>360</Link>
        <p>Yonetim Merkezi</p>
        {items.map((item) => (
          <button className={active === item ? "active" : ""} type="button" key={item} onClick={() => setActive(item)}>
            <LayoutDashboard size={18} /> {item}
          </button>
        ))}
      </aside>
      <main className="dash-main" id="top">
        <div className="dash-top"><div><h1>Admin Paneli</h1><p>Mersin, Turkiye</p></div><Link className="btn btn-primary small" to="/home">Siteye Don</Link></div>
        {message && <p className="admin-message">{message}</p>}
        {(active === "Genel Bakis" || active === "Isletme Listesi" || active === "Onay Bekleyenler") && (
          <>
            <DashboardHeader title={active} text="Canli isletme, onay ve bildirim akislarini buradan yonetin." />
            <StatsGrid stats={stats} />
            <Panel title="Isletme Listesi ve Onay Bekleyenler">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Isletme</th><th>Kategori</th><th>Konum</th><th>Durum</th><th>Islem</th></tr></thead>
                  <tbody>{businesses.map((b) => (
                    <tr key={b.id}>
                      <td>{b.name}</td><td>{b.category}</td><td>{b.district}</td>
                      <td><Badge tone={b.verified ? "green" : "gold"}>{b.verified ? "Onayli" : "Beklemede"}</Badge></td>
                      <td><button type="button" onClick={() => approve(b)}><CheckCircle2 /></button><button type="button" onClick={() => reject(b)}><XCircle /></button><button type="button" onClick={() => removeBusiness(b)}><Trash2 /></button><Link to={`/business/${b.slug}`}><Eye /></Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
        {active === "Yeni Isletme Ekle" && (
          <Panel title="Yeni Isletme Ekleme">
            <form className="form-grid" onSubmit={createBusiness}>
              <label>Isletme adi<input name="businessName" required placeholder="Yeni Restoran" /></label>
              <label>Kategori<select name="categoryId">{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
              <label>Sehir<input name="city" defaultValue="Mersin" /></label>
              <label>Ilce<input name="district" defaultValue="Merkez" /></label>
              <label>Telefon<input name="phone" placeholder="+90 324 000 00 00" /></label>
              <label>Paket<select name="packageType"><option value="free">Ucretsiz</option><option value="premium">Premium</option></select></label>
              <label>Durum<select name="status"><option>Beklemede</option><option>Onaylı</option></select></label>
              <button className="btn btn-primary" type="submit">Restorani Olustur</button>
            </form>
          </Panel>
        )}
        {active === "Kategori Yonetimi" && (
          <Panel title="Kategori Yonetimi">
            <form className="form-grid" onSubmit={createCategory}>
              <label>Kategori adi<input name="name" required placeholder="Kategori adi" /></label>
              <label>Slug<input name="slug" placeholder="bos birakilirsa otomatik" /></label>
              <label>Ikon<input name="icon" placeholder="📍" /></label>
              <button className="btn btn-primary" type="submit">Kategori Ekle</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Kategori</th><th>Slug</th><th>Kayit</th><th>Islem</th></tr></thead>
                <tbody>{categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{category.count || 0}</td>
                    <td><button type="button" onClick={() => renameCategory(category)}><Edit3 /></button><button type="button" onClick={() => removeCategory(category)}><XCircle /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Panel>
        )}
        {!["Genel Bakis", "Isletme Listesi", "Onay Bekleyenler", "Yeni Isletme Ekle", "Kategori Yonetimi"].includes(active) && (
          <Panel title={active}>
            <div className="manage-grid">
              {["Yeni kayit", "Duzenle", "Yayina al", "Raporla"].map((item) => <button type="button" key={item} onClick={() => setMessage(`${active}: ${item} islemi calisti.`)}><LayoutDashboard />{item}</button>)}
            </div>
          </Panel>
        )}
      </main>
    </div>
  );
}

function BusinessPanel() {
  const session = JSON.parse(localStorage.getItem("sehir-paneli-session") || "null");
  if (session?.role !== "business") return <Navigate to="/login?role=business" replace />;
  if (!session?.packageType) return <Navigate to="/package-select" replace />;
  setMeta("İşletme Paneli | Şehir360", "İşletme bilgilerini düzenleme, fotoğraf, kampanya, yorum ve istatistik yönetimi.");
  const stats = [["Görüntülenme", "12.480", Eye], ["Ortalama Puan", "4.8", Star], ["Gelen Mesaj", "42", MessageCircle], ["Aktif Kampanya", "4", Tags]];
  return (
    <DashboardShell title="İşletme Paneli" role="Gaziantep Mutfağı" items={["Dashboard", "İşletme Bilgileri", "Fotoğraflar", "Kampanyalar", "Yorumlar", "İstatistikler", "Paket Durumu"]}>
      <DashboardHeader title="Hoş geldiniz, Ahmet Bey" text="İşletmenizin bugünkü performansı oldukça hareketli." />
      <StatsGrid stats={stats} />
      <div className="dashboard-grid">
        <Panel title="İşletme Bilgilerini Düzenleme"><FormGrid fields={["İşletme adı", "Kategori", "Adres", "Telefon", "WhatsApp", "Web sitesi"]} button="Bilgileri Kaydet" /></Panel>
        <Panel title="Paket Durumu"><div className="package-card"><Badge tone="green">Aktif</Badge><h3>Premium Paket</h3><p>Yenileme: 15 Ağustos 2026</p><div className="progress"><span style={{ width: "70%" }} /></div><button className="btn btn-light">Paketi Yükselt</button></div></Panel>
      </div>
      <div className="dashboard-grid">
        <Panel title="Fotoğraf Ekleme"><button className="upload-box"><Upload /> Yeni galeri fotoğrafı ekle</button></Panel>
        <Panel title="Kampanya Ekleme"><FormGrid fields={["Başlık", "İndirim", "Başlangıç", "Bitiş"]} button="Kampanya Yayınla" /></Panel>
      </div>
      <Panel title="Yorumları Görme"><div className="review-list">{reviews.map((r) => <ReviewItem key={r.id} review={r} />)}</div></Panel>
    </DashboardShell>
  );
}

function BusinessPanelApi() {
  const session = getSession();
  const { categories, refreshBusinesses, refreshNotifications } = useAppData();
  const [business, setBusiness] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.role !== "business" || !session?.packageType) return;
    apiFetch("/businesses/mine")
      .then((data) => setBusiness(data.business))
      .catch((error) => setMessage(error.message || "Isletme bilgisi alinamadi."));
  }, []);

  if (session?.role !== "business") return <Navigate to="/login?role=business" replace />;
  if (!session?.packageType) return <Navigate to="/package-select" replace />;

  const saveBusiness = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      categoryId: String(form.get("categoryId") || "restaurants"),
      city: String(form.get("city") || "Mersin"),
      district: String(form.get("district") || ""),
      address: String(form.get("address") || ""),
      phone: String(form.get("phone") || ""),
      whatsapp: String(form.get("whatsapp") || ""),
      website: String(form.get("website") || ""),
      instagram: String(form.get("instagram") || ""),
      description: String(form.get("description") || ""),
      packageType: session.packageType
    };
    if (!payload.name) {
      setMessage("Isletme adi bos olamaz.");
      return;
    }
    try {
      const data = business?.id
        ? await apiFetch(`/businesses/${business.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch("/businesses", { method: "POST", body: JSON.stringify(payload) });
      setBusiness(data.business);
      await refreshBusinesses();
      await refreshNotifications();
      setMessage("Bilgiler kaydedildi. Isletme ana sayfa ve kategori listelerine dustu.");
    } catch (error) {
      setMessage(error.message || "Kayit basarisiz.");
    }
  };

  const stats = [
    ["Goruntulenme", business?.clicks?.website || 0, Eye],
    ["Ortalama Puan", business?.rating || 0, Star],
    ["Telefon Tiklama", business?.clicks?.phone || 0, Phone],
    ["Paket", session.packageType || "free", Tags]
  ];

  return (
    <DashboardShell title="Isletme Paneli" role={business?.name || session.name || "Isletme"} items={["Dashboard", "Isletme Bilgileri", "Fotograflar", "Kampanyalar", "Yorumlar", "Istatistikler", "Paket Durumu"]}>
      <DashboardHeader title={`Hos geldiniz, ${session.name}`} text="Isletme bilgilerinizi kaydedince siteye canli olarak yansir." />
      {message && <p className="admin-message">{message}</p>}
      <StatsGrid stats={stats} />
      <div className="dashboard-grid">
        <Panel title="Isletme Bilgilerini Duzenleme">
          <form className="form-grid" onSubmit={saveBusiness}>
            <label>Isletme adi<input name="name" required defaultValue={business?.name || ""} placeholder="Isletme adi" /></label>
            <label>Kategori<select name="categoryId" defaultValue={business?.categoryId || categories[0]?.id || "restaurants"}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <label>Sehir<input name="city" defaultValue={business?.city || "Mersin"} /></label>
            <label>Ilce<input name="district" defaultValue={business?.district || ""} placeholder="Mezitli, Yenisehir..." /></label>
            <label>Adres<input name="address" defaultValue={business?.address || ""} placeholder="Adres" /></label>
            <label>Telefon<input name="phone" defaultValue={business?.phone || ""} placeholder="+90 324 ..." /></label>
            <label>WhatsApp<input name="whatsapp" defaultValue={business?.whatsapp || ""} placeholder="90324..." /></label>
            <label>Web sitesi<input name="website" defaultValue={business?.website || ""} placeholder="https://..." /></label>
            <label>Instagram<input name="instagram" defaultValue={business?.instagram || ""} placeholder="@isletme" /></label>
            <label>Aciklama<input name="description" defaultValue={business?.description || ""} placeholder="Kisa aciklama" /></label>
            <button className="btn btn-primary" type="submit">Bilgileri Kaydet</button>
          </form>
        </Panel>
        <Panel title="Paket Durumu"><div className="package-card"><Badge tone="green">Aktif</Badge><h3>{session.packageType === "premium" ? "Premium Paket" : "Ucretsiz Paket"}</h3><p>Kaydedilen paket isletme kaydina islenir.</p><div className="progress"><span style={{ width: session.packageType === "premium" ? "100%" : "45%" }} /></div><Link className="btn btn-light" to="/package-select">Paketi Degistir</Link></div></Panel>
      </div>
      <div className="dashboard-grid">
        <Panel title="Fotograf Ekleme"><button className="upload-box" type="button" onClick={() => setMessage("Fotograf yukleme icin URL alanlari / CSV import kullanilabilir.")}><Upload /> Yeni galeri fotografi ekle</button></Panel>
        <Panel title="Kampanya Ekleme"><FormGrid fields={["Baslik", "Indirim", "Baslangic", "Bitis"]} button="Kampanya Yayinla" /></Panel>
      </div>
      <Panel title="Yorumlari Gorme"><div className="review-list">{(business?.reviews?.length ? business.reviews : reviews).map((r) => <ReviewItem key={r.id} review={r} />)}</div></Panel>
    </DashboardShell>
  );
}

function DashboardShell({ title, role, items, children }) {
  return (
    <div className="dash-shell">
      <aside className="dash-sidebar"><Link to="/home" className="brand"><span>Şehir</span>360</Link><p>{role}</p>{items.map((item, index) => <a className={index === 0 ? "active" : ""} href="#top" key={item}><LayoutDashboard size={18} /> {item}</a>)}</aside>
      <main className="dash-main" id="top"><div className="dash-top"><div><h1>{title}</h1><p>Mersin, Türkiye</p></div><Link className="btn btn-primary small" to="/home">Siteye Dön</Link></div>{children}</main>
    </div>
  );
}

function DashboardHeader({ title, text }) {
  return <header className="dashboard-header"><div><h2>{title}</h2><p>{text}</p></div><div className="dash-actions"><button className="btn btn-outline small"><Bell size={16} /> Bildirimler</button><button className="btn btn-primary small"><Plus size={16} /> Yeni Kayıt</button></div></header>;
}

function StatsGrid({ stats }) {
  return <section className="stats-grid">{stats.map(([label, value, Icon]) => <article className="stat-card" key={label}><Icon /><span>{label}</span><b>{value}</b><small>Bu ay +%12</small></article>)}</section>;
}

function AdminTable() {
  return <div className="table-wrap"><table><thead><tr><th>İşletme</th><th>Kategori</th><th>Konum</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{businesses.slice(0, 5).map((b) => <tr key={b.id}><td>{b.name}</td><td>{b.category}</td><td>{b.district}</td><td><Badge tone={b.verified ? "green" : "gold"}>{b.verified ? "Onaylı" : "Beklemede"}</Badge></td><td><button><CheckCircle2 /></button><button><XCircle /></button><Link to={`/business/${b.slug}`}><Eye /></Link></td></tr>)}</tbody></table></div>;
}

function FormGrid({ fields, button }) {
  return <form className="form-grid" onSubmit={(e) => e.preventDefault()}>{fields.map((f) => <label key={f}>{f}<input placeholder={f} /></label>)}<button className="btn btn-primary">{button}</button></form>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><Search size={40} /><h2>{title}</h2><p>{text}</p><Link className="btn btn-primary" to="/categories">Tüm kategoriler</Link></div>;
}

function Loading() {
  return <div className="loading"><div /><span>^ehir360 yükleniyor...</span></div>;
}

function NotFound() {
  setMeta("404 | ^ehir360", "Sayfa bulunamadı.");
  return <PageShell><section className="container page-top"><EmptyState title="Sayfa bulunamadı" text="Aradığınız sayfa taşınmış olabilir. Ana sayfaya dönüp keşfetmeye devam edin." /></section></PageShell>;
}

function App() {
  return (
    <CityProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/city-select" element={<CitySelect />} />
              <Route path="/login" element={<AuthPageApi />} />
              <Route path="/package-select" element={<PackageSelectPage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:slug" element={<CategoriesPage />} />
              <Route path="/business/:slug" element={<BusinessDetail />} />
              <Route path="/campaigns" element={<DataListPage type="campaigns" />} />
              <Route path="/events" element={<DataListPage type="events" />} />
              <Route path="/pharmacies" element={<DataListPage type="pharmacies" />} />
              <Route path="/jobs" element={<DataListPage type="jobs" />} />
              <Route path="/admin" element={<AdminPanelFixed />} />
              <Route path="/business-panel" element={<BusinessPanelApi />} />
              <Route path="/isletme-detay" element={<Navigate to="/business/gaziantep-mutfagi-pozcu" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppDataProvider>
    </CityProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);

