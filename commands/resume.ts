import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

export default {
  name: "resume",
  aliases: ["r"],
  description: i18n.__("resume.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("resume.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");

    if (queue.player.unpause()) {
      message.reply(i18n.__mf("resume.resultNotPlaying"))
        .then(msg => setTimeout(() => msg.delete(), 10000))
        .catch(console.error);
    }

    message.reply(i18n.__("resume.errorPlaying")).then(msg => setTimeout(() => msg.delete(), 10000)).catch(console.error);
  }
};
