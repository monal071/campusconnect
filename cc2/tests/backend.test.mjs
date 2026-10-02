import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./helpers/load-source.mjs";
const load = sourceLoader();
const { gradeAnswers, normalizedSubmission } = load("lib/quiz-submissions.js");
test("quiz grading supports option zero, strings, omitted answers, and missing points", () => {
  const quiz = { questions: [{ question: "One", options: ["A", "B"], correctAnswer: 0 }, { question: "Two", correctAnswer: "yes", points: 2 }] };
  assert.equal(gradeAnswers(quiz, [0, "yes"]).reduce((sum, a) => sum + a.points, 0), 3);
  assert.equal(gradeAnswers(quiz, ["A"])[1].points, 0);
  const graded = gradeAnswers(quiz, ["A", "no"]);
  assert.deepEqual(normalizedSubmission({ answers: graded, totalScore: 1, percentageScore: 33 }, quiz).detailedResults, graded);
});

test("randomized quiz views and grading share the same stable order without leaking answers", () => {
  const { studentQuestions, quizQuestions } = load("lib/quiz-questions.js");
  const quiz = { _id: "quiz", settings: { randomizeQuestions: true, randomizeOptions: true }, questions: Array.from({ length: 8 }, (_, index) => ({ question: `Q${index}`, options: ["A", "B", "C"], correctAnswer: 0, points: 1 })) };
  const shown = studentQuestions(quiz, "student");
  assert.deepEqual(shown, studentQuestions(quiz, "student"));
  assert.ok(shown.every(q => !Object.hasOwn(q, "correctAnswer")));
  assert.equal(gradeAnswers({ questions: quizQuestions(quiz, "student") }, shown.map(() => "A")).filter(a => a.isCorrect).length, 8);
});

