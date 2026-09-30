import { ObjectId } from "mongodb";
import { getQuizDb } from "../utils/mongodb";
import { connectionState } from "./connections";

export async function joinedEventFilter(db, userId) {
  const rsvps = await db.collection("rsvps").find({ userId }, { projection: { eventId: 1, status: 1 } }).toArray();
  const ids = status => rsvps.filter(r => status(r.status) && ObjectId.isValid(r.eventId)).map(r => new ObjectId(r.eventId));
  return { status: "approved", _id: { $nin: ids(status => status !== "going") }, $or: [{ joined: { $in: [userId, new ObjectId(userId)] } }, { _id: { $in: ids(status => status === "going") } }] };
}

export async function dashboardStats(client, db, user) {
  const { id, email, role } = user;
  const ids = [id, new ObjectId(id)];
  const teaches = role === "faculty" || role === "admin";
  const quizDb = getQuizDb(client);
  const quizFilter = { createdBy: { $in: [...ids, email] } };
  const eventFilter = await joinedEventFilter(db, id);
  const [state, posts, events, eventsCreated, resources, jobs, quizzes, submissions] = await Promise.all([
    connectionState(db, id),
    db.collection("posts").countDocuments({ $or: [{ "author.id": { $in: ids } }, { userId: { $in: ids } }] }),
    db.collection("events").countDocuments(eventFilter),
    db.collection("events").countDocuments({ createdBy: { $in: ids } }),
    db.collection("resources").countDocuments({ userId: { $in: ids } }),
    db.collection("jobs").countDocuments({ $or: [{ createdBy: { $in: ids } }, { postedBy: { $in: ids } }] }),
    teaches ? quizDb.collection("quizzes").find(quizFilter).project({ isActive: 1 }).toArray() : [],
    teaches ? [] : quizDb.collection("quizSubmissions").aggregate([{ $match: { userId: id } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$percentageScore" } } }]).toArray(),
  ]);
  const quizStats = teaches && quizzes.length ? await quizDb.collection("quizSubmissions").aggregate([{ $match: { quizId: { $in: quizzes.map(q => q._id) } } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$percentageScore" } } }]).toArray() : submissions;
  return { connections: state.friends.length, posts, events, eventsCreated, resources, jobs, quizzes: { totalQuizzes: quizzes.length, activeQuizzes: quizzes.filter(q => q.isActive).length, submissions: quizStats[0]?.count || 0, averageScore: Math.round(quizStats[0]?.average || 0) } };
}

export async function upcomingEvents(db, userId) {
  // Date-only campus events stay visible throughout the event day in India.
  const today = new Date(new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10) + "T00:00:00+05:30");
  return db.collection("events").aggregate([
    { $match: await joinedEventFilter(db, userId) },
    { $addFields: { eventDate: { $convert: { input: "$date", to: "date", onError: null, onNull: null } } } },
    { $addFields: { upcoming: { $gte: ["$eventDate", today] }, eventOrder: { $cond: [{ $gte: ["$eventDate", today] }, { $toLong: "$eventDate" }, { $multiply: [{ $ifNull: [{ $toLong: "$eventDate" }, 0] }, -1] }] } } },
    { $sort: { upcoming: -1, eventOrder: 1 } }, { $limit: 3 },
    { $project: { title: 1, date: 1, location: 1, description: 1, upcoming: 1 } },
  ]).toArray();
}
