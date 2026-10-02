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

This is a backend persistence and authorization audit, not a guarantee that every possible UI interaction is bug-free. OAuth sign-in and UploadThing uploads still require a real browser account/service round trip; the integration tests supply sessions and do not emulate Google's OAuth flow. Event reminders now create in-app notifications; email and push delivery are not configured. News reads a MongoDB collection; it does not automatically ingest an external news feed. Legacy historical collections remain available for an explicit, reviewed data migration if wanted later.


## Follow-up fixes — 2026-10-03

- Resources use one visibility rule across the list, hashtag search, bookmarks, profile activity, collections, tags and direct interaction/version endpoints. Public queries exclude private resources; owners and admins retain access. Legacy resources without a visibility field remain public, as before. This controls app access to records; previously shared external file URLs are still governed by their storage provider.
- JWT sessions reload the current account through its indexed email on every authenticated request. Deleted/disabled/recreated accounts lose existing sessions; role changes apply immediately. Database lookup errors fail closed.
- Chat send, read and clear operations use transactions sharing a conversation write, keeping unread counters consistent under concurrency.
- Event listing includes page navigation, a functional retry button, and deterministic timestamp/ID ordering. Public event pages no longer render an empty screen for signed-out visitors. Legacy approval-message records missing event fields are excluded before counting/pagination; their database records are preserved.
- Quiz question access starts/resumes a database-owned attempt. Its deadline, question snapshot, draft answers and revision survive refreshes. Autosaves reject stale revisions and expired attempts. Late submission finalizes only the last saved answers, ignoring any late replacement answers. Submission retries return the original result without duplicate scores. The timer continues while the student is away; rejoining with the quiz code resumes the attempt.
- Opted-in attendees receive one in-app reminder per event date during the preceding 48 hours. Notifications also catch up on read. The cron endpoint is implemented and protected. Scheduled activation is pending approval to store `CRON_SECRET`; `vercel.json` keeps cron jobs disabled until that variable is set. Enable it with `{"path":"/api/cron/event-reminders","schedule":"0 3 * * *"}`. Hobby scheduling may run later within that hour. This is not email/SMS delivery.
- Next.js upgraded to 15.5.27 and NextAuth to 4.24.15, retaining React 18 compatibility. Same-major Effect and PostCSS overrides resolve upstream pinned vulnerable versions. `npm audit` reports zero vulnerabilities after the lockfile update.
- GitHub Actions runs lint, typecheck, production dependency audit, regression tests against an ephemeral MongoDB replica set, and a production build on pushes to `sgp6` and pull requests. CI needs no production credentials.
- Added indexes for opted-in reminders and quiz attempts. Existing application records are preserved.

Regression coverage now includes privacy across retrieval paths, role revocation and account recreation, concurrent chat mutations, identical-timestamp event pagination, quiz draft conflicts/resume/expiry, idempotent submissions, and authenticated/idempotent reminders. Local integration tests still use only their guarded temporary database.
