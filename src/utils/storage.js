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

export async function createPoll({ question, type, options, setId = null, answer = null }) {
  try {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
    // Votes are now stored in the votes collection, not in the poll document
    const pollData = {
      id,
      question,
      type,
      options,
      createdAt: Date.now(),
      setId: setId || null,
      answer: answer || null // Store the correct answer for validation
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
      // Aggregate votes from votes collection
      const { votes, textResponses } = await aggregateVotes(id, data.type, data.options || [])
      
      return {
        ...data,
        id: pollSnap.id,
        votes: votes || [],
        textResponses: textResponses || []
      }
    }
    return null
  } catch (error) {
    console.error('Error getting poll:', error)
    return null
  }
}

// Aggregate votes from votes collection for a poll
async function aggregateVotes(pollId, pollType, options) {
  try {
    const votesRef = collection(db, COLLECTIONS.VOTES)
    const q = query(votesRef, where('pollId', '==', pollId))
    const snapshot = await getDocs(q)
    
    if (pollType === 'text') {
      // For text polls, return array of text responses
      const textResponses = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.textResponse) {
          textResponses.push(data.textResponse)
        }
      })
      return { textResponses, votes: null }
    } else {
      // For other poll types, aggregate by optionIndex
      const votes = new Array(options.length).fill(0)
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (typeof data.optionIndex === 'number' && data.optionIndex >= 0 && data.optionIndex < votes.length) {
          votes[data.optionIndex] = (votes[data.optionIndex] || 0) + 1
        }
      })
      return { votes, textResponses: null }
    }
  } catch (error) {
    console.error('Error aggregating votes:', error)
    // Fallback to empty arrays
    if (pollType === 'text') {
      return { textResponses: [], votes: null }
    }
    return { votes: new Array(options.length).fill(0), textResponses: null }
  }
}

