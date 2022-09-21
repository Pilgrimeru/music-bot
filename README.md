![Node build](https://github.com/eritislami/evobot/actions/workflows/node.yml/badge.svg)
![Docker build](https://github.com/eritislami/evobot/actions/workflows/docker.yml/badge.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

![logo](https://cdn.discordapp.com/attachments/643921269590458386/1022215395404435527/8aa95700-7730-11e9-84be-e80f28520325.jpg)

# 🤖 Discord Music Bot

> Discord Music Bot built with TypeScript, discord.js & uses Command Handler from [discordjs.guide](https://discordjs.guide)

## Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**  
1.1. Enable 'Message Content Intent' in Discord Developer Portal
2. Node.js 16.11.0 or newer

## 🚀 Getting Started

```sh
git clone https://github.com/Pilgrimeru/music-bot.git
cd evobot
npm install
```

After installation finishes follow configuration instructions then run `npm run start` to start the bot.

## ⚙️ Configuration

Copy or Rename `config.json.example` to `config.json` and fill out the values:

⚠️ **Note: Never commit or share your token or api keys publicly** ⚠️

```json
{
  "TOKEN": "",
  "MAX_PLAYLIST_SIZE": 10,
  "PREFIX": "!",
  "PRUNING": false,
  "LOCALE": "en",
  "DEFAULT_VOLUME": 100,
  "STAY_TIME": 30
}
```

## 🌎 Locales

Currently available locales are:

- English (en)
- French (fr)

## 📝 Features & Commands

> Note: The default prefix is '!'

- 🎶 Play music from YouTube via url

`!play https://www.youtube.com/watch?v=GLvohMXgcBo`

- 🔎 Play music from YouTube via search query

`!play under the bridge red hot chili peppers`

- 🔎 Search and select music to play

`!search Pearl Jam`

Reply with song number or numbers seperated by comma that you wish to play

Examples: `1` or `1,2,3`

- 📃 Play youtube playlists via url

`!playlist https://www.youtube.com/watch?v=YlUKcNNmywk&list=PL5RNCwK3GIO13SR_o57bGJCEmqFAwq82c`

- 🔎 Play youtube playlists via search query

`!playlist linkin park meteora`

- Now Playing (!np)
- Queue (!queue, !q)
- Loop / Repeat (!loop)
- Shuffle (!shuffle)
- Volume control (!volume, !v)
- Lyrics (!lyrics, !ly)
- Pause (!pause)
- Resume (!resume, !r)
- Skip (!skip, !s)
- Skip to song # in queue (!skipto, !st)
- Move a song in the queue (!move, !mv)
- Remove song # from queue (!remove, !rm)
- Show ping to Discord API (!ping)
- Show bot uptime (!uptime)
- Toggle pruning of bot messages (!pruning)
- Help (!help, !h)
- Command Handler from [discordjs.guide](https://discordjs.guide/)
- Media Controls via buttons

![buttons](https://cdn.discordapp.com/attachments/643921269590458386/1022217161655210126/unknown.png)
