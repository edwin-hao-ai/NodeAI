import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  sheetClassName?: string;
}

export function Modal({
  open,
  onClose,
  children,
  className = "",
  sheetClassName = "",
}: ModalProps) {
  if (!open) return null;
  return (
    <div
      className={`modal-backdrop open ${className}`.trim()}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-sheet ${sheetClassName}`.trim()} role="dialog">
        {children}
      </div>
    </div>
  );
}
