import { useState, useEffect, useRef, useCallback } from "react";
import { T, SERVICED_AREAS, loadPricing, savePricing, loadTemplates, saveTemplates, loadClients, saveClients, calcQuote, ICON_OPTIONS } from "./shared";
import emailjs from '@emailjs/browser';

// ─── EmailJS Config ───
const EMAILJS_SERVICE_ID = "service_v0w9y88";
const EMAILJS_TEMPLATE_ID = "template_mbaynwc";
const EMAILJS_PUBLIC_KEY = "MZs9Wz8jaU2en7Pdd";

// ═══════════════════════════════════════════════════════════
// DUST BUNNIES CLEANING — Admin Dashboard (Mobile-Ready)
// ═══════════════════════════════════════════════════════════

// ─── Channel Icons ───
const ChannelIcon = ({ ch, size = 16 }) => {
  const colors = { messenger: "#0084FF", instagram: "#E1306C", email: "#5B9EC4" };
  const labels = { messenger: "M", instagram: "IG", email: "@" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size + 8, height: size + 8, borderRadius: 6, background: colors[ch] || "#999", color: "#fff", fontSize: size * 0.55, fontWeight: 800 }}>
      {labels[ch] || "?"}
    </span>
  );
};

// ─── Status Badge ───
const StatusBadge = ({ status }) => {
  const map = {
    new: { bg: "#E6F0F7", color: "#3B82A0", label: "New" },
    info_requested: { bg: "#FFF8E7", color: "#8B6914", label: "Info Requested" },
    info_received: { bg: "#E8F5EE", color: "#2D7A5E", label: "Info Received" },
    quote_ready: { bg: "#E8F5EE", color: "#2D7A5E", label: "Quote Ready" },
    quote_sent: { bg: T.primaryLight, color: T.primaryDark, label: "Quote Sent" },
    accepted: { bg: "#D4EDDA", color: "#155724", label: "Accepted ✓" },
    declined: { bg: "#FDF0EF", color: "#D4645C", label: "Declined" },
    out_of_area: { bg: "#FDF0EF", color: "#D4645C", label: "Out of Area" },
    pending_approval: { bg: "#FFF8E7", color: "#8B6914", label: "Pending Approval" },
    sent: { bg: T.primaryLight, color: T.primaryDark, label: "Sent" },
  };
  const s = map[status] || { bg: "#eee", color: "#666", label: status };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

// ─── Toast ───
function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.sidebar, color: "#fff", padding: "14px 24px", borderRadius: T.radius, boxShadow: T.shadowLg, fontSize: 14, fontWeight: 600, zIndex: 9999, animation: "slideUp 0.3s ease", maxWidth: "90vw", textAlign: "center" }}>
      {message}
    </div>
  );
}

