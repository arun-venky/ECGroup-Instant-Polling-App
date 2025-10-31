import { db, COLLECTIONS } from './firebase.js'
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, onSnapshot, writeBatch, runTransaction } from 'firebase/firestore'

function generateId() {
  // RFC4122 v4-like fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Cache for polls to reduce reads
let pollsCache = null
let pollsCacheTime = 0
const CACHE_TTL = 5000 // 5 seconds

async function getAllPolls() {
  const now = Date.now()
  if (pollsCache && (now - pollsCacheTime) < CACHE_TTL) {
    return pollsCache
  }
  
  try {
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    const snapshot = await getDocs(pollsRef)
    const polls = {}
    snapshot.forEach((doc) => {
      const data = doc.data()
      polls[doc.id] = { ...data, id: doc.id }
    })
    pollsCache = polls
    pollsCacheTime = now
    return polls
  } catch (error) {
    console.error('Error loading polls:', error)
    return {}
  }
}

function invalidateCache() {
  pollsCache = null
  pollsCacheTime = 0
}

export async function createPoll({ question, type, options, setId = null }) {
  try {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
    const votes = type === 'text' ? [] : new Array(options.length).fill(0)
    const textResponses = type === 'text' ? [] : null
    const pollData = {
      id,
      question,
      type,
      options,
      votes,
      textResponses,
      createdAt: Date.now(),
      setId: setId || null
    }
    
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    await setDoc(pollRef, pollData)
    invalidateCache()
    return pollData
  } catch (error) {
    console.error('Error creating poll:', error)
    throw error
  }
}

export async function getPoll(id) {
  try {
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    const pollSnap = await getDoc(pollRef)
    
    if (pollSnap.exists()) {
      const data = pollSnap.data()
      return { ...data, id: pollSnap.id }
    }
    return null
  } catch (error) {
    console.error('Error getting poll:', error)
    return null
  }
}

export async function votePoll(id, index) {
  try {
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    
    // Use transaction for atomic update of array element
    await runTransaction(db, async (transaction) => {
      const pollSnap = await transaction.get(pollRef)
      if (!pollSnap.exists()) {
        throw new Error('Poll does not exist')
      }
      
      const pollData = pollSnap.data()
      const votes = [...(pollData.votes || [])]
      
      // Ensure votes array is long enough
      while (votes.length <= index) {
        votes.push(0)
      }
      
      // Increment the vote count
      votes[index] = (votes[index] || 0) + 1
      
      transaction.update(pollRef, { votes })
    })
    
    invalidateCache()
    // Return updated poll
    return await getPoll(id)
  } catch (error) {
    console.error('Error voting on poll:', error)
    return null
  }
}

export async function votePollText(id, textResponse) {
  try {
    if (!textResponse || !textResponse.trim()) {
      throw new Error('Text response cannot be empty')
    }
    
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    
    // Use transaction for atomic update
    await runTransaction(db, async (transaction) => {
      const pollSnap = await transaction.get(pollRef)
      if (!pollSnap.exists()) {
        throw new Error('Poll does not exist')
      }
      
      const pollData = pollSnap.data()
      const textResponses = [...(pollData.textResponses || [])]
      
      // Add the new text response
      textResponses.push(textResponse.trim())
      
      transaction.update(pollRef, { textResponses })
    })
    
    invalidateCache()
    // Return updated poll
    return await getPoll(id)
  } catch (error) {
    console.error('Error submitting text response:', error)
    return null
  }
}

export function hasVoted(id) {
  // Check localStorage for local vote tracking
  // This prevents duplicate votes from the same device
  return !!localStorage.getItem(`voted_${id}`)
}

export function markVoted(id) {
  localStorage.setItem(`voted_${id}`, 'true')
}

export async function listPollIdsSorted() {
  try {
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    const q = query(pollsRef, orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.id)
  } catch (error) {
    console.error('Error listing polls:', error)
    return []
  }
}

export async function getAdjacentPollId(id, step = 1) {
  try {
    const ids = await listPollIdsSorted()
    const idx = ids.indexOf(id)
    if (idx === -1) return null
    const target = ids[idx + step]
    return target || null
  } catch (error) {
    console.error('Error getting adjacent poll:', error)
    return null
  }
}

export async function getAdjacentPollIdSameSet(id, step = 1) {
  try {
    const current = await getPoll(id)
    if (!current) {
      console.warn('Current poll not found:', id)
      return null
    }
    
    const setId = current.setId || null
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    
    let snapshot
    if (setId) {
      // Query for specific setId
      try {
        const q = query(
          pollsRef,
          where('setId', '==', setId),
          orderBy('createdAt', 'asc')
        )
        snapshot = await getDocs(q)
      } catch (queryError) {
        // If composite index error, fallback to fetching all and filtering
        if (queryError.code === 'failed-precondition') {
          console.warn('Firestore index required. Fetching all polls and filtering...')
          const allSnapshot = await getDocs(query(pollsRef, orderBy('createdAt', 'asc')))
          const filteredDocs = allSnapshot.docs.filter(doc => {
            const data = doc.data()
            return data.setId === setId
          })
          snapshot = { docs: filteredDocs }
        } else {
          throw queryError
        }
      }
    } else {
      // For null setId, we need to query all and filter in memory
      // Firestore doesn't support querying for null directly
      const q = query(pollsRef, orderBy('createdAt', 'asc'))
      const allSnapshot = await getDocs(q)
      // Filter for polls with null or undefined setId
      const filteredDocs = allSnapshot.docs.filter(doc => {
        const data = doc.data()
        return (data.setId === null || data.setId === undefined || data.setId === '')
      })
      // Create a new snapshot-like structure
      snapshot = { docs: filteredDocs }
    }
    
    const polls = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    const ids = polls.map(p => p.id)
    const idx = ids.indexOf(id)
    if (idx === -1) {
      console.warn('Current poll not found in same set list:', id, 'Available IDs:', ids)
      return null
    }
    const targetId = ids[idx + step]
    if (!targetId) {
      console.log('No adjacent poll found. Index:', idx, 'Step:', step, 'Total polls:', ids.length)
    }
    return targetId || null
  } catch (error) {
    console.error('Error getting adjacent poll same set:', error)
    return null
  }
}

export async function listPollIdsBySetSorted(setId) {
  try {
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    let snapshot
    if (setId) {
      try {
        const q = query(
          pollsRef,
          where('setId', '==', setId),
          orderBy('createdAt', 'asc')
        )
        snapshot = await getDocs(q)
      } catch (queryError) {
        // If composite index error, fallback to fetching all and filtering
        if (queryError.code === 'failed-precondition') {
          console.warn('Firestore index required. Fetching all polls and filtering...')
          const allSnapshot = await getDocs(query(pollsRef, orderBy('createdAt', 'asc')))
          const filteredDocs = allSnapshot.docs.filter(doc => {
            const data = doc.data()
            return data.setId === setId
          })
          snapshot = { docs: filteredDocs }
        } else {
          throw queryError
        }
      }
    } else {
      // For null setId, query all and filter
      const q = query(pollsRef, orderBy('createdAt', 'asc'))
      const allSnapshot = await getDocs(q)
      const filteredDocs = allSnapshot.docs.filter(doc => {
        const data = doc.data()
        return (data.setId === null || data.setId === undefined || data.setId === '')
      })
      snapshot = { docs: filteredDocs }
    }
    return snapshot.docs.map(doc => doc.id)
  } catch (error) {
    console.error('Error listing polls by set:', error)
    return []
  }
}

export async function deletePoll(id) {
  try {
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    await deleteDoc(pollRef)
    invalidateCache()
  } catch (error) {
    console.error('Error deleting poll:', error)
    throw error
  }
}

export async function clearAllPolls() {
  try {
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    const snapshot = await getDocs(pollsRef)
    const batch = writeBatch(db)
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    invalidateCache()
  } catch (error) {
    console.error('Error clearing all polls:', error)
    throw error
  }
}

export async function createPollSet(name) {
  try {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
    const setData = {
      id,
      name,
      createdAt: Date.now()
    }
    
    const setRef = doc(db, COLLECTIONS.POLL_SETS, id)
    await setDoc(setRef, setData)
    return setData
  } catch (error) {
    console.error('Error creating poll set:', error)
    throw error
  }
}

export async function listPollSets() {
  try {
    const setsRef = collection(db, COLLECTIONS.POLL_SETS)
    const q = query(setsRef, orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
  } catch (error) {
    console.error('Error listing poll sets:', error)
    return []
  }
}

export async function deletePollSet(setId) {
  try {
    const setRef = doc(db, COLLECTIONS.POLL_SETS, setId)
    await deleteDoc(setRef)
    // Note: Polls with this setId will remain but the set reference will be removed
    // You might want to also remove setId from polls, but that's optional
  } catch (error) {
    console.error('Error deleting poll set:', error)
    throw error
  }
}

export async function deletePollSetAndPolls(setId) {
  try {
    // Get all polls in this set
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    const q = query(
      pollsRef,
      where('setId', '==', setId)
    )
    const snapshot = await getDocs(q)
    
    // Delete the set
    const setRef = doc(db, COLLECTIONS.POLL_SETS, setId)
    
    // Batch delete polls and set
    const batch = writeBatch(db)
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    batch.delete(setRef)
    
    await batch.commit()
    invalidateCache()
  } catch (error) {
    // If composite index error, try alternative approach
    if (error.code === 'failed-precondition') {
      console.warn('Firestore index required. Deleting set only...')
      const setRef = doc(db, COLLECTIONS.POLL_SETS, setId)
      await deleteDoc(setRef)
    } else {
      console.error('Error deleting poll set and polls:', error)
      throw error
    }
  }
}

// Real-time listener for poll updates
export function subscribeToPoll(id, callback) {
  const pollRef = doc(db, COLLECTIONS.POLLS, id)
  return onSnapshot(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      callback({ ...data, id: snapshot.id })
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Error in poll subscription:', error)
    callback(null)
  })
}

// Helper function to load all polls (for backward compatibility)
export async function loadPolls() {
  return await getAllPolls()
}

// Helper function to save polls (for backward compatibility - no-op with Firestore)
export function savePolls(polls) {
  // This is a no-op since we're using Firestore now
  // Kept for backward compatibility
  console.warn('savePolls is deprecated - use createPoll, updatePoll, etc. instead')
}
