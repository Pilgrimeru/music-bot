![Node build](https://github.com/eritislami/evobot/actions/workflows/node.yml/badge.svg)
![Docker build](https://github.com/eritislami/evobot/actions/workflows/docker.yml/badge.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

![logo](https://repository-images.githubusercontent.com/186841818/8aa95700-7730-11e9-84be-e80f28520325)

# 🤖 EvoBot (Discord Music Bot)

> EvoBot is a Discord Music Bot built with TypeScript, discord.js & uses Command Handler from [discordjs.guide](https://discordjs.guide)

## Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**  
1.1. Enable 'Message Content Intent' in Discord Developer Portal
2. Node.js 16.11.0 or newer

## 🚀 Getting Started

```sh
git clone https://github.com/eritislami/evobot.git
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

## 🐬 Docker Configuration

For those who would prefer to use our [Docker container](https://hub.docker.com/repository/docker/eritislami/evobot), you may provide values from `config.json` as environment variables.

```shell
docker run -e "TOKEN=<discord-token>" eritislami/evobot
```

## 📝 Features & Commands

> Note: The default prefix is '!'

- 🎶 Play music from YouTube via url

`!play https://www.youtube.com/watch?v=GLvohMXgcBo`

- 🔎 Play music from YouTube via search query

`!play under the bridge red hot chili peppers`

- 🎶 Play music from Soundcloud via url

`!play https://soundcloud.com/blackhorsebrigade/pearl-jam-alive`

- 🔎 Search and select music to play

`!search Pearl Jam`

Reply with song number or numbers seperated by comma that you wish to play

Examples: `1` or `1,2,3`

- 📃 Play youtube playlists via url

`!playlist https://www.youtube.com/watch?v=YlUKcNNmywk&list=PL5RNCwK3GIO13SR_o57bGJCEmqFAwq82c`

- 🔎 Play youtube playlists via search query

`!playlist linkin park meteora`

- Now Playing (!np)
- Queue system (!queue, !q)
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
- Play an mp3 clip (!clip song.mp3) (put the file in sounds folder)
- List all clips (!clips)
- Show ping to Discord API (!ping)
- Show bot uptime (!uptime)
- Toggle pruning of bot messages (!pruning)
- Help (!help, !h)
- Command Handler from [discordjs.guide](https://discordjs.guide/)
- Media Controls via Reactions

![reactions](https://i.imgur.com/9S7Omf9.png)

## 🌎 Locales

Currently available locales are:

- English (en)
- French (fr)

- Check [Contributing](#-contributing) if you wish to help add more languages!
- For languages please use [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) two letter format

## 🤝 Contributing

1. [Fork the repository](https://github.com/eritislami/evobot/fork)
2. Clone your fork: `git clone https://github.com/your-username/evobot.git`
3. Create your feature branch: `git checkout -b my-new-feature`
4. Stage changes `git add .`
5. Commit your changes: `cz` OR `npm run commit` do not use `git commit`
6. Push to the branch: `git push origin my-new-feature`
7. Submit a pull request