test("MongoDB backend regressions (isolated temporary database)", { skip: process.env.RUN_DB_TESTS !== "1", timeout: 180000 }, async t => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  require("@next/env").loadEnvConfig(process.cwd());
  const { MongoClient, ObjectId } = require("mongodb");
  const client = new MongoClient(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const name = "cc_regression_" + Date.now() + "_" + Math.random().toString(16).slice(2, 8);
  assert.match(name, /^cc_regression_\d+_[a-f0-9]+$/);
  await client.connect();
  const db = client.db(name);
  let session;
  const mockClient = { db: () => db, startSession: () => client.startSession() };
  const load = sourceLoader({ "next-auth/next": { getServerSession: async () => session }, "next-auth": { getServerSession: async () => session }, databaseModule: { __esModule: true, default: Promise.resolve(mockClient), connectToDatabase: async () => ({ client: mockClient, db }), getQuizDb: () => db } });
  const call = async (file, method, body = {}, query = {}, headers = {}) => {
    let result;
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { result = { status: this.statusCode, body: value }; return result; } };
    await load("pages/api/" + file).default({ method, body, query, headers }, res);
    return result;
  };
  const a = { _id: new ObjectId(), email: "student-a@example.test", name: "Student A", role: "student", friends: [], requests: [] };
  const b = { _id: new ObjectId(), email: "student-b@example.test", name: "Student B", role: "student", friends: [], requests: [] };
  const aid = String(a._id), bid = String(b._id);
  const as = user => { session = { user: { ...user, id: String(user._id) } }; };
  try {
    // Precreate collections so transaction tests also work on older Atlas versions.
    for (const collection of ["users", "connections", "connectionRequests", "notifications", "friendships", "userActivity", "events", "rsvps", "quizzes", "quizSubmissions", "quizAttempts", "pending_events", "rateLimits", "conversations", "messages"]) await db.createCollection(collection);
    await db.collection("users").insertMany([a, b]);
    await t.test("request persistence, retry safety, rejection, and ownership", async () => {
      as(a);
      assert.equal((await call("connections/request.js", "POST", { fromUserId: bid, toUserId: aid })).status, 403);
      const results = await Promise.all([1, 2].map(() => call("connections/request.js", "POST", { fromUserId: aid, toUserId: bid })));
      assert.deepEqual(results.map(r => r.status), [200, 200]);
      assert.equal(await db.collection("notifications").countDocuments({ type: "friend_request" }), 1);
      as(b);
      assert.equal((await call("connections/incoming.js", "GET", {}, { id: bid })).body.incoming.length, 1);
      assert.equal((await call("connections/request.js", "PUT", { fromUserId: aid, toUserId: bid, action: "accept" })).status, 200);
      assert.equal((await call("connections/request.js", "PUT", { fromUserId: aid, toUserId: bid, action: "accept" })).status, 200);
      assert.equal((await call("notifications.js", "GET")).body.notifications.filter(n => n.type === "friend_request").length, 0);
      assert.equal((await call("connections/incoming.js", "GET")).body.incoming.length, 0);
      assert.equal((await call("connections/friends.js", "GET")).body.friends.length, 1);
      assert.equal((await call("dashboard/stats.js", "GET")).body.data.connections, 1);
      assert.equal(await db.collection("notifications").countDocuments({ type: "approval" }), 1);
      const conversation = await call("chat/conversations.js", "POST", { participantId: aid });
      assert.equal(conversation.status, 201);
      const conversationId = String(conversation.body.conversation._id);
      assert.equal((await call("chat/messages.js", "POST", { conversationId, content: "Hello" })).status, 201);
      assert.equal((await call("chat/messages.js", "POST", { conversationId, content: "X".repeat(5001) })).status, 400);
      as(a);
      assert.equal((await call("chat/unread-count.js", "GET")).body.unreadCount, 1);
      assert.equal((await call("chat/messages.js", "GET", {}, { conversationId, page: "bad", limit: "99999" })).body.messages.length, 1);
      assert.equal((await call("chat/messages.js", "PUT", { conversationId })).status, 200);
      assert.equal((await call("chat/clear.js", "DELETE", {}, { conversationId })).status, 200);
      assert.equal((await call("chat/unread-count.js", "GET")).body.unreadCount, 0);
      as(b);
      assert.equal((await call("connections/request.js", "DELETE", { userId1: bid, userId2: aid })).status, 200);
      as(a); await call("connections/request.js", "POST", { toUserId: bid });
      as(b); assert.equal((await call("connections/request.js", "PUT", { fromUserId: aid, action: "reject" })).status, 200);
      assert.equal((await call("notifications.js", "GET")).body.notifications.filter(n => n.type === "friend_request").length, 0);
      assert.equal((await call("connections/request.js", "PUT", { fromUserId: aid, action: "accept" })).status, 409);
    });
    await t.test("joining through either API updates dashboard and attendees, leaving clears both", async () => {
      const event = { _id: new ObjectId(), title: "Regression Event", status: "approved", createdBy: aid, joined: [], date: new Date(Date.now() + 86400000), maxAttendees: 1 };
      await db.collection("events").insertOne(event);
      const eventId = String(event._id);
      as(a);
      assert.equal((await call("events/[eventId].js", "PUT", { title: "Edited event" }, { eventId })).status, 200);
      as(b);
      assert.equal((await call("events.js", "PUT", { eventId })).status, 200);
      assert.equal((await call("events.js", "PUT", { eventId })).status, 200);
      assert.equal((await call("dashboard/stats.js", "GET")).body.data.events, 1);
      assert.equal((await call("dashboard/upcoming.js", "GET")).body.data.length, 1);
      assert.equal((await call("events/[eventId]/rsvp.js", "GET", {}, { eventId })).body.userStatus, "going");
      const attendees = await call("events/[eventId]/attendees.js", "GET", {}, { eventId });
      assert.equal(attendees.body.attendees[0].name, b.name);
      as(a); assert.equal((await call("events.js", "PUT", { eventId })).status, 409);
      as(b);
      assert.equal((await call("events/[eventId]/rsvp.js", "POST", { status: "maybe" }, { eventId })).status, 200);
      assert.equal((await call("dashboard/stats.js", "GET")).body.data.events, 0);
      assert.equal((await db.collection("events").findOne({ _id: event._id })).attendees, 0);
      assert.equal((await call("events/[eventId]/rsvp.js", "POST", { status: "going" }, { eventId })).status, 200);
      assert.equal((await call("events/[eventId]/rsvp.js", "DELETE", {}, { eventId })).status, 200);
      assert.equal((await call("dashboard/upcoming.js", "GET")).body.data.length, 0);
      await db.collection("events").updateOne({ _id: event._id }, { $set: { date: new Date("2020-01-01"), joined: [bid] } });
      const past = await call("dashboard/upcoming.js", "GET");
      assert.equal(past.body.data[0].upcoming, false);
      assert.equal((await call("events.js", "DELETE", { eventId })).status, 403);
      assert.equal((await call("events/[eventId]/rsvp.js", "POST", { status: "going" }, { eventId: "bad" })).status, 400);
    });
    await t.test("notes really save, remain private, and profile roles cannot be escalated", async () => {
      as(a); assert.equal((await call("dashboard/save.js", "POST", { type: "notes", content: "My notes" })).status, 200);
      assert.equal((await call("dashboard/content.js", "GET", {}, { type: "notes" })).body.content, "My notes");
      as(b); assert.equal((await call("dashboard/content.js", "GET", {}, { type: "notes" })).body.content, "");
      assert.equal((await call("users.js", "PUT", { name: "Changed" }, { id: aid })).status, 403);
      assert.equal((await call("auth/complete-registration.js", "POST", { fullName: "B", role: "admin" })).status, 403);
      assert.equal((await call("users.js", "PUT", { name: "Student B updated" }, { id: bid })).status, 200);
    });
    await t.test("resource comments, reviews, ratings, versions and collections survive reads", async () => {
      const resource = { _id: new ObjectId(), userId: a._id, title: "Resource", description: "Version one", url: "https://example.test/resource" };
      await db.collection("resources").insertOne(resource);
      const resourceId = String(resource._id);
      const query = { resourceId };
      as(b);
      const posted = await call("resources/[resourceId]/comments.js", "POST", { content: "Useful" }, query);
      assert.equal(posted.status, 201);
      const commentId = String(posted.body.comment._id);
      assert.equal((await call("resources/[resourceId]/comments.js", "GET", {}, query)).body.comments[0].author.name, "Student B updated");
      assert.equal((await call("resources/[resourceId]/comments.js", "POST", { content: "Reply", parentId: commentId }, query)).status, 201);
      assert.equal((await call("resources/[resourceId]/comments.js", "GET", {}, query)).body.comments[0].replies.length, 1);
      assert.equal((await call("resources/[resourceId]/comments.js", "PUT", { commentId, content: "Edited" }, query)).status, 200);
      assert.equal((await call("resources/[resourceId]/reviews.js", "POST", { review: "Good", rating: 5 }, query)).status, 201);
      assert.equal((await call("resources/[resourceId]/reviews.js", "GET", {}, query)).body.reviews[0].author.name, "Student B updated");
      assert.equal((await call("resources/[resourceId]/rating.js", "POST", { rating: 5 }, query)).status, 200);
      assert.equal((await db.collection("resources").findOne({ _id: resource._id })).averageRating, 5);
      assert.equal((await call("resources/like.js", "POST", { resourceId })).body.likes, 1);
      assert.equal((await call("resources/dislike.js", "POST", { resourceId })).body.likes, 0);
      as(a);
      const version = await call("resources/[resourceId]/versions.js", "POST", { changeNote: "Initial" }, query);
      assert.equal(version.status, 201);
      assert.equal((await call("resources/[resourceId]/versions.js", "GET", {}, query)).body.versions[0].author.name, a.name);
      await db.collection("resources").updateOne({ _id: resource._id }, { $set: { description: "Changed" } });
      assert.equal((await call("resources/[resourceId]/versions/restore.js", "POST", { versionId: String(version.body.version._id) }, query)).status, 200);
      assert.equal((await db.collection("resources").findOne({ _id: resource._id })).description, "Version one");
      const collection = await call("resources/collections.js", "POST", { name: "Saved resources", resources: [resourceId] });
      assert.equal(collection.status, 201);
      const collectionId = String(collection.body.collection._id);
      assert.equal((await call("resources/collections.js", "GET")).body.collections[0].resourceDetails.length, 1);
      assert.equal((await call("resources/collections.js", "PUT", { collectionId, name: "Renamed" })).status, 200);
      assert.equal((await call("resources/collections.js", "DELETE", {}, { collectionId })).status, 200);
    });
    await t.test("approval retries create one event and one notification", async () => {
      as(a); session.user.role = "admin";
      const pending = { _id: new ObjectId(), title: "Pending event", createdBy: bid, status: "pending", joined: [], date: new Date(Date.now() + 86400000) };
      await db.collection("pending_events").insertOne(pending);
      const body = { type: "event", itemId: String(pending._id), action: "approve" };
      const responses = await Promise.all([1, 2].map(() => call("admin/pending-approvals.js", "POST", body)));
      assert.deepEqual(responses.map(r => r.status), [200, 200]);
      assert.equal(await db.collection("events").countDocuments({ title: pending.title }), 1);
      assert.equal(await db.collection("notifications").countDocuments({ type: "event" }), 1);
    });
    await t.test("rate limits remain atomic without Redis", async () => {
      const { customRateLimit } = load("lib/rateLimiter.js");
      const results = await Promise.all(Array.from({ length: 6 }, () => customRateLimit("regression", 3, 60000)));
      assert.equal(results.filter(r => r.success).length, 3);
    });
    await t.test("quiz submissions use account identity and prevent simultaneous retakes", async () => {
      const quiz = { _id: new ObjectId(), quizName: "Regression", quizCode: "TEST01", createdBy: aid, isActive: true, allowRetakes: false, showResults: true, questions: [{ id: 1, question: "Pick A", options: ["A", "B"], correctAnswer: "A", points: 2 }], totalPoints: 2 };
      await db.collection("quizzes").insertOne(quiz);
      as(b);
      const quizId = String(quiz._id);
      const joined = await call("quiz/get.js", "GET", {}, { code: "TEST01" });
      assert.equal(joined.status, 200);
      assert.equal(joined.body.quiz.questions[0].correctAnswer, undefined);
      const { attemptId, version } = joined.body.quiz.attempt;
      const results = await Promise.all([1, 2].map(() => call("quiz/submit.js", "POST", { quizId, attemptId, version, answers: ["A"], studentId: "spoof", studentName: "spoof" })));
      assert.deepEqual(results.map(r => r.status).sort(), [200, 200]);
      assert.equal(await db.collection("quizSubmissions").countDocuments({ quizId: quiz._id }), 1);
      const stored = await db.collection("quizSubmissions").findOne({ quizId: quiz._id });
      assert.notEqual(stored.studentId, "spoof");
      assert.equal(stored.percentageScore, 100);
      const result = await call("quiz/student-results.js", "GET", {}, { quizId });
      assert.equal(result.status, 200);
      assert.equal(result.body.result.submission.percentage, 100);
      assert.equal(result.body.result.submission.detailedResults[0].isCorrect, true);
      as(a); session.user.role = "faculty";
      assert.equal((await call("dashboard/stats.js", "GET")).body.data.quizzes.totalQuizzes, 1);
      assert.equal((await call("quiz/results.js", "GET", {}, { quizId })).body.results.statistics.highestScore, 100);
    });

    await t.test("private resources are hidden from lists, search, collections, bookmarks and direct routes", async () => {
      const resource = { _id: new ObjectId(), userId: a._id, title: "#private", description: "Confidential", isPublic: false, url: "https://example.test/private", tags: ["private"] };
      await db.collection("resources").insertOne(resource);
      const id = String(resource._id);
      session = null;
      assert.equal((await call("resources.js", "GET")).body.data.some(r => String(r._id) === id), false);
      as(b);
      assert.equal((await call("resources.js", "GET", {}, { search: "#private" })).body.total, 0);
      assert.equal((await call("search/hashtag.js", "GET", {}, { tag: "private", type: "resources" })).body.resources.length, 0);
      for (const route of ["comments", "reviews", "versions", "rating"]) {
        assert.equal((await call(`resources/[resourceId]/${route}.js`, "GET", {}, { resourceId: id })).status, 404);
      }
      assert.equal((await call("resources/download.js", "POST", { resourceId: id })).status, 404);
      await db.collection("bookmarks").insertOne({ userId: b._id, itemId: id, type: "resource", title: "Old bookmark" });
      assert.equal((await call("bookmarks/index.js", "GET")).body.bookmarks.length, 0);
      as(a);
      assert.equal((await call("resources.js", "GET", {}, { search: "#private" })).body.total, 1);
      const collection = await call("resources/collections.js", "POST", { name: "Public collection", isPublic: true, resources: [id] });
      as(b);
      const collections = (await call("resources/collections.js", "GET")).body.collections;
      const found = collections.find(c => String(c._id) === String(collection.body.collection._id));
      assert.equal(found.resources.length, 0);
      assert.equal(found.resourceDetails.length, 0);
      as(a); assert.equal((await call("resources/[resourceId]/versions.js", "GET", {}, { resourceId: id })).status, 200);
    });
    await t.test("role changes and account deletion invalidate existing session permissions", async () => {
      const { refreshSessionToken } = load("lib/session-user.js");
      const user = { _id: new ObjectId(), email: "session@example.test", role: "admin" };
      await db.collection("users").insertOne(user);
      const token = { email: user.email, userId: String(user._id), role: "admin" };
      await db.collection("users").updateOne({ _id: user._id }, { $set: { role: "student" } });
      assert.equal((await refreshSessionToken(db, token)).role, "student");
      await db.collection("users").deleteOne({ _id: user._id });
      assert.equal(await refreshSessionToken(db, token), null);
      await db.collection("users").insertOne({ ...user, _id: new ObjectId() });
      assert.equal(await refreshSessionToken(db, token), null);
    });
    await t.test("concurrent chat reads, sends and clears keep unread counts consistent", async () => {
      const { changeChat } = load("lib/chat.js");
      const id = new ObjectId();
      await db.collection("conversations").insertOne({ _id: id, participants: [aid, bid], unreadCounts: { [aid]: 0, [bid]: 0 } });
      for (const action of ["read", "clear"]) {
        await Promise.all([
          ...Array.from({ length: 3 }, (_, i) => changeChat(mockClient, db, String(id), aid, "send", { content: `message ${i}` })),
          changeChat(mockClient, db, String(id), bid, action),
        ]);
        const actual = await db.collection("messages").countDocuments({ conversationId: id, readBy: { $ne: bid } });
        const conversation = await db.collection("conversations").findOne({ _id: id });
        assert.equal(conversation.unreadCounts[bid], actual);
      }
    });
    await t.test("quiz saves resume with the same deadline and late answers cannot replace saved answers", async () => {
      const quiz = { _id: new ObjectId(), quizName: "Timed", isActive: true, timeLimit: 1, allowRetakes: false, questions: [{ question: "Pick A", options: ["A", "B"], correctAnswer: "A" }] };
      await db.collection("quizzes").insertOne(quiz);
      as(b);
      const quizId = String(quiz._id);
      assert.equal((await call("quiz/submit.js", "POST", { quizId, answers: ["A"] })).status, 409);
      const [one, two] = await Promise.all([1, 2].map(() => call("quiz/attempt.js", "POST", { quizId })));
      assert.equal(one.status, 200); assert.equal(two.status, 200);
      assert.equal(one.body.attemptId, two.body.attemptId);
      assert.equal(+one.body.deadline, +two.body.deadline);
      assert.equal(one.body.quiz.questions[0].correctAnswer, undefined);
      const { attemptId } = one.body;
      const save = await call("quiz/attempt.js", "PUT", { quizId, attemptId, version: 0, answers: ["B"] });
      assert.equal(save.status, 200);
      assert.equal((await call("quiz/attempt.js", "PUT", { quizId, attemptId, version: 0, answers: ["A"] })).status, 409);
      const resumed = await call("quiz/attempt.js", "POST", { quizId });
      assert.deepEqual(resumed.body.answers, ["B"]);
      assert.equal(+resumed.body.deadline, +one.body.deadline);
      await db.collection("quizAttempts").updateOne({ _id: `${quizId}:${bid}` }, { $set: { startedAt: new Date(Date.now() - 61000), deadline: new Date(Date.now() - 1000) } });
      assert.equal((await call("quiz/attempt.js", "PUT", { quizId, attemptId, version: 1, answers: ["A"] })).status, 409);
      const result = await call("quiz/submit.js", "POST", { quizId, attemptId, version: 1, answers: ["A"], timeSpent: 0 });
      assert.equal(result.status, 200);
      assert.equal(result.body.submission.totalScore, 0);
      assert.equal(result.body.submission.timeSpent, 60);
      assert.equal((await call("quiz/attempt.js", "POST", { quizId })).status, 409);
    });
    await t.test("event pagination reaches records after the first twenty", async () => {
      await db.collection("events").insertMany(Array.from({ length: 25 }, (_, i) => ({ title: `Page event ${i}`, description: "Pagination", status: "approved", createdAt: new Date() })));
      await db.collection("events").insertOne({ message: "Legacy approval response", status: "approved", createdAt: new Date() });
      const first = await call("events.js", "GET", {}, { page: "1" });
      const second = await call("events.js", "GET", {}, { page: "2" });
      assert.equal(first.body.pagination.total, 25);
      assert.equal(first.body.events.length, 20);
      assert.ok(second.body.events.length > 0);
      assert.equal(first.body.pagination.hasMore, true);
      assert.ok(second.body.events.every(event => !first.body.events.some(other => String(other._id) === String(event._id))));
    });
    await t.test("reminders deliver once, respect opt-out and authenticate the cron endpoint", async () => {
      const { deliverEventReminders } = load("lib/event-reminders.js");
      const now = new Date();
      const event = { _id: new ObjectId(), title: "Reminder event", status: "approved", date: new Date(+now + 86400000) };
      await db.collection("events").insertOne(event);
      await db.collection("rsvps").insertMany([
        { eventId: String(event._id), userId: aid, status: "going", reminder: true },
        { eventId: String(event._id), userId: bid, status: "going", reminder: false },
      ]);
      await Promise.all([1, 2].map(() => deliverEventReminders(db, { now })));
      assert.equal(await db.collection("notifications").countDocuments({ type: "event_reminder", eventId: String(event._id), userId: aid }), 1);
      assert.equal(await db.collection("notifications").countDocuments({ type: "event_reminder", userId: bid }), 0);
      assert.equal((await call("cron/event-reminders.js", "GET")).status, 401);
      const previous = process.env.CRON_SECRET;
      try {
        process.env.CRON_SECRET = "isolated-test-only";
        assert.equal((await call("cron/event-reminders.js", "GET", {}, {}, { authorization: "Bearer isolated-test-only" })).status, 200);
      } finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
    });
  } finally {
    // Only the randomly named database created by this test may be removed.
    try {
      if (db.databaseName === name && /^cc_regression_\d+_[a-f0-9]+$/.test(name)) await db.dropDatabase();
    } finally { await client.close(); }
  }
});
