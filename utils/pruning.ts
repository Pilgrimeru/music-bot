import { Message } from "discord.js";
import { config } from "../utils/config";

export async function purning(msg: Message, long?: boolean) {

  if (!config.PRUNING) return;
  let time = long ? 120 : 10;

  setTimeout(() => {
    msg.delete().catch(() => null);
  }, time * 1000);

}