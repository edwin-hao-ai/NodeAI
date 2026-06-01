export function Switch({
  on,
  onToggle,
  ariaLabel,
  disabled,
}: {
  on: boolean;
  onToggle?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`switch${on ? " on" : ""}`}
      aria-pressed={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
    />
  );
}
