import like from "../like";
export default function handler(req, res) {
  req.body = { resourceId: req.query.resourceId };
  return like(req, res);
}
