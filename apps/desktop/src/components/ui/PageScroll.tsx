import type { ReactNode } from "react";

export function PageScroll({ children }: { children: ReactNode }) {
  return <div className="page-scroll">{children}</div>;
}

export function PageHead({
  title,
  subtitle,
  compact,
  extra,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className={`page-head${compact ? " compact" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h1>{title}</h1>
        {extra}
      </div>
      {subtitle && !compact && <p>{subtitle}</p>}
    </div>
  );
}
