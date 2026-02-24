export default function DesktopAppMockup() {
  return (
    <div className="rounded-lg border p-4 bg-background text-text">
      <div className="h-6 mb-3 bg-primary rounded w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 bg-secondary rounded" />
        <div className="h-28 bg-accent rounded" />
      </div>
    </div>
  )
}
