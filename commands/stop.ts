import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";
import { canModifyQueue } from "../utils/queue";

export default {
  name: "stop",
  description: i18n.__("stop.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) message.reply(i18n.__("stop.errorNotQueue")).then(msg => purning(msg));
    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(msg => purning(msg));

    if (queue) setTimeout(() => {
      queue.textChannel.send(i18n.__mf("stop.result")).then(msg => purning(msg));
    }, 500);

    queue?.stop();
  }
};
