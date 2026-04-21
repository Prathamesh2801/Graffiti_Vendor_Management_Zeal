import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_URL } from "../../../config";

/* ─── Leaflet icon fix ─────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ─── SVG pin icons ────────────────────────────────────────────── */
const makePin = (fill) =>
  L.divIcon({
    className: "",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter></defs>
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.3 12.313 21.5 13.397 22.562a.857.857 0 001.206 0C15.687 35.5 28 23.3 28 14 28 6.268 21.732 0 14 0z"
        fill="${fill}" filter="url(#sh)"/>
      <circle cx="14" cy="14" r="5.5" fill="white" fill-opacity="0.9"/>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  });

const PIN_RED = makePin("#e8420a");
const PIN_GREEN = makePin("#27ae60");

/* ─── Auto-fit bounds ──────────────────────────────────────────── */
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) {
      map.setView(positions[0], 16);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
  }, [positions, map]);
  return null;
}

/* ─── Helpers ──────────────────────────────────────────────────── */
const getCampaignIdFromUrl = () => {
  const hash = window.location.hash;

  const queryString = hash.includes("?") ? hash.split("?")[1] : "";

  return new URLSearchParams(queryString).get("Campaign_ID");
};
const PALETTE = [
  "#e8420a",
  "#0ab8a8",
  "#f7c948",
  "#a62e06",
  "#7b2ff7",
  "#27ae60",
  "#1a1a2e",
];

