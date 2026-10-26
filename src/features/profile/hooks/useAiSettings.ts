"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  deleteApiKeyAction,
  saveApiKeyAction,
  testConnectionAction,
  updateAiSettingsAction,
} from "@/features/profile/actions";
import type { UserAiConfigData } from "@/features/profile/types";
import { RECOMMENDED_MODELS } from "@/lib/ai/constants";
import type { AIProviderType } from "@/lib/ai/types";

export type ProviderKey = "groq" | "openai" | "anthropic" | "google";

export interface UseAiSettingsProps {
  initialAiConfig?: UserAiConfigData;
}

export function useAiSettings({ initialAiConfig }: UseAiSettingsProps = {}) {
  const [config, setConfig] = useState<UserAiConfigData>(
    initialAiConfig ?? {
      apiKeys: [],
      dailyQuota: { isByok: false, total: 15, used: 0 },
      settings: {
        activeModel: "openai/gpt-oss-120b",
        activeProvider: "platform",
        customModel: null,
      },
    }
  );

  const [activeProvider, setActiveProvider] = useState<AIProviderType>(
    (config.settings.activeProvider as AIProviderType) || "platform"
  );
  const [activeModel, setActiveModel] = useState<string>(
    config.settings.activeModel || "openai/gpt-oss-120b"
  );
  const [customModel, setCustomModel] = useState<string>(
    config.settings.customModel || ""
  );

  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { error?: string; latencyMs?: number; success: boolean }>
  >({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const apiKeyMap = new Map(config.apiKeys.map((k) => [k.provider, k]));
  const isByok = config.settings.activeProvider !== "platform";
  const quota = config.dailyQuota;

  const handleProviderChange = (nextProvider: AIProviderType) => {
    setActiveProvider(nextProvider);
    if (nextProvider === "platform") {
      setActiveModel("openai/gpt-oss-120b");
      setCustomModel("");
    } else {
      const defaultForNext = RECOMMENDED_MODELS.find(
        (m) => m.provider === nextProvider
      );
      if (defaultForNext) {
        setActiveModel(defaultForNext.id);
      }
    }
  };

  const handleSaveKey = async (provider: ProviderKey) => {
    const rawKey = keyInputs[provider]?.trim();
    if (!rawKey) {
      toast.error("Please enter an API key");
      return;
    }

    try {
      const res = await saveApiKeyAction({ apiKey: rawKey, provider });
      if (res?.data?.success) {
        toast.success("API key encrypted and saved");
        setConfig((prev) => {
          const filtered = prev.apiKeys.filter((k) => k.provider !== provider);
          return {
            ...prev,
            apiKeys: [
              ...filtered,
              {
                createdAt: new Date().toISOString(),
                id: res.data?.id || res.data?.keyPreview || "key",
                keyPreview: res.data?.keyPreview || "sk-...",
                provider,
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        });
        setEditingProvider(null);
        setKeyInputs((prev) => ({ ...prev, [provider]: "" }));
      } else {
        toast.error("Failed to save API key");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save API key"
      );
    }
  };

  const handleDeleteKey = async (provider: ProviderKey) => {
    try {
      const res = await deleteApiKeyAction({ provider });
      if (res?.data?.success) {
        toast.success("API key deleted");
        setConfig((prev) => {
          const isCurrentActive = prev.settings.activeProvider === provider;
          return {
            ...prev,
            apiKeys: prev.apiKeys.filter((k) => k.provider !== provider),
            settings: isCurrentActive
              ? {
                  ...prev.settings,
                  activeModel: "openai/gpt-oss-120b",
                  activeProvider: "platform",
                  customModel: null,
                }
              : prev.settings,
          };
        });
        if (activeProvider === provider) {
          setActiveProvider("platform");
          setActiveModel("openai/gpt-oss-120b");
          setCustomModel("");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete API key"
      );
    }
  };

  const handleTestConnection = async (
    provider: AIProviderType,
    apiKeyOverride?: string
  ) => {
    setTestingProvider(provider);
    try {
      const modelToTest =
        provider === activeProvider
          ? customModel.trim() || activeModel || undefined
          : undefined;
      const res = await testConnectionAction({
        apiKey: apiKeyOverride?.trim(),
        modelId: modelToTest,
        provider,
      });
      if (res?.data) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            error: res.data?.error,
            latencyMs: res.data?.latencyMs,
            success: Boolean(res.data?.success),
          },
        }));
        if (res.data.success) {
          toast.success(
            `Connection verified! Latency: ${res.data.latencyMs}ms`
          );
        } else {
          toast.error(res.data.error || "Connection test failed");
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Connection test failed";
      setTestResults((prev) => ({
        ...prev,
        [provider]: { error: errorMsg, latencyMs: 0, success: false },
      }));
      toast.error(errorMsg);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSavePreferences = async () => {
    if (activeProvider !== "platform" && !apiKeyMap.has(activeProvider)) {
      toast.error(
        `Please add an API key for ${activeProvider} before selecting it.`
      );
      return;
    }

    setIsSavingSettings(true);
    try {
      const finalModel =
        activeModel === "custom"
          ? customModel.trim() || activeModel
          : activeModel;
      const res = await updateAiSettingsAction({
        activeModel: finalModel,
        activeProvider,
        customModel:
          activeModel === "custom" ? customModel.trim() || null : null,
      });

      if (res?.data?.success) {
        toast.success("AI preferences updated successfully");
        const nextIsByok = activeProvider !== "platform";
        setConfig((prev) => ({
          ...prev,
          dailyQuota: {
            ...prev.dailyQuota,
            isByok: nextIsByok,
            total: nextIsByok ? -1 : 15,
          },
          settings: {
            ...prev.settings,
            activeModel: finalModel,
            activeProvider,
            customModel:
              activeModel === "custom" ? customModel.trim() || null : null,
          },
        }));
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update AI preferences"
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  return {
    activeModel,
    activeProvider,
    apiKeyMap,
    customModel,
    editingProvider,
    handleDeleteKey,
    handleProviderChange,
    handleSaveKey,
    handleSavePreferences,
    handleTestConnection,
    isByok,
    isSavingSettings,
    keyInputs,
    quota,
    setActiveModel,
    setCustomModel,
    setEditingProvider,
    setKeyInputs,
    setShowKeys,
    showKeys,
    testingProvider,
    testResults,
  };
}
