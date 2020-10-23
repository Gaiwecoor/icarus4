const Augur = require("augurbot"),
    u = require("../utils/utils");

const Module = new Augur.Module()
    .addCommand({
        name: "meme",
        description: "Creates a meme, put an image URL for you background and then put the text you want along the bottom. Or put the image source afterwards. Who am I to judge?",
        permissions: (msg) => msg.channel.id == "121755900313731074" && msg.channel.permissionsFor(msg.member).has(["ATTACH_FILES", "EMBED_LINKS"]),
        process: (msg) => {
            let {suffix} = u.parse(msg, true);
            //general globals from bot this was imported from
            const args = suffix.trim().split(/ +/);
            //Determine if a string is a url
            function isURL(str) {
              // Sloppy, but does the trick.
              const url = /^<?(https?:\/\/\S*?)>?$/;
              const match = url.exec(str);
              return match ? match[1] : null;
            }

            let src = msg.attachments.size > 0 ? msg.attachments.first().url : null;
            let bottomText = [];
            let topText = [];
            for (const arg of args) {
              let url = isURL(arg);
              if (!src && url) {
                src = url;
              } else if (arg.toLowerCase() == "-t") {
                topText = bottomText;
                bottomText = [];
              } else {
                bottomText.push(arg);
              }
            }

            if (!src) src = "https://i.imgflip.com/qbm81.jpg";
            bottomText = encodeURIComponent(bottomText.join(" ").replace(/\-/g, " -"));
            topText = encodeURIComponent(topText.join(" ").replace(/\-/g, " -"));
            src = encodeURIComponent(src.trim());
            let meme = `https://api.memegen.link/images/custom/${topText || "_"}/${bottomText || "_"}.png?background=${src}`;

            msg.channel.send({ files: [meme] });
        },
    });
module.exports = Module;
