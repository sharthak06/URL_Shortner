import { UrlRepository } from "./url.repository.js";
import { UrlService } from "./url.service.js";
import { URLController } from "./url.controller.js";

const urlRepository = new UrlRepository();
const urlService = new UrlService(urlRepository);
const urlController = new URLController(urlService);

export { urlRepository, urlService, urlController };
