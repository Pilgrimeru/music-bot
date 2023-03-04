import { Message, EmbedBuilder, TextChannel } from "discord.js";
import youtube from "youtube-sr";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

type CustomTextChannel = TextChannel & { activeCollector: boolean };

export default {
  name: "search",
  description: i18n.__("search.description"),
  async execute(message: Message, args: any[]) {
    if (!args.length)
      return message
        .reply(i18n.__mf("search.usageReply", { prefix: bot.prefix, name: module.exports.name }))
        .then(msg => purning(msg));

    if ((message.channel as CustomTextChannel).activeCollector)
      return message.reply(i18n.__("search.errorAlreadyCollector"));

    if (!message.member?.voice.channel) return message.reply(i18n.__("search.errorNotChannel")).then(msg => purning(msg));

    const search = args.join(" ");

    let resultsEmbed = new EmbedBuilder()
      .setTitle(i18n.__("search.resultEmbedTitle"))
      .setDescription(i18n.__mf("search.resultEmbedDesc", { search: search }))
      .setColor("#F8AA2A");

    try {
      const results = await youtube.search(search, { limit: 10, type: "video" });

      results.map((video, index) =>

        resultsEmbed.addFields(
          {
            name: `https://youtube.com/watch?v=${video.id}`,
            value: `${index + 1}. ${video.title}`,
            inline: true
          }
        )
      );

      let resultsMessage = await (message.channel as TextChannel).send({ embeds: [resultsEmbed] });

      function filter(msg: Message) {
        const pattern = /^[1-9][0]?(\s*,\s*[1-9][0]?)*$/;
        return pattern.test(msg.content);
      }

      (message.channel as CustomTextChannel).activeCollector = true;

      const response = await (message.channel as TextChannel).awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] });
      const reply = response.first()!.content;

      if (reply.includes(",")) {
        let songs = reply.split(",").map((str: string) => str.trim());

        for (let song of songs) {
          await bot.commands.get("play")!.execute(message, [resultsEmbed.data.fields![parseInt(song) - 1].name]);
        }
      } else {
        const choice: any = resultsEmbed.data.fields![parseInt(response.first()?.toString()!) - 1].name;
        bot.commands.get("play")!.execute(message, [choice]);
      }

      (message.channel as CustomTextChannel).activeCollector = false;
      resultsMessage.delete().catch(console.error);
      response.first()!.delete().catch(console.error);
    } catch (error: any) {
      console.error(error);
      (message.channel as CustomTextChannel).activeCollector = false;
      message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
    }
  }
};
