import { Message } from "discord.js";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/tools";

export default {
  name: "ping",
  cooldown: 2,
  description: i18n.__("ping.description"),
  execute(message: Message) {
    message
      .reply(i18n.__mf("ping.result", { ping: Math.round(message.client.ws.ping) }))
      .then(purning);
  }
};