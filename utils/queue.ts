import { GuildMember } from "discord.js";

export function canModifyQueue(member: GuildMember) {
  return member.voice.channelId === member.guild.members.me!.voice.channelId;
}
  
