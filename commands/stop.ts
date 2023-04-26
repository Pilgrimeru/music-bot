import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "stop",
  description: i18n.__("stop.description"),
  execute(message: Message) {

    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("stop.errorNotQueue")).then(purning);
    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);

    queue.stop();
    queue.textChannel.send(i18n.__mf("stop.result")).then(purning);

  }
};