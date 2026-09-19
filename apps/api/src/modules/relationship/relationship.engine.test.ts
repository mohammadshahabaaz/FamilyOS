import { describe, it, expect } from 'vitest'
import { computeRelationship, computeAllRelationships } from './relationship.engine.js'
import type { GraphEdge } from './relationship.engine.js'

// ─── Minimal 3-generation family used across tests ───────────────────────────
//
//   GF ──── GM          (grandparents, SPOUSE)
//    │
//   DAD ─── MOM         (parents, SPOUSE)
//    │ ╲
//   ME  SIB             (children, SIBLING)
//         │
//        SON             (grandchild via sibling — only used in deeper tests)
//
// Persons: gf, gm, dad, mom, me, sib, son, uncle, aunt, cousin
// ─────────────────────────────────────────────────────────────────────────────

function makeFamily() {
  const edges: GraphEdge[] = [
    // GF is parent of DAD
    { fromPersonId: 'gf', toPersonId: 'dad', relationType: 'PARENT' },
    // GM is parent of DAD
    { fromPersonId: 'gm', toPersonId: 'dad', relationType: 'PARENT' },
    // GF + GM are spouses
    { fromPersonId: 'gf', toPersonId: 'gm', relationType: 'SPOUSE' },
    // DAD is parent of ME and SIB
    { fromPersonId: 'dad', toPersonId: 'me', relationType: 'PARENT' },
    { fromPersonId: 'dad', toPersonId: 'sib', relationType: 'PARENT' },
    // MOM is parent of ME and SIB
    { fromPersonId: 'mom', toPersonId: 'me', relationType: 'PARENT' },
    { fromPersonId: 'mom', toPersonId: 'sib', relationType: 'PARENT' },
    // DAD + MOM are spouses
    { fromPersonId: 'dad', toPersonId: 'mom', relationType: 'SPOUSE' },
    // ME and SIB are siblings
    { fromPersonId: 'me', toPersonId: 'sib', relationType: 'SIBLING' },
    // GF is parent of UNCLE
    { fromPersonId: 'gf', toPersonId: 'uncle', relationType: 'PARENT' },
    { fromPersonId: 'gm', toPersonId: 'uncle', relationType: 'PARENT' },
    // UNCLE has a spouse AUNT
    { fromPersonId: 'uncle', toPersonId: 'aunt', relationType: 'SPOUSE' },
    // UNCLE and AUNT have a child COUSIN
    { fromPersonId: 'uncle', toPersonId: 'cousin', relationType: 'PARENT' },
    { fromPersonId: 'aunt', toPersonId: 'cousin', relationType: 'PARENT' },
    // SIB has a child SON
    { fromPersonId: 'sib', toPersonId: 'son', relationType: 'PARENT' },
  ]

  const genders = new Map<string, 'MALE' | 'FEMALE' | 'OTHER'>([
    ['gf', 'MALE'],
    ['gm', 'FEMALE'],
    ['dad', 'MALE'],
    ['mom', 'FEMALE'],
    ['me', 'MALE'],
    ['sib', 'FEMALE'],
    ['son', 'MALE'],
    ['uncle', 'MALE'],
    ['aunt', 'FEMALE'],
    ['cousin', 'MALE'],
  ])

  return { edges, genders }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rel(from: string, to: string, gender?: 'MALE' | 'FEMALE' | 'OTHER') {
  const { edges } = makeFamily()
  return computeRelationship(from, to, edges, gender)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeRelationship — direct (1st degree)', () => {
  it('self → Self', () => {
    expect(rel('me', 'me').label).toBe('Self')
  })

  it('me → dad = Father', () => {
    expect(rel('me', 'dad', 'MALE').label).toBe('Father')
  })

  it('me → mom = Mother', () => {
    expect(rel('me', 'mom', 'FEMALE').label).toBe('Mother')
  })

  it('dad → me = Son', () => {
    expect(rel('dad', 'me', 'MALE').label).toBe('Son')
  })

  it('dad → sib = Daughter', () => {
    expect(rel('dad', 'sib', 'FEMALE').label).toBe('Daughter')
  })

  it('me → sib = Sister', () => {
    expect(rel('me', 'sib', 'FEMALE').label).toBe('Sister')
  })

  it('sib → me = Brother', () => {
    expect(rel('sib', 'me', 'MALE').label).toBe('Brother')
  })

  it('dad → mom = Wife', () => {
    expect(rel('dad', 'mom', 'FEMALE').label).toBe('Wife')
  })

  it('mom → dad = Husband', () => {
    expect(rel('mom', 'dad', 'MALE').label).toBe('Husband')
  })
})

