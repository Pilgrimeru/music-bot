import { Message, EmbedBuilder } from "discord.js";
import { i18n } from "../utils/i18n";
// @ts-ignore
import lyricsFinder from "lyrics-finder";
import { bot } from "../index";
import { purning } from "../utils/pruning";

export default {
  name: "lyrics",
  aliases: ["ly"],
  description: i18n.__("lyrics.description"),
  async execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue || !queue.songs.length) return message.reply(i18n.__("lyrics.errorNotQueue")).then(purning);

    let lyrics = null;
    const title = queue.songs[0].title;

    try {
      lyrics = await lyricsFinder(queue.songs[0].title, "");
      if (!lyrics) lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    } catch (error) {
      lyrics = i18n.__mf("lyrics.lyricsNotFound", { title: title });
    }

    let lyricsEmbed = new EmbedBuilder()
      .setTitle(i18n.__mf("lyrics.embedTitle", { title: title }))
      .setDescription(lyrics)
      .setColor("#69adc7")
      .setTimestamp();

    if (lyricsEmbed.data.description!.length >= 4096)
      lyricsEmbed.setDescription(`${lyricsEmbed.data.description!.slice(0, 4093)}...`);

    return message.reply({ embeds: [lyricsEmbed] }).then(msg => purning(msg, true));
  }
};
