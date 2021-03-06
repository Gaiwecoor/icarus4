﻿const categories =  [
  "Game Platforms",
  "Streaming",
  "Social",
  "Personal"
];

function helpList() {
  let response = ["```md"];

  categories.forEach(category => {
    let categoryList = ["# " + category];
    gameids.forEach(system => {
      if (system.display && system.category == category) categoryList.push(`* ${system.system} (${system.name})`);
    });
    if (categoryList.length > 1) {
      response = response.concat(categoryList);
      response.push("");
    }
  });

  response.push("```");

  return response.join("\n");
}

function system(data) {
  this.system = data.system;
  this.name = data.name;
  this.category = (data.category ? data.category : "Game Platforms");
  this.display = (data.display === false ? false : true);
  this.link = data.link;
  return this;
}

var gameids = new Map()
  .set("battlenet", new system({system: "battlenet", name: "Battle.net ID"}))
  .set("dragalia", new system({system: "dragalia", name: "Dragalia Lost"}))
  .set("elite", new system({system: "elite", name: "Elite: Dangerous CMDR Name"}))
  .set("epic", new system({system: "epic", name: "Epic Games Battletag"}))
  .set("gog", new system({system: "gog", name: "GOG Galaxy", link: "https://www.gog.com/u/"}))
  .set("guildwars", new system({system: "guildwars", name: "Guild Wars"}))
  .set("hirez", new system({system: "hirez", name: "Hi Rez (Smite / Paladins)"}))
  .set("lol", new system({system: "lol", name: "League of Legends"}))
  .set("minecraft", new system({system: "minecraft", name: "Minecraft Name"}))
  .set("nnid", new system({system: "nnid", name: "Nintendo Network ID"}))
  .set("3ds", new system({system: "3ds", name: "Nintendo 3DS"}))
  .set("switch", new system({system: "switch", name: "Nintendo Switch"}))
  .set("origin", new system({system: "origin", name: "Origin ID"}))
  .set("poke-go", new system({system: "poke-go", name: "Pokémon Go"}))
  .set("poke-tcgo", new system({system: "poke-tcgo", name: "Pokémon TCGO"}))
  .set("ps", new system({system: "ps", name: "PSN Name", link: "https://my.playstation.com/"}))
  .set("pubg", new system({system: "pubg", name: "PUBG User Name"}))
  .set("roblox", new system({system: "roblox", name: "Roblox Name", link: "https://www.roblox.com/search/users?keyword="}))
  .set("rocketid", new system({system: "rocketid", name: "Rocket League ID"}))
  .set("runescape", new system({system: "runescape", name: "Runescape Name"}))
  .set("spaceengineers", new system({system: "spaceengineers", name: "Space Engineers"}))
  .set("steam", new system({system: "steam", name: "Steam Name", link: "http://steamcommunity.com/search/users/#text="}))
  .set("uplay", new system({system: "uplay", name: "Uplay"}))
  .set("warframe", new system({system: "warframe", name: "Warframe Name"}))
  .set("xb", new system({system: "xb", name: "Xbox Gamertag", link: "http://live.xbox.com/en-US/Profile?gamertag="}))
  .set("mixer", new system({system: "mixer", name: "Mixer", category: "Streaming", link: "https://mixer.com/"}))
  .set("twitch", new system({system: "twitch", name: "Twitch", category: "Streaming", link: "https://www.twitch.tv/"}))
  .set("youtube", new system({system: "youtube", name: "YouTube", category: "Streaming", link: "https://www.youtube.com/user/"}))
  .set("credly", new system({ system: "credly", name: "Credly User ID", category: "Social", link: "https://credly.com/u/", display: false}))
  .set("fb", new system({system: "facebook", name: "Facebook", category: "Social", link: "https://www.facebook.com/"}))
  .set("playerme", new system({system: "playerme", name: "Player.me", category: "Social", link: "https://player.me/"}))
  .set("reddit", new system({system: "reddit", name: "Reddit", category: "Social", link: "https://www.reddit.com/user/"}))
  .set("skype", new system({system: "skype", name: "Skype", category: "Social"}))
  .set("twitter", new system({system: "twitter", name: "Twitter", category: "Social", link: "https://twitter.com/"}))
  .set("uproar", new system({system: "uproar", name: "Uproar.gg", category: "Social", link: "https://uproar.gg/profile/"}))
  .set("birthday", new system({system: "birthday", name: "Birthday", category: "Personal", display: false}))
  .set("job", new system({system: "job", name: "Job Title/Industry", category: "Personal", display: false}))
  .set("location", new system({system: "location", name: "Location", category: "Personal", display: false}))
  .set("nick", new system({system: "nick", name: "Childhood Nickname", category: "Personal", display: false}))
  .set("timezone", new system({system: "timezone", name: "Timezone", category: "Personal", display: false}))
  .set("stake", new system({system: "stake", name: "Stake", category: "Personal", display: false}));

const aliases = {
  "xbox": "xb",
  "psn": "ps",
  "ps4": "ps",
  "ps3": "ps",
  "yt": "youtube",
  "paragon": "epic",
  "cmdr": "elite",
  "battle.net": "battlenet",
  "bnet": "battlenet",
  "overwatch": "battlenet",
  "blizzard": "battlenet",
  "bliz": "battlenet",
  "blizz": "battlenet",
  "arenanet": "guildwars",
  "arena.net": "guildwars",
  "pokemongo": "pokego",
  "nintendo": "nnid",
  "wiiu": "nnid",
  "rocket": "rocketid",
  "rocketleague": "rocketid",
  "smite": "hirez",
  "paladins": "hirez",
  "paladin": "hirez",
  "facebook": "fb",
  "beam": "mixer",
  "player.me": "playerme",
  "profession": "job",
  "work": "job",
  "birfday": "birthday",
  "time": "timezone",
  "city": "location"
};

module.exports = {categories,  helpList,  aliases,  gameids};
