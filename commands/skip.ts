import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "skip",
  aliases: ["s"],
  description: i18n.__("skip.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("skip.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);
    
    if (queue.loop == "track") queue.loop = false;
    
    queue.player.stop(true);

    queue.textChannel.send(i18n.__mf("skip.result")).then(purning);
  }
};