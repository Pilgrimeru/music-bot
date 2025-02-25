import { ActivityType, Client, Collection, Snowflake, VoiceState } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { getFreeClientID, setToken } from "play-dl";
import { Command } from "../interfaces/Command";
import { MissingPermissionsException } from "../utils/MissingPermissionsException";
import { PermissionResult, checkPermissions } from "../utils/checkPermissions";
import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { clearMemory, purning } from "../utils/tools";
import { MusicQueue } from "./MusicQueue";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class Bot {
  public readonly prefix = config.PREFIX;
  public commands = new Collection<string, Command>();
  public cooldowns = new Collection<string, Collection<Snowflake, number>>();
  public queues = new Collection<Snowflake, MusicQueue>();

  public constructor(public readonly client: Client) {
    this.client.login(config.TOKEN);

    this.client.on("ready", () => {
      console.log(`${this.client.user!.username} ready!`);
      clearMemory();
      client.user!.setActivity(`${this.prefix}help and ${this.prefix}play`, { type: ActivityType.Listening });
      setInterval(() => {
        client.user!.setActivity(`${this.prefix}help and ${this.prefix}play`, { type: ActivityType.Listening });
        clearMemory();
      }, 1 * 3600 * 1000);
    });

    this.client.on("warn", (info) => console.log(info));
    this.client.on("error", console.error);

    this.client.on("voiceStateUpdate", async (voice: VoiceState) => {
      setTimeout(() => {
        const voiceChannel = voice.channel;
        const clientChannel = voice.guild.members.me!.voice.channelId;
        if (voiceChannel?.id === clientChannel) {
          let nbUser = voiceChannel?.members.filter(
            (member) => !member.user.bot
          );
          if (nbUser?.size === 0) {
            const queue = this.queues.get(voice.guild.id);
            queue?.leave();
          }
        }
      }, config.STAY_TIME * 1000);
    });

    this.importCommands();
    this.onMessageCreate();
    this.soundcloudApiConnect();
  }

  public async soundcloudApiConnect() {
    getFreeClientID().then((clientID) => setToken({
      soundcloud: {
        client_id: clientID
      }
    }));
  }

  private async importCommands() {
    const commandFiles = readdirSync(join(__dirname, "..", "commands")).filter((file) => !file.endsWith(".map"));

    for (const file of commandFiles) {
      const command = await import(join(__dirname, "..", "commands", `${file}`));
      this.commands.set(command.default.name, command.default);
    }
  }

  private async onMessageCreate() {
    this.client.on("messageCreate", async (message: any) => {
      if (message.author.bot || !message.guild) return;

      const prefixRegex = new RegExp(`^(<@!?${this.client.user!.id}>|${escapeRegex(this.prefix)})\\s*`);
      if (!prefixRegex.test(message.content)) return;

      const [, matchedPrefix] = message.content.match(prefixRegex);

      const args: string[] = message.content.slice(matchedPrefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      // @ts-ignore
      const command =
        // @ts-ignore
        this.commands.get(commandName!) ?? this.commands.find((cmd) => cmd.aliases?.includes(commandName));

      if (!command) return;

      if (!this.cooldowns.has(command.name)) {
        this.cooldowns.set(command.name, new Collection());
      }

      const now = Date.now();
      const timestamps: any = this.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldown || 1) * 1000;

      if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return message.reply(i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name })).then(purning);
        }
      }

      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

      try {
        const permissionsCheck: PermissionResult = await checkPermissions(command, message);

        if (permissionsCheck.result) {
          command.execute(message, args);
        } else {
          throw new MissingPermissionsException(permissionsCheck.missing);
        }
      } catch (error: any) {
        console.error(error);

        if (error.message.includes("permissions")) {
          message.reply(error.toString()).then(purning);
        } else {
          message.reply(i18n.__("common.errorCommand")).then(purning);
        }
      }
    });
  }
}
