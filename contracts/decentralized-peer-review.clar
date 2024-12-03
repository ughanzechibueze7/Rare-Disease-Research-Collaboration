;; Decentralized Peer Review Contract

(define-map research-proposals
  { proposal-id: uint }
  {
    researcher: principal,
    title: (string-ascii 100),
    description-hash: (buff 32),
    status: (string-ascii 20)
  }
)

(define-map reviews
  { proposal-id: uint, reviewer: principal }
  {
    score: uint,
    comment-hash: (buff 32),
    timestamp: uint
  }
)

(define-data-var last-proposal-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))

(define-public (submit-proposal (title (string-ascii 100)) (description-hash (buff 32)))
  (let
    ((new-id (+ (var-get last-proposal-id) u1)))
    (map-set research-proposals
      { proposal-id: new-id }
      {
        researcher: tx-sender,
        title: title,
        description-hash: description-hash,
        status: "pending"
      }
    )
    (var-set last-proposal-id new-id)
    (ok new-id)
  )
)

(define-public (submit-review (proposal-id uint) (score uint) (comment-hash (buff 32)))
  (let
    ((proposal (unwrap! (map-get? research-proposals { proposal-id: proposal-id }) err-not-found)))
    (asserts! (not (is-eq tx-sender (get researcher proposal))) err-unauthorized)
    (asserts! (and (>= score u0) (<= score u100)) err-unauthorized)
    (map-set reviews
      { proposal-id: proposal-id, reviewer: tx-sender }
      {
        score: score,
        comment-hash: comment-hash,
        timestamp: block-height
      }
    )
    (ok true)
  )
)

(define-public (finalize-proposal (proposal-id uint) (final-status (string-ascii 20)))
  (let
    ((proposal (unwrap! (map-get? research-proposals { proposal-id: proposal-id }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set research-proposals
      { proposal-id: proposal-id }
      (merge proposal { status: final-status })
    )
    (ok true)
  )
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? research-proposals { proposal-id: proposal-id })
)

(define-read-only (get-review (proposal-id uint) (reviewer principal))
  (map-get? reviews { proposal-id: proposal-id, reviewer: reviewer })
)
