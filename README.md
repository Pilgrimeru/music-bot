# Project replaced by [a new version](https://github.com/Pilgrimeru/Pilzic) entirely coded by myself using the knowledge obtained on this fork.

# 🎧 Music Bot ([Evobot](https://github.com/eritislami/evobot) fork)
> My vision of a simple and fast discord music bot.

![logo](https://cdn.discordapp.com/attachments/643921269590458386/1022215395404435527/8aa95700-7730-11e9-84be-e80f28520325.jpg)

# ⚡ Why this fork ?
- It fixes most of the bugs or crashes of the bot.
- It offers a more modern reply using the latest Discord features.
- It adds support for Spotify, SoundCloud, Deezer, audio links and attachments.
- It sinificantly improves the music queue. (connection stability and execution speed).
- It adds a loop mode of a music. (🔂)
- It adds an automatic disconnection when it is alone in a voice channel.
- It significantly improves the pruning functionality.

### 📉 What are its limits?
- It does not support slash commands.
- The end of clip support.
- The end of docker support.
- The majority of foreign languages need to be re-implemented.
- The number of media controls on the 'now playing' message has been reduced


## Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**  
1.1. Enable 'Message Content Intent' in Discord Developer Portal
2. (Optional) Spotify Client ID and Client Secret **[Guide (step 1 to 3)](https://stevesie.com/docs/pages/spotify-client-id-secret-developer-api)**
3. Node.js 16.11.0 or newer

## 🚀 Getting Started

```sh
git clone https://github.com/Pilgrimeru/music-bot.git
cd music-bot
npm install
```

After installation finishes follow configuration instructions then run `npm start` to start the bot.

## ⚙️ Configuration

Copy or Rename `config.json.example` to `config.json` and fill out the values:

⚠️ **Note: Never commit or share your token or api keys publicly** ⚠️

```json
{
  "TOKEN": "",
  "MAX_PLAYLIST_SIZE": 100,
  "PREFIX": "!",
  "PRUNING": true,
  "LOCALE": "en",
  "STAY_TIME": 30,
  "DEFAULT_VOLUME": 100,
  "SPOTIFY_CLIENT_ID": "",
  "SPOTIFY_CLIENT_SECRET": ""
}
```

## 🌎 Locales

Currently available locales are:

- English (en)
- French (fr)

## 📝 Features & Commands

> Note: The default prefix is '!'

- 🎶 Play song or playlist from YouTube, SoundCloud or Spotify via url

`!play https://www.youtube.com/watch?v=GLvohMXgcBo`

- 🔎 Play music from YouTube via search query

`!play under the bridge red hot chili peppers`

- 🔎 Search and select music to play

`!search Pearl Jam`

Next, select the track you have chosen from the drop-down menu.


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
- Stop (!stop)
- Move a song in the queue (!move, !mv)
- Remove song # from queue (!remove, !rm)
- Show ping to Discord API (!ping)
- Show bot uptime (!uptime)
- Toggle pruning of bot messages (!pruning)
- Help (!help, !h)
- Invite (!invite)
- Command Handler from [discordjs.guide](https://discordjs.guide/)
- Media Controls via buttons

![buttons](https://cdn.discordapp.com/attachments/643921269590458386/1099689057107329096/image.png)
