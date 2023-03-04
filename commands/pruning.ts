import { Message, TextChannel } from "discord.js";
import { writeFile } from "fs";
import { Config } from "../interfaces/Config";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

export default {
  name: "pruning",
  description: i18n.__("pruning.description"),
  async execute(message: Message) {
    let config: Config | undefined;

    try {
      config = require("../config.json");
    } catch (error) {
      config = undefined;
      console.error(error);
    }

    if (config) {
      config.PRUNING = !config.PRUNING;

      writeFile("./config.json", JSON.stringify(config, null, 2), (err) => {
        if (err) {
          console.log(err);
          return (message.channel as TextChannel).send(i18n.__("pruning.errorWritingFile")).then(msg => purning(msg));
        }

        return (message.channel as TextChannel)
          .send(
            i18n.__mf("pruning.result", {
              result: config!.PRUNING ? i18n.__("common.enabled") : i18n.__("common.disabled")
            })
          )
          .then(msg => purning(msg));
      });
    }
  }
};
