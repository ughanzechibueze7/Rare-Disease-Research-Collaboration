;; Research Breakthrough NFT Contract

(define-non-fungible-token breakthrough-nft uint)

(define-map breakthrough-data
  { token-id: uint }
  {
    researcher: principal,
    title: (string-ascii 100),
    description-hash: (buff 32),
    timestamp: uint
  }
)

(define-data-var last-token-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))

(define-public (mint-breakthrough (researcher principal) (title (string-ascii 100)) (description-hash (buff 32)))
  (let
    ((new-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (nft-mint? breakthrough-nft new-id researcher))
    (map-set breakthrough-data
      { token-id: new-id }
      {
        researcher: researcher,
        title: title,
        description-hash: description-hash,
        timestamp: block-height
      }
    )
    (var-set last-token-id new-id)
    (ok new-id)
  )
)

(define-public (transfer-breakthrough (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (nft-transfer? breakthrough-nft token-id sender recipient)
  )
)

(define-read-only (get-breakthrough-owner (token-id uint))
  (ok (nft-get-owner? breakthrough-nft token-id))
)

(define-read-only (get-breakthrough-data (token-id uint))
  (map-get? breakthrough-data { token-id: token-id })
)
