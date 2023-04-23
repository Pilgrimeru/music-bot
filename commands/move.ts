import move from "array-move";
import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";
import { canModifyQueue } from "../utils/queue";

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

    if (!args[1]) args[1] = 1;

    let song = queue.songs[args[0]];

    queue.songs = move(queue.songs, args[0], args[1]);

    queue.textChannel.send(
      i18n.__mf("move.result", {
        title: song.title,
        index: args[1]
      })
    ).then(purning);
  }
};
