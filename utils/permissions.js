// utils/permissions.js

const MOD_ROLE_ID = '1384827724434112512'; // your mod role ID

function isModerator(member) {
  return member.roles.cache.has(MOD_ROLE_ID);
}

module.exports = { isModerator };
