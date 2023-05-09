import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  entersState
} from "@discordjs/voice";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  PermissionsBitField,
  TextChannel,
  VoiceState,
} from "discord.js";
import { bot } from "../index";
import { QueueOptions } from "../interfaces/QueueOptions";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { canModifyQueue, clearMemory, formatTime, purning } from "../utils/tools";
import { Song } from "./Song";

export class MusicQueue {

  public readonly textChannel: TextChannel;
  public readonly connection: VoiceConnection;
  public readonly player: AudioPlayer;
  private readonly message: Message;
  private readonly bot = bot;

  public songs: Song[] = [];
  public volume = config.DEFAULT_VOLUME || 100;
  public loop : "queue" | "track" | false = false;
  public resource: AudioResource;

  private nowPlayingCollector: any;
  private stopped = false;

  public constructor(options: QueueOptions) {
    Object.assign(this, options);
    this.textChannel = options.message.channel as TextChannel;
    this.player = createAudioPlayer({
      behaviors: {
        maxMissedFrames: 45,
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });
    this.connection.subscribe(this.player);
    clearMemory();

    this.connection.on(VoiceConnectionStatus.Disconnected, async (_, disconnection) => {
      if ((disconnection.reason == 0 && disconnection.closeCode == 4014) || disconnection.reason == 3)
        return this.stop();
      try {
        this.connection.configureNetworking();
        this.connection.rejoin();
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        console.error(error);
        this.leave();
      }
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.skip();
    });

    this.player.on(AudioPlayerStatus.AutoPaused, () => {
      if (!this.stopped) {
        this.connection.subscribe(this.player);
        this.connection.configureNetworking();
      }
    });

    this.player.on("error", (error) => {
      console.error(error.message);
      this.skip();
    });

    this.bot.client.on("voiceStateUpdate", async (voice: VoiceState) => {
      setTimeout(() => {
        let voiceChannel = voice.channel;
        let clientChannel = voice.guild.members.me!.voice.channelId;
        if (voiceChannel?.id === clientChannel) {
          let nbUser = voiceChannel?.members.filter(
            (member) => !member.user.bot
          );
          if (nbUser?.size === 0) {
            this.leave();
          }
        }
      }, 5000);
    });
  }

  private skip() {
    this.nowPlayingCollector?.stop();
    if (this.loop === "track") {
      this.processQueue();
    } else if (this.loop === "queue") {
      this.enqueue(this.songs.shift()!);
    } else {
      this.songs.shift();

      if (this.songs.length) {
        this.processQueue();
      } else if (!this.stopped) {
        this.textChannel.send(i18n.__("play.queueEnded")).then(purning);
        this.stop();
      }
    }
  }

  public enqueue(...songs: Song[]) {
    this.stopped = false;
    this.songs = this.songs.concat(songs);
    this.processQueue();
  }

  public stop() {
    if (this.stopped) return;
    this.stopped = true;

    bot.queues.delete(this.message.guild!.id);
    this.songs.length = 0;
    this.nowPlayingCollector?.stop();
    this.player.stop();
    this.loop = false;
    this.resource?.playStream?.destroy();
    clearMemory();

    setTimeout(() => {
      if (!bot.queues.has(this.message.guild!.id)) {
        this.leave();
      }
    }, config.STAY_TIME * 1000);
  }

  public leave() {
    this.stop();
    if (this.connection.state.status != VoiceConnectionStatus.Destroyed) {
      this.connection.destroy();
      this.textChannel.send(i18n.__("play.leaveChannel")).then(purning);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.player.state.status != AudioPlayerStatus.Idle) {
      return;
    }

    const next = this.songs[0];

    try {
      const resource = await next.makeResource();
      this.resource = resource!;
      this.player.play(this.resource);
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
      this.sendPlayingMessage(this.resource);
    } catch (error) {
      console.error(error);
      this.skip();
    }
  }

  private async sendPlayingMessage(resource: AudioResource) {
    try {
      const song = (resource as AudioResource<Song>).metadata;

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("stop")
          .setEmoji("⏹")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("pause")
          .setEmoji("⏸")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("skip")
          .setEmoji("⏭")
          .setStyle(ButtonStyle.Secondary)
      );

      let time: string;
      if (song.duration == 0) {
        time = i18n.__mf("nowplaying.live");
      } else {
        time = formatTime(song.duration);
      }

      const nowPlayingMsg = await this.textChannel.send({
        embeds: [
          {
            title: i18n.__mf("play.startedPlaying"),
            description: `[${song.title}](${song.url})
            ${i18n.__mf("play.duration", " ")}\`${time}\``,
            thumbnail: {
              url: song.thumbnail,
            },
            color: 0x69adc7
          }
        ],
        components: [row],
      });

      const collector = nowPlayingMsg.createMessageComponentCollector();
      this.nowPlayingCollector = collector;

      collector.on("collect", async (b) => {
        const interactUser = await this.textChannel.guild.members.fetch(b.user);
        const permission = this.textChannel.permissionsFor(interactUser).has(PermissionsBitField.Flags.SendMessages, true);

        if (canModifyQueue(interactUser)) {
          if (b.customId === "stop" && permission) {
            this.stop();
            this.textChannel.send(i18n.__("stop.result")).then(purning);
          }
          if (b.customId === "skip" && permission) {
            this.player.stop(true);
          }
          if (b.customId === "pause" && permission) {
            if (this.player.state.status == AudioPlayerStatus.Playing) {
              this.player.pause();
              this.textChannel.send(i18n.__mf("pause.result")).then(purning);
            } else {
              this.player.unpause();
              this.textChannel.send(i18n.__mf("resume.resultNotPlaying")).then(purning);
            }
          }
        } else {
          this.textChannel.send(i18n.__("common.errorNotChannel"))
            .then(purning);
        }
        await b.deferUpdate();
      });

      collector.on("end", () => {
        const msg = (collector.options.message as Message<boolean>);

        if (config.PRUNING) {
          msg.delete().catch(() => null);
        } else {
          msg.edit({
            embeds: [{
              description: msg.embeds[0].description!,
              thumbnail: msg.embeds[0].thumbnail!,
              color: 0x69adc7
            }],
            components: []
          });
        }

        if (collector == this.nowPlayingCollector) {
          this.nowPlayingCollector = null;
        }
      });
    } catch { console.error; }
  }
}