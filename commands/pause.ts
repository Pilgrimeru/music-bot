import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";
import { bot } from "../index";
import { Message } from "discord.js";
import { purning } from "../utils/pruning";

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
