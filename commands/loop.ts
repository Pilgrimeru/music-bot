import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue, purning } from "../utils/tools";

export default {
  name: "loop",
  aliases: ["l"],
  description: i18n.__("loop.description"),
  async execute(message: Message) {
    const queue = bot.queues.get(message.guild!.id);

    if (!queue) return message.reply(i18n.__("loop.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member!)) return i18n.__("common.errorNotChannel");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("queue")
        .setEmoji("🔁")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("track")
        .setEmoji("🔂")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("false")
        .setEmoji("🚫")
        .setStyle(ButtonStyle.Secondary)
    );

    const resultsMessage = await message.reply({
      content: i18n.__("loop.resultEmbedTitle"),
      components: [row]
    });

    await resultsMessage
      .awaitMessageComponent({
        time: 30000
      })
      .then(async (selectInteraction) => {
        if ((selectInteraction instanceof ButtonInteraction)) {
          if (selectInteraction.customId === "queue") {
            queue.loop = "queue"
          } else if (selectInteraction.customId === "track") {
            queue.loop = "track"
          } else {
            queue.loop = false;
          }
        }
        selectInteraction.update({content: i18n.__mf("loop.result", { loop: queue.loop}), components: []});
      })
      .catch(() => resultsMessage.delete().catch(() => null));

    purning(resultsMessage);
  }
};