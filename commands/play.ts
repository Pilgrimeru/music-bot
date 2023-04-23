import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { Message, PermissionsBitField } from "discord.js";
import { so_validate, sp_validate, yt_validate } from "play-dl";
import { Track, parse } from 'spotify-uri';
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { purning } from "../utils/pruning";

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

    if (!args.length) return message.reply(i18n.__mf("play.usageReply", { prefix: bot.prefix })).then(purning);

    const url = args[0];
    let search = args.join(" ");

    const loadingReply = await message.reply(i18n.__mf("common.loading"));

    // Start the playlist if playlist url was provided
    if (
      url.startsWith('https') && yt_validate(url) === "playlist" ||
      sp_validate(url) === "playlist" || sp_validate(url) === "album" ||
      await so_validate(url) === "playlist"
    ) {
      await loadingReply.delete().catch(() => null);;
      return bot.commands.get("playlist")!.execute(message, args);
    }

    let song;
    if (sp_validate(url) === "track") {

      await bot.spotifyApiConnect();

      const trackId = (parse(url) as Track).id;

      await bot.spotify.getTrack(trackId)
        .then(function (data: any) {
          search = data.body.artists[0].name + " " + data.body.name;
        }, function (err: any) {
          console.error(err);
        });
    }

    try {
      song = await Song.from(url, search);
    } catch (error) {
      console.error(error);
      return message.reply(i18n.__("common.errorCommand")).then(msg => purning(msg));
    } finally {
      await loadingReply.delete().catch(() => null);
    }

    if (queue) {
      queue.songs.push(song);

      return message
        .reply(i18n.__mf("play.queueAdded", { title: song.title }))
        .then(purning)
        .catch(console.error);
    }

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
};
