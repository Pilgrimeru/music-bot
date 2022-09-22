import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus
} from "@discordjs/voice";
import { Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import { promisify } from "node:util";
import { bot } from "../index";
import { QueueOptions } from "../interfaces/QueueOptions";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { Song } from "./Song";

const wait = promisify(setTimeout);

export class MusicQueue {
  public readonly message: Message;
  public readonly connection: VoiceConnection;
  public readonly player: AudioPlayer;
  public readonly textChannel: TextChannel;
  public readonly bot = bot;

  public resource: AudioResource;
  public songs: Song[] = [];
  public volume = config.DEFAULT_VOLUME || 100;
  public loop = false;
  public muted = false;
  public waitTimeout: NodeJS.Timeout;
  private queueLock = false;
  private readyLock = false;

  public constructor(options: QueueOptions) {
    Object.assign(this, options);

    this.textChannel = options.message.channel as TextChannel;
    this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    this.connection.subscribe(this.player);

    this.connection.on("stateChange" as any, async (oldState: VoiceConnectionState, newState: VoiceConnectionState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          try {
            this.stop();
          } catch (e) {
            console.log(e);
            this.stop();
          }
        } else if (this.connection.rejoinAttempts < 5) {
          await wait((this.connection.rejoinAttempts + 1) * 5_000);
          this.connection.rejoin();
        } else {
          this.connection.destroy();
        }
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
        } catch {
          if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
            try {
              this.connection.destroy();
            } catch {}
          }
        } finally {
          this.readyLock = false;
        }
      }
    });

    this.player.on("stateChange" as any, async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        if (this.loop && this.songs.length) {
          this.songs.push(this.songs.shift()!);
        } else {
          this.songs.shift();
        }

        if (this.songs.length || this.resource) this.processQueue();
      } else if (oldState.status === AudioPlayerStatus.Buffering && newState.status === AudioPlayerStatus.Playing) {
        this.sendPlayingMessage(newState);
      }
    });

    this.player.on("error", (error) => {
      console.error(error);
      if (this.loop && this.songs.length) {
        this.songs.push(this.songs.shift()!);
      } else {
        this.songs.shift();
      }
      this.processQueue();
    });
  }

  public enqueue(...songs: Song[]) {
    if (typeof this.waitTimeout !== "undefined") clearTimeout(this.waitTimeout);
    this.songs = this.songs.concat(songs);
    this.processQueue();
  }

  public stop() {
    this.loop = false;
    this.songs = [];
    this.player.stop();

    this.waitTimeout = setTimeout(() => {
      
      bot.queues.delete(this.message.guild!.id);
      if (this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
        this.connection.destroy();
      }
      !config.PRUNING && this.textChannel.send(i18n.__("play.leaveChannel"));
    }, config.STAY_TIME * 1000);
  }

  public async processQueue(): Promise<void> {
    if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
      return;
    }

    if (!this.songs.length) {
      !config.PRUNING && this.textChannel.send(i18n.__("play.queueEnded")).catch(console.error);
      config.PRUNING && this.textChannel.send(i18n.__("play.queueEnded")).then(msg => setTimeout(() => msg.delete(), 10000)).catch(console.error);
      return this.stop();
    }

    this.queueLock = true;

    const next = this.songs[0];

    try {
      const resource = await next.makeResource();

      this.resource = resource!;
      this.player.play(this.resource);
      this.resource.volume?.setVolumeLogarithmic(this.volume / 100);
    } catch (error) {
      console.error(error);

      return this.processQueue();
    } finally {
      this.queueLock = false;
    }
  }

  private async sendPlayingMessage(newState: any) {
    const song = (newState.resource as AudioResource<Song>).metadata;

    let playingMessage: Message;
    
    try {
      const row = new MessageActionRow().addComponents(
      
      new MessageButton().setCustomId("stop").setEmoji('⏹').setStyle('SECONDARY'),
  
      new MessageButton().setCustomId("pause").setEmoji('⏸').setStyle('SECONDARY'),
    
      new MessageButton().setCustomId("skip").setEmoji('⏭').setStyle('SECONDARY'),
      
      );
      
      const time = new Date(song.duration * 1000).toISOString().substr(11, 8);
      
      playingMessage = await this.textChannel.send({
        embeds: [
          {
              description: `${i18n.__mf("play.startedPlaying")}\n\n[${song.title}](${song.url})\n${i18n.__mf("play.duration")}\`${time}\``,
              thumbnail: {
                  url: `https://i.ytimg.com/vi/${song.id}/hqdefault.jpg` 
              },
              color: 0x44b868
          }
      ],
        components: [row] });
    
    } catch (error: any) {
      console.error(error);
      this.textChannel.send(error.message);
      return;
    }
    const collector = playingMessage.createMessageComponentCollector({
      time : song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on('collect', async (b) => {
      if(b.customId === "stop") {
        await this.bot.commands.get("stop")!.execute(this.message);
        await b.deferUpdate();
        collector.stop();
      }
      if(b.customId === "skip") {
        await this.bot.commands.get("skip")!.execute(this.message);
        await b.deferUpdate();
        collector.stop();
      }
      if(b.customId === "pause") {
         if (this.player.state.status == AudioPlayerStatus.Playing) {
          await this.bot.commands.get("pause")!.execute(this.message);
        } else {
          await this.bot.commands.get("resume")!.execute(this.message);
        }
        console.log(b.member)
        await b.deferUpdate();
      }
    });
    collector.on("end", () => {
      if (config.PRUNING) {
        setTimeout(() => {
          playingMessage.delete().catch();
        }, 5);
      }
    });

  } 
}

