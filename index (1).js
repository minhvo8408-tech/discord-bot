const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("bot online");
});

app.listen(3000, () => {
  console.log("web chạy");
});
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// ===== LOAD DATA =====
let debts = {};
try {
  debts = JSON.parse(fs.readFileSync("./debts.json"));
} catch {
  debts = {};
}

client.once("ready", () => {
  console.log(`Bot online: ${client.user.tag}`);
});

// ===== MAIN =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args[0].toLowerCase();

  // =====================
  // 🎲 RANDOM
  // =====================
  if (cmd === "mrd") {
    const number = Math.floor(Math.random() * 100) + 1;
    return message.reply(`số random của bae là **${number}**`);
  }

  // =====================
  // 🎁 GIVEAWAY
  // =====================
  if (cmd === "mga") {
    if (args.length < 4) {
      return message.reply("dùng: mga 10s 1 quà");
    }

    const time = args[1];
    const prize = args.slice(3).join(" ");
    const duration = parseInt(time.replace("s", ""));
    const endTime = Math.floor((Date.now() + duration * 1000) / 1000);

    const embed = {
      description: `**${prize}**

Bấm 🌧️ để tham gia
• kết thúc trong: <t:${endTime}:R>
• host: ${message.author}`,
      color: 0x000000,
      thumbnail: {
        url: client.user.displayAvatarURL()
      }
    };

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🌧️");

    setTimeout(async () => {
      const fetched = await message.channel.messages.fetch(msg.id);
      const reaction = fetched.reactions.cache.get("🌧️");

      if (!reaction) return message.channel.send("không có ai tham gia");

      const users = await reaction.users.fetch();
      const list = users.filter(u => !u.bot).map(u => u);

      if (list.length === 0) {
        return message.channel.send("không có ai tham gia");
      }

      const winner = list[Math.floor(Math.random() * list.length)];
      message.channel.send(`# alo con bạc ${winner} lên sòng lẹ`);
    }, duration * 1000);
  }

  // =====================
  // 💰 MNO
  // =====================
  if (cmd === "mno") {
    const user = message.mentions.users.first();
    const amount = parseInt(args[2]);

    if (!user || isNaN(amount)) {
      return message.reply("dùng: mno @user 500000");
    }

    if (!debts[user.id]) debts[user.id] = 0;
    debts[user.id] += amount;

    fs.writeFileSync("./debts.json", JSON.stringify(debts, null, 2));

    return message.channel.send(
      `${user.username} đang nợ bae ${debts[user.id].toLocaleString()}`
    );
  }

  // =====================
  // 💸 MXOA
  // =====================
  if (cmd === "mxoa") {
    const user = message.mentions.users.first();
    const amount = parseInt(args[2]);

    if (!user || isNaN(amount)) {
      return message.reply("dùng: mxoa @user 500000");
    }

    if (!debts[user.id]) debts[user.id] = 0;

    debts[user.id] -= amount;
    if (debts[user.id] < 0) debts[user.id] = 0;

    fs.writeFileSync("./debts.json", JSON.stringify(debts, null, 2));

    return message.channel.send(
      `${user.username} còn nợ bae ${debts[user.id].toLocaleString()}`
    );
  }

  // =====================
  // 📊 MCHECK (KHÔNG PING)
  // =====================
  if (cmd === "mcheck") {
    let text = " <:emoji_74:1485446111425593374> Những người đang nợ bae:\n\n";
    let hasDebt = false;

    for (let id in debts) {
      if (debts[id] > 0) {
        const user = await client.users.fetch(id);
        text += `${user.username}: ${debts[id].toLocaleString()}\n`;
        hasDebt = true;
      }
    }

    if (!hasDebt) {
      text += "không có ai đang nợ bae hết <:doi:1495584346076217556> ";
    }

    text += "\n <:emoji_74:1485446111425593374> Những người bae đang nợ:\n";
    text += "bae không nợ ai cả <a:lacdit:1488782092434145291>";

    return message.channel.send(text);
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);``