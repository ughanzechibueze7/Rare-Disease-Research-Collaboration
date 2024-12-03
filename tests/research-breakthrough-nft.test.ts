import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let breakthroughData: { [key: number]: any } = {}
let nftOwners: { [key: number]: string } = {}
let lastTokenId = 0

// Mock contract functions
const mintBreakthrough = (sender: string, researcher: string, title: string, descriptionHash: string) => {
  if (sender !== 'contract-owner') {
    return { success: false, error: 100 }
  }
  const newId = ++lastTokenId
  breakthroughData[newId] = {
    researcher,
    title,
    description_hash: descriptionHash,
    timestamp: Date.now()
  }
  nftOwners[newId] = researcher
  return { success: true, value: newId }
}

const transferBreakthrough = (sender: string, tokenId: number, recipient: string) => {
  if (nftOwners[tokenId] !== sender) {
    return { success: false, error: 100 }
  }
  nftOwners[tokenId] = recipient
  return { success: true }
}

const getBreakthroughOwner = (tokenId: number) => {
  return { success: true, value: nftOwners[tokenId] || null }
}

const getBreakthroughData = (tokenId: number) => {
  return breakthroughData[tokenId] || null
}

describe('Research Breakthrough NFT', () => {
  beforeEach(() => {
    breakthroughData = {}
    nftOwners = {}
    lastTokenId = 0
  })
  
  it('allows minting a breakthrough NFT', () => {
    const result = mintBreakthrough('contract-owner', 'researcher1', 'New Discovery', '0x1234567890abcdef')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const data = getBreakthroughData(1)
    expect(data).toBeTruthy()
    expect(data.researcher).toBe('researcher1')
    expect(data.title).toBe('New Discovery')
  })
  
  it('prevents non-owner from minting breakthrough NFT', () => {
    const result = mintBreakthrough('researcher1', 'researcher1', 'New Discovery', '0x1234567890abcdef')
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
  
  it('allows transferring breakthrough NFT', () => {
    mintBreakthrough('contract-owner', 'researcher1', 'New Discovery', '0x1234567890abcdef')
    
    const result = transferBreakthrough('researcher1', 1, 'researcher2')
    expect(result.success).toBe(true)
    
    const owner = getBreakthroughOwner(1)
    expect(owner.value).toBe('researcher2')
  })
  
  it('prevents unauthorized transfer of breakthrough NFT', () => {
    mintBreakthrough('contract-owner', 'researcher1', 'New Discovery', '0x1234567890abcdef')
    
    const result = transferBreakthrough('researcher2', 1, 'researcher2')
    expect(result.success).toBe(false)
    expect(result.error).toBe(100)
  })
})

