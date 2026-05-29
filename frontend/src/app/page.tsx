"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../i18n/config";
import JobDrawer, { Job } from "../components/JobDrawer";
import PostJobModal from "../components/PostJobModal";

// Pre-flight database mock set (Purging emojis, applying telemetry formats, zero orphans config)
const initialJobs: Job[] = [
  {
    id: "solidity-architect",
    title: "Senior Solidity Architect",
    company: "DeFi Syndicate",
    tags: ["Solidity", "Smart Contracts", "Security", "Ethereum"],
    salary: "$140k - $200k + Equity",
    description:
      "We are seeking an elite Smart Contract Architect to lead development of our next-generation AMM. You will design, build, test and audit Solidity protocol components.\n\nRequired Skills:\n- 4+ years of Solidity Smart Contract architecture\n- Strong understanding of EVM assembly (Yul)\n- Prior audit participation records\n- Excellent knowledge of lending/borrowing logic.",
    apply_url: "https://remoteweb3.com/apply/solidity-architect",
    timeAgo: "2 hours ago",
  },
  {
    id: "rust-zkp-expert",
    title: "Rust & ZK-Proofs Engineer",
    company: "ZKLabs DAO",
    tags: ["Rust", "ZK-Proofs", "Cryptography", "WASM"],
    salary: "$180k - $240k + Tokens",
    description:
      "Join our research team scaling Ethereum rollups using Zero-Knowledge proofs. You will research, design, and deploy arithmetic circuits and Rust cryptographic primitives.\n\nRequired Skills:\n- 3+ years writing professional Rust core architectures\n- Experience with PlonK, Halo2 or Groth16 circuits\n- Background in mathematical systems and WebAssembly engines.",
    apply_url: "https://remoteweb3.com/apply/rust-zkp",
    timeAgo: "4 hours ago",
  },
  {
    id: "lead-dapp-engineer",
    title: "Lead Front-End DApp Engineer",
    company: "HyperState Protocol",
    tags: ["React", "Next.js", "Ethers.js", "TypeScript"],
    salary: "$120k - $165k",
    description:
      "Help us build the most performant DeFi frontend dashboard in the world. You will work with React, Next.js App Router, Tailwind, and Ethers.js/Viem library interfaces.\n\nRequired Skills:\n- Expert level familiarity with React and state paradigms\n- Mastery of responsive layout architectures\n- Familiarity with web3 modal bindings and wallet connector paradigms.",
    apply_url: "https://remoteweb3.com/apply/lead-dapp",
    timeAgo: "1 day ago",
  },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Dynamic drawer and post modal triggers
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // API sync
  useEffect(() => {
    fetch("http://localhost:6002/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs && data.jobs.length > 0) {
          const formatted = data.jobs.map((j: any) => ({
            ...j,
            id: String(j.id),
            tags: typeof j.tags === "string" ? j.tags.split(",") : j.tags,
            timeAgo: j.created_at ? "Recently Sourced" : "2 hours ago",
          }));
          setJobs(formatted);
        }
      })
      .catch((err) =>
        console.log(
          "Backend connection offline. Displaying modular telemetry.",
        ),
      );
  }, []);

  // Custom event listener for triggering post modal from Header links
  useEffect(() => {
    const handleOpenModal = () => setIsPostModalOpen(true);
    window.addEventListener("open-post-modal", handleOpenModal);
    return () => window.removeEventListener("open-post-modal", handleOpenModal);
  }, []);

  // Filter computation
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag ? job.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  // Helper to dynamically assign desaturated spot pastels (Minimalist-Skill Rule 4)
  const getTagClass = (tag: string) => {
    const t = tag.toLowerCase();
    if (t === "solidity" || t === "ethereum" || t === "evm")
      return "tag-solidity";
    if (t === "rust" || t === "zk-proofs" || t === "cryptography")
      return "tag-rust";
    if (t === "react" || t === "next.js" || t === "typescript")
      return "tag-frontend";
    return "tag-neutral";
  };

  // Bilingual time helper to keep typography pristine
  const formatTimeAgo = (timeAgo: string) => {
    if (i18n.language === "zh") {
      return timeAgo
        .replace("2 hours ago", "2 小时前")
        .replace("4 hours ago", "4 小时前")
        .replace("1 day ago", "1 天前")
        .replace("Recently Sourced", "刚刚获取");
    }
    return timeAgo;
  };

  // Collect all unique tags from jobs for the tag cloud
  const allTags = Array.from(new Set(jobs.flatMap((job) => job.tags)));

  // Handle tag click — set as filter
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        marginTop: "0.5rem",
      }}
    >
      {/* ── Compact Hero: Title + Subtitle inline ── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: "1.5rem",
          paddingBottom: "0.5rem",
          gap: "0.5rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
          }}
        >
          {t("hero.title")}{" "}
          <span className="gradient-text" style={{ fontWeight: 800 }}>
            {t("hero.titleSpan")}
          </span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
            maxWidth: "480px",
          }}
        >
          {t("hero.subtitle")}
        </p>
      </section>

      {/* ── Prominent Web3 Search Area ── */}
      <section
        style={{
          position: "relative",
          padding: "3.5rem 2rem",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, rgba(5,5,7,0.9) 0%, rgba(10,12,16,0.95) 100%)",
          border: "1px solid rgba(0, 242, 254, 0.15)",
          boxShadow:
            "0 0 40px rgba(0, 242, 254, 0.05), inset 0 0 20px rgba(0, 242, 254, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Cool Web3 Background Effects */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "120%",
            height: "200%",
            background:
              "radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div className="hero-particle-field" style={{ opacity: 0.6 }} />

        {/* Search Input Container */}
        <div
          className="search-scan-wrapper"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "800px",
            zIndex: 2,
          }}
        >
          <input
            type="text"
            className="form-input neon-border"
            placeholder={t("feed.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "3.5rem",
              paddingRight: "3rem",
              fontFamily: "var(--font-sans)",
              fontSize: "1.25rem",
              height: "70px",
              borderRadius: "16px",
              backgroundColor: "rgba(5, 5, 7, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0, 242, 254, 0.3)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "1.25rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--accent-cyan)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "1.25rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                padding: "0.4rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
                zIndex: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L11 11M1 11L11 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tags Below */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1.5rem",
            maxWidth: "900px",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginRight: "0.5rem",
            }}
          >
            [ {i18n.language === "zh" ? "热门标签" : "POPULAR_TAGS"} ]
          </span>

          <button
            onClick={() => setSelectedTag(null)}
            className={!selectedTag ? "tag-active-cyan" : ""}
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "var(--radius-pill)",
              fontSize: "0.65rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: !selectedTag
                ? "var(--accent-cyan)"
                : "var(--text-secondary)",
              backgroundColor: !selectedTag
                ? "rgba(0, 242, 254, 0.08)"
                : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${!selectedTag ? "rgba(0, 242, 254, 0.3)" : "var(--border-light)"}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {i18n.language === "zh" ? "全部" : "ALL"}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`tag-pulse-hover ${selectedTag === tag ? "tag-active-cyan" : ""}`}
              style={{
                padding: "0.2rem 0.6rem",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.65rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color:
                  selectedTag === tag
                    ? "var(--accent-cyan)"
                    : "var(--text-secondary)",
                backgroundColor:
                  selectedTag === tag
                    ? "rgba(0, 242, 254, 0.08)"
                    : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${selectedTag === tag ? "rgba(0, 242, 254, 0.3)" : "var(--border-light)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Bento Grid: Concentric double-bezels and crosshair corners */}
      <div
        className="bento-grid"
        style={{ gridAutoRows: "minmax(140px, auto)" }}
      >
        {/* Card 1: EVM Solidity (span 4, index 1) */}
        <div
          onClick={() =>
            setSelectedTag(selectedTag === "Solidity" ? null : "Solidity")
          }
          className="double-bezel-shell stagger-load"
          style={
            {
              gridColumn: "span 4",
              cursor: "pointer",
              borderColor:
                selectedTag === "Solidity"
                  ? "var(--accent-cyan)"
                  : "var(--border-light)",
              boxShadow:
                selectedTag === "Solidity"
                  ? "0 0 20px rgba(0, 242, 254, 0.18)"
                  : "none",
              "--index": 1,
            } as React.CSSProperties
          }
        >
          <div className="double-bezel-core">
            <span className="tactical-crosshair tl">+</span>
            <span className="tactical-crosshair tr">+</span>
            <span className="tactical-crosshair bl">+</span>
            <span className="tactical-crosshair br">+</span>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span
                className="telemetry-label"
                style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
              >
                [EVM_01]
              </span>
            </div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#fff",
                textWrap: "balance",
              }}
            >
              {t("bento.evmTitle")}
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginTop: "0.2rem",
                lineHeight: 1.4,
              }}
            >
              {t("bento.evmDesc")}
            </p>
          </div>
        </div>

        {/* Card 2: Rust & ZK (span 8, index 2) */}
        <div
          onClick={() => setSelectedTag(selectedTag === "Rust" ? null : "Rust")}
          className="double-bezel-shell stagger-load"
          style={
            {
              gridColumn: "span 8",
              cursor: "pointer",
              borderColor:
                selectedTag === "Rust" ? "#f97316" : "var(--border-light)",
              boxShadow:
                selectedTag === "Rust"
                  ? "0 0 20px rgba(249, 115, 22, 0.18)"
                  : "none",
              "--index": 2,
            } as React.CSSProperties
          }
        >
          <div
            className="double-bezel-core"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-secondary) 70%, rgba(249, 115, 22, 0.01) 100%)",
            }}
          >
            <span className="tactical-crosshair tl">+</span>
            <span className="tactical-crosshair tr">+</span>
            <span className="tactical-crosshair bl">+</span>
            <span className="tactical-crosshair br">+</span>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f97316"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="18" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="8.12" y1="8.12" x2="9.88" y2="9.88"></line>
                <line x1="14.12" y1="14.12" x2="15.88" y2="15.88"></line>
                <line x1="15.88" y1="8.12" x2="14.12" y2="9.88"></line>
                <line x1="9.88" y1="14.12" x2="8.12" y2="15.88"></line>
              </svg>
              <span
                className="telemetry-label"
                style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
              >
                [ZKP_02]
              </span>
            </div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#fff",
                textWrap: "balance",
              }}
            >
              {t("bento.rustTitle")}
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginTop: "0.2rem",
                lineHeight: 1.4,
              }}
            >
              {t("bento.rustDesc")}
            </p>
          </div>
        </div>

        {/* Card 3: DApp Frontends (span 8, index 3) */}
        <div
          onClick={() =>
            setSelectedTag(selectedTag === "React" ? null : "React")
          }
          className="double-bezel-shell stagger-load"
          style={
            {
              gridColumn: "span 8",
              cursor: "pointer",
              borderColor:
                selectedTag === "React"
                  ? "var(--accent-cyan)"
                  : "var(--border-light)",
              boxShadow:
                selectedTag === "React"
                  ? "0 0 20px rgba(0, 242, 254, 0.18)"
                  : "none",
              "--index": 3,
            } as React.CSSProperties
          }
        >
          <div
            className="double-bezel-core"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-secondary) 70%, rgba(0, 242, 254, 0.01) 100%)",
            }}
          >
            <span className="tactical-crosshair tl">+</span>
            <span className="tactical-crosshair tr">+</span>
            <span className="tactical-crosshair bl">+</span>
            <span className="tactical-crosshair br">+</span>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span
                className="telemetry-label"
                style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
              >
                [DAP_03]
              </span>
            </div>
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#fff",
                textWrap: "balance",
              }}
            >
              {t("bento.dappTitle")}
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginTop: "0.2rem",
                lineHeight: 1.4,
              }}
            >
              {t("bento.dappDesc")}
            </p>
          </div>
        </div>

        {/* Card 4: Stats Tile (span 4, index 4) */}
        <div
          onClick={() => setSelectedTag(null)}
          className="double-bezel-shell stagger-load"
          style={
            {
              gridColumn: "span 4",
              cursor: "pointer",
              borderColor: !selectedTag
                ? "var(--accent-cyan)"
                : "var(--border-light)",
              boxShadow: !selectedTag
                ? "0 0 20px rgba(0, 242, 254, 0.15)"
                : "none",
              "--index": 4,
            } as React.CSSProperties
          }
        >
          <div
            className="double-bezel-core"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span className="tactical-crosshair tl">+</span>
            <span className="tactical-crosshair tr">+</span>
            <span className="tactical-crosshair bl">+</span>
            <span className="tactical-crosshair br">+</span>

            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}
              className="accent-glow-text"
            >
              {jobs.length} {t("bento.stats")}
            </span>
            <span
              className="telemetry-label"
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                marginTop: "0.3rem",
              }}
            >
              {t("bento.statsLabel")}
            </span>
          </div>
        </div>

        {/* 4. STATEFUL LISTING FEED INDEX (Highlighting Search and Job Cards) */}
        <section
          id="job-search-feed"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            scrollMarginTop: "100px",
          }}
        >
          {/* Header Telemetry for Feed */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <span
                className="telemetry-label"
                style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}
              >
                [SEC_03 // FEED_DECRYPT]
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  color: "#fff",
                  marginTop: "0.2rem",
                }}
              >
                {t("feed.title")}
              </h2>
            </div>
            <span
              className="telemetry-label"
              style={{ fontSize: "0.65rem", color: "var(--accent-cyan)" }}
            >
              {t("feed.showing", { count: filteredJobs.length })}
            </span>
          </div>

          {/* Double-Bezel Concentric Job Listings (Highlighting Core Job Cards) */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}
          >
            {filteredJobs.length === 0 ? (
              <div
                className="double-bezel-shell"
                style={{ borderStyle: "dashed" }}
              >
                <div
                  className="double-bezel-core"
                  style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}
                >
                  <span
                    className="telemetry-label"
                    style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                  >
                    {t("feed.empty")}
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    }}
                    className="telemetry-label"
                    style={{
                      color: "var(--accent-cyan)",
                      marginTop: "0.75rem",
                      display: "block",
                      margin: "0.75rem auto 0 auto",
                      cursor: "pointer",
                    }}
                  >
                    {t("feed.reload")}
                  </button>
                </div>
              </div>
            ) : (
              filteredJobs.map((job, idx) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="double-bezel-shell stagger-load job-card-glow"
                  style={
                    {
                      cursor: "pointer",
                      borderColor: "var(--border-light)",
                      "--index": idx + 6,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="double-bezel-core"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1.5rem",
                      padding: "1.25rem 1.5rem",
                    }}
                  >
                    {/* Left Column (Brand, Newsreader Title, desaturated Pastels) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        flex: "1 1 300px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className="telemetry-label"
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--accent-cyan)",
                            fontWeight: 700,
                          }}
                        >
                          [{job.company.toUpperCase()}]
                        </span>
                        {job.source && job.source !== "manual" && (
                          <span
                            className="telemetry-label"
                            style={{
                              fontSize: "0.55rem",
                              color: "var(--accent-purple)",
                              fontWeight: 600,
                            }}
                          >
                            [ 来源: {job.source} ]
                          </span>
                        )}
                        <span
                          className="telemetry-label"
                          style={{
                            fontSize: "0.55rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          [ {t("card.status")} ]
                        </span>
                      </div>

                      <h3
                        className="editorial-title"
                        style={{
                          fontSize: "1.35rem",
                          color: "#fff",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {job.title}
                      </h3>

                      {/* Spot Pastels Tags */}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                          marginTop: "0.2rem",
                        }}
                      >
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`${getTagClass(tag)} tag-pulse-hover`}
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "3px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              letterSpacing: "0.2px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Column (Space Mono salary telemetry + direct interactive vector trigger) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1.5rem",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        flex: "0 1 auto",
                        marginLeft: "auto",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          textAlign: "right",
                          gap: "0.15rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#fff",
                            fontSize: "0.9rem",
                            fontFamily: "var(--font-mono)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {job.salary || t("card.retainer")}
                        </span>
                        <span
                          className="telemetry-label"
                          style={{
                            fontSize: "0.6rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          [{formatTimeAgo(job.timeAgo).toUpperCase()}]
                        </span>
                      </div>

                      {/* Highly responsive spring gateway trigger (Vercel Guidelines - 44px tap area) */}
                      <div
                        className="btn-primary"
                        style={{
                          padding: "0.5rem 1rem",
                          minHeight: "44px",
                          minWidth: "44px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#030406",
                          background: "var(--accent-cyan)",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Slide-in Detail Drawer */}
        <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />

        {/* Post Job Overlay Modal */}
        {isPostModalOpen && (
          <PostJobModal
            onClose={() => setIsPostModalOpen(false)}
            onSubmitSuccess={(newJob) => {
              setJobs((prev) => [newJob, ...prev]);
              const feedEl = document.getElementById("job-search-feed");
              if (feedEl) feedEl.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}
      </div>
    </div>
  );
}
