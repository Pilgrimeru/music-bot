import { Message, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

export default {
  name: "queue",
  cooldown: 5,
  aliases: ["q"],
  description: i18n.__("queue.description"),
  async execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);
    if (!queue || !queue.songs.length) return message.reply(i18n.__("queue.errorNotQueue")).then(msg => purning(msg));

    let currentPage = 0;
    const embeds = generateQueueEmbed(message, queue.songs);

    let queueEmbed: Message;

    try {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(

        new ButtonBuilder().setCustomId("left").setEmoji('⬅️').setStyle(ButtonStyle.Secondary),

        new ButtonBuilder().setCustomId("right").setEmoji('➡️').setStyle(ButtonStyle.Secondary),

      );

      queueEmbed = await message.reply({
        content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
        embeds: [embeds[currentPage]],
        components: [row]
      });

    } catch (error: any) {
      console.error(error);
      message.reply(error.message).catch(console.error);
      return;
    }

    const collector = queueEmbed.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async (q) => {
      if (q.customId === "left") {
        if (currentPage !== 0) {
          --currentPage;
          queueEmbed.edit({
            content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
            embeds: [embeds[currentPage]]
          });
        }
        await q.deferUpdate();
      }
      if (q.customId === "right") {
        if (currentPage < embeds.length - 1) {
          currentPage++;
          queueEmbed.edit({
            content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
            embeds: [embeds[currentPage]]
          });
        }
        await q.deferUpdate();
      }
    });
    collector.on("end", () => {
      queueEmbed.delete().catch(() => null);
    });
  }
};

function generateQueueEmbed(message: Message, songs: Song[]) {
  let embeds: EmbedBuilder[] = [];
  let k = 11;

  for (let i = 0; i < songs.length; i += 10) {
    const current = songs.slice(i + 1, k);
    let j = i + 1;
    k += 10;

    const info = current.map((track) => `${j++} - [${track.title}](${track.url})`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle(i18n.__("queue.embedTitle"))
      .setThumbnail(message.guild?.iconURL()!)
      .setColor("#F8AA2A")
      .setDescription(
        i18n.__mf("queue.embedCurrentSong", { title: songs[0].title, url: songs[0].url, info: info })
      )
      .setTimestamp();
    embeds.push(embed);
  }

  return embeds;
}
