const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

// ===== LOAD DATA =====
let debts = {};
try {
  debts = JSON.parse(fs.readFileSync("./debts.json"));
} catch {
  debts = {};
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.once("ready", () => {
  console.log(`Bot online: ${client.user.tag}`);
});

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
      color: 0x000000
    };

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🌧️");

    setTimeout(async () => {
      const fetched = await message.channel.messages.fetch(msg.id);
      const reaction = fetched.reactions.cache.get("🌧️");

      if (!reaction) return message.channel.send("không có ai tham gia");

      const users = await reaction.users.fetch();
      const list = users.filter(u => !u.bot);

      if (list.size === 0) {
        return message.channel.send("không có ai tham gia");
      }

      const winner = list.random();
      message.channel.send(`alo con bạc ${winner} lên nhận quà 😈`);
    }, duration * 1000);
  }

  // =====================
  // 💸 MNO (mình nợ người khác)
  // =====================
  if (cmd === "mno") {
    const target = message.mentions.users.first();
    const amount = parseInt(args[2]);

    if (!target || isNaN(amount)) {
      return message.reply("dùng: mno @user 500");
    }

    const author = message.author;

    if (!debts[author.id]) debts[author.id] = {};
    if (!debts[author.id][target.id]) debts[author.id][target.id] = 0;

    debts[author.id][target.id] += amount;

    fs.writeFileSync("./debts.json", JSON.stringify(debts, null, 2));

    return message.reply(
      `bạn nợ ${target.username}: ${debts[author.id][target.id].toLocaleString()}`
    );
  }

  // =====================
  // 📊 MCHECK (KHÔNG GỘP)
  // =====================
  if (cmd === "mcheck") {
    const author = message.author;

    let text = `<:emoji_74:1485446111425593374> Những người đang nợ bae:\n\n`;

    let hasDebt = false;
    let hasOwe = false;

    // ===== AI NỢ MÌNH =====
    for (let userId in debts) {
      if (debts[userId][author.id]) {
        hasDebt = true;
        const user = await client.users.fetch(userId);
        text += `${user.username}: ${debts[userId][author.id].toLocaleString()}\n`;
      }
    }

    if (!hasDebt) {
      text += "không có ai đang nợ bae hết <:doi:1495584346076217556>";
    }

    // ===== XUỐNG DÒNG =====
    text += `\n\n<:emoji_74:1485446111425593374> Những người bae đang nợ:\n\n`;

    // ===== MÌNH NỢ AI =====
    if (debts[author.id]) {
      for (let userId in debts[author.id]) {
        hasOwe = true;
        const user = await client.users.fetch(userId);
        text += `${user.username}: ${debts[author.id][userId].toLocaleString()}\n`;
      }
    }

    if (!hasOwe) {
      text += "bae không nợ ai cả <:lacdit:1488782092434145291>";
    }

    return message.channel.send(text);
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
