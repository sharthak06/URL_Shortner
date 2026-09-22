import { urlRepository } from "../url.container.js";
import { CacheWarmerService } from "./cache-warmer.service.js";

const cacheWarmerService = new CacheWarmerService(urlRepository);

export { cacheWarmerService };
