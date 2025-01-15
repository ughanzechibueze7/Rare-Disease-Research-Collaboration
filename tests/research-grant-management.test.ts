import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let grants: { [key: number]: anylet grants: { [key: number]: any } = {}
let milestoneCompletions: { [key: string]: boolean } = {}
let lastGrantId = 0

// Mock contract functions
const createGrant = (sender: string, researcher: string, amount: number, milestones: number[]) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  const newId = ++lastGrantId
  grants[newId] = {
    researcher,
    amount,
    milestones,
    current_milestone: 0,
    status: 'active'
  }
  return { success: true, value: newId }
}

const completeMilestone = (sender: string, grantId: number) => {
  const grant = grants[grantId]
  if (!grant) {
    return { success: false, error: 101 }
  }
  if (sender !== grant.researcher) {
    return { success: false, error: 102 }
  }
  if (grant.current_milestone >= grant.milestones.length) {
    return { success: false, error: 102 }
  }
  const milestoneAmount = grant.milestones[grant.current_milestone]
  grant.current_milestone++
  milestoneCompletions[`${grantId}:${grant.current_milestone - 1}`] = true
  if (grant.current_milestone === grant.milestones.length) {
    grant.status = 'completed'
  }
  return { success: true }
}

const getGrant = (grantId: number) => {
  return grants[grantId] || null
}

const getMilestoneCompletion = (grantId: number, milestone: number) => {
  return { completed: milestoneCompletions[`${grantId}:${milestone}`] || false }
}

describe('Research Grant Management', () => {
  beforeEach(() => {
    grants = {}
    milestoneCompletions = {}
    lastGrantId = 0
  })
  
  it('allows creating a grant', () => {
    const result = createGrant('contract-owner', 'researcher1', 1000, [250, 250, 500])
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const grant = getGrant(1)
    expect(grant).toBeTruthy()
    expect(grant.researcher).toBe('researcher1')
    expect(grant.amount).toBe(1000)
    expect(grant.milestones).toEqual([250, 250, 500])
    expect(grant.status).toBe('active')
  })
  
  it('prevents non-owner from creating a grant', () => {
    const result = createGrant('researcher1', 'researcher1', 1000, [250, 250, 500])
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
  
  it('allows completing milestones', () => {
    createGrant('contract-owner', 'researcher1', 1000, [250, 250, 500])
    
    const result = completeMilestone('researcher1', 1)
    expect(result.success).toBe(true)
    
    const grant = getGrant(1)
    expect(grant.current_milestone).toBe(1)
    
    const completion = getMilestoneCompletion(1, 0)
    expect(completion.completed).toBe(true)
  })
  
  it('prevents unauthorized milestone completion', () => {
    createGrant('contract-owner', 'researcher1', 1000, [250, 250, 500])
    
    const result = completeMilestone('researcher2', 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe(102)
  })
  
  it('updates grant status to completed after final milestone', () => {
    createGrant('contract-owner', 'researcher1', 1000, [250, 250, 500])
    
    completeMilestone('researcher1', 1)
    completeMilestone('researcher1', 1)
    completeMilestone('researcher1', 1)
    
    const grant = getGrant(1)
    expect(grant.status).toBe('completed')
  })
})