describe('computeRelationship — 2nd degree (grandparents + in-laws)', () => {
  it('me → gf = Grandfather', () => {
    expect(rel('me', 'gf', 'MALE').label).toBe('Grandfather')
  })

  it('me → gm = Grandmother', () => {
    expect(rel('me', 'gm', 'FEMALE').label).toBe('Grandmother')
  })

  it('gf → me = Grandson', () => {
    expect(rel('gf', 'me', 'MALE').label).toBe('Grandson')
  })

  it('me → uncle = Uncle', () => {
    expect(rel('me', 'uncle', 'MALE').label).toBe('Uncle')
  })

  it('me → aunt = Aunt', () => {
    expect(rel('me', 'aunt', 'FEMALE').label).toBe('Aunt')
  })

  it('uncle → me = Nephew', () => {
    expect(rel('uncle', 'me', 'MALE').label).toBe('Nephew')
  })

  it('sib → mom = Mother-in-law (via spouse→parent path if applicable)', () => {
    // dad→mom is SPOUSE, so mom is sib's mother (direct PARENT edge)
    // SIB→MOM should be Mother
    expect(rel('sib', 'mom', 'FEMALE').label).toBe('Mother')
  })
})

describe('computeRelationship — 3rd degree (cousins)', () => {
  it('me → cousin = First Cousin', () => {
    expect(rel('me', 'cousin').label).toBe('First Cousin')
  })

  it('cousin → me = First Cousin', () => {
    expect(rel('cousin', 'me').label).toBe('First Cousin')
  })
})

describe('computeRelationship — in-laws', () => {
  it('me → aunt (spouse of uncle) = Aunt via spouse path', () => {
    // uncle is Parent's Brother → Aunt
    expect(rel('me', 'aunt', 'FEMALE').label).toBe('Aunt')
  })

  it('dad → gf = Father (his father)', () => {
    expect(rel('dad', 'gf', 'MALE').label).toBe('Father')
  })
})

describe('computeRelationship — grandchildren', () => {
  it("gf → son = Great-grandson (sib's son, 3 generations)", () => {
    expect(rel('gf', 'son', 'MALE').label).toBe('Great-grandson')
  })

  it("me → son = Nephew (sib's son)", () => {
    expect(rel('me', 'son', 'MALE').label).toBe('Nephew')
  })
})

describe('computeRelationship — unrelated', () => {
  it('returns Not related for a disconnected person', () => {
    const { edges } = makeFamily()
    const result = computeRelationship('me', 'stranger', edges)
    expect(result.label).toBe('Not related')
  })
})

describe('computeAllRelationships', () => {
  it('computes all relationships from one root', () => {
    const { edges, genders } = makeFamily()
    const all = ['gf', 'gm', 'dad', 'mom', 'sib', 'son', 'uncle', 'aunt', 'cousin']
    const map = computeAllRelationships('me', all, edges, genders)

    expect(map.get('dad')?.label).toBe('Father')
    expect(map.get('mom')?.label).toBe('Mother')
    expect(map.get('gf')?.label).toBe('Grandfather')
    expect(map.get('gm')?.label).toBe('Grandmother')
    expect(map.get('sib')?.label).toBe('Sister')
    // uncle/aunt/cousin are only reachable through gf/gm (dad's parents) in this
    // fixture — there's no maternal side — so computeAllRelationships (which always
    // has a full personGenders map, unlike the rel() helper below) now prefixes them.
    expect(map.get('uncle')?.label).toBe('Paternal Uncle')
    expect(map.get('aunt')?.label).toBe('Paternal Aunt')
    expect(map.get('cousin')?.label).toBe('Paternal First Cousin')
    expect(map.get('son')?.label).toBe('Nephew')
  })

  it('does not include the root person itself', () => {
    const { edges, genders } = makeFamily()
    const all = ['gf', 'dad', 'sib']
    const map = computeAllRelationships('me', all, edges, genders)
    expect(map.has('me')).toBe(false)
  })

  it('handles an empty edges list gracefully', () => {
    const map = computeAllRelationships('me', ['gf', 'dad'], [], new Map())
    expect(map.get('gf')?.label).toBe('Not related')
    expect(map.get('dad')?.label).toBe('Not related')
  })
})

describe('pathToLabel — gender-neutral fallbacks', () => {
  it('returns Parent when gender is unknown', () => {
    expect(rel('me', 'dad').label).toMatch(/Father|Parent/)
  })

  it('returns Sibling when gender is unknown', () => {
    expect(rel('me', 'sib').label).toMatch(/Sister|Sibling/)
  })
})

describe('symmetry', () => {
  it('Father / Son is symmetric inverse', () => {
    const a = rel('me', 'dad', 'MALE')
    const b = rel('dad', 'me', 'MALE')
    expect(a.label).toBe('Father')
    expect(b.label).toBe('Son')
  })

  it('Grandparent / Grandchild is symmetric inverse', () => {
    const a = rel('me', 'gf', 'MALE')
    const b = rel('gf', 'me', 'MALE')
    expect(a.label).toBe('Grandfather')
    expect(b.label).toBe('Grandson')
  })

  it('Cousin is symmetric', () => {
    const a = rel('me', 'cousin')
    const b = rel('cousin', 'me')
    expect(a.label).toBe(b.label)
  })
})

