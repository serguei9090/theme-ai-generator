export default function WebsiteMockup() {
  return (
    <div className="rounded-lg border p-6 bg-background text-text w-full">
      <div className="h-8 mb-4 bg-primary rounded" />
      <div className="h-4 mb-2 bg-secondary rounded w-3/4" />
      <div className="h-4 mb-2 bg-secondary rounded w-1/2" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="h-24 bg-primary rounded" />
        <div className="h-24 bg-secondary rounded" />
        <div className="h-24 bg-accent rounded" />
      </div>
    </div>
  )
}
