import { Router } from "express";
import { requireModule } from "../../middleware/org.js";
import { orgCoreRouter } from "./core.js";
import { branchesRouter } from "../branches/router.js";
import { catalogRouter } from "../catalog/router.js";
import { staffRouter } from "../staff/router.js";
import { chatbotRouter } from "../chatbot/router.js";
import { conversationsRouter } from "../conversations/router.js";
import { appointmentsRouter, inquiriesRouter, ordersRouter } from "../intake/router.js";

// Mounted at /v1/orgs/:orgId after requireJwt, requireUser, loadOrg, requireMember.
export const orgRouter = Router({ mergeParams: true });
orgRouter.use("/branches", requireModule("branches"), branchesRouter);
orgRouter.use("/catalog", requireModule("catalog"), catalogRouter);
orgRouter.use("/staff", requireModule("staff"), staffRouter);
orgRouter.use("/chatbot", chatbotRouter);
orgRouter.use("/conversations", conversationsRouter);
orgRouter.use("/orders", ordersRouter);
orgRouter.use("/appointments", appointmentsRouter);
orgRouter.use("/inquiries", inquiriesRouter);
orgRouter.use("/", orgCoreRouter);
