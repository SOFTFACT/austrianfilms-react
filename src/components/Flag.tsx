/**
 * Country flag. Uses the STATIC SVGs the 4D web server serves from
 * WebFolder/flags/{iso2}.svg (no auth) -- an <img> cannot send the Bearer
 * header, so the auth-gated /api/v1/countries/:id/flag route is unusable here.
 */
export function Flag({ code, className }: { code?: string; className?: string }) {
  if (!code) return null
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={code}
      title={code}
      loading="lazy"
      className={className ?? 'h-4 w-6 shrink-0 rounded-sm object-cover'}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
      }}
    />
  )
}
