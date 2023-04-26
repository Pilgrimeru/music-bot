import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "resume",
  aliases: ["r"],
  description: i18n.__("resume.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("resume.errorNotQueue")).then(purning);
    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);

    if (queue.player.unpause()) {
      message.reply(i18n.__mf("resume.resultNotPlaying"))
        .then(purning);
    }

    message.reply(i18n.__("resume.errorPlaying")).then(purning);
  }
};