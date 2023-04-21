import { Message } from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";
import { canModifyQueue } from "../utils/queue";

const pattern = /^[1-9][0-9]{0,2}(\s*,\s*[1-9][0-9]{0,2})*$/;

export default {
  name: "remove",
  aliases: ["rm"],
  description: i18n.__("remove.description"),
  execute(message: Message, args: any[]) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("remove.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);

    if (!args.length) return message.reply(i18n.__mf("remove.usageReply", { prefix: bot.prefix })).then(purning);

    const removeArgs = args.join("");

    const songs = removeArgs.split(",").map((arg) => parseInt(arg));

    if (pattern.test(removeArgs)) {
      let removed: Song[] = [];

      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex) => songIndex === index)) removed.push(item);
        else return true;
      });

      queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: removed.map((song) => song.title).join("\n")
        })
      ).then(purning);
    } else if (!isNaN(args[0]) && args[0] >= 1 && args[0] < queue.songs.length) {
      return queue.textChannel.send(
        i18n.__mf("remove.result", {
          title: queue.songs.splice(args[0], 1)[0].title
        })
      ).then(purning);
    } else {
      return message.reply(i18n.__mf("remove.usageReply", { prefix: bot.prefix })).then(purning);
    }
  }
};
