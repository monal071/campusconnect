import friends from "./connections/friends";
export default async function handler(req, res) {
  const json = res.json.bind(res);
  res.json = body => json(body.friends ? body.friends.map(user => ({ ...user, connectionId: user._id })) : body);
  return friends(req, res);
}
