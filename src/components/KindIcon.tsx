import { UserRound, Building2, Users as UsersIcon } from 'lucide-react'
import type { PartyKind } from '../types/party'

/** Person, organization or group — the icon the contacts screens share. */
export function KindIcon({ kind, className }: { kind: PartyKind; className?: string }) {
  if (kind === 'organization') return <Building2 className={className} />
  if (kind === 'group') return <UsersIcon className={className} />
  return <UserRound className={className} />
}
