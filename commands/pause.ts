import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "pause",
  description: i18n.__("pause.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("pause.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);

    if (queue.player.pause()) {
      message.reply(i18n.__mf("pause.result")).then(purning);
    }
  }
};