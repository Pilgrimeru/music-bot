import axios from "axios";
import { GuildMember, Message } from "discord.js";
import { runInNewContext } from "node:vm";
import { so_validate, sp_validate, yt_validate } from "play-dl";
import { config } from "../utils/config";

export function canModifyQueue(member: GuildMember) {
  return member.voice.channelId === member.guild.members.me!.voice.channelId;
}

export function formatTime(milliseconds: number): string {
  let sec_num = Math.round(milliseconds / 1000);
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor(sec_num / 60) % 60;
  let seconds = sec_num % 60;

  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
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

export async function validate(url: string): Promise<string | false> {
  const YT_LINK = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
  const SO_LINK = /^https?:\/\/soundcloud\.com\/?.+/;
  const SP_LINK = /^https?:\/\/(?:open|play)\.spotify\.com\/?.+/;
  const DZ_LINK = /^https?:\/\/(?:www\.)?(?:deezer\.com|deezer\.page\.link)\/?.+/;
  const AUDIO_LINK = /^https?:\/\/.+\.(mp3|wav|flac|ogg)$/;

  if (!url.startsWith("https")) return false;

  if (url.match(YT_LINK)) {
    return yt_validate(url);
  }
  if (url.match(SO_LINK)) {
    return await so_validate(url);
  }
  if (url.match(SP_LINK)) {
    let type = sp_validate(url);
    if (type) return type;
    const SP_ARTIST = /^https?:\/\/(?:open|play)\.spotify\.com\/artist\/?.+/;
    if (url.match(SP_ARTIST)) return "sp_artist";
    return false;
  }
  if (url.match(DZ_LINK)) {
    let r = await axios.head(url);
    let patch = r.request?.socket?._httpMessage?.path;
    if (!patch) return false;
    if (patch.match(/^\/(?:\w{2})\/track/)) return "dz_track";
    if (patch.match(/^\/(?:\w{2})\/album/)) return "dz_album";
    if (patch.match(/^\/(?:\w{2})\/playlist/)) return "dz_playlist";
    return false;
  }

  if (url.match(AUDIO_LINK)) {
    return "audio";
  }
  return false;
}