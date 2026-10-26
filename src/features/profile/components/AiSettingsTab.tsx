"use client";

import {
  Check,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ProviderKey,
  useAiSettings,
} from "@/features/profile/hooks/useAiSettings";
import type { UserAiConfigData } from "@/features/profile/types";
import { RECOMMENDED_MODELS } from "@/lib/ai/constants";
import type { AIProviderType } from "@/lib/ai/types";

interface AiSettingsTabProps {
  initialAiConfig?: UserAiConfigData;
}

const PROVIDER_INFO: Record<
  ProviderKey,
  {
    description: string;
    docsUrl: string;
    keyPlaceholder: string;
    name: string;
  }
> = {
  anthropic: {
    description: "Claude 3.5 Sonnet & Claude 3.5 Haiku",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    name: "Anthropic",
  },
  google: {
    description: "Gemini 1.5 Pro & Gemini 1.5 Flash",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIzaSy...",
    name: "Google Gemini",
  },
  groq: {
    description: "Ultra-fast open weights models (Llama 3.3 70B, etc.)",
    docsUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    name: "Groq",
  },
  openai: {
    description: "GPT-4o & GPT-4o Mini",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-...",
    name: "OpenAI",
  },
};

const PROVIDER_LIST: ProviderKey[] = ["openai", "anthropic", "groq", "google"];

interface ProviderKeyEditFormProps {
  isTesting: boolean;
  keyValue: string;
  onCancel: () => void;
  onKeyChange: (val: string) => void;
  onSave: () => void;
  onTest: () => void;
  onToggleShowKey: () => void;
  provider: ProviderKey;
  showKey: boolean;
}

