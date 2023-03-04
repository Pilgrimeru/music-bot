import { Message } from "discord.js";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";
import { bot } from "../index";
import { purning } from "../utils/pruning";

export default {
  name: "volume",
  aliases: ["v"],
  description: i18n.__("volume.description"),
  execute(message: Message, args: Array<any>) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).then(msg => purning(msg));

    if (!canModifyQueue(message.member!))
      return message.reply(i18n.__("volume.errorNotChannel")).then(msg => purning(msg));

    if (!args[0])
      return message.reply(i18n.__mf("volume.currentVolume", { volume: queue.volume })).then(msg => purning(msg));

    if (isNaN(args[0])) return message.reply(i18n.__("volume.errorNotNumber")).then(msg => purning(msg));

    if (Number(args[0]) > 100 || Number(args[0]) < 0)
      return message.reply(i18n.__("volume.errorNotValid")).then(msg => purning(msg));

    queue.volume = args[0];
    queue.resource.volume?.setVolumeLogarithmic(args[0] / 100);

    return message.reply(i18n.__mf("volume.result", { arg: args[0] })).then(msg => purning(msg));
  }
};