// ─── Modal ───
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,58,45,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: T.radiusLg, padding: "24px", maxWidth: wide ? 700 : 500, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: T.shadowLg }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textMuted, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Search Input ───
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: T.textLight }}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box" }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 14 }}>✕</button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [enquiries, setEnquiries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("db_enquiries") || "[]"); } catch { return []; }
  });
  const [quotes, setQuotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("db_quotes") || "[]"); } catch { return []; }
  });
  const [pricing, setPricing] = useState(loadPricing);
  const [templates, setTemplates] = useState(loadTemplates);
  const [clients, setClients] = useState(loadClients);
  
  const [filter, setFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editQuoteModal, setEditQuoteModal] = useState(null);
  const [editPriceModal, setEditPriceModal] = useState(null);
  const [addServiceModal, setAddServiceModal] = useState(false);
  const [addTemplateModal, setAddTemplateModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const quoteCounter = useRef(3);

  const showToast = useCallback((msg) => setToast(msg), []);

  // ─── Responsive listener ───
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ─── Close sidebar on page change (mobile) ───
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [page, isMobile]);

  // ─── On load: pick up any recent form submission ───
  useEffect(() => {
    try {
      const raw = localStorage.getItem("db_form_submission");
      if (!raw) return;
      const data = JSON.parse(raw);
      const already = enquiries.some(e => e.details?.submittedAt === data.submittedAt && e.name === data.name);
      if (!already) {
        const enq = {
          id: Date.now(),
          name: data.name, channel: "email", suburb: data.suburb,
          message: `Form submitted: ${data.bedrooms} bed, ${data.bathrooms} bath, ${data.frequency} clean`,
          status: "info_received",
          timestamp: new Date().toISOString(),
          avatar: data.name.split(" ").map(n => n[0]).join(""),
          details: data, quoteId: null, archived: false,
        };
        setEnquiries(prev => [enq, ...prev]);
        
        // Also add to clients list
        const client = {
          id: Date.now(),
          name: data.name,
          email: data.email,
          phone: data.phone,
          suburb: data.suburb,
          createdAt: new Date().toISOString(),
          status: "lead",
        };
        setClients(prev => {
          const exists = prev.some(c => c.email === data.email);
          return exists ? prev : [client, ...prev];
        });
        
        showToast(`📋 New form submission from ${data.name}!`);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cross-tab: listen for customer form submissions ───
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "db_form_submission") {
        try {
          const data = JSON.parse(e.newValue);
          const enq = {
            id: Date.now(),
            name: data.name, channel: "email", suburb: data.suburb,
            message: `Form submitted: ${data.bedrooms} bed, ${data.bathrooms} bath, ${data.frequency} clean`,
            status: "info_received",
            timestamp: new Date().toISOString(),
            avatar: data.name.split(" ").map(n => n[0]).join(""),
            details: data, quoteId: null, archived: false,
          };
          setEnquiries(prev => [enq, ...prev]);
          
          const client = {
            id: Date.now(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            suburb: data.suburb,
            createdAt: new Date().toISOString(),
            status: "lead",
          };
          setClients(prev => {
            const exists = prev.some(c => c.email === data.email);
            return exists ? prev : [client, ...prev];
          });
          
          showToast(`📋 New form submission from ${data.name}!`);
        } catch (_) {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [showToast]);

  // ─── Persist to localStorage ───
  useEffect(() => {
    try { localStorage.setItem("db_enquiries", JSON.stringify(enquiries)); } catch {}
  }, [enquiries]);

  useEffect(() => {
    try { localStorage.setItem("db_quotes", JSON.stringify(quotes)); } catch {}
  }, [quotes]);

  useEffect(() => {
    savePricing(pricing);
  }, [pricing]);

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  // ─── Actions ───
  const sendInfoForm = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "info_requested" } : e));
    showToast("📤 Info form link sent!");
  };

  const generateQuote = (enqId) => {
    const enq = enquiries.find(e => e.id === enqId);
    if (!enq || !enq.details) return;
    const qId = `Q${String(quoteCounter.current++).padStart(3, "0")}`;
    const q = {
      id: qId, enquiryId: enqId, name: enq.name, channel: enq.channel, suburb: enq.suburb,
      frequency: enq.details.frequency.charAt(0).toUpperCase() + enq.details.frequency.slice(1),
      status: "pending_approval", createdAt: new Date().toISOString(), details: { ...enq.details },
    };
    setQuotes(prev => [q, ...prev]);
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "quote_ready", quoteId: qId } : e));
    showToast(`💰 Quote ${qId} generated — review & approve`);
  };

  const approveQuote = (qId) => {
    // Open email preview modal instead of sending immediately
    const q = quotes.find(q => q.id === qId);
    if (q) {
      const enq = enquiries.find(e => e.id === q.enquiryId);
      setEmailPreview({ quote: q, enquiry: enq });
    }
  };

  const sendQuoteEmail = async () => {
    if (!emailPreview) return;
    
    const { quote, enquiry } = emailPreview;
    const calc = calcQuote(quote.details, pricing);
    
    // Build quote items string
    const quoteItems = calc.items.map(item => 
      `${item.description} × ${item.qty} — $${item.total.toFixed(2)}`
    ).join('<br>');
    
    const templateParams = {
      customer_name: quote.name.split(' ')[0],
      customer_email: enquiry?.details?.email || '',
      frequency: quote.frequency,
      frequency_lower: quote.frequency.toLowerCase(),
      suburb: quote.suburb,
      quote_items: quoteItems,
      total: calc.total.toFixed(2),
      discount: calc.discount > 0 ? calc.discount.toFixed(2) : '',
      to_email: enquiry?.details?.email || '',
    };
    
    setSendingEmail(true);
    
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      // Mark quote as sent
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: "sent" } : q));
      setEnquiries(prev => prev.map(e => e.id === quote.enquiryId ? { ...e, status: "quote_sent" } : e));
      
      setEmailPreview(null);
      showToast(`✅ Quote sent to ${enquiry?.details?.email}!`);
    } catch (error) {
      console.error('Email error:', error);
      showToast(`❌ Failed to send email. Please try again.`);
    } finally {
      setSendingEmail(false);
    }
  };

  const markAccepted = (qId) => {
    setQuotes(prev => prev.map(q => q.id === qId ? { ...q, status: "accepted" } : q));
    const q = quotes.find(q => q.id === qId);
    if (q) {
      setEnquiries(prev => prev.map(e => e.id === q.enquiryId ? { ...e, status: "accepted" } : e));
      setClients(prev => prev.map(c => c.name === q.name ? { ...c, status: "client" } : c));
    }
    showToast(`🎉 Quote accepted — new client!`);
  };

  const declineOutOfArea = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "out_of_area" } : e));
    showToast("📍 Out-of-area reply sent");
  };

  const archiveEnquiry = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, archived: true } : e));
    showToast("📦 Enquiry archived");
  };

  const unarchiveEnquiry = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, archived: false } : e));
    showToast("📤 Enquiry restored");
  };

  const removeEnquiry = (enqId) => {
    if (!window.confirm("Permanently delete this enquiry?")) return;
    setEnquiries(prev => prev.filter(e => e.id !== enqId));
    setQuotes(prev => prev.filter(q => q.enquiryId !== enqId));
    showToast("🗑️ Enquiry removed");
  };

  const addService = (service) => {
    const key = service.label.toLowerCase().replace(/\s+/g, "_");
    setPricing(prev => ({ ...prev, [key]: service }));
    setAddServiceModal(false);
    showToast(`✅ ${service.label} added`);
  };

  const removeService = (key) => {
    if (!window.confirm(`Remove ${pricing[key].label}? This cannot be undone.`)) return;
    setPricing(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    showToast(`🗑️ Service removed`);
  };

  const addTemplate = (template) => {
    const newTemplate = { ...template, id: Date.now().toString(), isDefault: false };
    setTemplates(prev => [...prev, newTemplate]);
    setAddTemplateModal(false);
    showToast(`✅ Template added`);
  };

  const removeTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    showToast(`🗑️ Template removed`);
  };

  const copyTemplate = (content) => {
    navigator.clipboard?.writeText(content);
    showToast("📋 Copied to clipboard!");
  };

  // ─── Filtered Enquiries ───
  const filtered = enquiries.filter(e => {
    // First apply archive filter
    if (filter === "archived") return e.archived;
    if (filter !== "all" && e.archived) return false;
    
    // Then apply status filter
    if (filter === "active") return !e.archived;
    if (filter === "new") return e.status === "new";
    if (filter === "awaiting") return e.status === "info_requested";
    if (filter === "received") return e.status === "info_received";
    if (filter === "quote_ready") return e.status === "quote_ready";
    if (filter === "sent") return e.status === "quote_sent";
    if (filter === "accepted") return e.status === "accepted";
    if (filter === "out") return e.status === "out_of_area";
    return true;
  }).filter(e => {
    // Then apply search
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return e.name.toLowerCase().includes(term) || e.suburb.toLowerCase().includes(term) || e.message.toLowerCase().includes(term);
  });

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const term = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.phone?.includes(term) || c.suburb?.toLowerCase().includes(term);
  });

  const pendingQuotes = quotes.filter(q => q.status === "pending_approval");
  const sentQuotes = quotes.filter(q => q.status === "sent" || q.status === "accepted");
  const archivedCount = enquiries.filter(e => e.archived).length;

  // ─── Sidebar Items ───
  const navItems = [
    { id: "inbox", label: "Inbox", icon: "📥", badge: enquiries.filter(e => !e.archived && ["new", "info_received", "quote_ready"].includes(e.status)).length },
    { id: "quotes", label: "Quotes", icon: "💰", badge: pendingQuotes.length },
    { id: "clients", label: "Clients", icon: "👥", badge: clients.length },
    { id: "templates", label: "Templates", icon: "💬", badge: 0 },
    { id: "form", label: "Customer Form", icon: "📋", badge: 0 },
    { id: "pricing", label: "Pricing", icon: "⚙️", badge: 0 },
  ];

  const formUrl = typeof window !== "undefined" ? window.location.origin + "/form" : "/form";

  // ─── Time Ago ───
  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const roomServices = Object.entries(pricing).filter(([_, v]) => v.category === "room");
  const addonServices = Object.entries(pricing).filter(([_, v]) => v.category === "addon");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* ═══ Mobile Header ═══ */}
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: T.sidebar, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 100 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 8 }}>
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Dust Bunnies</span>
          </div>
          <div style={{ width: 40 }} />
        </div>
      )}

      {/* ═══ Sidebar ═══ */}
      <div style={{
        width: isMobile ? "100%" : 240,
        maxWidth: isMobile ? 280 : 240,
        background: T.sidebar,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: isMobile ? 60 : 0,
        left: isMobile ? (sidebarOpen ? 0 : -300) : 0,
        height: isMobile ? "calc(100vh - 60px)" : "100vh",
        zIndex: 99,
        transition: "left 0.3s ease",
        boxShadow: isMobile && sidebarOpen ? "4px 0 20px rgba(0,0,0,0.3)" : "none",
      }}>
        {!isMobile && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🌿</div>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0 }}>Dust Bunnies</h2>
            <p style={{ color: "#8FBFA8", fontSize: 11, margin: "2px 0 0" }}>Admin Dashboard</p>
          </div>
        )}

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: T.radiusSm,
              background: page === n.id ? "rgba(255,255,255,0.12)" : "transparent",
              border: "none", cursor: "pointer", color: page === n.id ? "#fff" : "#8FBFA8", fontSize: 14, fontWeight: 600,
              textAlign: "left", width: "100%", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge > 0 && (
                <span style={{ background: T.accent, color: T.sidebar, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ Overlay for mobile ═══ */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 98 }} />
      )}

      {/* ═══ Main Content ═══ */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 240,
        marginTop: isMobile ? 60 : 0,
        padding: isMobile ? 16 : 28,
        maxWidth: isMobile ? "100%" : 960,
        width: "100%",
        boxSizing: "border-box",
      }}>

        {/* ─── INBOX PAGE ─── */}
        {page === "inbox" && (
          <>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Inbox</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>{enquiries.filter(e => !e.archived).length} active · {archivedCount} archived</p>
              </div>
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search enquiries..." />
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { id: "active", label: "Active" }, { id: "new", label: "New" }, { id: "awaiting", label: "Awaiting" },
                { id: "received", label: "Received" }, { id: "quote_ready", label: "Quote Ready" },
                { id: "sent", label: "Sent" }, { id: "accepted", label: "Accepted" }, { id: "archived", label: `Archived (${archivedCount})` },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: "6px 12px", borderRadius: 20, border: filter === f.id ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
                  background: filter === f.id ? T.primaryLight : "#fff", color: filter === f.id ? T.primaryDark : T.textMuted,
                  fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Enquiry Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(e => (
                <div key={e.id} style={{
                  background: "#fff", borderRadius: T.radius, padding: isMobile ? "14px 16px" : "18px 20px",
                  boxShadow: T.shadow,
                  borderLeft: e.archived ? `4px solid ${T.textLight}` : e.status === "new" ? `4px solid ${T.blue}` : e.status === "info_received" ? `4px solid ${T.accent}` : "4px solid transparent",
                  opacity: e.archived ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 10 : 14 }}>
                    {/* Avatar */}
                    <div style={{ width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: isMobile ? 12 : 14, flexShrink: 0 }}>
                      {e.avatar}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15, color: T.text }}>{e.name}</span>
                        <ChannelIcon ch={e.channel} size={isMobile ? 12 : 14} />
                        <span style={{ fontSize: 11, color: T.textLight }}>📍 {e.suburb}</span>
                        <span style={{ fontSize: 11, color: T.textLight, marginLeft: "auto" }}>{timeAgo(e.timestamp)}</span>
                      </div>
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{e.message}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <StatusBadge status={e.status} />

                        {/* Contact Info Quick View */}
                        {e.details?.email && (
                          <span style={{ fontSize: 11, color: T.textMuted, display: isMobile ? "none" : "inline" }}>📧 {e.details.email}</span>
                        )}

                        {/* Action Buttons */}
                        {!e.archived && (
                          <>
                            {e.status === "new" && !SERVICED_AREAS.includes(e.suburb) && (
                              <button onClick={() => declineOutOfArea(e.id)} style={actionBtn("#FDF0EF", T.danger)}>📍 Out of Area</button>
                            )}
                            {e.status === "new" && SERVICED_AREAS.includes(e.suburb) && (
                              <button onClick={() => sendInfoForm(e.id)} style={actionBtn(T.blueLight, T.blue)}>📤 Send Form</button>
                            )}
                            {e.status === "info_received" && !e.quoteId && (
                              <button onClick={() => generateQuote(e.id)} style={actionBtn(T.primaryLight, T.primaryDark)}>💰 Quote</button>
                            )}
                            {e.status === "quote_ready" && (
                              <button onClick={() => setPage("quotes")} style={actionBtn(T.primaryLight, T.primaryDark)}>👁️ Review</button>
                            )}
                            {e.details && (
                              <button onClick={() => setSelectedEnquiry(e)} style={actionBtn(T.borderLight, T.textMuted)}>📋 Details</button>
                            )}
                            <button onClick={() => archiveEnquiry(e.id)} style={actionBtn(T.borderLight, T.textMuted)}>📦</button>
                          </>
                        )}
                        {e.archived && (
                          <>
                            <button onClick={() => unarchiveEnquiry(e.id)} style={actionBtn(T.primaryLight, T.primaryDark)}>📤 Restore</button>
                            <button onClick={() => removeEnquiry(e.id)} style={actionBtn("#FDF0EF", T.danger)}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 60, color: T.textLight }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 15 }}>{searchTerm ? "No results found" : "No enquiries match this filter"}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── QUOTES PAGE ─── */}
        {page === "quotes" && (
          <>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Quotes</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>{quotes.length} total quotes</p>

            {/* Pending Approval */}
            {pendingQuotes.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.8 }}>⏳ Pending Your Approval</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                  {pendingQuotes.map(q => {
                    const calc = calcQuote(q.details, pricing);
                    return (
                      <div key={q.id} style={{ background: "#fff", borderRadius: T.radiusLg, padding: isMobile ? "18px 16px" : "24px 28px", boxShadow: T.shadowMd, borderTop: `3px solid ${T.accent}` }}>
                        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 10, marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{q.name}</span>
                            <ChannelIcon ch={q.channel} />
                            <span style={{ fontSize: 12, color: T.textLight }}>📍 {q.suburb}</span>
                          </div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: T.primary }}>${calc.total.toFixed(2)}</div>
                        </div>

                        {/* Line items */}
                        <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "14px 16px", marginBottom: 14, fontSize: 13 }}>
                          {calc.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: T.textMuted }}>
                              <span>{item.description} × {item.qty}</span>
                              <span style={{ fontWeight: 700, color: T.text }}>${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                          {calc.discountLabel && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: T.primaryDark, fontWeight: 700, borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 8 }}>
                              <span>{calc.discountLabel}</span>
                              <span>-${calc.discount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
                          📅 {q.frequency} clean · Quote #{q.id}
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button onClick={() => setEditQuoteModal(q)} style={{ padding: "10px 16px", borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.textMuted }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => setPreviewQuote(q)} style={{ padding: "10px 16px", borderRadius: T.radiusSm, border: `1.5px solid ${T.primary}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.primary }}>
                            👁️ Preview
                          </button>
                          <button onClick={() => approveQuote(q.id)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: "none", background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: "0 2px 8px rgba(74,158,126,0.3)" }}>
                            ✅ Approve & Send
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sent / Accepted Quotes */}
            {sentQuotes.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Sent & Accepted</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sentQuotes.map(q => {
                    const calc = calcQuote(q.details, pricing);
                    return (
                      <div key={q.id} style={{ background: "#fff", borderRadius: T.radius, padding: isMobile ? "14px 16px" : "16px 20px", boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <ChannelIcon ch={q.channel} size={14} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: T.text, minWidth: isMobile ? "auto" : 130 }}>{q.name}</span>
                        {!isMobile && <span style={{ fontSize: 12, color: T.textLight }}>📍 {q.suburb}</span>}
                        <span style={{ fontSize: 12, color: T.textMuted }}>{q.frequency}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: T.primary, marginLeft: "auto" }}>${calc.total.toFixed(2)}</span>
                        <StatusBadge status={q.status} />
                        {q.status === "sent" && (
                          <button onClick={() => markAccepted(q.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#D4EDDA", color: "#155724", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            ✓ Accepted
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {quotes.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: T.textLight }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                <p>No quotes yet — they'll appear when you generate them from the inbox</p>
              </div>
            )}
          </>
        )}

        {/* ─── CLIENTS PAGE ─── */}
        {page === "clients" && (
          <>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Clients</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>{clients.length} contacts</p>
              </div>
              <SearchInput value={clientSearch} onChange={setClientSearch} placeholder="Search name, email, phone..." />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredClients.map(c => (
                <div key={c.id} style={{ background: "#fff", borderRadius: T.radius, padding: isMobile ? "14px 16px" : "18px 20px", boxShadow: T.shadow }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: c.status === "client" ? `linear-gradient(135deg, ${T.primary}, ${T.blue})` : T.border, display: "flex", alignItems: "center", justifyContent: "center", color: c.status === "client" ? "#fff" : T.textMuted, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {c.name?.split(" ").map(n => n[0]).join("") || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>📍 {c.suburb}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      {c.email && (
                        <a href={`mailto:${c.email}`} style={{ color: T.blue, textDecoration: "none" }}>📧 {c.email}</a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} style={{ color: T.primary, textDecoration: "none" }}>📱 {c.phone}</a>
                      )}
                    </div>
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: c.status === "client" ? "#D4EDDA" : T.accentLight,
                      color: c.status === "client" ? "#155724" : "#8B6914",
                    }}>
                      {c.status === "client" ? "Client ✓" : "Lead"}
                    </span>
                  </div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div style={{ textAlign: "center", padding: 60, color: T.textLight }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <p>{clientSearch ? "No results found" : "No clients yet — they'll appear when customers submit the form"}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── TEMPLATES PAGE ─── */}
        {page === "templates" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Message Templates</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>Quick-copy messages for common responses</p>
              </div>
              <button onClick={() => setAddTemplateModal(true)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                + Add Template
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {templates.map(t => (
                <div key={t.id} style={{ background: "#fff", borderRadius: T.radius, padding: isMobile ? "16px" : "20px 24px", boxShadow: T.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{t.name}</span>
                      {t.isDefault && <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: T.blueLight, color: T.blue }}>DEFAULT</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => copyTemplate(t.content)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${T.primary}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.primary }}>
                        📋 Copy
                      </button>
                      {!t.isDefault && (
                        <button onClick={() => removeTemplate(t.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#FDF0EF", cursor: "pointer", fontSize: 12, color: T.danger }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: T.textMuted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{t.content}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: T.blueLight, borderRadius: T.radius, padding: "16px 20px" }}>
              <h4 style={{ margin: "0 0 8px", fontWeight: 700, color: T.blue }}>💡 Tip: Using placeholders</h4>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                Use <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{"{NAME}"}</code> for customer name, <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{"{FREQUENCY}"}</code> for clean frequency, and <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>[FORM LINK]</code> as a reminder to paste your form link.
              </p>
            </div>
          </>
        )}

        {/* ─── CUSTOMER FORM PAGE ─── */}
        {page === "form" && (
          <>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Customer Form</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>This is the form your customers will fill in. Share the link below.</p>

            <div style={{ background: "#fff", borderRadius: T.radiusLg, padding: isMobile ? "20px" : "28px 32px", boxShadow: T.shadowMd, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: T.text }}>📎 Shareable Form Link</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: T.radiusSm, background: T.bg, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.primary, fontWeight: 600, wordBreak: "break-all" }}>
                  {formUrl}
                </div>
                <button onClick={() => { navigator.clipboard?.writeText(formUrl); showToast("📋 Link copied!"); }}
                  style={{ padding: "12px 20px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Copy Link
                </button>
                <a href="/form" target="_blank" rel="noopener noreferrer"
                  style={{ padding: "12px 20px", borderRadius: T.radiusSm, border: `1.5px solid ${T.primary}`, background: "#fff", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Open Form ↗
                </a>
              </div>
            </div>

            <div style={{ background: T.blueLight, borderRadius: T.radius, padding: "20px 24px" }}>
              <h4 style={{ margin: "0 0 8px", fontWeight: 700, color: T.blue }}>How it works</h4>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 2 }}>
                1️⃣ Customer clicks the link (from your auto-reply message)<br />
                2️⃣ They select their suburb first to check we service their area<br />
                3️⃣ They fill in their details, room counts, frequency & add-ons<br />
                4️⃣ Submission appears in your Inbox with status "Info Received"<br />
                5️⃣ You click "Generate Quote" → review → approve & send
              </div>
            </div>
          </>
        )}

        {/* ─── PRICING PAGE ─── */}
        {page === "pricing" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 24, fontWeight: 900, color: T.text }}>Pricing</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>Manage services & prices. Changes update the customer form automatically.</p>
              </div>
              <button onClick={() => setAddServiceModal(true)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                + Add Service
              </button>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Room Pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "140px" : "180px"}, 1fr))`, gap: 12, marginBottom: 28 }}>
              {roomServices.map(([k, v]) => (
                <div key={k} style={{ background: "#fff", borderRadius: T.radius, padding: isMobile ? "16px" : "20px", boxShadow: T.shadow, textAlign: "center", position: "relative" }}>
                  <button onClick={() => removeService(k)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: T.textLight, fontSize: 14 }}>✕</button>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: T.textLight, marginBottom: 10 }}>{v.unit}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: T.primary }}>${v.price}</div>
                  <button onClick={() => setEditPriceModal(k)} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 700, color: T.textMuted, cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Add-on Pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "140px" : "180px"}, 1fr))`, gap: 12, marginBottom: 28 }}>
              {addonServices.map(([k, v]) => (
                <div key={k} style={{ background: "#fff", borderRadius: T.radius, padding: isMobile ? "16px" : "20px", boxShadow: T.shadow, textAlign: "center", position: "relative" }}>
                  <button onClick={() => removeService(k)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: T.textLight, fontSize: 14 }}>✕</button>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: T.textLight, marginBottom: 10 }}>{v.unit}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: T.blue }}>${v.price}</div>
                  <button onClick={() => setEditPriceModal(k)} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 700, color: T.textMuted, cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div style={{ background: T.accentLight, borderRadius: T.radius, padding: "18px 22px" }}>
                <h4 style={{ margin: "0 0 6px", fontWeight: 700, color: "#8B6914" }}>🎉 Weekly Discount</h4>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>10% automatically applied to all weekly bookings</p>
              </div>
              <div style={{ background: T.primaryLight, borderRadius: T.radius, padding: "18px 22px" }}>
                <h4 style={{ margin: "0 0 6px", fontWeight: 700, color: T.primaryDark }}>📍 Service Areas</h4>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>{SERVICED_AREAS.join(", ")}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <Modal title={`${selectedEnquiry.name}'s Details`} onClose={() => setSelectedEnquiry(null)}>
          {selectedEnquiry.details && (
            <>
              {/* Contact Info */}
              <div style={{ background: T.blueLight, borderRadius: T.radiusSm, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 8, textTransform: "uppercase" }}>Contact Info</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedEnquiry.details.email && (
                    <a href={`mailto:${selectedEnquiry.details.email}`} style={{ fontSize: 14, color: T.text, textDecoration: "none" }}>📧 {selectedEnquiry.details.email}</a>
                  )}
                  {selectedEnquiry.details.phone && (
                    <a href={`tel:${selectedEnquiry.details.phone}`} style={{ fontSize: 14, color: T.text, textDecoration: "none" }}>📱 {selectedEnquiry.details.phone}</a>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                {Object.entries({
                  "Bedrooms": selectedEnquiry.details.bedrooms,
                  "Bathrooms": selectedEnquiry.details.bathrooms,
                  "Living Rooms": selectedEnquiry.details.living,
                  "Kitchens": selectedEnquiry.details.kitchen,
                  "Frequency": selectedEnquiry.details.frequency,
                }).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontWeight: 700, color: T.text }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Addons */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Add-ons Selected</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {addonServices.map(([key, service]) => {
                    const isActive = selectedEnquiry.details[key];
                    const qty = service.hasQuantity ? selectedEnquiry.details[`${key}Count`] : null;
                    if (!isActive) return null;
                    return (
                      <span key={key} style={{ padding: "6px 12px", borderRadius: 8, background: T.primaryLight, color: T.primaryDark, fontSize: 12, fontWeight: 600 }}>
                        {service.icon} {service.label}{qty ? ` (${qty})` : ""}
                      </span>
                    );
                  })}
                  {!addonServices.some(([key]) => selectedEnquiry.details[key]) && (
                    <span style={{ color: T.textLight, fontSize: 13 }}>None selected</span>
                  )}
                </div>
              </div>

              {selectedEnquiry.details.notes && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: T.bg, borderRadius: T.radiusSm }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>NOTES</div>
                  <div style={{ fontSize: 13, color: T.text }}>{selectedEnquiry.details.notes}</div>
                </div>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Edit Quote Modal */}
      {editQuoteModal && (
        <EditQuoteModal
          quote={editQuoteModal}
          pricing={pricing}
          onSave={(updated) => {
            setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
            setEditQuoteModal(null);
            showToast("✏️ Quote updated");
          }}
          onClose={() => setEditQuoteModal(null)}
        />
      )}

      {/* Edit Price Modal */}
      {editPriceModal && (
        <EditPriceModal
          serviceKey={editPriceModal}
          pricing={pricing}
          onSave={(key, newPrice) => {
            setPricing(prev => ({ ...prev, [key]: { ...prev[key], price: newPrice } }));
            setEditPriceModal(null);
            showToast(`💰 ${pricing[editPriceModal].label} price updated to $${newPrice}`);
          }}
          onClose={() => setEditPriceModal(null)}
        />
      )}

      {/* Add Service Modal */}
      {addServiceModal && (
        <AddServiceModal
          onSave={addService}
          onClose={() => setAddServiceModal(false)}
        />
      )}

      {/* Add Template Modal */}
      {addTemplateModal && (
        <AddTemplateModal
          onSave={addTemplate}
          onClose={() => setAddTemplateModal(false)}
        />
      )}

      {/* Quote Preview Modal */}
      {previewQuote && (
        <Modal title="Quote Preview" onClose={() => setPreviewQuote(null)} wide>
          <QuotePreviewInline quote={previewQuote} pricing={pricing} />
          <button onClick={() => setPreviewQuote(null)} style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", color: T.textMuted }}>
            Close
          </button>
        </Modal>
      )}

      {/* Email Preview Modal */}
      {emailPreview && (
        <EmailPreviewModal
          quote={emailPreview.quote}
          enquiry={emailPreview.enquiry}
          pricing={pricing}
          onSend={sendQuoteEmail}
          onClose={() => setEmailPreview(null)}
          sending={sendingEmail}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        button:hover:not(:disabled) { opacity: 0.9; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ─── Helper: action button style ───
function actionBtn(bg, color) {
  return {
    padding: "5px 10px", borderRadius: 8, border: "none", background: bg,
    color, fontSize: 11, fontWeight: 700, cursor: "pointer",
  };
}

// ─── Edit Quote Modal Component ───
function EditQuoteModal({ quote, pricing, onSave, onClose }) {
  const [details, setDetails] = useState({ ...quote.details });
  const u = (k, v) => setDetails(prev => ({ ...prev, [k]: v }));
  const calc = calcQuote(details, pricing);

  const roomServices = Object.entries(pricing).filter(([_, v]) => v.category === "room");

  return (
    <Modal title={`Edit Quote — ${quote.name}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {roomServices.map(([k, v]) => (
          <div key={k}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{v.label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <button onClick={() => u(k, Math.max(0, (details[k] || 0) - 1))} style={counterBtn}>−</button>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{details[k] || 0}</span>
              <button onClick={() => u(k, (details[k] || 0) + 1)} style={counterBtnPlus}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Frequency</label>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {["weekly", "fortnightly", "monthly"].map(f => (
            <button key={f} onClick={() => u("frequency", f)} style={{
              padding: "8px 16px", borderRadius: 8, border: details.frequency === f ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
              background: details.frequency === f ? T.primaryLight : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
              color: details.frequency === f ? T.primaryDark : T.textMuted,
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === "weekly" && "(-10%)"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Updated Total: <span style={{ fontSize: 22, color: T.primary }}>${calc.total.toFixed(2)}</span></div>
        {calc.discountLabel && <div style={{ fontSize: 12, color: T.primaryDark }}>Includes {calc.discountLabel}</div>}
      </div>

      <button onClick={() => onSave({ ...quote, details, frequency: details.frequency.charAt(0).toUpperCase() + details.frequency.slice(1) })}
        style={{ width: "100%", padding: "12px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Save Changes
      </button>
    </Modal>
  );
}

const counterBtn = { width: 32, height: 32, borderRadius: 8, border: `1.5px solid #E2EBE6`, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#7A8F85", display: "flex", alignItems: "center", justifyContent: "center" };
const counterBtnPlus = { ...counterBtn, border: `1.5px solid #4A9E7E`, background: "#E8F5EE", color: "#4A9E7E" };

// ─── Edit Price Modal ───
function EditPriceModal({ serviceKey, pricing, onSave, onClose }) {
  const [price, setPrice] = useState(pricing[serviceKey].price);
  return (
    <Modal title={`Edit ${pricing[serviceKey].label} Price`} onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Price ($)</label>
        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0} step={5}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 20, fontWeight: 800, marginTop: 6, color: T.primary }} />
      </div>
      <button onClick={() => onSave(serviceKey, price)}
        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Update Price
      </button>
    </Modal>
  );
}

// ─── Add Service Modal ───
function AddServiceModal({ onSave, onClose }) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState(25);
  const [unit, setUnit] = useState("per room");
  const [icon, setIcon] = useState("🧹");
  const [category, setCategory] = useState("room");
  const [hasQuantity, setHasQuantity] = useState(false);

  const canSave = label.trim() && price > 0;

  return (
    <Modal title="Add New Service" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>SERVICE NAME</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Garage Clean"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14 }} />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>ICON</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ICON_OPTIONS.map(i => (
              <button key={i} onClick={() => setIcon(i)} style={{
                width: 40, height: 40, borderRadius: 8, fontSize: 20, cursor: "pointer",
                border: icon === i ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
                background: icon === i ? T.primaryLight : "#fff",
              }}>{i}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>PRICE ($)</label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 16, fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>UNIT</label>
            <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="per room"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14 }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 8 }}>CATEGORY</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ id: "room", label: "Room (counted)" }, { id: "addon", label: "Add-on (optional)" }].map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                flex: 1, padding: "12px", borderRadius: 8, cursor: "pointer",
                border: category === c.id ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
                background: category === c.id ? T.primaryLight : "#fff",
                fontWeight: 700, fontSize: 13, color: category === c.id ? T.primaryDark : T.textMuted,
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        {category === "addon" && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={hasQuantity} onChange={e => setHasQuantity(e.target.checked)} />
            <span style={{ fontSize: 13, color: T.text }}>Allow quantity selection (e.g. "How many windows?")</span>
          </label>
        )}

        <button onClick={() => canSave && onSave({ label, price, unit, icon, category, hasQuantity: category === "addon" && hasQuantity })}
          disabled={!canSave}
          style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: canSave ? T.primary : T.border,
            color: canSave ? "#fff" : T.textLight,
            fontWeight: 700, fontSize: 14, cursor: canSave ? "pointer" : "not-allowed",
          }}>
          Add Service
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Template Modal ───
function AddTemplateModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const canSave = name.trim() && content.trim();

  return (
    <Modal title="Add Message Template" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>TEMPLATE NAME</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reschedule Request"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14 }} />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 6 }}>MESSAGE CONTENT</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Type your message template here..."
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 14, resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div style={{ background: T.bg, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: T.textMuted }}>
          💡 Use {"{NAME}"} for customer name, {"{FREQUENCY}"} for clean frequency
        </div>

        <button onClick={() => canSave && onSave({ name, content })}
          disabled={!canSave}
          style={{
            width: "100%", padding: "12px", borderRadius: 8, border: "none",
            background: canSave ? T.primary : T.border,
            color: canSave ? "#fff" : T.textLight,
            fontWeight: 700, fontSize: 14, cursor: canSave ? "pointer" : "not-allowed",
          }}>
          Add Template
        </button>
      </div>
    </Modal>
  );
}