// ─── Paternal/Maternal side family — separate grandparents on each side ──────
//
//   dadGF ── dadGM         momGF ── momGM
//     │  ╲                   │  ╲
//    dad  dadBro            mom  momBro
//      ╲   (paternal          ╱   (maternal
//       ╲   uncle)           ╱     uncle)
//        ╲                  ╱
//         me ─── sib  (dad + mom's children)
//
// ────────────────────────────────────────────────────────────────────────────

function makeSidedFamily() {
  const edges: GraphEdge[] = [
    { fromPersonId: 'dadGF', toPersonId: 'dad', relationType: 'PARENT' },
    { fromPersonId: 'dadGM', toPersonId: 'dad', relationType: 'PARENT' },
    { fromPersonId: 'dadGF', toPersonId: 'dadGM', relationType: 'SPOUSE' },
    { fromPersonId: 'dadGF', toPersonId: 'dadBro', relationType: 'PARENT' },
    { fromPersonId: 'dadGM', toPersonId: 'dadBro', relationType: 'PARENT' },

    { fromPersonId: 'momGF', toPersonId: 'mom', relationType: 'PARENT' },
    { fromPersonId: 'momGM', toPersonId: 'mom', relationType: 'PARENT' },
    { fromPersonId: 'momGF', toPersonId: 'momGM', relationType: 'SPOUSE' },
    { fromPersonId: 'momGF', toPersonId: 'momBro', relationType: 'PARENT' },
    { fromPersonId: 'momGM', toPersonId: 'momBro', relationType: 'PARENT' },

    { fromPersonId: 'dad', toPersonId: 'me', relationType: 'PARENT' },
    { fromPersonId: 'mom', toPersonId: 'me', relationType: 'PARENT' },
    { fromPersonId: 'dad', toPersonId: 'sib', relationType: 'PARENT' },
    { fromPersonId: 'mom', toPersonId: 'sib', relationType: 'PARENT' },
    { fromPersonId: 'dad', toPersonId: 'mom', relationType: 'SPOUSE' },
  ]

  const genders = new Map<string, 'MALE' | 'FEMALE' | 'OTHER'>([
    ['dadGF', 'MALE'],
    ['dadGM', 'FEMALE'],
    ['dad', 'MALE'],
    ['dadBro', 'MALE'],
    ['momGF', 'MALE'],
    ['momGM', 'FEMALE'],
    ['mom', 'FEMALE'],
    ['momBro', 'MALE'],
    ['me', 'MALE'],
    ['sib', 'FEMALE'],
  ])

  return { edges, genders }
}

describe('pathToLabel — paternal/maternal prefix (P2-D)', () => {
  it("father's brother → Paternal Uncle", () => {
    const { edges, genders } = makeSidedFamily()
    const map = computeAllRelationships('me', ['dadBro'], edges, genders)
    expect(map.get('dadBro')?.label).toBe('Paternal Uncle')
  })

  it("mother's brother → Maternal Uncle", () => {
    const { edges, genders } = makeSidedFamily()
    const map = computeAllRelationships('me', ['momBro'], edges, genders)
    expect(map.get('momBro')?.label).toBe('Maternal Uncle')
  })

  it('sibling → Brother/Sister, no prefix', () => {
    const { edges, genders } = makeSidedFamily()
    const map = computeAllRelationships('me', ['sib'], edges, genders)
    expect(map.get('sib')?.label).toBe('Sister')
  })

  it('parent → Father/Mother, no prefix', () => {
    const { edges, genders } = makeSidedFamily()
    const map = computeAllRelationships('me', ['dad', 'mom'], edges, genders)
    expect(map.get('dad')?.label).toBe('Father')
    expect(map.get('mom')?.label).toBe('Mother')
  })

  it('falls back to no prefix when the via-node gender is unknown', () => {
    const { edges } = makeSidedFamily()
    // dadBro's own gender is known (drives Uncle/Aunt); dad's (the via-node) is not.
    const partialGenders = new Map<string, 'MALE' | 'FEMALE' | 'OTHER'>([['dadBro', 'MALE']])
    const map = computeAllRelationships('me', ['dadBro'], edges, partialGenders)
    expect(map.get('dadBro')?.label).toBe('Uncle')
  })

  it('computeRelationship also applies the prefix when personGenders is passed', () => {
    const { edges, genders } = makeSidedFamily()
    const result = computeRelationship('me', 'momBro', edges, 'MALE', genders)
    expect(result.label).toBe('Maternal Uncle')
  })

  it('computeRelationship omits the prefix when personGenders is not passed', () => {
    const { edges } = makeSidedFamily()
    const result = computeRelationship('me', 'momBro', edges, 'MALE')
    expect(result.label).toBe('Uncle')
  })
})
