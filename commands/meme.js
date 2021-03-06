const Augur = require("augurbot"),
    u = require("../utils/utils"),
    axios = require("axios");

const Module = new Augur.Module()
    .addCommand({
        name: "meme",
        category: "Meme",
        description: "Creates a meme, put an image URL for you background and then put the text you want on new lines.",
        permissions: (msg) => msg.channel.type === 'dm' || msg.channel.permissionsFor(msg.member).has(["ATTACH_FILES", "EMBED_LINKS"]),
        process: async (msg, uncleanSuffix) => {
            if (!uncleanSuffix) return msg.reply("you need to tell me some meme text!").then(u.clean);
            let { suffix } = u.parse(msg, true);
            //general globals from bot this was imported from
            const args = suffix.trim().split("\n");
            const uncleanArgs = uncleanSuffix.trim().split("\n");
            //Determine if a string is a url
            function isURL(str) {
                // Sloppy, but does the trick.
                const url = /^<?(https?:\/\/\S*?)>?$/;
                const match = url.exec(str);
                return match ? match[1] : null;
            }
            let src;

            if (msg.attachments.size > 0) {  // Message attachments as the default source
              src = msg.attachments.first().url;
            } else if (isURL(args[0])) { // Look for a URL at the beginning if one wasn't attached
              src = isURL(args.shift());
            } else {
              // Look for an initial @mention to use as source
              let mention = /^<@!?(\d+)>$/;
              let match = mention.exec(uncleanArgs[0].trim());
              if (match) {
                let mentionId = match[1];
                src = msg.guild?.members.cache.get(mentionId)?.user.displayAvatarURL({size: 512, format: "png"});
                args.shift();
              }
              // Fallback
              if (!src) {
                let i = 0;
                while (!(src?.endsWith(".jpg") || src?.endsWith(".png")) && (i++ < 5)) {
                  let response = await axios.get("https://random.dog/woof.json").catch(u.noop);
                  src = response?.data?.url;
                }
                if (!(src?.endsWith(".jpg") || src?.endsWith(".png"))) src = null;
              }
              if (!src) src = "https://i.imgflip.com/qbm81.jpg";
            }
            let [topText, bottomText] = args;

            bottomText = encodeURIComponent(bottomText?.replace(/\-/g, " -") || "_");
            topText = encodeURIComponent(topText?.replace(/\-/g, " -") || "_");
            src = encodeURIComponent(src.trim());
            let meme = `https://api.memegen.link/images/custom/${topText}/${bottomText}.png?background=${src}`;

            msg.channel.send(`${msg.author} says:`, { files: [meme] });
            u.clean(msg, 2000);
        },
    });
module.exports = Module;
