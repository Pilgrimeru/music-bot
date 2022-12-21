import { Message, MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";

export default {
  name: "queue",
  cooldown: 5,
  aliases: ["q"],
  description: i18n.__("queue.description"),
  async execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);
    if (!queue || !queue.songs.length) return message.reply(i18n.__("queue.errorNotQueue"));

    let currentPage = 0;
    const embeds = generateQueueEmbed(message, queue.songs);

    let queueEmbed: Message;

    try {
      const row = new MessageActionRow().addComponents(
      
        new MessageButton().setCustomId("gauche").setEmoji('⬅️').setStyle('SECONDARY'),
    
        new MessageButton().setCustomId("droite").setEmoji('➡️').setStyle('SECONDARY'),
        
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

    const collector = queueEmbed.createMessageComponentCollector({time: 60000});

    collector.on('collect', async (q) => {
      if(q.customId === "gauche") {
        if (currentPage !== 0) {
          --currentPage;
          queueEmbed.edit({
            content: `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
            embeds: [embeds[currentPage]]
          });
        }
        await q.deferUpdate();
      }
      if(q.customId === "droite") {
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
      setTimeout(() => {
        queueEmbed.delete().catch();
      }, 5);
    });
  }
};

function generateQueueEmbed(message: Message, songs: Song[]) {
  let embeds : any = [];
  let k = 10;

  for (let i = 0; i < songs.length; i += 10) {
    const current = songs.slice(i, k);
    let j = i;
    k += 10;

    const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");

    const embed = new MessageEmbed()
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
