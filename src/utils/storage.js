const POLLS_KEY = 'polls_v1'
const SETS_KEY = 'poll_sets_v1'

export function loadPolls() {
  try {
    const raw = localStorage.getItem(POLLS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function savePolls(polls) {
  localStorage.setItem(POLLS_KEY, JSON.stringify(polls))
}

function loadSets() {
  try {
    const raw = localStorage.getItem(SETS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSets(sets) {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets))
}

function generateId() {
  // RFC4122 v4-like fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function createPoll({ question, type, options, setId = null }) {
  const polls = loadPolls()
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
  const votes = new Array(options.length).fill(0)
  polls[id] = { id, question, type, options, votes, createdAt: Date.now(), setId }
  savePolls(polls)
  return polls[id]
}

export function getPoll(id) {
  return loadPolls()[id] || null
}

export function votePoll(id, index) {
  const polls = loadPolls()
  const poll = polls[id]
  if (!poll) return null
  poll.votes[index] = (poll.votes[index] || 0) + 1
  savePolls(polls)
  return poll
}

export function hasVoted(id) {
  return !!localStorage.getItem(`voted_${id}`)
}

export function markVoted(id) {
  localStorage.setItem(`voted_${id}`, 'true')
}

export function listPollIdsSorted() {
  const polls = Object.values(loadPolls())
  polls.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  return polls.map(p => p.id)
}

export function getAdjacentPollId(id, step = 1) {
  const ids = listPollIdsSorted()
  const idx = ids.indexOf(id)
  if (idx === -1) return null
  const target = ids[idx + step]
  return target || null
}

export function getAdjacentPollIdSameSet(id, step = 1) {
  const pollsMap = loadPolls()
  const current = pollsMap[id]
  if (!current) return null
  const sameSet = Object.values(pollsMap).filter(p => (p.setId || null) === (current.setId || null))
  sameSet.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  const ids = sameSet.map(p => p.id)
  const idx = ids.indexOf(id)
  if (idx === -1) return null
  return ids[idx + step] || null
}

export function deletePoll(id) {
  const polls = loadPolls()
  if (polls[id]) {
    delete polls[id]
    savePolls(polls)
  }
}

export function clearAllPolls() {
  savePolls({})
}

export function createPollSet(name) {
  const sets = loadSets()
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
  sets[id] = { id, name, createdAt: Date.now() }
  saveSets(sets)
  return sets[id]
}

export function listPollSets() {
  return Object.values(loadSets()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}


