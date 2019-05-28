import * as express from "express";
import renderer from "lib/rendererSingleton";

import { badRequest } from "api/helpers/errors";

export function getURLFromQuery(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // url
  if (req.method === "GET" && !req.query.url) {
    badRequest({ res, message: "Missing URL in query params" });
    return;
  }
  res.locals.url = new URL(decodeURIComponent(req.query.url));
  next();
}

export function getURLFromBody(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method === "POST" && !req.body.url) {
    badRequest({ res, message: "Missing URL in body" });
    return;
  }
  res.locals.url = req.body.url;
  next();
}

export function validateURL(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  // Prevent browsing the filesystem using Chrome
  if (!["http:", "https:"].includes(url.protocol)) {
    badRequest({ res, message: "Disallowed protocol" });
    return;
  }
  next();
}

export async function render(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  const { statusCode, headers, content } = await renderer.task({ url });
  res
    .status(statusCode)
    .header("Content-Type", "text/html")
    // Only whitelist loading styles resources when testing
    // (will not change programmatic use of this system)
    .header(
      "Content-Security-Policy",
      [
        "default-src 'none'",
        "style-src * 'unsafe-inline'",
        "img-src * data:",
        "font-src *"
      ].join("; ")
    )
    .send(content);
}

export async function renderJSON(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { url } = res.locals;
  const { statusCode, headers, content } = await renderer.task({ url });
  res.status(200).json({
    statusCode,
    headers,
    content
  });
}
