import "dotenv/config";
import { Config } from "../interfaces/Config";

let config: Config;

try {
  config = require("../config.json");
} catch (error) {
  config = {
    TOKEN: process.env.TOKEN || "",
    PREFIX: process.env.PREFIX || "!",
    MAX_PLAYLIST_SIZE: (parseInt(process.env.MAX_PLAYLIST_SIZE!) > 1) ? parseInt(process.env.MAX_PLAYLIST_SIZE!) : 10,
    PRUNING: process.env.PRUNING === "true" ? true : false,
    STAY_TIME: parseInt(process.env.STAY_TIME!) || 1,
    AUDIO_QUALITY: parseInt(process.env.AUDIO_QUALITY!) >= 0 && parseInt(process.env.AUDIO_QUALITY!) <= 2 ? parseInt(process.env.AUDIO_QUALITY!) as 0 | 1 | 2 : 0,
    DEFAULT_VOLUME: parseInt(process.env.DEFAULT_VOLUME!) || 100,
    LOCALE: process.env.LOCALE || "en"
  };
}

export { config };
