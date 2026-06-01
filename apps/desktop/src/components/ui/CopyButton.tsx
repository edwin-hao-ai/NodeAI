import { useApp } from "../../state/AppContext";

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function CopyButton({
  text,
  tipKey,
  primary,
}: {
  text: string;
  tipKey?: "tipCopyAddr" | "tipCopyCode" | "tipCopyModel";
  primary?: boolean;
}) {
  const { showToast, tr } = useApp();
  return (
    <button
      type="button"
      className={`icon-btn${primary ? " primary" : ""}`}
      title={tipKey ? tr(tipKey) : undefined}
      onClick={async () => {
        await copyText(text);
        showToast(tr("toastCopied"));
      }}
    >
      <span className="material-symbols-outlined">content_copy</span>
    </button>
  );
}
