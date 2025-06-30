// utils/playerdb.js

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchPlayerInfo(username) {
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`, {
    headers: { 'User-Agent': 'discord-whitelist-bot' }
  });

  if (!res.ok) throw new Error(`PlayerDB API error (${res.status})`);

  const json = await res.json();
  const player = json?.data?.player;

  if (!player) throw new Error(`❌ Player "${username}" not found`);

  return {
    username: player.username,
    uuid: player.id,
    avatar: player.avatar
  };
}

module.exports = { fetchPlayerInfo };
