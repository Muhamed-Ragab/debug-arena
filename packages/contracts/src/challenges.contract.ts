import { initContract } from "@ts-rest/core";
import {
  ChallengeListQuerySchema,
  ChallengeListResponseSchema,
  ChallengeDetailPathParamsSchema,
  ChallengeDetailSchema,
  ChallengeDetailErrorSchema,
} from "./challenges.schema";

const c = initContract();

export const challengesContract = c.router({
  list: {
    method: "GET",
    path: "/challenges",
    query: ChallengeListQuerySchema,
    responses: {
      200: ChallengeListResponseSchema,
    },
  },
  detail: {
    method: "GET",
    path: "/challenges/:id",
    pathParams: ChallengeDetailPathParamsSchema,
    responses: {
      200: ChallengeDetailSchema,
      404: ChallengeDetailErrorSchema,
    },
  },
});
