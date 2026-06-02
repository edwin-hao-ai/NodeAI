import type { ReactNode } from "react";
import { AddAppModal } from "./components/AddAppModal";
import { BrandMark } from "./components/BrandMark";
import { CelebrateModal } from "./components/CelebrateModal";
import { ModelCatalogModal } from "./components/ModelCatalogModal";
import { SourceModal } from "./components/SourceModal";
import { Menubar } from "./components/Menubar";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { AppProvider, useApp, type ViewId } from "./state/AppContext";
import { ChatProvider } from "./state/ChatContext";
import { AuthView } from "./views/AuthView";
import { BillingView } from "./views/BillingView";
import { ChatView } from "./views/ChatView";
import { GatewayView } from "./views/GatewayView";
import { HubView } from "./views/HubView";
import { MemoryView } from "./views/MemoryView";
import { ModelsView } from "./views/ModelsView";
import { PlanView } from "./views/PlanView";
import { SettingsView } from "./views/SettingsView";
import { SourcesView } from "./views/SourcesView";
import "./styles/app.css";

function MainViews() {
  const { view } = useApp();

  const panels: { id: ViewId; content: ReactNode }[] = [
    { id: "models", content: <ModelsView /> },
    { id: "chat", content: <ChatView /> },
    { id: "hub", content: <HubView /> },
    { id: "gateway", content: <GatewayView /> },
    { id: "memory", content: <MemoryView /> },
    { id: "sources", content: <SourcesView /> },
    { id: "billing", content: <BillingView /> },
    { id: "plan", content: <PlanView /> },
    { id: "settings", content: <SettingsView /> },
    { id: "auth", content: null },
  ];

  return (
    <div className="main">
      {panels.map(({ id, content }) => (
        <section
          key={id}
          className={`view-panel${view === id ? " active" : ""}`}
          aria-hidden={view !== id}
        >
          {content}
        </section>
      ))}
    </div>
  );
}

function AppShell() {
  const {
    view,
    catalogOpen,
    setCatalogOpen,
    addAppOpen,
    setAddAppOpen,
    sourceModalOpen,
    setSourceModalOpen,
    celebrateOpen,
    hideCelebrate,
  } = useApp();

  if (view === "auth") {
    return (
      <>
        <AuthView />
        <Toast />
      </>
    );
  }

  return (
    <>
      <Menubar />
      <div className="scene">
        <div className="app-window">
          <div className="titlebar">
            <div className="traffic-lights">
              <span className="tl-red" />
              <span className="tl-yellow" />
              <span className="tl-green" />
            </div>
            <div className="titlebar-title">
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <BrandMark size={13} />
                NodeAI
              </span>
            </div>
          </div>
          <div className="window-body">
            <Sidebar />
            <MainViews />
          </div>
        </div>
      </div>
      <ModelCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <AddAppModal open={addAppOpen} onClose={() => setAddAppOpen(false)} />
      <SourceModal open={sourceModalOpen} onClose={() => setSourceModalOpen(false)} />
      <CelebrateModal open={celebrateOpen} onClose={hideCelebrate} />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </AppProvider>
  );
}
