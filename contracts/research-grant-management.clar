;; Research Grant Management Contract

(define-map grants
  { grant-id: uint }
  {
    researcher: principal,
    amount: uint,
    milestones: (list 5 uint),
    current-milestone: uint,
    status: (string-ascii 20)
  }
)

(define-map milestone-completions
  { grant-id: uint, milestone: uint }
  { completed: bool }
)

(define-data-var last-grant-id uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))

(define-public (create-grant (researcher principal) (amount uint) (milestones (list 5 uint)))
  (let
    ((new-id (+ (var-get last-grant-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set grants
      { grant-id: new-id }
      {
        researcher: researcher,
        amount: amount,
        milestones: milestones,
        current-milestone: u0,
        status: "active"
      }
    )
    (var-set last-grant-id new-id)
    (ok new-id)
  )
)

(define-public (complete-milestone (grant-id uint))
  (let
    ((grant (unwrap! (map-get? grants { grant-id: grant-id }) err-not-found)))
    (asserts! (is-eq tx-sender (get researcher grant)) err-unauthorized)
    (asserts! (< (get current-milestone grant) (len (get milestones grant))) err-unauthorized)
    (let
      ((new-milestone (+ (get current-milestone grant) u1))
       (milestone-amount (unwrap! (element-at (get milestones grant) (get current-milestone grant)) err-not-found)))
      (try! (stx-transfer? milestone-amount contract-owner (get researcher grant)))
      (map-set milestone-completions
        { grant-id: grant-id, milestone: (get current-milestone grant) }
        { completed: true }
      )
      (map-set grants
        { grant-id: grant-id }
        (merge grant { current-milestone: new-milestone })
      )
      (if (is-eq new-milestone (len (get milestones grant)))
        (map-set grants
          { grant-id: grant-id }
          (merge grant { status: "completed" })
        )
        false
      )
      (ok true)
    )
  )
)

(define-read-only (get-grant (grant-id uint))
  (map-get? grants { grant-id: grant-id })
)

(define-read-only (get-milestone-completion (grant-id uint) (milestone uint))
  (default-to
    { completed: false }
    (map-get? milestone-completions { grant-id: grant-id, milestone: milestone })
  )
)

