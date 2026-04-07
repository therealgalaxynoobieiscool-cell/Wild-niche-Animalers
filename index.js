const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');

// --- 1. HOSTING (Keep-Alive) ---
const port = process.env.PORT || 8080;
http.createServer((req, res) => { res.write("Niche-Verse: Wild Animalers MASTER ONLINE"); res.end(); }).listen(port);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- 2. DATABASES ---
const balances = new Map();
const inventories = new Map();
const activeSpawns = new Map();
const serverBoosters = { godly: 0.0075, mythical: 0.004, legendary: 0.0025 }; // 2x Nerfed
const activeBoss = { entity: null, hp: 0, maxHp: 0 };
const creatorID = '1265802263398711369';
let ownershipMode = false;

// --- 3. CHARACTER & LORE DATA ---
const characters = {
  "Noobie": { 
    rarity: "VOID/Godly", hp: 10000, color: "#000000", 
    passive: "35-70% Crit (2x DMG)", 
    forms: ["Normal", "Leader (75%)", "General (50%)", "Elite (20%)"] 
  },
  "E2": { rarity: "Godly", hp: 8000, ability: "6:06 Error (Crashout if Billy dies)", color: "#FFD700" },
  "Divine": { rarity: "Godly", hp: 15000, ability: "Absolute Power / Fusion with Smile", color: "#FFFFFF" },
  "Sakin": { rarity: "Godly", hp: 12000, ability: "Void Slicer", color: "#4B0082" },
  "Zuomy": { rarity: "Godly", hp: 11000, ability: "Speed Blitz", color: "#00FFFF" },
  "Wemboo": { rarity: "Mythical", hp: 9500, ability: "Wemboo Bash", color: "#FF69B4" },
  "Smile": { rarity: "Mythical", hp: 9500, ability: "Divine Fusion Partner", color: "#FF00FF" },
  "Billy Ohio": { rarity: "Legendary", hp: 5000, ability: "Lore Trigger: 'Is anyone there?'", color: "#00FF00" },
  "Louka": { rarity: "Common", hp: 30606, ability: "Void Strike (60% Accuracy)", color: "#808080" },
  "Jamal": { rarity: "Legendary", hp: 6000, ability: "Green Smiler Healing", color: "#32CD32" }
};

const bossData = {
  "Oticapsed": { hp: 250000, rewards: 25000, color: "#1a0033" },
  "Void King": { hp: 500000, rewards: 50000, color: "#000000" }
};

// --- 4. MAIN GAME LOGIC ---
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // 👑 CREATOR COMMANDS
  if (msg.author.id === creatorID) {
    if (msg.content === '!ownership') {
      ownershipMode = !ownershipMode;
      return msg.reply(ownershipMode ? "👑 **OWNERSHIP: ON** (Admin DMG Active)" : "🛡️ **OWNERSHIP: OFF**");
    }

    if (msg.content.startsWith('!give')) {
      const target = msg.mentions.users.first() || msg.author;
      const char = msg.content.split(' ').pop();
      if (!characters[char]) return msg.reply("Character not found.");
      let inv = inventories.get(target.id) || [];
      inv.push(char);
      inventories.set(target.id, inv);
      return msg.reply(`✅ Gave **${char}** to **${target.username}**.`);
    }

    if (msg.content.startsWith('!kind')) {
      const target = msg.mentions.users.first();
      const amount = parseInt(msg.content.split(' ')[2]);
      if (target && amount) {
        balances.set(target.id, (balances.get(target.id) || 0) + amount);
        return msg.reply(`💰 Bestowed **${amount.toLocaleString()}** coins to ${target.username}.`);
      }
    }

    if (msg.content === '!spawn boss') {
      const b = bossData["Oticapsed"];
      activeBoss.entity = b; activeBoss.hp = b.hp; activeBoss.maxHp = b.hp;
      return msg.channel.send(`⚠️ **BOSS ALERT:** Oticapsed has appeared! HP: ${b.hp.toLocaleString()}`);
    }
  }

  // ✨ AUTO SPAWN (2-6% Godly Rates)
  if (Math.random() < 0.15) {
    const roll = Math.random() * 100;
    let picked = "Louka";
    if (roll < 4) picked = "Noobie";
    else if (roll < 8) picked = "E2";
    else if (roll < 15) picked = "Divine";
    else if (roll < 30) picked = "Speedy";

    const spawnId = `claim_${msg.id}`;
    activeSpawns.set(spawnId, picked);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(spawnId).setLabel(`CLAIM ${picked}`).setStyle(ButtonStyle.Success)
    );
    msg.channel.send({ content: `✨ **A WILD ${picked.toUpperCase()} APPEARED!**`, components: [row] });
  }

  // ⚔️ BOSS ATTACK
  if (msg.content === '!attack' && activeBoss.entity) {
    let dmg = 1500 + Math.floor(Math.random() * 2000);
    if (ownershipMode && msg.author.id === creatorID) dmg = 9999999;

    activeBoss.hp -= dmg;
    if (activeBoss.hp <= 0) {
      msg.reply("🏆 **BOSS DEFEATED!** Rewards distributed.");
      activeBoss.entity = null;
    } else {
      msg.channel.send(`💥 **${msg.author.username}** dealt **${dmg.toLocaleString()}** DMG! HP: ${activeBoss.hp.toLocaleString()}`);
    }
  }

  // 🎒 INVENTORY
  if (msg.content === '!inv') {
    const inv = inventories.get(msg.author.id) || ["None"];
    const embed = new EmbedBuilder().setTitle(`🎒 ${msg.author.username}'s Inventory`).setDescription(inv.join(", ")).setColor("#5865F2");
    msg.channel.send({ embeds: [embed] });
  }
});

// --- 5. INTERACTION ENGINE ---
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;
  await i.deferUpdate().catch(() => {});

  if (i.customId.startsWith('claim_')) {
    const char = activeSpawns.get(i.customId);
    if (!char) return;
    let inv = inventories.get(i.user.id) || [];
    inv.push(char);
    inventories.set(i.user.id, inv);
    activeSpawns.delete(i.customId);
    return i.editReply({ content: `✅ Caught **${char}**!`, embeds: [], components: [] });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