/* ═══════════════════════════════════════════════════════════════ */
export default function CampaignMap() {
  const [campaignId, setCampaignId] = useState(() => getCampaignIdFromUrl());
  const [inputId, setInputId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile: closed by default
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [imgModal, setImgModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  /* track screen size */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    // desktop sidebar open by default
    if (window.innerWidth >= 768) setSidebarOpen(true);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const urlId = getCampaignIdFromUrl();
      if (urlId) {
        setCampaignId(urlId);
        setInputId(urlId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ── fetch ── */
  const fetchData = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setRecords([]);
    setSelected(null);
    setDrawerOpen(false);
    try {
      const res = await fetch(`${BASE_URL}/map.php?Campaign_ID=${id}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (!data.Status) throw new Error(data.Message || "No records returned");
      setRecords(data.Records || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) fetchData(campaignId);
  }, [campaignId]);

  const handleLoad = (e) => {
    e?.preventDefault?.();
    const t = inputId.trim();
    if (t) {
      setCampaignId(t);
      setInputId("");
    }
  };

  /* ── derived ── */
  const geoRecords = records.filter(
    (r) => r.Location && r.Location !== "Vendor" && r.Location.includes(","),
  );
  const positions = geoRecords.map((r) => r.Location.split(",").map(Number));
  const defaultCenter = positions[0] ?? [19.2226, 72.8312];

  const userGroups = {};
  const userColors = {};
  records.forEach((r) => {
    userGroups[r.User_ID] = (userGroups[r.User_ID] || 0) + 1;
  });
  Object.keys(userGroups).forEach((u, i) => {
    userColors[u] = PALETTE[i % PALETTE.length];
  });

  const stats = {
    total: records.length,
    withImages: records.filter((r) => r.Campaign_Images?.length > 0).length,
    withGPS: geoRecords.length,
    pending: records.filter((r) => r.Status !== "Approved").length,
  };

  /* ── open record ── */
  const openRecord = (rec) => {
    setSelected(rec);
    setDrawerOpen(true);
    if (isMobile) setSidebarOpen(false); // close sidebar on mobile
  };

  /* ── close sidebar on mobile overlay click ── */
  const handleOverlayClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  /* ══════════════════════ STYLES ══════════════════════════════ */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .cm-root {
      font-family: var(--font-body,'Barlow',sans-serif);
      background: var(--color-bg,#f5f4f0);
      color: var(--color-text-primary,#1a1a2e);
      height: 100vh; width: 100vw;
      display: flex; flex-direction: column; overflow: hidden;
    }

    /* ══ HEADER ══ */
    .cm-header {
      background: var(--color-secondary,#1a1a2e);
      border-bottom: 3px solid var(--color-primary,#e8420a);
      height: 56px; flex-shrink: 0;
      display: flex; align-items: center; gap: 10px; padding: 0 14px;
      z-index: 1100; position: relative;
    }
    .cm-logo {
      width: 34px; height: 34px; flex-shrink: 0; border-radius: 8px;
      background: var(--color-primary,#e8420a);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .cm-title {
      font-family: var(--font-display,'Barlow Condensed',sans-serif);
      font-size: 20px; font-weight: 800; color: #fff;
      letter-spacing: .06em; text-transform: uppercase; white-space: nowrap;
    }
    @media(max-width:420px){ .cm-title { font-size:16px; } }
    .cm-cid-badge {
      background: rgba(232,66,10,.2); border: 1px solid rgba(232,66,10,.45);
      color: #f6a080; border-radius: 4px; padding: 2px 8px;
      font-size: 11px; font-family: monospace; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 130px;
    }
    @media(max-width:520px){ .cm-cid-badge { display:none; } }
    .cm-spacer { flex:1; }
    .cm-menu-btn {
      background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
      color: #fff; border-radius: 7px; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; flex-shrink: 0; transition: background .15s;
    }
    .cm-menu-btn:hover { background: rgba(255,255,255,.22); }
    .cm-hform { display:flex; gap:6px; }
    .cm-hinput {
      background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.18);
      border-radius: 7px; color: #fff; padding: 7px 11px;
      font-size: 13px; outline: none; width: 160px; transition: border-color .2s;
    }
    @media(max-width:480px){ .cm-hinput{ width:100px; font-size:12px; } }
    @media(max-width:360px){ .cm-hinput{ width:80px; } }
    .cm-hinput::placeholder { color: rgba(255,255,255,.35); }
    .cm-hinput:focus { border-color: var(--color-primary,#e8420a); }
    .cm-hload {
      background: var(--color-primary,#e8420a); color:#fff;
      border:none; border-radius:7px; padding:7px 13px;
      font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap;
      transition: background .15s, transform .1s;
    }
    .cm-hload:hover  { background:#c83508; }
    .cm-hload:active { transform:scale(.96); }

    /* ══ BODY ══ */
    .cm-body { flex:1; display:flex; overflow:hidden; position:relative; }

    /* ══ MOBILE OVERLAY ══ */
    .cm-overlay {
      display: none;
      position: absolute; inset: 0; z-index: 950;
      background: rgba(0,0,0,.45);
      animation: fadeIn .2s ease;
    }
    .cm-overlay.show { display:block; }
    @media(min-width:768px){ .cm-overlay { display:none !important; } }

    /* ══ SIDEBAR ══ */
    .cm-sidebar {
      width: 300px; flex-shrink: 0;
      background: #fff;
      border-right: 1px solid var(--color-border,rgba(26,26,46,.12));
      display: flex; flex-direction: column; overflow: hidden;
      transition: width .26s cubic-bezier(.4,0,.2,1);
      /* desktop: push map */
    }
    .cm-sidebar.closed { width: 0; }

    /* Mobile: sidebar overlays the map */
    @media(max-width:767px){
      .cm-sidebar {
        position: absolute; left:0; top:0; bottom:0; z-index:960;
        width: 290px; flex-shrink: 0;
        box-shadow: 6px 0 28px rgba(26,26,46,.22);
        transform: translateX(0);
        transition: transform .26s cubic-bezier(.4,0,.2,1);
      }
      .cm-sidebar.closed { transform: translateX(-100%); width: 290px; }
    }

    /* sidebar inner — always keep content rendered but clipped by parent */
    .cm-sidebar-inner {
      width: 300px; flex-shrink: 0;
      display: flex; flex-direction: column; height: 100%;
      min-width: 300px;
    }
    @media(max-width:767px){ .cm-sidebar-inner { width:290px; min-width:290px; } }

    /* ── Tabs ── */
    .cm-tabs { display:flex; border-bottom:1px solid var(--color-border,rgba(26,26,46,.1)); }
    .cm-tab {
      flex:1; padding:10px 6px; font-size:11px; font-weight:700;
      text-transform:uppercase; letter-spacing:.07em;
      color:var(--color-text-muted,#9898aa); cursor:pointer; text-align:center;
      background:none; border:none; border-bottom:2px solid transparent;
      transition: color .15s, border-color .15s;
    }
    .cm-tab.on { color:var(--color-primary,#e8420a); border-bottom-color:var(--color-primary,#e8420a); }
    .cm-tab:hover:not(.on){ color:var(--color-text-secondary,#5a5a72); }

    /* ── Stats ── */
    .cm-stats { padding:14px; overflow-y:auto; flex:1; }
    .cm-sg { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
    .cm-sc {
      background:var(--color-bg,#f5f4f0); border-radius:10px;
      padding:12px 10px; text-align:center;
      border:1px solid var(--color-border,rgba(26,26,46,.08));
    }
    .cm-sn {
      font-family:var(--font-display,'Barlow Condensed',sans-serif);
      font-size:30px; font-weight:800; line-height:1;
    }
    .cm-sl { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted,#9898aa); margin-top:3px; }
    .cm-sh { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--color-text-muted,#9898aa); margin:12px 0 8px; }
    .cm-vr { display:flex; align-items:center; gap:8px; margin-bottom:7px; }
    .cm-vdot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .cm-vname { font-size:12px; font-weight:600; min-width:55px; }
    .cm-vbw { flex:1; background:var(--color-bg,#f5f4f0); border-radius:4px; height:6px; overflow:hidden; }
    .cm-vb  { height:100%; border-radius:4px; transition:width .7s ease; }
    .cm-vc  { font-size:11px; color:var(--color-text-muted,#9898aa); font-family:monospace; min-width:18px; text-align:right; }

    /* ── List ── */
    .cm-lh {
      padding:9px 14px 7px; font-size:10px; font-weight:700;
      text-transform:uppercase; letter-spacing:.1em;
      color:var(--color-text-muted,#9898aa);
      position:sticky; top:0; background:#fff; z-index:2;
      border-bottom:1px solid var(--color-border,rgba(26,26,46,.06));
    }
    .cm-list { flex:1; overflow-y:auto; }
    .cm-ri {
      padding:10px 14px;
      border-bottom:1px solid var(--color-border,rgba(26,26,46,.07));
      cursor:pointer; border-left:3px solid transparent;
      transition:background .12s, border-color .12s;
    }
    .cm-ri:hover { background:var(--color-bg,#f5f4f0); }
    .cm-ri.on { background:var(--color-primary-50,#fdeae3); border-left-color:var(--color-primary,#e8420a); }
    .cm-rt { display:flex; align-items:center; gap:7px; margin-bottom:3px; }
    .cm-rn { font-size:13px; font-weight:600; flex:1; }
    .cm-badge { font-size:10px; border-radius:4px; padding:1px 6px; font-weight:600; white-space:nowrap; }
    .cm-bg  { background:rgba(39,174,96,.12);  color:#27ae60; }
    .cm-bt  { background:rgba(10,184,168,.12); color:#0ab8a8; }
    .cm-bgy { background:rgba(152,152,170,.1); color:#9898aa; }
    .cm-rs  { font-size:11px; color:var(--color-text-muted,#9898aa); margin-top:2px; }

    /* ══ MAP ══ */
    .cm-map { flex:1; position:relative; overflow:hidden; }
    .cm-map .leaflet-container { width:100% !important; height:100% !important; }

    /* Floating sidebar toggle ON the map (mobile) */
    .cm-fab {
      position:absolute; top:12px; left:12px; z-index:800;
      background:var(--color-secondary,#1a1a2e); border:none;
      color:#fff; border-radius:10px;
      width:42px; height:42px;
      box-shadow:0 3px 16px rgba(26,26,46,.3);
      display:flex; align-items:center; justify-content:center;
      font-size:20px; cursor:pointer;
      transition:background .15s, transform .1s;
    }
    .cm-fab:hover  { background:#2d2d4e; }
    .cm-fab:active { transform:scale(.94); }
    /* only visible on mobile */
    @media(min-width:768px){ .cm-fab { display:none; } }

    /* ── Legend ── */
    .cm-legend {
      position:absolute; bottom:76px; right:12px; z-index:800;
      background:#fff; border-radius:10px; padding:10px 13px;
      box-shadow:0 4px 20px rgba(26,26,46,.14);
      border:1px solid var(--color-border,rgba(26,26,46,.1)); font-size:12px;
    }
    @media(max-width:767px){ .cm-legend{ bottom:14px; } }
    .cm-lt { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--color-text-muted,#9898aa); margin-bottom:6px; }
    .cm-lr { display:flex; align-items:center; gap:7px; margin-bottom:4px; }
    .cm-ld { width:11px; height:11px; border-radius:50%; }

    /* ── Popup ── */
    .leaflet-popup-content-wrapper {
      border-radius:10px !important; padding:0 !important;
      overflow:hidden; box-shadow:0 4px 20px rgba(26,26,46,.2) !important;
    }
    .leaflet-popup-content { margin:0 !important; }
    .cm-popup { padding:12px 14px; min-width:155px; }
    .cm-ppname { font-weight:700; font-size:14px; margin-bottom:2px; }
    .cm-ppid   { font-size:10px; color:#999; font-family:monospace; margin-bottom:6px; }
    .cm-ppst   { display:inline-block; font-size:10px; border-radius:4px; padding:2px 7px; margin-bottom:6px; font-weight:600; }
    .cm-ppimg  { font-size:11px; color:#555; margin-top:3px; }
    .cm-ppbtn  {
      margin-top:9px; width:100%;
      background:var(--color-primary,#e8420a); color:#fff;
      border:none; border-radius:6px; padding:7px 0;
      font-size:12px; font-weight:700; cursor:pointer; transition:background .15s;
    }
    .cm-ppbtn:hover { background:#c83508; }

    /* ── Detail Drawer ── */
    .cm-drawer {
      position:absolute; bottom:0; left:0; right:0; z-index:810;
      background:#fff;
      border-top:3px solid var(--color-primary,#e8420a);
      border-radius:16px 16px 0 0;
      box-shadow:0 -6px 36px rgba(26,26,46,.16);
      max-height:54vh; overflow-y:auto;
      transform:translateY(100%);
      transition:transform .28s cubic-bezier(.4,0,.2,1);
    }
    .cm-drawer.open { transform:translateY(0); }
    .cm-dhandle {
      width:40px; height:4px; border-radius:2px;
      background:rgba(26,26,46,.15); margin:10px auto 0; cursor:pointer;
    }
    .cm-dinner { padding:12px 16px 24px; }
    .cm-dhead  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
    .cm-dtitle {
      font-family:var(--font-display,'Barlow Condensed',sans-serif);
      font-size:22px; font-weight:800; text-transform:uppercase;
    }
    .cm-dsub { font-size:11px; color:var(--color-text-muted,#9898aa); font-family:monospace; margin-top:2px; }
    .cm-xbtn {
      background:var(--color-bg,#f5f4f0); border:none; border-radius:50%;
      width:30px; height:30px; display:flex; align-items:center; justify-content:center;
      font-size:15px; cursor:pointer; color:var(--color-text-muted,#9898aa); flex-shrink:0;
      transition:background .15s;
    }
    .cm-xbtn:hover { background:var(--color-bg-secondary,#eceae4); }
    .cm-mgrid {
      display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
      gap:7px; margin-bottom:14px;
    }
    .cm-mcard { background:var(--color-bg,#f5f4f0); border-radius:8px; padding:8px 10px; }
    .cm-mlbl  { font-size:9px; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted,#9898aa); margin-bottom:2px; }
    .cm-mval  { font-size:12px; font-weight:600; word-break:break-all; }

    /* image strip */
    .cm-imgstrip { display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; }
    .cm-imgstrip::-webkit-scrollbar { height:4px; }
    .cm-imgstrip::-webkit-scrollbar-track { background:transparent; }
    .cm-imgstrip::-webkit-scrollbar-thumb { background:rgba(26,26,46,.18); border-radius:2px; }
    .cm-imgcard {
      border-radius:10px; overflow:hidden; flex-shrink:0; width:128px;
      border:1px solid var(--color-border,rgba(26,26,46,.1)); cursor:pointer;
      transition:transform .15s, box-shadow .15s;
    }
    .cm-imgcard:hover { transform:scale(1.04); box-shadow:0 4px 18px rgba(26,26,46,.2); }
    .cm-imgthumb { width:128px; height:88px; object-fit:cover; display:block; }
    .cm-imgfall  {
      width:128px; height:88px;
      background:var(--color-bg-secondary,#eceae4);
      display:flex; align-items:center; justify-content:center; font-size:26px;
    }
    .cm-imginfo { padding:6px 8px; background:#fff; }
    .cm-imgid   { font-size:11px; font-weight:700; }
    .cm-imgby   { font-size:10px; color:var(--color-text-muted,#9898aa); }

    /* ══ CENTER SCREENS ══ */
    .cm-center {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:14px;
      padding:32px 20px; text-align:center;
    }
    .cm-icon { font-size:52px; }
    .cm-ctitle {
      font-family:var(--font-display,'Barlow Condensed',sans-serif);
      font-size:26px; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
    }
    .cm-csub { font-size:14px; color:var(--color-text-secondary,#5a5a72); max-width:340px; line-height:1.6; }
    .cm-bform {
      display:flex; gap:10px; flex-wrap:wrap; justify-content:center;
      background:#fff; border:1px solid var(--color-border,rgba(26,26,46,.1));
      border-radius:14px; padding:20px;
      box-shadow:0 4px 28px rgba(26,26,46,.08); width:100%; max-width:440px;
    }
    .cm-binput {
      flex:1; min-width:150px;
      border:1.5px solid var(--color-border-strong,rgba(26,26,46,.2));
      border-radius:9px; padding:11px 14px;
      font-size:14px; font-family:monospace; outline:none;
      color:var(--color-text-primary,#1a1a2e); transition:border-color .2s;
    }
    .cm-binput:focus { border-color:var(--color-primary,#e8420a); }
    .cm-bbtn {
      background:var(--color-primary,#e8420a); color:#fff;
      border:none; border-radius:9px; padding:11px 22px;
      font-size:14px; font-weight:700; cursor:pointer; transition:background .15s;
    }
    .cm-bbtn:hover { background:#c83508; }
    .cm-spinner {
      width:44px; height:44px;
      border:4px solid var(--color-border,rgba(26,26,46,.1));
      border-top-color:var(--color-primary,#e8420a);
      border-radius:50%; animation:spin .75s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ══ LIGHTBOX ══ */
    .cm-modal {
      position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,.9);
      display:flex; align-items:center; justify-content:center;
      animation:fadeIn .18s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .cm-mimg { max-width:92vw; max-height:88vh; border-radius:10px; box-shadow:0 12px 60px rgba(0,0,0,.6); }
    .cm-mclose {
      position:absolute; top:14px; right:14px;
      background:rgba(255,255,255,.14); border:none; color:#fff;
      border-radius:50%; width:42px; height:42px; font-size:20px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
    }
  `;

  /* ══════════════════════ RENDER ════════════════════════════════ */
  return (
    <>
      <style>{css}</style>

      <div className="cm-root">
        {/* ══ HEADER ══ */}
        <header className="cm-header">
          {/* mobile hamburger — only show when map is loaded */}
          {records.length > 0 && (
            <button
              className="cm-menu-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              title="Toggle sidebar"
              style={{ display: isMobile ? "flex" : "none" }}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}

          <div className="cm-logo">🗺️</div>
          <span className="cm-title">Campaign Map</span>
          {campaignId && <span className="cm-cid-badge">{campaignId}</span>}
          <div className="cm-spacer" />

          {/* desktop sidebar toggle */}
          {records.length > 0 && (
            <button
              className="cm-menu-btn"
              onClick={() => setSidebarOpen((o) => !o)}
              title="Toggle sidebar"
              style={{ display: isMobile ? "none" : "flex" }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          )}

          <form className="cm-hform" onSubmit={handleLoad}>
            <input
              className="cm-hinput"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Campaign ID…"
            />
            <button className="cm-hload" type="submit">
              Load
            </button>
          </form>
        </header>

        {/* ══ NO ID ══ */}
        {!campaignId && (
          <div className="cm-center">
            <div className="cm-icon">🗺️</div>
            <h2 className="cm-ctitle">No Campaign Found</h2>
            <p className="cm-csub">
              Enter a Campaign ID below, or add{" "}
              <code style={{ color: "var(--color-primary,#e8420a)" }}>
                ?Campaign_ID=cmp_xxx
              </code>{" "}
              to the page URL.
            </p>
            <form className="cm-bform" onSubmit={handleLoad}>
              <input
                className="cm-binput"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="e.g. cmp_69df62026e82f"
                autoFocus
              />
              <button className="cm-bbtn" type="submit">
                View Map →
              </button>
            </form>
          </div>
        )}

        {/* ══ LOADING ══ */}
        {campaignId && loading && (
          <div className="cm-center">
            <div className="cm-spinner" />
            <p className="cm-csub">Fetching campaign data…</p>
          </div>
        )}

        {/* ══ ERROR ══ */}
        {campaignId && !loading && error && (
          <div className="cm-center">
            <div className="cm-icon">⚠️</div>
            <h2
              className="cm-ctitle"
              style={{ color: "var(--color-error,#c92a2a)" }}
            >
              Something went wrong
            </h2>
            <p className="cm-csub">{error}</p>
            <button className="cm-bbtn" onClick={() => fetchData(campaignId)}>
              ↻ Try Again
            </button>
          </div>
        )}

        {/* ══ EMPTY ══ */}
        {campaignId && !loading && !error && records.length === 0 && (
          <div className="cm-center">
            <div className="cm-icon">📭</div>
            <h2 className="cm-ctitle">No Records</h2>
            <p className="cm-csub">
              No locations found for <code>{campaignId}</code>.
            </p>
          </div>
        )}

        {/* ══ MAIN VIEW ══ */}
        {campaignId && !loading && !error && records.length > 0 && (
          <div className="cm-body">
            {/* Mobile overlay — tap outside sidebar to close */}
            <div
              className={`cm-overlay${sidebarOpen && isMobile ? " show" : ""}`}
              onClick={handleOverlayClick}
            />

            {/* ── Sidebar ── */}
            <aside className={`cm-sidebar${sidebarOpen ? "" : " closed"}`}>
              <div className="cm-sidebar-inner">
                {/* Close button inside sidebar on mobile */}
                {isMobile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px 0",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--font-display,'Barlow Condensed',sans-serif)",
                        fontSize: 14,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        color: "var(--color-text-muted,#9898aa)",
                      }}
                    >
                      Locations
                    </span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        background: "var(--color-bg,#f5f4f0)",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--color-text-muted,#9898aa)",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Tabs */}
                <div className="cm-tabs">
                  <button
                    className={`cm-tab${activeTab === "list" ? " on" : ""}`}
                    onClick={() => setActiveTab("list")}
                  >
                    📋 Locations
                  </button>
                  <button
                    className={`cm-tab${activeTab === "stats" ? " on" : ""}`}
                    onClick={() => setActiveTab("stats")}
                  >
                    📊 Stats
                  </button>
                </div>

                {/* ── Stats tab ── */}
                {activeTab === "stats" && (
                  <div className="cm-stats">
                    <div className="cm-sg">
                      {[
                        { label: "Total", val: stats.total, color: "#1a1a2e" },
                        {
                          label: "w/ Photos",
                          val: stats.withImages,
                          color: "#27ae60",
                        },
                        {
                          label: "w/ GPS",
                          val: stats.withGPS,
                          color: "#0ab8a8",
                        },
                        {
                          label: "Pending",
                          val: stats.pending,
                          color: "#f7c948",
                        },
                      ].map((s) => (
                        <div className="cm-sc" key={s.label}>
                          <div className="cm-sn" style={{ color: s.color }}>
                            {s.val}
                          </div>
                          <div className="cm-sl">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="cm-sh">By Vendor</div>
                    {Object.entries(userGroups).map(([u, c]) => (
                      <div className="cm-vr" key={u}>
                        <div
                          className="cm-vdot"
                          style={{ background: userColors[u] }}
                        />
                        <span className="cm-vname">{u}</span>
                        <div className="cm-vbw">
                          <div
                            className="cm-vb"
                            style={{
                              width: `${(c / stats.total) * 100}%`,
                              background: userColors[u],
                            }}
                          />
                        </div>
                        <span className="cm-vc">{c}</span>
                      </div>
                    ))}

                    <div className="cm-sh" style={{ marginTop: 16 }}>
                      Photo Status
                    </div>
                    <div className="cm-vr">
                      <div
                        className="cm-vdot"
                        style={{ background: "#27ae60" }}
                      />
                      <span style={{ fontSize: 12 }}>Has photos</span>
                    </div>
                    <div className="cm-vr">
                      <div
                        className="cm-vdot"
                        style={{ background: "#e8420a" }}
                      />
                      <span style={{ fontSize: 12 }}>No photos yet</span>
                    </div>
                  </div>
                )}

                {/* ── List tab ── */}
                {activeTab === "list" && (
                  <>
                    <div className="cm-lh">
                      All Locations ({records.length})
                    </div>
                    <div className="cm-list">
                      {records.map((rec) => {
                        const hasGPS =
                          rec.Location &&
                          rec.Location !== "Vendor" &&
                          rec.Location.includes(",");
                        const hasPics = rec.Campaign_Images?.length > 0;
                        const isOn = selected?.ID === rec.ID;
                        return (
                          <div
                            key={rec.ID}
                            className={`cm-ri${isOn ? " on" : ""}`}
                            onClick={() => openRecord(rec)}
                          >
                            <div className="cm-rt">
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  background: userColors[rec.User_ID],
                                }}
                              />
                              <span className="cm-rn">{rec.User_ID}</span>
                              {hasPics && (
                                <span className="cm-badge cm-bg">
                                  📸 {rec.Campaign_Images.length}
                                </span>
                              )}
                              {hasGPS && (
                                <span className="cm-badge cm-bt">GPS</span>
                              )}
                              {!hasGPS && !hasPics && (
                                <span className="cm-badge cm-bgy">Pending</span>
                              )}
                            </div>
                            <div
                              className="cm-rs"
                              style={{ fontFamily: "monospace" }}
                            >
                              {rec.ID.slice(-10)}
                            </div>
                            <div className="cm-rs" style={{ marginTop: 2 }}>
                              {hasGPS
                                ? `📍 ${rec.Location.split(",")
                                    .map((n) => parseFloat(n).toFixed(4))
                                    .join(", ")}`
                                : `🏪 ${rec.Location}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* ── Map area ── */}
            <div className="cm-map">
              {/* Floating sidebar toggle on map for mobile */}
              <button
                className="cm-fab"
                onClick={() => setSidebarOpen((o) => !o)}
                title="Open sidebar"
              >
                ☰
              </button>

              <MapContainer
                center={defaultCenter}
                zoom={15}
                zoomControl
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {positions.length > 0 && <FitBounds positions={positions} />}

                {geoRecords.map((rec) => {
                  const [lat, lng] = rec.Location.split(",").map(Number);
                  const hasPics = rec.Campaign_Images?.length > 0;
                  return (
                    <Marker
                      key={rec.ID}
                      position={[lat, lng]}
                      icon={hasPics ? PIN_GREEN : PIN_RED}
                      eventHandlers={{ click: () => openRecord(rec) }}
                    >
                      <Popup>
                        <div className="cm-popup">
                          <div className="cm-ppname">{rec.User_ID}</div>
                          <div className="cm-ppid">{rec.ID}</div>
                          <span
                            className="cm-ppst"
                            style={{
                              background:
                                rec.Status === "Approved"
                                  ? "rgba(39,174,96,.13)"
                                  : "rgba(201,42,42,.11)",
                              color:
                                rec.Status === "Approved"
                                  ? "#27ae60"
                                  : "#c92a2a",
                            }}
                          >
                            {rec.Status}
                          </span>
                          {rec.Campaign_Images?.map((img) => (
                            <div className="cm-ppimg" key={img.ID}>
                              📸 Image #{img.ID}
                              {img.Placed_BY ? ` · ${img.Placed_BY}` : ""}
                            </div>
                          ))}
                          {!hasPics && (
                            <div className="cm-ppimg" style={{ color: "#bbb" }}>
                              No images yet
                            </div>
                          )}
                          <button
                            className="cm-ppbtn"
                            onClick={() => openRecord(rec)}
                          >
                            View Details →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Legend */}
              <div className="cm-legend">
                <div className="cm-lt">Photo Status</div>
                <div className="cm-lr">
                  <div className="cm-ld" style={{ background: "#27ae60" }} />
                  <span>Has photos</span>
                </div>
                <div className="cm-lr">
                  <div className="cm-ld" style={{ background: "#e8420a" }} />
                  <span>No photos</span>
                </div>
              </div>

              {/* ── Detail Drawer ── */}
              <div
                className={`cm-drawer${drawerOpen && selected ? " open" : ""}`}
              >
                <div
                  className="cm-dhandle"
                  onClick={() => setDrawerOpen(false)}
                />
                {selected && (
                  <div className="cm-dinner">
                    <div className="cm-dhead">
                      <div>
                        <div className="cm-dtitle">{selected.User_ID}</div>
                        <div className="cm-dsub">{selected.ID}</div>
                      </div>
                      <button
                        className="cm-xbtn"
                        onClick={() => {
                          setDrawerOpen(false);
                          setSelected(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="cm-mgrid">
                      {[
                        { label: "Status", val: selected.Status },
                        { label: "Location", val: selected.Location },
                        { label: "Campaign", val: selected.Campaign_ID },
                        { label: "Updated By", val: selected.Updated_BY },
                        { label: "Updated At", val: selected.Updated_AT },
                      ].map((m) => (
                        <div className="cm-mcard" key={m.label}>
                          <div className="cm-mlbl">{m.label}</div>
                          <div className="cm-mval">{m.val}</div>
                        </div>
                      ))}
                    </div>

                    {selected.Campaign_Images?.length > 0 ? (
                      <>
                        <div className="cm-sh" style={{ marginBottom: 8 }}>
                          Wall Images ({selected.Campaign_Images.length}) · tap
                          to enlarge
                        </div>
                        <div className="cm-imgstrip">
                          {selected.Campaign_Images.map((img) => (
                            <div
                              className="cm-imgcard"
                              key={img.ID}
                              onClick={() =>
                                setImgModal(
                                  `${BASE_URL}/test/${img.Wall_Image}`,
                                )
                              }
                            >
                              <img
                                className="cm-imgthumb"
                                src={`${BASE_URL}/test/${img.Wall_Image}`}
                                alt={`Wall Image ${img.ID}`}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="cm-imgfall"
                                style={{ display: "none" }}
                              >
                                🖼️
                              </div>
                              <div className="cm-imginfo">
                                <div className="cm-imgid">Image #{img.ID}</div>
                                {img.Placed_BY && (
                                  <div className="cm-imgby">
                                    By {img.Placed_BY}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: 10,
                                    marginTop: 2,
                                    color:
                                      img.Status === "Approved"
                                        ? "#27ae60"
                                        : "#9898aa",
                                  }}
                                >
                                  ● {img.Status}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          background: "var(--color-bg,#f5f4f0)",
                          borderRadius: 9,
                          padding: "14px 16px",
                          textAlign: "center",
                          fontSize: 13,
                          color: "var(--color-text-muted,#9898aa)",
                        }}
                      >
                        📷 No images uploaded for this location yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ Image lightbox ══ */}
      {imgModal && (
        <div className="cm-modal" onClick={() => setImgModal(null)}>
          <button className="cm-mclose" onClick={() => setImgModal(null)}>
            ✕
          </button>
          <img
            className="cm-mimg"
            src={imgModal}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}