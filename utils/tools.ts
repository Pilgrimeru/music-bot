import { GuildMember, Message } from "discord.js";
import { runInNewContext } from "node:vm";
import { config } from "../utils/config";

export function canModifyQueue(member: GuildMember) {
  return member.voice.channelId === member.guild.members.me!.voice.channelId;
}

export function formatTime(milliseconds: number): string {
    let sec_num = Math.round(milliseconds / 1000)
    let hours = Math.floor(sec_num / 3600)
    let minutes = Math.floor(sec_num / 60) % 60
    let seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}

export async function purning(msg: Message, long?: boolean) {

  if (!config.PRUNING) return;
  let time = long ? 120 : 15;

  setTimeout(() => {
    msg.delete().catch(() => null);
  }, time * 1000);

}

export async function clearMemory() {
    try {
        const gc = runInNewContext('gc');
        gc();
    } catch (error) {
        console.error(error);
    }
}