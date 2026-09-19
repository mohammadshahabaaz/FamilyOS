import { db } from '../../lib/db.js'

// Scalar fields only — NEVER select/include Person, Event, or Media relations here.
// Cross-tree visibility is an explicitly unresolved product question (see CLAUDE.md);
// this module is write-side only and must not leak Tree B's data to Tree A members.
const TREE_LINK_SELECT = {
  id: true,
  treeAId: true,
  treeAPersonId: true,
  treeBId: true,
  treeBPersonId: true,
  linkType: true,
  status: true,
  requestedById: true,
  approvedByTreeAAdminId: true,
  approvedByTreeBAdminId: true,
  rejectedById: true,
  createdAt: true,
}

export const treeLinkRepository = {
  create(data: {
    treeAId: string
    treeAPersonId: string
    treeBId: string
    treeBPersonId: string
    linkType: 'MARRIAGE'
    requestedById: string
    approvedByTreeAAdminId: string
  }) {
    return db.treeLink.create({ data, select: TREE_LINK_SELECT })
  },

  findById(id: string) {
    return db.treeLink.findUnique({ where: { id }, select: TREE_LINK_SELECT })
  },

  listForTrees(treeIds: string[]) {
    return db.treeLink.findMany({
      where: { OR: [{ treeAId: { in: treeIds } }, { treeBId: { in: treeIds } }] },
      select: TREE_LINK_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  },

  findActiveBetweenPersons(treeAPersonId: string, treeBPersonId: string) {
    return db.treeLink.findFirst({
      where: { treeAPersonId, treeBPersonId, status: { in: ['PENDING', 'APPROVED'] } },
      select: { id: true },
    })
  },

  // Optimistic-locking transition — only succeeds if the row is still in `from` status,
  // so two concurrent approve/reject calls can't both "win".
  transitionStatus(
    id: string,
    from: 'PENDING',
    to: 'APPROVED' | 'REJECTED',
    extra: Record<string, string>,
  ) {
    return db.treeLink.updateMany({
      where: { id, status: from },
      data: { status: to, ...extra },
    })
  },
}
