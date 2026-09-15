import { useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import CredentialsPage from "./CredentialsPage";
import PersonalCredentialsPanel from "../components/PersonalCredentialsPanel";
import { getUser } from "../services/session.service";

export default function CredentialVaultPage() {
  const user = getUser();
  const canSeeGeneral = user?.role === "ADMIN";
  const [view, setView] = useState<"general" | "personal">(
    canSeeGeneral ? "general" : "personal",
  );
  return (
    <div className="ui-page space-y-5">
      <nav
        aria-label="Secciones de la bóveda"
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-company-surface p-2"
      >
        {canSeeGeneral && (
          <button
            type="button"
            aria-pressed={view === "general"}
            onClick={() => setView("general")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === "general" ? "btn-company-primary" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <KeyRound size={17} />
            Credenciales generales
          </button>
        )}
        <button
          type="button"
          aria-pressed={view === "personal" || !canSeeGeneral}
          onClick={() => setView("personal")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === "personal" || !canSeeGeneral ? "btn-company-primary" : "text-slate-500 hover:bg-slate-100"}`}
        >
          <UserRound size={17} />
          Mis credenciales
        </button>
      </nav>
      {view === "general" && canSeeGeneral ? (
        <CredentialsPage />
      ) : (
        <PersonalCredentialsPanel key={user?.id} />
      )}
    </div>
  );
}
