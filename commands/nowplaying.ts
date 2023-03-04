import { Message, EmbedBuilder } from "discord.js";
import { splitBar } from "string-progressbar";
import { i18n } from "../utils/i18n";
import { bot } from "../index";
import { purning } from "../utils/pruning";

export default {
  name: "nowplaying",
  aliases: ["np"],
  cooldown: 10,
  description: i18n.__("nowplaying.description"),
  execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue || !queue.songs.length)
      return message.reply(i18n.__("nowplaying.errorNotQueue")).catch(console.error);

    const song = queue.songs[0];
    const seek = queue.resource.playbackDuration;
    const left = song.duration - seek;

    let nowPlaying = new EmbedBuilder()
      .setTitle(i18n.__("nowplaying.embedTitle"))
      .setDescription(`${song.title}\n${song.url}`)
      .setColor("#F8AA2A");

    if (song.duration > 0) {
      nowPlaying.addFields(
        {
          name: "\u200b",
          value: new Date(seek).toISOString().slice(11, 19) +
            "[" +
            splitBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
            "]" +
            (song.duration == 0 ? i18n.__mf("nowplaying.live") : new Date(song.duration).toISOString().slice(11, 19)),
          inline: false
        }
      );

      nowPlaying.setFooter({
        text: i18n.__mf("nowplaying.timeRemaining", {
          time: new Date(left).toISOString().slice(11, 19)
        })
      });
    }

    return message.reply({ embeds: [nowPlaying] }).then(msg => purning(msg, true));
  }
};
