import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAdminUsersQuery,
  useUpdateUserRolesMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
} from '@/features/admin/hooks/useAdmin'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  Shield,
  Check,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AdminUser } from '@/features/admin/api/admin.api'

import { PermissionMatrix } from '@/features/admin/components/PermissionMatrix'

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  const [page, setPage] = useState(0)
  
  // Modals / Dialog state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const { data, isLoading } = useAdminUsersQuery({
    search,
    active: activeFilter,
    page,
    size: 8,
  })

  const updateRolesMutation = useUpdateUserRolesMutation()
  const toggleStatusMutation = useToggleUserStatusMutation()
  const deleteUserMutation = useDeleteUserMutation()

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  const submitRolesUpdate = async () => {
    if (!selectedUser) return
    await updateRolesMutation.mutateAsync({
      userId: selectedUser.id,
      roles: selectedRoles,
    })
    setSelectedUser(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">User Registry & Roles</h1>
          <p className="text-xs text-muted-foreground">
            Inspect, promote, deactivate, or review clearance levels for student registrations.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60 shrink-0">
          <Button
            variant={activeTab === 'users' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setActiveTab('users')}
            className="text-xs font-semibold h-8 rounded-lg"
          >
            User Registry
          </Button>
          <Button
            variant={activeTab === 'permissions' ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setActiveTab('permissions')}
            className="text-xs font-semibold h-8 rounded-lg"
          >
            Permission Matrix
          </Button>
        </div>
      </div>

      {activeTab === 'permissions' ? (
        <PermissionMatrix />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, user…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9 text-xs h-9 bg-background/50 border-border/80"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Badge
            variant={activeFilter === null ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] px-2.5 py-0.5 font-semibold"
            onClick={() => {
              setActiveFilter(null)
              setPage(0)
            }}
          >
            All Accounts
          </Badge>
          <Badge
            variant={activeFilter === true ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] px-2.5 py-0.5 font-semibold"
            onClick={() => {
              setActiveFilter(true)
              setPage(0)
            }}
          >
            Active Only
          </Badge>
          <Badge
            variant={activeFilter === false ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] px-2.5 py-0.5 font-semibold"
            onClick={() => {
              setActiveFilter(false)
              setPage(0)
            }}
          >
            Suspended Only
          </Badge>
        </div>
      </div>

      {/* Users Grid/Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/60">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Retrieving student indexes…</p>
            </div>
          ) : !data || data.content.length === 0 ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              No matching registered profiles found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8.5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {user.firstName ? user.firstName[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4 font-mono text-[10px] text-muted-foreground">
                      @{user.username}
                    </td>

                    {/* Roles Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-border/80 bg-muted/40 font-medium"
                          >
                            {role.replace('ROLE_', '')}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.active ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'
                          }`}
                        />
                        <span className="font-semibold text-[10px] text-muted-foreground">
                          {user.active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[10px]">
                      {new Date(user.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action Panel Buttons */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        title="Edit Roles"
                        onClick={() => {
                          setSelectedUser(user)
                          setSelectedRoles(user.roles)
                        }}
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        className="text-[10px] h-7 font-semibold"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            userId: user.id,
                            active: !user.active,
                          })
                        }
                      >
                        {user.active ? 'Suspend' : 'Activate'}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="hover:bg-destructive/10 text-destructive border-transparent"
                        title="Purge Profile"
                        onClick={() => {
                          if (confirm(`Permanently soft-delete user ${user.email}?`)) {
                            deleteUserMutation.mutate(user.id)
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Bar */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <div className="text-[10px] text-muted-foreground font-medium">
            Page {page + 1} of {data.totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
              disabled={page === data.totalPages - 1}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Edit Roles dialog drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-pointer"
            />
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border/80 rounded-xl shadow-2xl p-5 z-50 space-y-4 focus:outline-none"
              role="dialog"
              aria-modal="true"
            >
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Shield className="size-4 text-primary" />
                  Edit Security Roles
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Update role clearance levels for {selectedUser.firstName} {selectedUser.lastName}.
                </p>
              </div>

              {/* Roles checkboxes */}
              <div className="space-y-2.5 py-2">
                {['ROLE_USER', 'ROLE_CREATOR', 'ROLE_ADMIN'].map((role) => {
                  const isChecked = selectedRoles.includes(role)
                  return (
                    <div
                      key={role}
                      onClick={() => handleRoleToggle(role)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? 'border-primary/45 bg-primary/5 text-foreground'
                          : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs font-semibold">{role.replace('ROLE_', '')}</span>
                      <div
                        className={`size-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border/80'
                        }`}
                      >
                        {isChecked && <Check className="size-3 font-bold" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Save/Cancel footer actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs h-8.5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitRolesUpdate}
                  size="sm"
                  disabled={updateRolesMutation.isPending}
                  className="text-xs h-8.5 gap-1.5"
                >
                  {updateRolesMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : null}
                  Save Roles
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
