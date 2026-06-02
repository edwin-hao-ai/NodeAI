type BrandMarkProps = {
  /** Rendered pixel size (width = height). */
  size?: number;
  /** Render the dark rounded-square app-icon tile instead of the bare mark. */
  tile?: boolean;
  /** Signature "current node" accent dot color. */
  accent?: string;
  className?: string;
};

/**
 * NodeAI brand mark — "Node Dial".
 *
 * An instrument-style control ring (the model hub) with a single accent node at
 * the top (the currently selected model) and a solid core (NodeAI itself).
 * The bare mark uses `currentColor` so it inherits the surrounding text color;
 * only the signature node keeps the brand accent.
 */
export function BrandMark({
  size = 24,
  tile = false,
  accent = "#6e7bff",
  className,
}: BrandMarkProps) {
  if (tile) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect width="120" height="120" rx="28" fill="#0d0f13" />
        <path
          d="M75.4 33.9 A29 29 0 1 1 44.6 33.9"
          stroke="#f3f1ec"
          strokeWidth="6"
          strokeLinecap="round"
          transform="translate(0,4)"
        />
        <circle cx="60" cy="35" r="4.2" fill={accent} />
        <circle cx="60" cy="64" r="9" fill="#f3f1ec" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M76.06 25.56 A38 38 0 1 1 43.94 25.56"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="60" cy="22" r="5" fill={accent} />
      <circle cx="60" cy="60" r="11" fill="currentColor" />
    </svg>
  );
}
