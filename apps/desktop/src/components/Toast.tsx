import { useApp } from "../state/AppContext";

export function Toast() {
  const { toast } = useApp();
  return <div className={`toast${toast ? " show" : ""}`}>{toast ?? ""}</div>;
}
