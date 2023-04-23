import { EmbedBuilder, Message } from "discord.js";
import { splitBar } from "string-progressbar";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";
import { formatTime } from "../utils/time";

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
      .setTitle(`${queue.player.state.status === "playing" ? "▶" : "⏸"} ${i18n.__("nowplaying.embedTitle")}`)
      .setDescription(`[${song.title}](${song.url})`)
      .setColor("#69adc7")
      .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)

    
      nowPlaying.addFields(
        {
          name: "\u200b",
          value: formatTime(seek) +
            " [" +
            splitBar((song.duration == 0 ? seek : song.duration), seek, 15)[0] +
            "] " +
            (song.duration == 0 ? i18n.__mf("nowplaying.live") : formatTime(song.duration)),
          inline: false
        }
      );

      if (song.duration > 0) {
        nowPlaying.setFooter({
          text: i18n.__mf("nowplaying.timeRemaining", {
            time: formatTime(left)
          })
        });
      }

    return message.reply({ embeds: [nowPlaying] }).then(msg => purning(msg, true));
  }
};