// ─── Email Preview Modal ───
function EmailPreviewModal({ quote, enquiry, pricing, onSend, onClose, sending }) {
  const calc = calcQuote(quote.details, pricing);
  const customerEmail = enquiry?.details?.email || 'No email found';
  const customerName = quote.name.split(' ')[0];
  
  return (
    <Modal title="📧 Preview Email" onClose={onClose} wide>
      {/* Email To */}
      <div style={{ background: T.blueLight, borderRadius: T.radiusSm, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: T.textMuted }}>Sending to:</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.blue }}>{customerEmail}</span>
      </div>
      
      {/* Email Preview */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden", marginBottom: 20 }}>
        {/* Email Header */}
        <div style={{ background: T.sidebar, padding: "24px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🌿</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Dust Bunnies Cleaning</div>
          <div style={{ fontSize: 12, color: "#8FBFA8", marginTop: 4 }}>Eco-conscious cleaning · Sunshine Coast</div>
        </div>
        
        <div style={{ background: T.primary, padding: "10px 24px", textAlign: "center" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>YOUR CLEANING QUOTE</span>
        </div>
        
        {/* Email Body */}
        <div style={{ padding: "24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 16, color: T.text }}>
            Hey <strong>{customerName}</strong>! 👋
          </p>
          
          <p style={{ margin: "0 0 20px", fontSize: 14, color: T.textMuted, lineHeight: 1.7 }}>
            Thanks so much for getting in touch! We've put together a personalised quote for your <strong style={{ color: T.text }}>{quote.frequency}</strong> clean in <strong style={{ color: T.text }}>{quote.suburb}</strong>.
          </p>
          
          {/* Quote Summary Box */}
          <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Quote Summary</div>
            {calc.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: T.text }}>
                <span>{item.description} × {item.qty}</span>
                <span style={{ fontWeight: 600 }}>${item.total.toFixed(2)}</span>
              </div>
            ))}
            {calc.discountLabel && (
              <>
                <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: T.primaryDark, fontWeight: 700 }}>
                  <span>🎉 Weekly Discount (10%)</span>
                  <span>-${calc.discount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Total Box */}
          <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, borderRadius: T.radiusSm, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>TOTAL PER CLEAN</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>per {quote.frequency.toLowerCase()} visit</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>${calc.total.toFixed(2)}</div>
          </div>
          
          {/* CTA */}
          <div style={{ background: T.primaryLight, borderRadius: T.radiusSm, padding: "16px 20px", borderLeft: `4px solid ${T.primary}` }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: T.primaryDark }}>Ready to get started? 💚</p>
            <p style={{ margin: 0, fontSize: 13, color: T.text }}>Simply reply to this email and we'll get your first clean booked in!</p>
          </div>
        </div>
        
        {/* Email Footer */}
        <div style={{ background: T.bg, padding: "16px 24px", textAlign: "center", borderTop: `1px solid ${T.border}` }}>
          <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Chat soon! 💚</p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: T.textLight }}>Dust Bunnies Cleaning · Sunshine Coast, QLD</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} disabled={sending} style={{
          flex: 1, padding: "14px", borderRadius: T.radiusSm,
          border: `1.5px solid ${T.border}`, background: "#fff",
          fontWeight: 700, fontSize: 14, cursor: sending ? "not-allowed" : "pointer", color: T.textMuted,
        }}>
          Cancel
        </button>
        <button onClick={onSend} disabled={sending || !enquiry?.details?.email} style={{
          flex: 2, padding: "14px", borderRadius: T.radiusSm, border: "none",
          background: (!enquiry?.details?.email || sending) ? T.border : `linear-gradient(135deg, ${T.primary}, ${T.blue})`,
          fontWeight: 700, fontSize: 14, cursor: (!enquiry?.details?.email || sending) ? "not-allowed" : "pointer", color: "#fff",
          boxShadow: enquiry?.details?.email && !sending ? "0 4px 12px rgba(74,158,126,0.3)" : "none",
        }}>
          {sending ? "Sending..." : `📧 Send to ${customerEmail}`}
        </button>
      </div>
      
      {!enquiry?.details?.email && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "#FDF0EF", borderRadius: T.radiusSm, fontSize: 13, color: T.danger }}>
          ⚠️ No email address found for this customer. Please check the enquiry details.
        </div>
      )}
    </Modal>
  );
}

