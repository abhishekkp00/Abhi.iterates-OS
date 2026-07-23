import { useState, useEffect } from 'react'
import {
  useAdminSettingsQuery,
  useUpdateSettingsMutation,
} from '@/features/admin/hooks/useAdmin'
import {
  Loader2,
  Settings,
  AlertTriangle,
  Bot,
  ShoppingBag,
  Cpu,
  Lock,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

export default function AdminSettings() {
  const { data: currentSettings, isLoading } = useAdminSettingsQuery()
  const saveMutation = useUpdateSettingsMutation()

  // Internal states
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [enableAiAssistant, setEnableAiAssistant] = useState(true)
  const [marketplaceAutoApprove, setMarketplaceAutoApprove] = useState(true)
  const [maxTokensPerSession, setMaxTokensPerSession] = useState(2000)
  const [apiKeyConfig, setApiKeyConfig] = useState('')

  // Sync internal state with loaded API settings
  useEffect(() => {
    if (currentSettings) {
      setMaintenanceMode(currentSettings.maintenanceMode)
      setEnableAiAssistant(currentSettings.enableAiAssistant)
      setMarketplaceAutoApprove(currentSettings.marketplaceAutoApprove)
      setMaxTokensPerSession(currentSettings.maxTokensPerSession)
      setApiKeyConfig(currentSettings.apiKeyConfig)
    }
  }, [currentSettings])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      maintenanceMode,
      enableAiAssistant,
      marketplaceAutoApprove,
      maxTokensPerSession: Number(maxTokensPerSession),
      apiKeyConfig,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Retrieving platform configuration params…</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5.5 text-primary" />
          Global Platform Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure feature flags, manage maintenance intervals, and tune LLM session parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Controls */}
        <div className="space-y-4">
          {/* Maintenance Mode Card */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription className="text-[11px] leading-relaxed max-w-md">
                    Switching this on blocks non-admin logins and displays a maintenance message to students. Useful during system upgrades.
                  </CardDescription>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                  className="shrink-0"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Feature Flags Card */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 p-5">
              <CardTitle className="text-sm font-bold">Feature Flags</CardTitle>
              <CardDescription className="text-[11px]">
                Toggle sub-modules of the platform on or off.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Bot className="size-3.5 text-primary" />
                    Enable AI Tutor Chatbot
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Allow students to open chat turns and query model summaries.
                  </p>
                </div>
                <Switch
                  checked={enableAiAssistant}
                  onCheckedChange={setEnableAiAssistant}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShoppingBag className="size-3.5 text-emerald-400" />
                    Bypass Marketplace Moderation
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Automatically set new student marketplace items to active status (bypass admin queue).
                  </p>
                </div>
                <Switch
                  checked={marketplaceAutoApprove}
                  onCheckedChange={setMarketplaceAutoApprove}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Session Tuning Config */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 p-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                AI Session Configurations
              </CardTitle>
              <CardDescription className="text-[11px]">
                Adjust computational allocations and API constraints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-foreground block">
                  Max Session Token Budget
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Limits the maximum token overhead permitted per chat thread to control API billing.
                </p>
                <Input
                  type="number"
                  value={maxTokensPerSession}
                  onChange={(e) => setMaxTokensPerSession(Number(e.target.value))}
                  className="max-w-xs h-9 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-amber-500" />
                  Gemini API Gateway Credentials
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Configuration key details utilized to sign outgoing student LLM completions.
                </p>
                <Input
                  type="password"
                  value={apiKeyConfig}
                  onChange={(e) => setApiKeyConfig(e.target.value)}
                  placeholder="Enter API key credential hash"
                  className="max-w-md h-9 text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="text-xs font-semibold px-4 h-9 min-w-[100px]"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Saving…
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
