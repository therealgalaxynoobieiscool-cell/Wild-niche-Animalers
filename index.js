const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');

// --- 1. INITIALIZE BOT ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- 2. THE POWER SWITCH (Login First!) ---
client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error("LOGIN ERROR: Check your Render Token Value!");
    console.error(err);
});

// --- 3. HOSTING (Keep Render Happy) ---
const port = process.env.PORT || 10000; // Render prefers 10000
http.createServer((req, res) => { 
    res.write("Niche-Verse: Wild Animalers MASTER ONLINE"); 
    res.end(); 
}).listen(port);

// --- 4. DATABASES ---
const balances = new Map();
const inventories = new Map();
const activeSpawns = new Map();
const serverBoosters = { godly: 0.0075, mythical: 0.004, legendary: 0.0025 };
const activeBoss = { entity: null, hp: 0, maxHp: 0 };
const creatorID = '1265802263398711369';
let ownershipMode = false;

// --- 5. CHARACTER DATA ---
const characters = {
  "Noobie": { rarity: "VOID/Godly", hp: 10000, color: "#000000", passive: "35-70% Crit (2x DMG)", forms: ["Normal", "Leader (75%)", "General (50%)", "Elite (20%)"] },
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

// --- 6. LOGIC ---
client.once('ready', () => {
    console.log(`✅ SUCCESS: Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.author.id === creatorID) {
    if (msg.content === '!ownership') {
      ownershipMode = !ownershipMode;
      return msg.reply(ownershipMode ? "👑 **OWNERSHIP: ON** (Admin DMG Active)" : "🛡️ **OWNERSHIP: OFF**");
    }

    if (msg.content.startsWith('!give')) {
      const parts = msg.content.split(' ');
      const char = parts[parts.length - 1];
      const target = msg.mentions.users.first() || msg.author;
      if (!characters[char]) return msg.reply("Character not found.");
      let inv = inventories.get(target.id) || [];
      inv.push(char);
      inventories.set(target.id, inv);
      return msg.reply(`✅ Gave **${char}** to **${target.username}**.`);
    }
  }

  // ✨ AUTO SPAWN
  if (Math.random() < 0.15) {
    const roll = Math.random() * 100;
    let picked = "Louka";
    if (roll < 4) picked = "Noobie";
    else if (roll < 8) picked = "E2";
    else if (roll < 15) picked = "Divine";

    const spawnId = `claim_${msg.id}`;
    activeSpawns.set(spawnId, picked);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(spawnId).setLabel(`CLAIM ${picked}`).setStyle(ButtonStyle.Success)
    );
    msg.channel.send({ content: `✨ **A WILD ${picked.toUpperCase()} APPEARED!**`, components: [row] });
  }

  if (msg.content === '!inv') {
    const inv = inventories.get(msg.author.id) || ["None"];
    const embed = new EmbedBuilder().setTitle(`🎒 ${msg.author.username}'s Inventory`).setDescription(inv.join(", ")).setColor("#5865F2");
    msg.channel.send({ embeds: [embed] });
  }
});

client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;
  if (i.customId.startsWith('claim_')) {
    const char = activeSpawns.get(i.customId);
    if (!char) return i.reply({ content: "Too late!", ephemeral: true });
    let inv = inventories.get(i.user.id) || [];
    inv.push(char);
    inventories.set(i.user.id, inv);
    activeSpawns.delete(i.customId);
    return i.update({ content: `✅ **${i.user.username}** caught **${char}**!`, components: [] });
  }
});
