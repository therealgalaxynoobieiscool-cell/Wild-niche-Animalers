const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Frontier Engine: SINGULARITY READY'));
app.listen(3000);

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// --- THE COMPLETE CHARACTER DATABASE ---
const Characters = {
    'Gabor': { 
        rarity: 'Common', hp: 100, atk: 15, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496247883106877560/Screenshot_20260411-035900.png', 
        vnt_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496245909389049856/017fc814809cfd1cc46d385b277248a9.png', 
        vnt_name: 'The Noober One', vnt_rarity: 'Legendary' 
    },
    'Helper': { 
        rarity: 'Uncommon', hp: 120, atk: 18, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496261889519522003/8b601fce2f11faa6709f1158f6efdeea.png', 
        vnt_img: null 
    },
    'Laggyboi': { rarity: 'Rare', hp: 110, atk: 25, std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496246942685069372/Screenshot_20260411-035737.png', vnt_img: null },
    'Jay': { 
        rarity: 'Legendary', hp: 250, atk: 30, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496247062285783130/Screenshot_20260411-021057.png', 
        vnt_name: 'Randomizing', vnt_rarity: 'Mythical' 
    },
    'Louka': { 
        rarity: 'Legendary', hp: 260, atk: 28, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496245898064302161/dc7eca4c7e7c87a5c51b4739b4543168.webp', 
        vnt_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496250110072455229/Screenshot_20240402_222835_Discord.jpg', 
        vnt_name: 'Galactic', vnt_rarity: 'Singularity' 
    },
    'Besumss': { 
        rarity: 'Legendary', hp: 320, atk: 35, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496246967934648380/Screenshot_20260411-020944.png', 
        vnt_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496249902118731906/Untitled43_20260412135224.png', 
        vnt_name: 'Wheelchair', vnt_rarity: 'Mythical' 
    },
    'Smile': { 
        rarity: 'Mythical', hp: 200, atk: 40, 
        std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496245904477261834/Screenshot_20260421-222154.png', 
        vnt_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496249911639806143/Screenshot_20260411-035838.png', 
        vnt_name: 'Certified Pan', vnt_rarity: 'Godly' 
    },
    'Divine': { rarity: 'Godly', hp: 450, atk: 55, std_img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496246990672236544/Screenshot_20260411-020928.png', vnt_img: null }
};

const UserData = new Map(); 

function getUser(id) {
    if (!UserData.has(id)) {
        UserData.set(id, { 
            wc: 100, nc: 0, inventory: [], achievements: [], 
            titles: ['Traveler'], activeTitle: 'Traveler', 
            premiumUntil: 0, isPermPremium: false, boughtItems: []
        });
    }
    return UserData.get(id);
}

// --- SLASH COMMANDS ---
client.on('ready', async () => {
    const commands = [
        new SlashCommandBuilder().setName('spawn').setDescription('Find a character in the Frontier'),
        new SlashCommandBuilder().setName('shop').setDescription('Open the Frontier Store'),
        new SlashCommandBuilder().setName('profile').setDescription('View profile').addUserOption(o => o.setName('target')),
        new SlashCommandBuilder().setName('achievements').setDescription('View your medals'),
        new SlashCommandBuilder().setName('upvote').setDescription('Get 12h of Free Premium'),
        new SlashCommandBuilder().setName('titles').setDescription('Equip your titles')
    ];
    await client.application.commands.set(commands);
    console.log("🤠 Frontier Engine Online!");
});

client.on('interactionCreate', async (i) => {
    const u = getUser(i.user.id);
    const isPremium = u.isPermPremium || u.premiumUntil > Date.now();

    // Wealth/Shop Achievement Checks
    if (u.wc >= 11000 && !u.achievements.includes('💰 Wealthy Individual')) u.achievements.push('💰 Wealthy Individual');
    if (u.wc >= 55000 && !u.achievements.includes('💎 Very Wealthy Individual')) u.achievements.push('💎 Very Wealthy Individual');
    if (u.boughtItems.length >= 6 && !u.achievements.includes('🏬 Shopaholic')) u.achievements.push('🏬 Shopaholic');

    // --- 1. SPAWN SYSTEM ---
    if (i.commandName === 'spawn') {
        const roll = Math.random() * 100;
        let tier = roll < 0.1 ? 'Singularity' : roll < 1 ? 'Godly' : roll < 5 ? 'Mythical' : roll < 15 ? 'Legendary' : roll < 35 ? 'Rare' : roll < 60 ? 'Uncommon' : 'Common';

        const pool = Object.keys(Characters).filter(c => Characters[c].rarity === tier || (Characters[c].vnt_rarity === tier));
        const charKey = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 'Gabor';
        const char = Characters[charKey];
        const isVariant = Math.random() < 0.2 && char.vnt_img;

        const spawnEmbed = new EmbedBuilder()
            .setTitle(isVariant ? `✨ VARIANT DETECTED: ${char.vnt_name}` : `❗ NEW CHARACTER`)
            .setImage(isVariant ? char.vnt_img : char.std_img)
            .setColor(isVariant ? '#000000' : '#8B4513')
            .setDescription(`**Character:** ${charKey}\n**Rarity:** ${isVariant ? char.vnt_rarity : char.rarity}`);

        const btns = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`claim_${charKey}`).setLabel('🤝 CLAIM').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`fight_${charKey}_${isVariant}`).setLabel('⚔️ FIGHT').setStyle(ButtonStyle.Danger)
        );
        return i.reply({ embeds: [spawnEmbed], components: [btns] });
    }

    // --- 2. BATTLE SYSTEM (HONOURED ONE LOGIC) ---
    if (i.isButton() && i.customId.startsWith('fight')) {
        const [_, name, variant] = i.customId.split('_');
        let playerHP = 100, enemyHP = 400, didRevive = false, didSwitch = false;

        const bEmbed = new EmbedBuilder()
            .setTitle(`⚔️ BATTLE: VS ${name.toUpperCase()}`)
            .addFields({ name: 'Your HP', value: `${playerHP}/100`, inline: true }, { name: 'Enemy HP', value: `${enemyHP}/400`, inline: true })
            .setColor('#FF0000');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('atk').setLabel('⚔️ STRIKE').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('sw').setLabel('🔄 SWITCH').setStyle(ButtonStyle.Secondary)
        );

        const msg = await i.reply({ embeds: [bEmbed], components: [row], fetchReply: true });
        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async b => {
            if (b.user.id !== i.user.id) return b.reply({ content: "Not your battle!", ephemeral: true });
            if (b.customId === 'sw') didSwitch = true;
            
            // Honoured One Trigger
            if (name === 'Gabor' && variant === 'true' && playerHP > 1) {
                playerHP = 1; didRevive = true;
                bEmbed.setTitle("✨ THE HONOURED ONE AWAKENS").setDescription("`Throughout Heaven and Earth... I alone am the Noober one.`");
            }

            enemyHP -= (didRevive ? 200 : 50);
            if (enemyHP <= 0) {
                if (didRevive && playerHP === 1 && !didSwitch) u.titles.push('The Honoured One');
                u.wc += 350;
                await b.update({ content: "🏆 **VICTORY!** Wild Coins earned.", embeds: [], components: [] });
                collector.stop();
            } else {
                await b.update({ embeds: [bEmbed.setFields({ name: 'Your HP', value: `${playerHP}/100`, inline: true }, { name: 'Enemy HP', value: `${enemyHP}/400`, inline: true })] });
            }
        });
    }

    // --- 3. SHOP SYSTEM ---
    if (i.commandName === 'shop') {
        const shop = new EmbedBuilder()
            .setTitle('🌵 FRONTIER STORE')
            .setDescription(`💰 **WC:** ${u.wc} | 💎 **NC:** ${u.nc}\n${isPremium ? '🌟 **PREMIUM DISCOUNT ACTIVE**' : ''}`)
            .addFields(
                { name: '🩹 Bandage (50)', value: 'Heals 30 HP' },
                { name: '🎲 Re-Roll (500)', value: 'New Spawn' },
                { name: '🧿 Void Lens (1.5k)', value: 'Singularity Luck' },
                { name: '🧲 Horseshoe (2.5k)', value: 'Variant Luck' },
                { name: '🧪 Gamma Radiation (5k)', value: 'Power upgrade' },
                { name: '🛸 Warp Drive (10k)', value: 'Legendary Spawn' }
            ).setColor('#8B4513');
        return i.reply({ embeds: [shop] });
    }

    // --- 4. PROFILE & ACHIEVEMENTS ---
    if (i.commandName === 'profile') {
        const target = i.options.getUser('target') || i.user;
        const d = getUser(target.id);
        const p = d.isPermPremium || d.premiumUntil > Date.now();
        const prof = new EmbedBuilder()
            .setTitle(`${p ? '🌟 ' : ''}${target.username}'s Profile`)
            .addFields(
                { name: 'Title', value: `< ${d.activeTitle} >` },
                { name: 'Balance', value: `💰 ${d.wc} WC | 💎 ${d.nc} NC` },
                { name: 'Medals', value: d.achievements.join(', ') || 'None' }
            ).setColor(p ? '#00FFFF' : '#8B4513');
        return i.reply({ embeds: [prof] });
    }

    if (i.commandName === 'upvote') {
        u.premiumUntil = Date.now() + (12 * 60 * 60 * 1000);
        return i.reply("🌟 Upvoted! Premium benefits active for 12 hours.");
    }
});

client.login(process.env.TOKEN);