function ProviderKeyEditForm({
  provider,
  keyValue,
  showKey,
  isTesting,
  onKeyChange,
  onToggleShowKey,
  onCancel,
  onSave,
  onTest,
}: ProviderKeyEditFormProps) {
  const info = PROVIDER_INFO[provider];

  return (
    <div className="mt-2 space-y-3 rounded-md border border-border bg-surface p-3">
      <Label className="font-medium text-xs" htmlFor={`key-input-${provider}`}>
        Enter your {info.name} API Key
      </Label>
      <div className="relative">
        <Input
          className="pr-10 font-mono text-xs"
          id={`key-input-${provider}`}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder={info.keyPlaceholder}
          type={showKey ? "text" : "password"}
          value={keyValue}
        />
        <button
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onToggleShowKey}
          type="button"
        >
          {showKey ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <a
          className="text-primary text-xs hover:underline"
          href={info.docsUrl}
          rel="noreferrer"
          target="_blank"
        >
          Get {info.name} API Key &rarr;
        </a>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} size="sm" type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!keyValue.trim() || isTesting}
            onClick={onTest}
            size="sm"
            type="button"
            variant="outline"
          >
            {isTesting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Test
          </Button>
          <Button
            disabled={!keyValue.trim()}
            onClick={onSave}
            size="sm"
            type="button"
          >
            Save & Encrypt
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ProviderKeyRowProps {
  apiKeyPreview?: string;
  isEditing: boolean;
  isTesting: boolean;
  keyValue: string;
  onCancelEdit: () => void;
  onDeleteKey: () => void;
  onKeyChange: (val: string) => void;
  onSaveKey: () => void;
  onStartEdit: () => void;
  onTestConnection: () => void;
  onToggleShowKey: () => void;
  provider: ProviderKey;
  showKey: boolean;
  testResult?: { error?: string; latencyMs?: number; success: boolean };
}

function ProviderKeyRow({
  provider,
  apiKeyPreview,
  isEditing,
  isTesting,
  keyValue,
  showKey,
  testResult,
  onStartEdit,
  onCancelEdit,
  onKeyChange,
  onToggleShowKey,
  onSaveKey,
  onDeleteKey,
  onTestConnection,
}: ProviderKeyRowProps) {
  const info = PROVIDER_INFO[provider];
  const isConfigured = Boolean(apiKeyPreview);

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-heading text-sm">{info.name}</h4>
            {isConfigured ? (
              <Badge
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs"
                variant="outline"
              >
                <Check className="mr-1 h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge className="text-xs" variant="secondary">
                Not set
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {info.description}
          </p>
          {isConfigured && (
            <p className="mt-1 font-mono text-muted-foreground text-xs">
              Key: {apiKeyPreview}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConfigured && (
            <>
              <Button
                disabled={isTesting}
                onClick={onTestConnection}
                size="sm"
                type="button"
                variant="outline"
              >
                {isTesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Test
              </Button>
              <Button
                className="text-destructive hover:bg-destructive/10"
                onClick={onDeleteKey}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {!isEditing && (
            <Button
              onClick={onStartEdit}
              size="sm"
              type="button"
              variant={isConfigured ? "outline" : "default"}
            >
              {isConfigured ? "Replace" : "Add Key"}
            </Button>
          )}
        </div>
      </div>

      {testResult ? (
        <Alert
          className={
            testResult.success
              ? "border-emerald-500/30 bg-emerald-500/5 py-2 text-xs"
              : "border-destructive/30 bg-destructive/5 py-2 text-xs"
          }
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : null}
            <AlertTitle className="font-semibold text-xs">
              {testResult.success
                ? `Connection verified (${testResult.latencyMs}ms)`
                : "Connection failed"}
            </AlertTitle>
          </div>
          {testResult.error ? (
            <AlertDescription className="mt-1 text-destructive text-xs">
              {testResult.error}
            </AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {isEditing ? (
        <ProviderKeyEditForm
          isTesting={isTesting}
          keyValue={keyValue}
          onCancel={onCancelEdit}
          onKeyChange={onKeyChange}
          onSave={onSaveKey}
          onTest={onTestConnection}
          onToggleShowKey={onToggleShowKey}
          provider={provider}
          showKey={showKey}
        />
      ) : null}
    </div>
  );
}

export function AiSettingsTab({ initialAiConfig }: AiSettingsTabProps) {
  const {
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
  } = useAiSettings({ initialAiConfig });

  const availableModelsForProvider = RECOMMENDED_MODELS.filter((m) =>
    activeProvider === "platform"
      ? m.provider === "groq"
      : m.provider === activeProvider
  );

  return (
    <div className="space-y-6">
      {/* Rate Limits & Daily Quota Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Evaluation Quotas & Rate Limits
              </CardTitle>
            </div>
            {isByok ? (
              <Badge
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                variant="outline"
              >
                <Zap className="mr-1 h-3.5 w-3.5 fill-emerald-500" /> BYOK
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">Platform Free Tier</Badge>
            )}
          </div>
          <CardDescription>
            {isByok
              ? "Your submissions run with your configured API keys with higher throughput and unlimited daily evaluations."
              : "Submissions run on Debug Arena shared platform infrastructure with daily quotas and standard rate limits."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Daily Evaluations
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-bold text-2xl tracking-tight">
                  {quota.used}
                </span>
                <span className="text-muted-foreground text-sm">
                  {isByok ? "/ unlimited" : `/ ${quota.total} today`}
                </span>
              </div>
              {!isByok && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (quota.used / Math.max(1, quota.total)) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Throughput Limit
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-bold text-2xl tracking-tight">
                  {isByok ? "30" : "5"}
                </span>
                <span className="text-muted-foreground text-sm">
                  requests per minute (RPM)
                </span>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                {isByok
                  ? "High-speed evaluation window for custom API keys."
                  : "Shared pool limit to ensure fair access across all users."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Model Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Active AI Evaluator</CardTitle>
          </div>
          <CardDescription>
            Select which provider and model analyzes and grades your challenge
            code fixes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-medium text-xs" htmlFor="provider-select">
              Provider
            </Label>
            <select
              className="mt-1.5 flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              id="provider-select"
              onChange={(e) =>
                handleProviderChange(e.target.value as AIProviderType)
              }
              value={activeProvider}
            >
              <option value="platform">Platform Default (Free Shared)</option>
              <option disabled={!apiKeyMap.has("openai")} value="openai">
                OpenAI {apiKeyMap.has("openai") ? "" : "(Key required)"}
              </option>
              <option disabled={!apiKeyMap.has("anthropic")} value="anthropic">
                Anthropic {apiKeyMap.has("anthropic") ? "" : "(Key required)"}
              </option>
              <option disabled={!apiKeyMap.has("groq")} value="groq">
                Groq {apiKeyMap.has("groq") ? "" : "(Key required)"}
              </option>
              <option disabled={!apiKeyMap.has("google")} value="google">
                Google Gemini {apiKeyMap.has("google") ? "" : "(Key required)"}
              </option>
            </select>
          </div>

          <div>
            <Label className="font-medium text-xs" htmlFor="model-select">
              Model
            </Label>
            <select
              className="mt-1.5 flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              id="model-select"
              onChange={(e) => setActiveModel(e.target.value)}
              value={activeModel}
            >
              {availableModelsForProvider.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.description})
                </option>
              ))}
              {activeProvider !== "platform" && (
                <option value="custom">Custom Model ID...</option>
              )}
            </select>
          </div>

          {activeModel === "custom" && activeProvider !== "platform" && (
            <div>
              <Label className="font-medium text-xs" htmlFor="custom-model">
                Custom Model Identifier
              </Label>
              <Input
                className="mt-1.5"
                id="custom-model"
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. claude-3-7-sonnet-20250219"
                value={customModel}
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              disabled={isSavingSettings}
              onClick={handleSavePreferences}
              type="button"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save AI Preferences"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bring Your Own Key (BYOK) Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">API Keys (BYOK)</CardTitle>
          </div>
          <CardDescription>
            Your API keys are encrypted at rest using AES-256-GCM and never
            leave the server in plaintext.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {PROVIDER_LIST.map((provider) => {
            const savedKey = apiKeyMap.get(provider);
            const isEditing = editingProvider === provider;
            const isTesting = testingProvider === provider;
            const currentInputValue = keyInputs[provider] || "";

            return (
              <ProviderKeyRow
                apiKeyPreview={savedKey?.keyPreview}
                isEditing={isEditing}
                isTesting={isTesting}
                key={provider}
                keyValue={currentInputValue}
                onCancelEdit={() => setEditingProvider(null)}
                onDeleteKey={() => handleDeleteKey(provider)}
                onKeyChange={(val) =>
                  setKeyInputs((prev) => ({ ...prev, [provider]: val }))
                }
                onSaveKey={() => handleSaveKey(provider)}
                onStartEdit={() => {
                  setEditingProvider(provider);
                  setKeyInputs((p) => ({ ...p, [provider]: "" }));
                }}
                onTestConnection={() =>
                  handleTestConnection(
                    provider,
                    isEditing ? currentInputValue : undefined
                  )
                }
                onToggleShowKey={() =>
                  setShowKeys((prev) => ({
                    ...prev,
                    [provider]: !prev[provider],
                  }))
                }
                provider={provider}
                showKey={Boolean(showKeys[provider])}
                testResult={testResults[provider]}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
