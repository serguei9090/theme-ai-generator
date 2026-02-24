export default function WebAppMockup() {
  return (
    <div className="rounded-lg border p-4 bg-background text-text">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 bg-primary rounded-full" />
        <div className="h-4 w-40 bg-secondary rounded" />
      </div>
      <div className="h-36 bg-primary rounded" />
    </div>
  )
}
