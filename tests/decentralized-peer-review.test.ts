import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let researchProposals: { [key: number]: any } = {}
let reviews: { [key: string]: any } = {}
let lastProposalId = 0

// Mock contract functions
const submitProposal = (sender: string, title: string, descriptionHash: string) => {
  const newId = ++lastProposalId
  researchProposals[newId] = {
    researcher: sender,
    title,
    description_hash: descriptionHash,
    status: 'pending'
  }
  return { success: true, value: newId }
}

const submitReview = (sender: string, proposalId: number, score: number, commentHash: string) => {
  const proposal = researchProposals[proposalId]
  if (!proposal) {
    return { success: false, error: 101 }
  }
  if (sender === proposal.researcher) {
    return { success: false, error: 102 }
  }
  if (score < 0 || score > 100) {
    return { success: false, error: 102 }
  }
  reviews[`${proposalId}:${sender}`] = {
    score,
    comment_hash: commentHash,
    timestamp: Date.now()
  }
  return { success: true }
}

const finalizeProposal = (sender: string, proposalId: number, finalStatus: string) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  const proposal = researchProposals[proposalId]
  if (!proposal) {
    return { success: false, error: 101 }
  }
  proposal.status = finalStatus
  return { success: true }
}

const getProposal = (proposalId: number) => {
  return researchProposals[proposalId] || null
}

const getReview = (proposalId: number, reviewer: string) => {
  return reviews[`${proposalId}:${reviewer}`] || null
}

describe('Decentralized Peer Review', () => {
  beforeEach(() => {
    researchProposals = {}
    reviews = {}
    lastProposalId = 0
  })
  
  it('allows submitting a proposal', () => {
    const result = submitProposal('researcher1', 'New Research', '0x1234567890abcdef')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const proposal = getProposal(1)
    expect(proposal).toBeTruthy()
    expect(proposal.researcher).toBe('researcher1')
    expect(proposal.title).toBe('New Research')
    expect(proposal.status).toBe('pending')
  })
  
  it('allows submitting a review', () => {
    submitProposal('researcher1', 'New Research', '0x1234567890abcdef')
    
    const result = submitReview('reviewer1', 1, 85, '0xabcdef1234567890')
    expect(result.success).toBe(true)
    
    const review = getReview(1, 'reviewer1')
    expect(review).toBeTruthy()
    expect(review.score).toBe(85)
  })
  
  it('prevents researcher from reviewing their own proposal', () => {
    submitProposal('researcher1', 'New Research', '0x1234567890abcdef')
    
    const result = submitReview('researcher1', 1, 85, '0xabcdef1234567890')
    expect(result.success).toBe(false)
    expect(result.error).toBe(102)
  })
  
  it('allows finalizing a proposal', () => {
    submitProposal('researcher1', 'New Research', '0x1234567890abcdef')
    
    const result = finalizeProposal('contract-owner', 1, 'approved')
    expect(result.success).toBe(true)
    
    const proposal = getProposal(1)
    expect(proposal.status).toBe('approved')
  })
  
  it('prevents non-owner from finalizing a proposal', () => {
    submitProposal('researcher1', 'New Research', '0x1234567890abcdef')
    
    const result = finalizeProposal('researcher1', 1, 'approved')
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
})