export async function votePoll(id, index) {
  try {
    // Verify poll exists
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    const pollSnap = await getDoc(pollRef)
    if (!pollSnap.exists()) {
      throw new Error('Poll does not exist')
    }
    
    // Create a vote document in the votes collection
    const voteId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
    const voteRef = doc(db, COLLECTIONS.VOTES, voteId)
    const voteData = {
      pollId: id,
      optionIndex: index,
      createdAt: Date.now()
    }
    
    await setDoc(voteRef, voteData)
    invalidateCache()
    // Return updated poll with aggregated votes
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
    
    // Verify poll exists
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    const pollSnap = await getDoc(pollRef)
    if (!pollSnap.exists()) {
      throw new Error('Poll does not exist')
    }
    
    // Create a vote document in the votes collection with text response
    const voteId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateId()
    const voteRef = doc(db, COLLECTIONS.VOTES, voteId)
    const voteData = {
      pollId: id,
      textResponse: textResponse.trim(),
      createdAt: Date.now()
    }
    
    await setDoc(voteRef, voteData)
    invalidateCache()
    // Return updated poll with aggregated votes
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
    console.log('listPollIdsBySetSorted called with setId:', setId)
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
        console.log('Query succeeded, found', snapshot.docs.length, 'polls')
      } catch (queryError) {
        // If composite index error, fallback to fetching all and filtering
        if (queryError.code === 'failed-precondition') {
          console.warn('Firestore index required. Fetching all polls and filtering...')
          const allSnapshot = await getDocs(query(pollsRef, orderBy('createdAt', 'asc')))
          const filteredDocs = allSnapshot.docs.filter(doc => {
            const data = doc.data()
            const matches = data.setId === setId
            if (!matches && data.setId) {
              console.log('Poll', doc.id, 'has setId', data.setId, 'expected', setId)
            }
            return matches
          })
          console.log('Filtered to', filteredDocs.length, 'polls')
          snapshot = { docs: filteredDocs }
        } else {
          console.error('Query error (not index issue):', queryError)
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
    const ids = snapshot.docs.map(doc => doc.id)
    console.log('Returning poll IDs:', ids)
    return ids
  } catch (error) {
    console.error('Error listing polls by set:', error)
    return []
  }
}

export async function deletePoll(id) {
  try {
    // Delete all votes for this poll
    const votesRef = collection(db, COLLECTIONS.VOTES)
    const votesQuery = query(votesRef, where('pollId', '==', id))
    const votesSnapshot = await getDocs(votesQuery)
    
    const batch = writeBatch(db)
    votesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Delete the poll
    const pollRef = doc(db, COLLECTIONS.POLLS, id)
    batch.delete(pollRef)
    
    await batch.commit()
    invalidateCache()
  } catch (error) {
    console.error('Error deleting poll:', error)
    throw error
  }
}

export async function clearAllPolls() {
  try {
    // Delete all votes
    const votesRef = collection(db, COLLECTIONS.VOTES)
    const votesSnapshot = await getDocs(votesRef)
    const batch = writeBatch(db)
    
    votesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Delete all polls
    const pollsRef = collection(db, COLLECTIONS.POLLS)
    const snapshot = await getDocs(pollsRef)
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
    
    // Get all vote IDs for these polls
    const pollIds = snapshot.docs.map(doc => doc.id)
    const votesRef = collection(db, COLLECTIONS.VOTES)
    
    // For each poll, get its votes and delete them
    const batch = writeBatch(db)
    
    for (const pollId of pollIds) {
      const votesQuery = query(votesRef, where('pollId', '==', pollId))
      const votesSnapshot = await getDocs(votesQuery)
      votesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
    }
    
    // Delete all polls in the set
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Delete the set
    const setRef = doc(db, COLLECTIONS.POLL_SETS, setId)
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
  let pollUnsubscribe = null
  let votesUnsubscribe = null
  
  const pollRef = doc(db, COLLECTIONS.POLLS, id)
  
  // Subscribe to poll changes
  pollUnsubscribe = onSnapshot(pollRef, async (pollSnapshot) => {
    if (pollSnapshot.exists()) {
      const pollData = pollSnapshot.data()
      
      // Also subscribe to votes collection for this poll
      const votesRef = collection(db, COLLECTIONS.VOTES)
      const votesQuery = query(votesRef, where('pollId', '==', id))
      
      // Unsubscribe from previous votes listener
      if (votesUnsubscribe) {
        votesUnsubscribe()
      }
      
      // Subscribe to votes changes
      votesUnsubscribe = onSnapshot(votesQuery, async (votesSnapshot) => {
        try {
          // Aggregate votes
          const { votes, textResponses } = await aggregateVotes(id, pollData.type, pollData.options || [])
          
          // Call callback with poll data including aggregated votes
          callback({
            ...pollData,
            id: pollSnapshot.id,
            votes: votes || [],
            textResponses: textResponses || []
          })
        } catch (error) {
          console.error('Error aggregating votes in subscription:', error)
          // Fallback to poll data without votes
          callback({
            ...pollData,
            id: pollSnapshot.id,
            votes: [],
            textResponses: []
          })
        }
      }, (error) => {
        console.error('Error in votes subscription:', error)
      })
      
      // Initial aggregation
      try {
        const { votes, textResponses } = await aggregateVotes(id, pollData.type, pollData.options || [])
        callback({
          ...pollData,
          id: pollSnapshot.id,
          votes: votes || [],
          textResponses: textResponses || []
        })
      } catch (error) {
        console.error('Error in initial vote aggregation:', error)
        callback({
          ...pollData,
          id: pollSnapshot.id,
          votes: [],
          textResponses: []
        })
      }
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Error in poll subscription:', error)
    callback(null)
  })
  
  // Return unsubscribe function
  return () => {
    if (pollUnsubscribe) pollUnsubscribe()
    if (votesUnsubscribe) votesUnsubscribe()
  }
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
