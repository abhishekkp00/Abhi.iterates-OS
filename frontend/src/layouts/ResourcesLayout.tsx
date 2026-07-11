import { Outlet } from 'react-router-dom'

/**
 * ResourcesLayout — sub-shell layout wrapper for the Resources module.
 * Holds nested Outlet so that resource child sub-pages (list, detail, edit, new)
 * are cleanly contained.
 */
export default function ResourcesLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  )
}
