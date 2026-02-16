import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { PROTOCOLS } from "@/utils/constants";
import { SearchBar, ProtocolIcon } from "@/components/shared";
import { useTheme } from "@/context/ThemeContext";
import type { ProtocolId } from "@/utils/constants";
import Dashboard from "@/pages/Dashboard";
import TransactionDetail from "@/pages/TransactionDetail";
import AddressDetail from "@/pages/AddressDetail";
import ProtocolPage from "@/pages/ProtocolPage";
import TokensPage from "@/pages/TokensPage";
import TokenDetailPage from "@/pages/TokenDetailPage";
import StatsPage from "@/pages/StatsPage";
import LearnPage from "@/pages/LearnPage";
import LearnLessonPage from "@/pages/LearnLessonPage";
import { search } from "@/services/api";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-th-surface border border-bd-primary hover:bg-th-elevated transition-colors"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg className="w-4 h-4 text-tx-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-tx-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function Header() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = async (query: string) => {
    if (query.startsWith("0x") && query.length === 66) {
      navigate(`/tx/${query}`);
    } else if (query.startsWith("0x") && query.length === 42) {
      navigate(`/address/${query}`);
    } else if (/^\d+$/.test(query)) {
      navigate(`/block/${query}`);
    } else {
      try {
        const result = await search(query);
        if (result.redirect) navigate(result.redirect);
      } catch {
        // fallback — stay on page
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-bd-primary bg-th-header backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={theme === "dark" ? "/oec-white.png" : "/oec-black.png"}
            alt="OEC"
            className="w-16 h-auto object-contain"
          />
          <div className="hidden sm:block -ml-1">
            <div className="text-3xl font-bold text-accent-gold tracking-wide">
              splorer
            </div>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Network badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-th-elevated border border-bd-primary">
          <span className="w-2 h-2 rounded-full bg-status-live" style={{ boxShadow: "0 0 6px #22C55E44" }} />
          <span className="text-xs text-tx-tertiary">Sepolia</span>
        </div>
      </div>
    </header>
  );
}

function ProtocolNav() {
  const location = useLocation();

  return (
    <nav className="fixed top-[69px] left-0 right-0 z-40 border-b border-bd-secondary bg-th-subnav backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-md text-base font-bold transition-colors flex-1 text-center ${
            location.pathname === "/"
              ? "bg-oec-gold/15 text-oec-gold border border-oec-gold/30"
              : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
          }`}
        >
          Dashboard
        </Link>
        {(Object.entries(PROTOCOLS) as [ProtocolId, typeof PROTOCOLS[ProtocolId]][]).map(([id, config]) => (
          <Link
            key={id}
            to={`/protocol/${id}`}
            className={`px-3 py-1.5 rounded-md text-base font-bold transition-colors flex items-center justify-center flex-1 ${
              location.pathname === `/protocol/${id}`
                ? "border"
                : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
            }`}
            style={
              location.pathname === `/protocol/${id}`
                ? { backgroundColor: `${config.color}18`, color: config.color, borderColor: `${config.color}30` }
                : undefined
            }
          >
            {config.shortName}
          </Link>
        ))}
        <Link
          to="/tokens"
          className={`px-3 py-1.5 rounded-md text-base font-bold transition-colors flex-1 text-center ${
            location.pathname === "/tokens"
              ? "bg-oec-gold/15 text-oec-gold border border-oec-gold/30"
              : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
          }`}
        >
          Tokens
        </Link>
        <Link
          to="/stats"
          className={`px-3 py-1.5 rounded-md text-base font-bold transition-colors flex-1 text-center ${
            location.pathname === "/stats"
              ? "bg-oec-gold/15 text-oec-gold border border-oec-gold/30"
              : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
          }`}
        >
          Stats
        </Link>
        <Link
          to="/learn"
          className={`px-3 py-1.5 rounded-md text-base font-bold transition-colors flex-1 text-center ${
            location.pathname.startsWith("/learn")
              ? "bg-oec-gold/15 text-oec-gold border border-oec-gold/30"
              : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
          }`}
        >
          Learn
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-th-page">
      <Header />
      <ProtocolNav />
      <main className="max-w-7xl mx-auto px-4 py-6 pt-[134px]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tx/:hash" element={<TransactionDetail />} />
          <Route path="/address/:address" element={<AddressDetail />} />
          <Route path="/protocol/:protocolId" element={<ProtocolPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/token/:address" element={<TokenDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:slug" element={<LearnLessonPage />} />
        </Routes>
      </main>
    </div>
  );
}
