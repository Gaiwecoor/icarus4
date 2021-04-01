const Augur = require("augurbot"),
  u = require("../utils/utils");

const sponsorChannels = new u.Collection();
let proSponsor = "121783903630524419";

const Module = new Augur.Module()
.addCommand({name: "coolkids",
  description: "Add user(s) to your Pro Sponsor private channel.",
  suffix: "@user(s)",
  permissions: (msg) => (msg.guild?.id == Module.config.ldsg) && sponsorChannels.has(msg.member?.id),
  process: async (msg) => {
    u.clean(msg, 0);
    let channelId = sponsorChannels.get(msg.member.id)?.channelId;
    let channel = msg.guild.channels.cache.get(channelId);

    if (msg.mentions.members.size == 0) {
      msg.reply("you need to tell me who to invite to your channel!").then(u.clean);
      return;
    }

    try {
      for (const [memberId, member] of msg.mentions.members) {
        await channel?.createOverwrite(member.id, {
          VIEW_CHANNEL: true
        }, "Pro Sponsor Invite");
        channel?.send(`Welcome, ${member}!`);
      }
    } catch(error) { u.errorHandler(error, msg); }
  }
})
.addCommand({name: "sponsorchannel",
  description: "Set up a private channel for a Pro Sponsor.",
  suffix: "@sponsor(s)",
  info: "Creates a private channel for a Pro Sponsor, where they can invite individuals to hang out.",
  category: "Admin",
  permissions: (msg) => (msg.guild?.id == Module.config.ldsg) && (msg.member?.roles.cache.has(Module.config.roles.management) || msg.member?.roles.cache.has("205826273639923722")),
  process: async (msg) => {
    try {
      u.clean(msg);

      if (msg.mentions.members.size == 0) {
        msg.reply("you need to tell me who to create a channel for!");
        return;
      }

      for (const [sponsorId, sponsor] of msg.mentions.members) {
        if (!sponsor.roles.cache.has(proSponsor)) continue;
        if (sponsorChannels.has(sponsor.id)) {
          msg.reply(`${sponsor} already has a channel at ${msg.guild.channels.cache.get(sponsorChannels.get(sponsor.id)?.channelId)}!`).then(u.clean);
          continue;
        }

        let channel = await msg.guild.channels.create(`${sponsor.displayName}-hangout`, {
          parent: "742400003137470613",
          permissionOverwrites: [
            { id: msg.client.user.id, allow: "VIEW_CHANNEL" },
            { id: Module.config.ldsg, deny: "VIEW_CHANNEL" },
            { id: sponsor.id, allow: ["VIEW_CHANNEL", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "MANAGE_WEBHOOKS"] },
          ]
        }, "Sponsor Perk");

        sponsorChannels.set(sponsor.id, {sponsorId: sponsor.id, channelId: channel.id});

        try {
          await Module.config.sheets.get("Sponsor Channels").addRow({
            "Sponsor Name": sponsor.displayName,
            "Sponsor ID": sponsor.id,
            "Channel ID": channel.id
          });
        } catch(error) { u.errorHandler(error, "Save Sponsor Channel Info"); }

        channel.send(`${sponsor}, welcome to your private channel! Thank you for being a Pro Sponsor! Your contributions each month are very much appreciated! Please accept this channel as a token of our appreciation.\n\nYou should have some administrative abilities for this channel (including changing the name and description), as well as the ability to add people to the channel with \`!coolkids @user(s)\`. If you would like to change default permissions for users in the channel, please contact a member of Management directly.`);
      }
    } catch(e) {
      u.errorHandler(e, msg);
    }
  }
})
.addCommand({name: "uncoolkids",
  description: "Remove user(s) to your Pro Sponsor private channel.",
  suffix: "@user(s)",
  hidden: true,
  permissions: (msg) => (msg.guild?.id == Module.config.ldsg),
  process: async (msg) => {
    u.clean(msg, 0);

    if (msg.mentions.channels.size > 0) {
      try {
        for (const [channelId, channel] of msg.mentions.channels) {
          let myChannel = sponsorChannels.get(msg.author.id)?.channelId;
          if (channelId == myChannel) {
            msg.reply("you can't remove yourself from your own channel!").then(u.clean);
            continue;
          } else if (sponsorChannels.find(c => c.channelId == channelId)) {
            channel.permissionOverwrites.get(msg.author.id)?.delete("I don't want to be here anymore.");
          }
        }
      } catch(error) { u.errorHandler(error, msg); }
    } else if (sponsorChannels.has(msg.author.id) && (msg.mentions.members.size > 0)) {
      let channelId = sponsorChannels.get(msg.member.id)?.channelId;
      let channel = msg.guild.channels.cache.get(channelId);
      try {
        for (const [memberId, member] of msg.mentions.members) {
          await channel?.permissionOverwrites.get(memberId)?.delete("Pro Sponsor Uninvite");
        }
      } catch(error) { u.errorHandler(error, msg); }
    } else {
      msg.reply(`You need to tell me ${sponsorChannels.has(msg.author.id) ? "who to remove or " : ""}which Pro Sponsor Channel to leave!`).then(u.clean);
    }
  }
})
.addEvent("loadConfig", async () => {
  try {
    let rows = await Module.config.sheets.get("Sponsor Channels").getRows();
    let ldsg = Module.client.guilds.cache.get(Module.config.ldsg);
    sponsorChannels.clear();
    for (let row of rows) {
      if (!(ldsg.members.cache.has(row["Sponsor ID"]) && ldsg.members.cache.get(row["Sponsor ID"]).roles.cache.has(proSponsor))) continue;
      sponsorChannels.set(row["Sponsor ID"], {
        sponsorId: row["Sponsor ID"],
        channelId: row["Channel ID"]
      });
    }
  } catch(error) { u.errorHandler(error, "Sponsors loadConfig"); }
});

module.exports = Module;
