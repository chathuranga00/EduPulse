import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) {
  return (
    <div className="ep-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-lavender-light/50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900/50">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender dark:bg-gray-800">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
