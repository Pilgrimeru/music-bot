import { GuildMember } from "discord.js";
import { bot } from "../index";

export function canModifyQueue(member: GuildMember) {
  if (member.guild.members.me!.voice.channelId == null) {
    bot.queues.get(member.guild.id)?.stop();
  }
  return member.voice.channelId === member.guild.members.me!.voice.channelId;
}
  
