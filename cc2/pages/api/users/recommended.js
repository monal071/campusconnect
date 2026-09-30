import recommendations from "../connections/recommendations";
export default async function handler(req, res) {
  const json = res.json.bind(res);
  res.json = body => json(body.recommendations || body);
  return recommendations(req, res);
}
