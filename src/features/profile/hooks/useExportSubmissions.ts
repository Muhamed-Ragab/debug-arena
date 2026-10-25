"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { exportSubmissionsAction } from "@/features/profile/actions";
import { EXPORT_MESSAGES } from "@/features/profile/constants";
import type { ExportFormat } from "@/features/profile/types";

export function useExportSubmissions() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(true);
    const toastId = toast.loading(EXPORT_MESSAGES.PREPARING(format));

    try {
      const res = await exportSubmissionsAction({ format });
      if (!(res?.data?.success && res.data.content)) {
        toast.error(EXPORT_MESSAGES.GENERATE_ERROR, {
          id: toastId,
        });
        return;
      }

      const { content, filename, mimeType } = res.data;
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `submissions.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        EXPORT_MESSAGES.SUCCESS(filename || `submissions.${format}`),
        { id: toastId }
      );
    } catch (err) {
      console.error("[useExportSubmissions] Export error:", err);
      toast.error(EXPORT_MESSAGES.ERROR, {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    handleExport,
    isExporting,
  };
}
