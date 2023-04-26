import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "volume",
  aliases: ["v"],
  description: i18n.__("volume.description"),
  execute(message: Message, args: Array<any>) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!))
      return message.reply(i18n.__("volume.errorNotChannel")).then(purning);

    if (!args[0])
      return message.reply(i18n.__mf("volume.currentVolume", { volume: queue.volume })).then(purning);

    if (isNaN(args[0])) return message.reply(i18n.__("volume.errorNotNumber")).then(purning);

    if (Number(args[0]) > 100 || Number(args[0]) < 0)
      return message.reply(i18n.__("volume.errorNotValid")).then(purning);

    queue.volume = args[0];
    queue.resource.volume?.setVolumeLogarithmic(args[0] / 100);

    return message.reply(i18n.__mf("volume.result", { arg: args[0] })).then(purning);
  }
};