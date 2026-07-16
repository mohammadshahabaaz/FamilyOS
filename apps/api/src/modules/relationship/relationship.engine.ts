export type RelationStep = 'P' | 'C' | 'S' | 'B'

export interface GraphEdge {
  fromPersonId: string
  toPersonId: string
  relationType: 'PARENT' | 'SPOUSE' | 'SIBLING'
}

type AdjList = Map<string, Array<{ id: string; step: RelationStep }>>

function buildAdjacency(edges: GraphEdge[]): AdjList {
  const adj: AdjList = new Map()

  const add = (from: string, to: string, step: RelationStep) => {
    if (!adj.has(from)) adj.set(from, [])
    adj.get(from)!.push({ id: to, step })
  }

  for (const e of edges) {
    if (e.relationType === 'PARENT') {
      // fromPerson IS PARENT of toPerson
      add(e.toPersonId, e.fromPersonId, 'P') // child walks up to parent
      add(e.fromPersonId, e.toPersonId, 'C') // parent walks down to child
    } else if (e.relationType === 'SPOUSE') {
      add(e.fromPersonId, e.toPersonId, 'S')
      add(e.toPersonId, e.fromPersonId, 'S')
    } else if (e.relationType === 'SIBLING') {
      add(e.fromPersonId, e.toPersonId, 'B')
      add(e.toPersonId, e.fromPersonId, 'B')
    }
  }

  return adj
}

function bfs(from: string, to: string, adj: AdjList, maxDepth = 7): RelationStep[] | null {
  if (from === to) return []

  const queue: Array<{ id: string; path: RelationStep[] }> = [{ id: from, path: [] }]
  const visited = new Set([from])

  while (queue.length > 0) {
    const { id, path } = queue.shift()!
    if (path.length >= maxDepth) continue

    for (const { id: nextId, step } of adj.get(id) ?? []) {
      if (visited.has(nextId)) continue
      const nextPath = [...path, step] as RelationStep[]
      if (nextId === to) return nextPath
      visited.add(nextId)
      queue.push({ id: nextId, path: nextPath })
    }
  }

  return null
}

export function computeRelationship(
  fromPersonId: string,
  toPersonId: string,
  edges: GraphEdge[],
  targetGender?: 'MALE' | 'FEMALE' | 'OTHER',
): { label: string; path: string } {
  if (fromPersonId === toPersonId) return { label: 'Self', path: '' }

  const adj = buildAdjacency(edges)
  const path = bfs(fromPersonId, toPersonId, adj)

  if (!path) return { label: 'Not related', path: '' }

  const pathStr = path.join('')
  return { label: pathToLabel(pathStr, targetGender), path: pathStr }
}

export function computeAllRelationships(
  fromPersonId: string,
  allPersonIds: string[],
  edges: GraphEdge[],
  personGenders: Map<string, 'MALE' | 'FEMALE' | 'OTHER'>,
): Map<string, { label: string; path: string }> {
  const adj = buildAdjacency(edges)
  const results = new Map<string, { label: string; path: string }>()

  for (const toId of allPersonIds) {
    if (toId === fromPersonId) continue
    const path = bfs(fromPersonId, toId, adj)
    if (!path) {
      results.set(toId, { label: 'Not related', path: '' })
    } else {
      const pathStr = path.join('')
      results.set(toId, {
        label: pathToLabel(pathStr, personGenders.get(toId)),
        path: pathStr,
      })
    }
  }

  return results
}

function pathToLabel(path: string, gender?: 'MALE' | 'FEMALE' | 'OTHER'): string {
  const g = (m: string, f: string, n = `${m} / ${f}`) =>
    gender === 'MALE' ? m : gender === 'FEMALE' ? f : n

  // Normalise some equivalent paths that BFS might return differently
  // depending on which SIBLING/PARENT edges are stored
  const norm: Record<string, string> = {
    // First degree
    P: g('Father', 'Mother', 'Parent'),
    C: g('Son', 'Daughter', 'Child'),
    S: g('Husband', 'Wife', 'Spouse'),
    B: g('Brother', 'Sister', 'Sibling'),
    // Second degree
    PP: g('Grandfather', 'Grandmother', 'Grandparent'),
    CC: g('Grandson', 'Granddaughter', 'Grandchild'),
    PC: g('Brother', 'Sister', 'Sibling'),   // parent→their other child
    PB: g('Uncle', 'Aunt', 'Uncle / Aunt'),  // parent→their sibling
    BC:  g('Nephew', 'Niece', 'Niece / Nephew'),  // sibling's child
    PCC: g('Nephew', 'Niece', 'Niece / Nephew'),  // via shared grandparent (no sibling edge)
    // In-laws (1st)
    SP: g('Father-in-law', 'Mother-in-law', 'Parent-in-law'),
    CS: g('Son-in-law', 'Daughter-in-law', 'Child-in-law'),
    BS: g('Brother-in-law', 'Sister-in-law', 'Sibling-in-law'),
    SB: g('Brother-in-law', 'Sister-in-law', 'Sibling-in-law'),
    // Third degree
    PPP: g('Great-grandfather', 'Great-grandmother', 'Great-grandparent'),
    CCC: g('Great-grandson', 'Great-granddaughter', 'Great-grandchild'),
    PPC: g('Uncle', 'Aunt', 'Uncle / Aunt'),  // via grandparent
    PBC: 'First Cousin',
    PPB: g('Great-uncle', 'Great-aunt', 'Great-uncle / Great-aunt'),
    BCC: g('Grand-nephew', 'Grand-niece', 'Grand-niece / nephew'),
    // In-laws (extended)
    SPP: g('Grandfather-in-law', 'Grandmother-in-law', 'Grandparent-in-law'),
    SPC: g('Brother-in-law', 'Sister-in-law', 'Sibling-in-law'),
    PBS:  g('Uncle-in-law', 'Aunt', 'Aunt / Uncle-in-law'),  // parent→sibling→spouse
    PPCS: g('Uncle-in-law', 'Aunt', 'Aunt / Uncle-in-law'),  // parent→parent→child→spouse
    PPCC: 'First Cousin',
    PBCS: 'First Cousin-in-law',
    // Step
    PS: g('Stepfather', 'Stepmother', 'Stepparent'),
    SC: g('Stepson', 'Stepdaughter', 'Stepchild'),
  }

  return norm[path] ?? `Relative (${path})`
}
