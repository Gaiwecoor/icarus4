const Discord = require("discord.js"),
  config = require("../config/config.json"),
  fs = require("fs"),
  path = require("path"),
  db = require(path.resolve(process.cwd(), config.db.model));

const errorLog = new Discord.WebhookClient(config.error.id, config.error.token),
  serverSettings = new Map();

const Utils = {
  Collection: Discord.Collection,
  botSpam: (msg) => {
    if ((msg.guild?.id == config.ldsg) && (msg.channel.parentID != "363020585988653057") && (msg.channel.parentID != "800827468315492352") && (msg.channel.id != config.channels.botspam)) {
      msg.reply(`I've placed your results in <#${config.channels.botspam}> to keep things nice and tidy in here. Hurry before they get cold!`)
        .then(Utils.clean);
      return msg.guild.channels.cache.get(config.channels.botspam);
    } else return msg.channel;
  },
  clean: function(msg, t = 20000) {
    setTimeout((m) => {
      if (m.interaction) {
        m.interaction.deleteResponse(m.id).catch(Utils.noop);
      } else if (m.deletable && !m.deleted) {
        m.delete().catch(Utils.noop);
      }
    }, t, msg);
    return Promise.resolve(msg);
  },
  confirm: async function(msg, prompt = "Are you sure?", timeout = 15) {
    try {
      let buttons = ["✅", "⛔"];
      let embed = Utils.embed().setColor(0xff0000)
        .setTitle(`Confirmation Required - Confirm in ${timeout}s`)
        .setAuthor(msg.member ? msg.member.displayName : msg.author.username, msg.author.displayAvatarURL())
        .setDescription(prompt)
        .setFooter(`${buttons[0]} to Confirm, ${buttons[1]} to Deny`);
      let dialog = await msg.channel.send({embed});
      for (let button of buttons) await dialog.react(button);

      let react = await dialog.awaitReactions((reaction, user) => buttons.includes(reaction.emoji.name) && msg.author.id == user.id, {max: 1, time: timeout * 1000});
      dialog.delete();
      if (react.size == 1 && react.first().emoji.name == buttons[0]) {
        return true;
      } else {
        return false;
      }
    } catch(error) { Utils.errorHandler(error, "Confirmation Prompt"); }
  },
  embed: (data) => {
    if (!data) {
      return new Discord.MessageEmbed().setColor(config.color).setTimestamp();
    } else {
      return new Discord.MessageEmbed(data);
    }
  },
  errorHandler: function(error, msg = null) {
    if (!error || (error.name == "AbortError")) return;

    console.error(Date());

    let embed = Utils.embed().setTitle(error.name);

    if (msg instanceof Discord.Message) {
      console.error(`${msg.author.username} in ${(msg.guild ? `${msg.guild.name} > ${msg.channel.name}` : "DM")}: ${msg.cleanContent}`);
      const client = msg.client;
      msg.channel.send("I've run into an error. I've let my devs know.")
        .then(Utils.clean);
      embed.addField("User", msg.author.username, true)
        .addField("Location", (msg.guild ? `${msg.guild.name} > ${msg.channel.name}` : "DM"), true)
        .addField("Command", msg.cleanContent || "`undefined`", true);
    } else if (typeof msg === "string") {
      console.error(msg);
      embed.addField("Message", msg);
    }

    console.trace(error);

    let stack = (error.stack ? error.stack : error.toString());
    if (stack.length > 1024) stack = stack.slice(0, 1000);

    embed.addField("Error", stack);
    errorLog.send(embed);
  },
  errorLog,
  escape: (text, options = {}) => Discord.escapeMarkdown(text, options),
  escapeText: (txt) => txt.replace(/(\*|_|`|~|\\|\|)/g, '\\$1'),
  getUser: function(msg, user, strict = false) {
    // Finds a user in the same guild as the message.

    // If no user to look for, return message author.
    if (user.length == 0 || !msg.guild) return (msg.guild ? msg.member : msg.author);

    let lcUser = user.toLowerCase();
    let memberCollection = msg.guild.members.cache;

    let myFn = (element) => false;
    // If there's a discriminator given, look for exact match
    if (lcUser.length > 5 && lcUser.charAt(lcUser.length-5) === "#")
      myFn = (element) => element.user.tag.toLowerCase() === lcUser;
    // Otherwise look for exact match of either nickname or username
    else if (!strict)
      myFn = (element) => (element.displayName.toLowerCase() === lcUser || element.user.username.toLowerCase() === lcUser);

    let foundUser = memberCollection.find(myFn);

    // If no exact match, find a user whose nick or username begins with the query
    /*
    if (!foundUser && !strict) {
      myFn = (element) => (element.displayName.toLowerCase().startsWith(lcUser) || element.user.username.toLowerCase().startsWith(lcUser));
      foundUser = memberCollection.find(myFn);
    }
    */
    // If still no match, search by ID
    if (!foundUser)
      foundUser = memberCollection.get(user);

    // If still no match, return message author
    if (!foundUser && !strict)
      foundUser = msg.member;

    return foundUser;
  },
  getMention: async function(msg, getMember = true) {
    try {
      let {suffix} = Utils.parse(msg);
      if (msg.guild) {
        let memberMentions = msg.mentions.members;
        memberMentions.delete(msg.client.user.id);
        if (memberMentions.size > 0) {
          return (getMember ? memberMentions.first() : memberMentions.first().user);
        } else if (suffix && /^(.*)#(\d{4})$/.test(suffix)) {
          let member = msg.guild.members.cache.find(m => m.user.tag.toLowerCase() == suffix.toLowerCase());
          return member;
        } else if (suffix) {
          let member = (await msg.guild.members.fetch({query: suffix})).first();
          if (member) return (getMember ? member : member.user);
          else return undefined;
        } else return (getMember ? msg.member : msg.author);
      } else {
        let userMentions = msg.mentions.users;
        userMentions.delete(msg.client.user.id);
        return userMentions.first() || msg.author;
      }
    } catch(error) {
      u.errorHandler(error, msg);
      return null;
    }
  },
  noop: () => {},
  paginator: async function(msg, pager, elements, page = 0, perPage = 1) {
    try {
      let totalPages = Math.ceil(elements.length / perPage);
      if (totalPages > 1) {
        let embed = pager(elements, page, msg)
        .setFooter(`Page ${page + 1} / ${totalPages}. React with ⏪ and ⏩ to navigate.`);
        let m = await msg.channel.send({embed});
        await m.react("⏪");
        await m.react("⏩");
        let reactions;

        do {
          reactions = await m.awaitReactions(
            (reaction, user) => (user.id == msg.author.id) && ["⏪", "⏩"].includes(reaction.emoji.name),
            { time: 300000, max: 1 }
          );
          if (reactions.size > 0) {
            let react = reactions.first().emoji.name;
            if (react == "⏪") page--;
            else if (react == "⏩") page++;
            if (page < 0 || page >= totalPages) page = (page + totalPages) % totalPages;

            reactions.first().remove(msg.author.id);

            embed = pager(elements, page, msg)
            .setFooter(`Page ${page + 1} / ${totalPages}. React with ⏪ and ⏩ to navigate.`);
            m = await m.edit({embed});
          }
        } while (reactions.size > 0);

        embed.setFooter(`Page ${page + 1} / ${totalPages}`);
        m.edit({embed});
        for (const [rid, r] of m.reactions.cache) {
          if (!r.me) continue;
          else r.remove();
        }
      } else await msg.channel.send({embed: pager(elements, page, msg)});
    } catch(e) { Utils.alertError(e, msg); }
  },
  parse: (msg, clean = false) => {
    for (let prefix of [config.prefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`]) {
      let content = clean ? msg.cleanContent : msg.content;
      if (!content.startsWith(prefix)) continue;
      let trimmed = content.substr(prefix.length).trim();
      let [command, ...params] = trimmed.split(" ");
      if (command) {
        let suffix = params.join(" ");
        if (suffix.toLowerCase() == "help") {  // Allow `!command help` syntax
          let t = command.toLowerCase();
          command = "help";
          suffix = t;
        }
        return {
          command: command.toLowerCase(),
          suffix,
          params
        };
      }
    }
    return null;
  },
  path: (...segments) => {
    const path = require("path");
    return path.resolve(path.dirname(require.main.filename), ...segments);
  },
  properCase: (txt) => txt.split(" ").map(word => (word[0].toUpperCase() + word.substr(1).toLowerCase())).join(" "),
  rand: (array) => array[Math.floor(Math.random() * array.length)],
  userMentions: (msg, member = false) => {
    // Useful to ensure the bot isn't included in the mention list,
    // such as when the bot mention is the command prefix
    let userMentions = (member ? msg.mentions.members : msg.mentions.users);
    if (userMentions.has(msg.client.user.id)) userMentions.delete(msg.client.user.id);

    // Now, if mentions don't exist, run queries until they fail
    /*if (userMentions.size == 0) {
      guildMembers = msg.guild.members;
      let parse = msg.content.trim().split(" ");
      parse.shift(); // Ditch the command
      do {
        let q = parse.shift(); // Get next potential user/member
        let keepGoing = false;
        try {
          // Query it as a Snowflake first, otherwise search by username
          let mem = (await guildMembers.fetch(q)) || (await guildMembers.fetch({query: q}));

          if (mem instanceof Discord.Collection && mem.size == 1) {
            // Treat a multiple-match search result as a failed search
            mem = mem.first(); // Convert the Collection into a GuildMember
          }

          if (mem instanceof Discord.GuildMember) {
            // Either the Snowflake search worked, or there was exactly one username match
            userMentions.set(mem.id, member ? mem : mem.user);
            keepGoing = true;
          }
        } catch (e) {
          Utils.errorHandler(e, msg);
        }
      } while (keepGoing && parse.length > 0);
    }*/
    return userMentions;
  }
};

module.exports = Utils;
