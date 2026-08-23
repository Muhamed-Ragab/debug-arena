import { initContract } from "@ts-rest/core";
import {
  SubmitAttemptSchema,
  SubmissionResultSchema,
  SubmissionErrorSchema,
} from "./submissions.schema";

const c = initContract();

export const submissionsContract = c.router({
  submit: {
    method: "POST",
    path: "/submissions",
    body: SubmitAttemptSchema,
    responses: {
      201: SubmissionResultSchema,
      400: SubmissionErrorSchema,
    },
  },
});
