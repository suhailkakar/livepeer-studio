import Router from "express/lib/router";
import { db } from "../store";
import { authorizer, validatePost } from "../middleware";
import { products } from "../config";
import { reportUsage } from "./stripe";

const app = Router();

app.get("/", authorizer({ anyAdmin: true }), async (req, res) => {
  let { fromTime, toTime } = req.query;

  // if time range isn't specified return all usage
  if (!fromTime && !toTime) {
    fromTime = +new Date(2020, 0); // start at beginning
    toTime = +new Date();
  }

  const cachedUsageHistory = await db.stream.cachedUsageHistory(
    fromTime,
    toTime,
    {
      useReplica: true,
    }
  );

  res.status(200);
  res.json(cachedUsageHistory);
});

app.post(
  "/update",
  authorizer({ anyAdmin: true }),
  validatePost("usage"),
  async (req, res) => {
    let { fromTime, toTime } = req.query;

    let token = req.token;

    // New automated billing usage report
    let result = await reportUsage(req, token);

    res.status(200);
    res.json(result);
  }
);

export default app;