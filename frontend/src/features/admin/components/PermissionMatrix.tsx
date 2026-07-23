import { CheckCircle2, XCircle } from '@/lib/icons'
import { Card, CardContent } from '@/components/ui/card'

interface PermissionRow {
  name: string
  key: string
  description: string
  USER: boolean
  CREATOR: boolean
  ADMIN: boolean
  SUPER_ADMIN: boolean
}

export function PermissionMatrix() {
  const permissions: PermissionRow[] = [
    {
      name: 'Read Resources',
      key: 'read:resource',
      description: 'Allows browsing library study resources and attachments.',
      USER: true,
      CREATOR: true,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Create Resources',
      key: 'write:resource',
      description: 'Allows uploading guides, summaries, and exam prep files.',
      USER: true,
      CREATOR: true,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Moderate Marketplace',
      key: 'moderate:listing',
      description: 'Allows approving or rejecting student items on the campus market.',
      USER: false,
      CREATOR: false,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Moderate Resources',
      key: 'moderate:resource',
      description: 'Allows removing resources flagged as plagiarism or spam.',
      USER: false,
      CREATOR: false,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Manage User Registry',
      key: 'manage:users',
      description: 'Allows suspending, reactivating, or soft-deleting profiles.',
      USER: false,
      CREATOR: false,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Edit Security Roles',
      key: 'manage:roles',
      description: 'Allows updating user roles (USER, CREATOR, ADMIN).',
      USER: false,
      CREATOR: false,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'View Security Audit Trails',
      key: 'audit:logs',
      description: 'Allows searching chronological system audit logs.',
      USER: false,
      CREATOR: false,
      ADMIN: true,
      SUPER_ADMIN: true,
    },
    {
      name: 'Configure Platform Settings',
      key: 'configure:settings',
      description: 'Allows toggling maintenance mode and active feature flags.',
      USER: false,
      CREATOR: false,
      ADMIN: false,
      SUPER_ADMIN: true,
    },
  ]

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/60">
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 w-[240px]">Capability Flag</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-center w-[100px]">Student</th>
              <th className="py-3 px-4 text-center w-[100px]">Creator</th>
              <th className="py-3 px-4 text-center w-[100px]">Admin</th>
              <th className="py-3 px-4 text-center w-[110px]">Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((row) => (
              <tr
                key={row.key}
                className="border-b border-border/40 hover:bg-muted/10 transition-colors"
              >
                <td className="py-3.5 px-4 font-mono text-[10px]">
                  {row.key}
                  <span className="block text-[10px] font-sans font-semibold text-foreground mt-0.5">
                    {row.name}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-muted-foreground pr-8 leading-relaxed">
                  {row.description}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {row.USER ? (
                    <CheckCircle2 className="size-4.5 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="size-4.5 text-muted-foreground/45 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {row.CREATOR ? (
                    <CheckCircle2 className="size-4.5 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="size-4.5 text-muted-foreground/45 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {row.ADMIN ? (
                    <CheckCircle2 className="size-4.5 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="size-4.5 text-muted-foreground/45 mx-auto" />
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {row.SUPER_ADMIN ? (
                    <CheckCircle2 className="size-4.5 text-primary mx-auto" />
                  ) : (
                    <XCircle className="size-4.5 text-muted-foreground/45 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
