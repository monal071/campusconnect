# Backend audit and persistence fixes

Date: 2026-09-30. Branch: `sgp6`.

## Database layout

The existing Atlas connection was verified. Core app data remains in the URI's default database (`test` for the current deployment); quizzes use `MONGODB_QUIZ_DB`, defaulting to `campusconnect`. All runtime MongoDB connections share `utils/mongodb.js`. No production records were deleted or moved. Historical collections in other databases and differently capitalized collections were preserved rather than merged without provenance.

The API inventory contains 106 route files. Database-backed features include accounts/profiles, connections, notifications, events/RSVPs, dashboard data/preferences/content, posts, resources and their comments/reviews/ratings/versions/collections, jobs/approvals, communities, chat, bookmarks, quiz creation/submissions/results/history/analytics, search and activity. UploadThing stores uploaded file bytes externally; MongoDB stores their metadata. OAuth sessions use signed NextAuth JWTs, not a MongoDB session table. Retired community/reset routes intentionally return 410.

## Corrected behavior

| Area | Fix |
| --- | --- |
| Friend requests | Actor comes from the authenticated session. A transaction saves acceptance/rejection/removal, both friends arrays, activity and resolved notifications. Repeat and concurrent requests are safe. Old unresolved notifications are checked against actual pending requests and deduplicated. |
| Connections | Navigation, friends, recommendations, profile count and dashboard share the same relationship reader; old email-based records remain readable. |
| Events | Join and RSVP use one transaction. String URL IDs are converted to ObjectIds for event lookups. Capacity, cancellations, attendee names/counts and activity persist together. Dashboard shows joined events, including past events with a label. |
| Event UI | Removed full-list polling from each event card every five seconds. Added error feedback and immediate refresh signals. Added the missing owner-authorized edit endpoint and prevented approval messages becoming malformed event cards. |
| Dashboard | Removed demo responses and fake save handlers; notes/tasks now persist per account. Quiz statistics use the quiz database, and connection/event counts use actual relationships. |
| Quizzes | Shared connection pool and database selection; submissions use account identity and prevent concurrent forbidden retakes. Grading handles option zero and stores graded answers once. Results/analytics normalize older data. Student question responses omit answer keys. Randomized display and grading use the same order. |
| Resources | Fixed string/ObjectId mismatches, invalid findOne().project() calls, ownership fields, reply IDs, version restore scope, and collection edits. Like/dislike updates are atomic. |
| Permissions | Blocked self-assigned admin roles and editing another user's name; event/job/post deletion requires ownership or admin rights. Disabled legacy bulk account resets and protected quiz migration. |
| Approvals | Approval/rejection is transactional; retries cannot publish duplicate content or repeat notifications. |
| Chat | Bounded message pagination, validated IDs/message length, handled deleted participants, and corrected clear-chat identity/unread state. |
| Search and supporting routes | Corrected quiz database lookups for search, bookmarks, activity and trending; removed quiz answer data from public summaries. Bounded query sizes in additional endpoints. |
| Rate limits | Atomic MongoDB counters with expiry work across Vercel instances without requiring Redis. Connection sends use account-based throttling. |

## Verification

- Real Atlas connection and collection/index inspection; 37 index specifications applied to the correct databases without changing application records.
- Unit tests cover grading, deterministic randomization, pagination, fetch errors/cancellation, and service-worker caching boundaries.
- Integration tests use a uniquely named temporary database on Atlas. They exercise API handlers with controlled authenticated sessions and real MongoDB operations: friend request retry/accept/reject/unfriend, chat read/unread/clear, event edit/join/RSVP/cancel/capacity/dashboard, notes isolation, profile permissions, resource comments/replies/reviews/ratings/reactions/versions/collections, approval retries, atomic rate limits and simultaneous quiz submissions/results.
- The integration database is deleted in a guarded cleanup block. Tests do not write test users or content into production databases.
- TypeScript check and Next.js production build are required before push. Existing non-blocking React hook/image lint warnings are separate from backend errors.

Commands (from `cc2`):

```powershell
npm test
$env:RUN_DB_TESTS='1'
npm test
npm run typecheck
npm run build
npm run db:audit
# Only when installing/updating the documented indexes:
npm run db:indexes
```

`RUN_DB_TESTS=1` uses `MONGODB_TEST_URI` when supplied, otherwise the local MongoDB connection; it always creates a separate randomly named database. Credentials stay in ignored environment files.

## Verification limits

This is a backend persistence and authorization audit, not a guarantee that every possible UI interaction is bug-free. OAuth sign-in and UploadThing uploads still require a real browser account/service round trip; the integration tests supply sessions and do not emulate Google's OAuth flow. Event reminder preferences are saved, but there is no scheduled email/push delivery service in this project. News reads a MongoDB collection; it does not automatically ingest an external news feed. Legacy historical collections remain available for an explicit, reviewed data migration if wanted later.
