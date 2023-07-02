import { Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "shuffle",
  description: i18n.__("shuffle.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("shuffle.errorNotQueue")).then(purning);

    if (!canModifyQueue(message.member!)) return message.reply(i18n.__("common.errorNotChannel")).then(purning);

    let previousSongs = queue.songs.slice(0, queue.index);
    let followingSongs = queue.songs.slice(queue.index);

    for (let i = followingSongs.length - 1; i > 1; i--) {
      let j = 1 + Math.floor(Math.random() * i);
      [followingSongs[i], followingSongs[j]] = [followingSongs[j], followingSongs[i]];
    }

    queue.songs = previousSongs.concat(followingSongs);

    queue.textChannel.send(i18n.__mf("shuffle.result")).then(purning);
  }
};