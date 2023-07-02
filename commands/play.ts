import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
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
    const type: string | false = await validate(url);
    const search = args.join(" ");
    let songs: Song[] = [];

    // Start the playlist if playlist url was provided
    let playlist: Playlist | undefined = undefined;
    try {
      if (type.toString().match(/playlist|album|artist/)) {
        loadingReply.edit(i18n.__mf("playlist.fetchingPlaylist"));
        playlist = await Playlist.from(url, search, type.toString());
        songs = playlist.songs;
      } else {
        songs.push(await Song.from(url, search, type.toString()));
      }
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
    } finally {
      loadingReply.delete().catch(() => null);
    }

    if (queue) {
      queue.enqueue(...songs);
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
      newQueue.enqueue(...songs);
    }

    if (playlist) {
      message.reply({
        embeds: [{
          description: i18n.__mf("playlist.startedPlaylist", {
            title: playlist.title,
            url: playlist.url,
            length: playlist.songs.length
          }),
          color: 0x69adc7
        }]
      })
        .then(purning);
    } else {
      return message.reply({
        embeds: [{
          description: i18n.__mf("play.queueAdded", {
            title: songs[0].title,
            url: songs[0].url
          }),
          color: 0x69adc7
        }]
      })
        .then(purning);
    }
  }
};