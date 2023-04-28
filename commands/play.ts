import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { purning, validate } from "../utils/tools";

export default {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: i18n.__("play.description"),
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak
  ],
  async execute(message: Message, args: string[]) {
    const { channel } = message.member!.voice;

    if (!channel) return message.reply(i18n.__("play.errorNotChannel")).then(purning);

    if (!channel.joinable) return message.reply(i18n.__("play.missingPermissionConnect")).then(purning);

    if (!channel.permissionsFor(bot.client.user!.id, true)?.has(PermissionsBitField.Flags.Speak))
      return message.reply(i18n.__("play.missingPermissionSpeak")).then(purning);

    const queue = bot.queues.get(message.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }))
        .then(purning);

    if (!args.length && !message.attachments.size)
      return message.reply(i18n.__mf("play.usageReply", { prefix: bot.prefix })).then(purning);

    const loadingReply = await message.reply(i18n.__mf("common.loading"));

    const url = (!args.length) ? message.attachments.first()?.url! : args[0];
    let type: string | false = await validate(url);

    // Start the playlist if playlist url was provided
    if (type.toString().match(/playlist|album|artist/)) {
      loadingReply.delete().catch(() => null);
      return bot.commands.get("playlist")!.execute(message, args);
    }

    let song: Song;
    try {

      switch (type) {
        case "sp_track":
          song = await Song.fromSpotify(url);
          break;
        case "so_track":
          song = await Song.fromSoundCloud(url);
          break;
        case "dz_track":
          song = await Song.fromDeezer(url);
          break;
        case "audio":
          song = await Song.fromExternalLink(url);
          break;
        default:
          let search = args.join(" ");
          song = await Song.fromYoutube(url, search);
      }
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
    } finally {
      await loadingReply.delete().catch(() => null);
    }

    if (queue) {
      queue.enqueue(song);
    } else {
      const newQueue = new MusicQueue({
        message,
        connection: joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        })
      });

      bot.queues.set(message.guild!.id, newQueue);
      newQueue.enqueue(song);
    }

    return message
      .reply({
        embeds: [{
          description: i18n.__mf("play.queueAdded", {
            title: song.title,
            url: song.url
          }),
          color: 0x69adc7
        }]
      })
      .then(purning);
  }
};