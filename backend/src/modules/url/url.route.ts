import { Router } from "express";
import { urlController } from "./url.container.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUrlSchema,
  updateUrlSchema,
  getUserUrlsQuerySchema,
} from "./url.schema.js";

const urlRouter = Router();

urlRouter.post(
  "/",
  authMiddleware,
  validate(createUrlSchema),
  urlController.createShortUrl
);

urlRouter.get(
  "/",
  authMiddleware,
  validate(getUserUrlsQuerySchema, "query"),
  urlController.getUserUrls
);

urlRouter.patch(
  "/:shortCode",
  authMiddleware,
  validate(updateUrlSchema),
  urlController.updateOriginalUrl
);

// 4. Delete Short URL Endpoint (DELETE /api/v1/urls/:shortCode)
urlRouter.delete(
  "/:shortCode",
  authMiddleware,
  urlController.deleteShortUrl
);

// 5. Public Redirection Endpoint (GET /api/v1/urls/r/:shortCode)
urlRouter.get("/r/:shortCode", urlController.redirectToOriginalURL);

export default urlRouter;


