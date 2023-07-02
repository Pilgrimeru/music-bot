import move from "array-move";
import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "move",
  aliases: ["mv"],
  description: i18n.__("move.description"),
  execute(message: Message, args: number[]) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("move.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!)) return;

    if (!args.length || isNaN(args[0]) || args[0] < 1)
      return message.reply(i18n.__mf("move.usagesReply", { prefix: bot.prefix })).then(purning);

    if (!args[1]) args[1] = queue.index + 1;

    let song = queue.songs[Number(args[0]) + queue.index];

    queue.songs = move(queue.songs, queue.index + Number(args[0]), queue.index + Number(args[1]));

    queue.textChannel.send(
      i18n.__mf("move.result", {
        title: song.title,
        index: args[1]
      })
    ).then(purning);
  }
};