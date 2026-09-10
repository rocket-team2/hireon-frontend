import React, { useState } from "react";
import { getCompanyLogoUrl } from "../utils/eligibility";

interface CompanyLogoProps {
  companyName?: string;
  companyUrl?: string;
  logoUrl?: string;
  className?: string;
  size?: number;
}

// Generate consistent background color based on company name
function getLogoColor(name: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }, // Blue
    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" }, // Green
    { bg: "#fef3c7", text: "#b45309", border: "#fde68a" }, // Amber
    { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" }, // Purple
    { bg: "#fce7f3", text: "#be185d", border: "#fbcfe8" }, // Pink
    { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" }, // Sky
    { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }, // Emerald
    { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" }, // Rose
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Extract company initials (e.g. "Tata Consultancy Services" -> "TCS", "Microsoft" -> "MS")
function getInitials(name: string): string {
  if (!name || !name.trim()) return "C";
  const clean = name.trim();
  const words = clean.split(/\s+/);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName = "Company",
  companyUrl,
  logoUrl: customLogoUrl,
  className = "company-logo-img",
  size,
}) => {
  const [errorCount, setErrorCount] = useState(0);

  // Extract clean domain if available
  let domain = "";
  if (companyUrl) {
    try {
      const cleanUrl = companyUrl.startsWith("http") ? companyUrl : `https://${companyUrl}`;
      domain = new URL(cleanUrl).hostname.replace(/^www\./, "");
    } catch {
      // Ignore
    }
  }

  // Construct logo URL candidates
  const primaryUrl = customLogoUrl || getCompanyLogoUrl(companyName, companyUrl);
  const secondaryUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : "";
  const tertiaryUrl = domain ? `https://unavatar.io/${domain}` : "";

  const currentSrc =
    errorCount === 0
      ? primaryUrl
      : errorCount === 1 && secondaryUrl
      ? secondaryUrl
      : errorCount === 2 && tertiaryUrl
      ? tertiaryUrl
      : "";

  if (!currentSrc || errorCount >= 3) {
    const { bg, text, border } = getLogoColor(companyName);
    const initials = getInitials(companyName);
    const style: React.CSSProperties = {
      backgroundColor: bg,
      color: text,
      border: `1px solid ${border}`,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: size ? `${Math.max(10, Math.round(size * 0.38))}px` : "0.85rem",
      borderRadius: "0.5rem",
      width: size ? `${size}px` : "38px",
      height: size ? `${size}px` : "38px",
      flexShrink: 0,
      userSelect: "none",
      letterSpacing: "0.02em",
    };

    return (
      <div className={`company-logo-fallback ${className}`} style={style} title={companyName}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={`${companyName} Logo`}
      className={className}
      style={size ? { width: `${size}px`, height: `${size}px`, objectFit: "contain" } : undefined}
      onError={() => setErrorCount((prev) => prev + 1)}
      loading="lazy"
    />
  );
};

export default CompanyLogo;
