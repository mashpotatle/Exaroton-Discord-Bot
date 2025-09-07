# Exaroton Discord Bot

This is a custom Discord bot designed to enhance the multiplayer experience on an exatron server. It provides a seamless integration between Discord and the Minecraft server, allowing players to communicate and manage their whitelist status easily.

-  Discord ↔ Minecraft Chat Bridge: Talk with your SMP teammates on Discord or in-game with messages synced both ways.

- Whitelist System: You must whitelist on Discord to be able to join the Minecraft server.

- Vanilla SMP support: Works with standard Minecraft servers without needing mods or plugins!



# How To Use

- Create a Discord bot and invite it to your server.

- Configure the .env with your Exaroton API key and server ID. as well as your Discord bot token.

- Create both a player role and a moderator role in your Discord server, then configure the .env to use those roles.

- Also create a channel for the bot to relay chat messages. and then configure the .env to use that channel.

- (replace the 1s in the env with your keys and ids)

# Commands Overview

User Commands

    /whitelist Add username: – Begin the whitelist process to get verified
    
    /whitelist Update username: – Update your username for the server's whitelist if it has changed

    /whitelist Remove: – Remove your current whitelisted username

    /whitelist Show: – Shows your current whitelisted username
    
    /deathcount – Shows death count per your whitelisted username

Admin Only Commands

    /list - shows all discord accounts with listed usernames

    /resync roles - resync player roles from whitelist.json

    /resync exaroton - resync player roles from whitelist.json
