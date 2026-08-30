import { ShieldAlert } from "lucide-react";
import { useExtracted } from "next-intl";

export function AdminReadOnlyBanner() {
  const t = useExtracted();
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30"
      role="status"
    >
      <ShieldAlert
        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
        size={18}
      />
      <div className="flex flex-col">
        <p className="font-semibold text-amber-900 text-sm dark:text-amber-100">
          {t("Read-only mode")}
        </p>
        <p className="mt-1 text-amber-800 text-sm leading-relaxed dark:text-amber-200">
          {t(
            "Admins can browse challenges in read-only mode. Submissions are disabled for admin accounts."
          )}
        </p>
      </div>
    </div>
  );
}
