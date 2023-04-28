import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
import { i18n } from "../utils/i18n";
import { purning, validate } from "../utils/tools";

export default {
  name: "playlist",
  cooldown: 5,
  aliases: ["pl"],
  description: i18n.__("playlist.description"),
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak
  ],
  async execute(message: Message, args: any[]) {
    const { channel } = message.member!.voice;

    const queue = bot.queues.get(message.guild!.id);

    if (!args.length)
      return message.reply(i18n.__mf("playlist.usagesReply", { prefix: bot.prefix })).then(purning);

    if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).then(purning);

    if (!channel.joinable) return message.reply(i18n.__("playlist.missingPermissionConnect")).then(purning);

    if (!channel.permissionsFor(bot.client.user!.id, true)?.has(PermissionsBitField.Flags.Speak)) {
      return message.reply(i18n.__("playlist.missingPermissionSpeak")).then(purning);
    }

    if (queue && channel.id !== queue.connection.joinConfig.channelId)
      return message
        .reply(i18n.__mf("playlist.errorNotInSameChannel", { user: message.client.user!.username }))
        .then(purning);

    const loadingReply = await message.reply(i18n.__mf("playlist.fetchingPlaylist"));

    const url: string = args[0];
    let type: string | false = await validate(url);

    let playlist: Playlist;

    try {
      if (type === "sp_playlist" || type === "sp_album" || type === "sp_artist") {
        playlist = await Playlist.fromSpotify(url);
      } else if (type === "so_playlist") {
        playlist = await Playlist.fromSoundcloud(url);
      } else if (type === "dz_playlist" || type === "dz_album") {
        playlist = await Playlist.fromDeezer(url);
      } else {
        let search = args.join(" ");
        playlist = await Playlist.fromYoutube(url, search);
      }
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).then(purning);
    } finally {
      loadingReply.delete().catch(() => null);
    }

    if (queue) {
      queue.enqueue(...playlist.songs);
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
      newQueue.enqueue(...playlist.songs);
    }

    message
      .reply({
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
  }
};