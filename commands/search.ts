import { ActionRowBuilder, Message, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import youtube, { Video } from "youtube-sr";
import { bot } from "../index";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

export default {
  name: "search",
  aliases: ["sh"],
  description: i18n.__("search.description"),
  async execute(message: Message, args: any[]) {
    if (!args.length)
      return message
        .reply(i18n.__mf("search.usageReply", { prefix: bot.prefix, name: module.exports.name }))
        .then(msg => purning(msg));

    if (!message.member?.voice.channel) return message.reply(i18n.__("search.errorNotChannel")).then(msg => purning(msg));

    const search = args.join(" ");

      let results: Video[] = [];

      const loadingReply = await message.reply(i18n.__mf("common.loading"));

      try {
        results = await youtube.search(search, { limit: 10, type: "video" });
      } catch (error: any) {
        console.error(error);
        return message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
      } finally {
        loadingReply.delete().catch(() => null);
      }
  
      const options = results
      .filter((video) => video.title != undefined && video.title != "Private video" && video.title != "Deleted video")
      .map((video) => {
        return {
          label: video.title!,
          value: video.url
        };
      });
      
      if (options.length === 0)
        return message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
  
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("search-select")
          .setPlaceholder(i18n.__("search.menuNothing"))
          .setMinValues(0)
          .setMaxValues(1)
          .addOptions(options)
      );
  
      const resultsMessage = await message.reply({
        content: i18n.__("search.resultEmbedTitle"),
        components: [row]
      });
  
      resultsMessage
        .awaitMessageComponent({
          time: 30000
        })
        .then(async (selectInteraction) => {
          if ((selectInteraction instanceof StringSelectMenuInteraction)) {
            await selectInteraction.update({content : i18n.__("search.finished"), components: []}).catch(console.error);
            bot.commands.get("play")!.execute(message, [selectInteraction.values[0]]);
          }
          config.PRUNING && resultsMessage.delete().catch(() => null);
        })
        .catch(() => resultsMessage.delete().catch(() => null));
      
    }
  };