// utils/permissions.js

const MOD_ROLE_ID = process.env.MOD_ROLE_ID;

function isModerator(member) {
  return member.roles.cache.has(MOD_ROLE_ID);
}

module.exports = { isModerator };
