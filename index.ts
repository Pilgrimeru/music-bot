import { Client, GatewayIntentBits } from "discord.js";
import { setFlagsFromString } from "node:v8";
import { Bot } from "./structs/Bot";

setFlagsFromString('--expose_gc');


export const bot = new Bot(
  
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  })
);
