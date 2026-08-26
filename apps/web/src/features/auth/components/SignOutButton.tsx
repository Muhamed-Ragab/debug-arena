import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authClient } from "../../../lib/auth-client";

export default function SignOutButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
      onClick={async () => {
        await authClient.signOut();
        navigate("/login");
      }}
    >
      <LogOut size={13} />
    </button>
  );
}
