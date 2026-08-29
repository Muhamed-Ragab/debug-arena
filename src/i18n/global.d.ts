import type enAdmin from "../../messages/en/admin.json";
import type enAuth from "../../messages/en/auth.json";
import type enBrowser from "../../messages/en/browser.json";
import type enCategory from "../../messages/en/category.json";
import type enChallenge from "../../messages/en/challenge.json";
import type enCommon from "../../messages/en/common.json";
import type enDifficulty from "../../messages/en/difficulty.json";
import type enError from "../../messages/en/error.json";
import type enLanding from "../../messages/en/landing.json";
import type enLeaderboard from "../../messages/en/leaderboard.json";
import type enProfile from "../../messages/en/profile.json";
import type enResults from "../../messages/en/results.json";
import type enStatus from "../../messages/en/status.json";
import type enValidation from "../../messages/en/validation.json";

declare global {
  interface IntlMessages {
    admin: typeof enAdmin;
    auth: typeof enAuth;
    browser: typeof enBrowser;
    category: typeof enCategory;
    challenge: typeof enChallenge;
    common: typeof enCommon;
    difficulty: typeof enDifficulty;
    error: typeof enError;
    landing: typeof enLanding;
    leaderboard: typeof enLeaderboard;
    profile: typeof enProfile;
    results: typeof enResults;
    status: typeof enStatus;
    validation: typeof enValidation;
  }
}
