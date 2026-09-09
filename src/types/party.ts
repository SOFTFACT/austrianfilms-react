/**
 * Party -- people, organizations and groups in one table (the model that
 * replaced `personen` and `kontakt` on 2026-09-02). Output shape of
 * cs.PartyController.partyToObject (list) and partyToObjectFull (detail),
 * GET /api/v1/parties[/:id]. `id` is P_UUID; the image is served by
 * /getimage?type=person&id=<id> (that handler resolves Party).
 */
export type PartyKind = 'person' | 'organization' | 'group'

/** never = no check yet, checked = reviewedAt after the last change, changed = edited since the check */
export type ReviewState = 'never' | 'checked' | 'changed'

export interface PartyRow {
  id: string
  kind: PartyKind
  displayName: string
  vorname: string
  nachname: string
  shortName: string
  categoryName: string
  hidden: boolean
  /** every reference to the party: credits, articles, awards, contact roles, relationships */
  linkCount: number
  city: string
  email: string
  /** where the row came from: kontakt, personen, icloud.afcfestivals, jart.credits, … */
  source: string
  reviewState: ReviewState
  reviewedAt: string
  modifiedAt: string
  imageUrl: string
}

export interface PartyChannel {
  id: string
  type: 'EMAIL' | 'PHONE' | 'FAX' | 'WEBSITE' | 'SOCIAL' | string
  value: string
  label: string
  preferred: boolean
}

export interface PartyAddress {
  id: string
  type: string
  street: string
  addressLine2: string
  zip: string
  city: string
  countryCode: string
}

export interface PartyRelation {
  relationshipId: string
  roleCode: string
  roleName: string
  outgoing: boolean
  roleNote: string
  verifiedAt: string
  validFrom: string
  validTo: string
  isValidToday: boolean
  other: { id: string; kind: PartyKind; displayName: string }
}

export interface PartyHistoryLine {
  P_UUID: string
  at: string
  user: string
  source: string
  action: string
  /** "2026-09-03T10:12 · reinhard · update · note: … → …" */
  summary: string
  /** the field diffs, the note and "[copy on file]" — what the 4D History tab shows in its Detail column */
  detail: string
  /** a merge stored a full copy of the dropped row on this line */
  hasSnapshot: boolean
}

/** One row of the "Films & awards" tab: a credit (person_film_rel) or a company role on a film (film_contact_rel). */
export interface PartyFilm {
  /** FM_filme UUID; empty when the legacy shadow row carries none */
  filmKey: string
  title: string
  titleEn: string
  year: number
  role: string
  /** country of a distribution/sales role; empty for credits */
  country: string
  source: 'credit' | 'company'
  rowId: string
}

/** A prize the party holds itself — never one of its films' awards. */
export interface PartyAward {
  name: string
  year: number
  category: string
  festival: string
  result: 'won' | 'nominee' | 'special_mention' | 'honorable_mention' | string
  subjectType: string
}

export interface Party extends PartyRow {
  shortNameEn: string
  displayNameAlt: string
  gender: string
  academicTitle: string
  bornIn: string
  bornInYear: string
  diedIn: string
  diedInYear: string
  bornDate: string
  diedDate: string
  credit: string
  quote: string
  filmography: string
  phone: string
  fax: string
  website: string
  channels: PartyChannel[]
  addresses: PartyAddress[]
  relations: PartyRelation[]
  legacySource: string
  modifiedBy: string
  note: string
  reviewedBy: string
  externalSource: string
  externalId: string
  createdAt: string
  createdBy: string
  mailingLists: { id: string; name: string }[]
  history: PartyHistoryLine[]
  films: PartyFilm[]
  awards: PartyAward[]
}

/**
 * Party query params -- GET /api/v1/parties accepts limit/offset/sortField/
 * sortOrder/kind/workset/search (all in one list route; there is no separate
 * category filter, the work list replaces it).
 */
export interface PartyFilters {
  search?: string
  kind?: PartyKind | ''
  /** a work-list code from cs.PartyModel.worksetCatalog: USED_5Y, NEVER_REVIEWED, … */
  workset?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: 'displayName' | 'nachname' | 'vorname' | 'kind' | 'modifiedAt' | 'reviewedAt' | 'source'
  sortOrder?: 'asc' | 'desc'
}

/** The work lists as the mask offers them -- label for the eye, code for the query. */
export const PARTY_WORKSETS: { code: string; label: string }[] = [
  { code: '', label: 'All' },
  { code: 'USED_5Y', label: 'Used in the last 5 years' },
  { code: 'NEVER_REVIEWED', label: 'Never checked' },
  { code: 'CHANGED_SINCE_REVIEW', label: 'Changed since checked' },
  { code: 'UNVERIFIED', label: 'Relationship not yet verified' },
  { code: 'NAME_TWICE', label: 'Same name more than once' },
  { code: 'NAME_ALSO_A_PERSON', label: "Company that shares a person's name" },
  { code: 'NO_NAME', label: 'Without a name' },
  { code: 'NO_FIRST_NAME', label: 'Person without a first name' },
  { code: 'UNLINKED', label: 'Nothing links to it' },
  { code: 'CATEGORY_ORPHAN', label: 'Category points nowhere' },
]