// ─── Inline Quote Preview ───
function QuotePreviewInline({ quote, pricing }) {
  const calc = calcQuote(quote.details, pricing);

  return (
    <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ background: T.sidebar, padding: "20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🌿 Dust Bunnies Cleaning</div>
        <div style={{ fontSize: 12, color: "#8FBFA8", marginTop: 2 }}>Eco-conscious cleaning | Sunshine Coast</div>
      </div>
      <div style={{ background: T.primary, padding: "8px 24px", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
        <span>CLEANING QUOTE</span><span>#{quote.id}</span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Customer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>Prepared For</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{quote.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{quote.suburb}, Sunshine Coast</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>Frequency</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.primaryDark }}>
              {quote.frequency} {quote.details.frequency === "weekly" && <span style={{ background: T.accentLight, padding: "2px 8px", borderRadius: 8, fontSize: 10, color: "#8B6914" }}>SAVE 10%</span>}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div style={{ borderRadius: T.radiusSm, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ background: T.sidebar, padding: "8px 14px", display: "flex", color: "#fff", fontSize: 11, fontWeight: 700 }}>
            <span style={{ flex: 1 }}>SERVICE</span><span style={{ width: 50, textAlign: "center" }}>QTY</span><span style={{ width: 60, textAlign: "center" }}>UNIT</span><span style={{ width: 70, textAlign: "right" }}>TOTAL</span>
          </div>
          {calc.items.map((item, i) => (
            <div key={i} style={{ padding: "10px 14px", display: "flex", fontSize: 13, background: i % 2 ? T.bg : "#fff", alignItems: "center" }}>
              <span style={{ flex: 1, color: T.text }}>{item.description}</span>
              <span style={{ width: 50, textAlign: "center", color: T.textMuted }}>{item.qty}</span>
              <span style={{ width: 60, textAlign: "center", color: T.textMuted }}>${item.unitPrice}</span>
              <span style={{ width: 70, textAlign: "right", fontWeight: 700, color: T.text }}>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>Subtotal: <span style={{ fontWeight: 700, color: T.text }}>${calc.subtotal.toFixed(2)}</span></div>
          {calc.discountLabel && (
            <div style={{ fontSize: 13, color: T.primaryDark, fontWeight: 700, marginTop: 4 }}>{calc.discountLabel}: -${calc.discount.toFixed(2)}</div>
          )}
        </div>

        <div style={{ background: T.primary, borderRadius: T.radiusSm, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>TOTAL PER CLEAN</span>
          <span style={{ fontSize: 26, fontWeight: 900 }}>${calc.total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: T.textLight }}>Dust Bunnies Cleaning · Sunshine Coast · Eco-conscious 🌿</p>
      </div>
    </div>
  );
}
