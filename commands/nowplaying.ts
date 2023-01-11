import { Message, MessageEmbed } from "discord.js";
import { splitBar } from "string-progressbar";
import { i18n } from "../utils/i18n";
import { bot } from "../index";

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

    let nowPlaying = new MessageEmbed()
      .setTitle(i18n.__("nowplaying.embedTitle"))
      .setDescription(`${song.title}\n${song.url}`)
      .setColor("#F8AA2A");

    if (song.duration > 0) {
      nowPlaying.addFields(
        { 
          name: "\u200b",
          value:  new Date(seek).toISOString().substr(11, 8) +
                  "[" +
                  splitBar(song.duration == 0 ? seek : song.duration, seek, 20)[0] +
                  "]" +
                  (song.duration == 0 ? i18n.__mf("nowplaying.live") : new Date(song.duration).toISOString().substr(11, 8)),
          inline: false 
        }
      );

      nowPlaying.setFooter({
        text: i18n.__mf("nowplaying.timeRemaining", {
          time: new Date(left).toISOString().substr(11, 8)
        })
      });
    }

    return message.reply({ embeds: [nowPlaying] }).then(msg => setTimeout(() => msg.delete(), 30000));
  }
};
