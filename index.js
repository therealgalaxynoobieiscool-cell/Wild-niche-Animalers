const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const express = require('express');

// --- KEEP-ALIVE ---
const app = express();
app.get('/', (req, res) => res.send('Wild Niche Animalers: MASTER ENGINE ONLINE'));
app.listen(3000);

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// --- DATA & RARITIES ---
const Rarities = {
    COMMON:      { color: '#808080', label: 'Common' },
    UNCOMMON:    { color: '#31FF00', label: 'Uncommon' },
    RARE:        { color: '#0070FF', label: 'Rare' },
    LEGENDARY:   { color: '#FFA500', label: 'Legendary' },
    MYTHICAL:    { color: '#A335EE', label: 'Mythical' },
    GODLY:       { color: '#FF0000', label: 'Godly' },
    SINGULARITY: { color: '#00FBFF', label: 'Singularity' }
};

const Characters = {
    'Gabor': {
        hp: 400, img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496247883106877560/Screenshot_20260411-035900.png',
        variant: { name: 'The Noober One', tier: 'LEGENDARY', img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496245909389049856/017fc814809cfd1cc46d385b277248a9.png' },
        abilities: {
            melee: { name: '👊 Noob Slap', dmg: 20, charge: 15 },
            skill1: { name: '🔥 Lag Spike', dmg: 40, charge: 25 },
            skill2: { name: '⚡ Server Crash', dmg: 50, charge: 25 },
            skill3: { name: '🌀 Potato Shield', dmg: 10, charge: 35 },
            ultimate: { name: '🌈 IMAGINARY: BEIGE', dmg: 10000 }
        }
    },
    'Louka': {
        hp: 600, img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496245898064302161/dc7eca4c7e7c87a5c51b4739b4543168.webp',
        variant: { name: 'Galactic Louka', tier: 'SINGULARITY', img: 'https://cdn.discordapp.com/attachments/1311023058819219551/1496250110072455229/Screenshot_20240402_222835_Discord.jpg' },
        abilities: {
            melee: { name: '👊 Star Punch', dmg: 45, charge: 10 },
            skill1: { name: '🔥 Supernova', dmg: 80, charge: 20 },
            skill2: { name: '⚡ Quasar Beam', dmg: 95, charge: 20 },
            skill3: { name: '🌀 Black Hole', dmg: 110, charge: 20 },
            ultimate: { name: '🌈 EVENT HORIZON', dmg: 1500 }
        }
    },
    'Smile': {
        hp: 350, img: 'https://via.placeholder.com/150?text=Smile',
        variant: { name: 'Certified Pan Smile', tier: 'LEGENDARY', img: 'https://via.placeholder.com/150?text=Certified+Pan+Smile' },
        abilities: {
            melee: { name: '👊 Grin Strike', dmg: 30, charge: 20 },
            skill1: { name: '🔥 Pan Bash', dmg: 60, charge: 25 },
            skill2: { name: '⚡ Certified Flash', dmg: 50, charge: 25 },
            skill3: { name: '🌀 Scary Face', dmg: 15, charge: 30 },
            ultimate: { name: '🌈 GOLDEN FRY', dmg: 999 }
        }
    },
    'Besumss': {
        hp: 500, img: 'https://via.placeholder.com/150?text=Besumss',
        variant: { name: 'Wheelchair Besumss', tier: 'MYTHICAL', img: 'https://via.placeholder.com/150?text=Wheelchair+Besumss' },
        abilities: {
            melee: { name: '👊 Heavy Swing', dmg: 35, charge: 10 },
            skill1: { name: '🔥 Rolling Tackle', dmg: 55, charge: 20 },
            skill2: { name: '⚡ Metal Crash', dmg: 70, charge: 20 },
            skill3: { name: '🌀 Iron Wall', dmg: 5, charge: 40 },
            ultimate: { name: '🌈 WHEEL OF DOOM', dmg: 1200 }
        }
    },
    'Jay': {
        hp: 400, img: 'https://via.placeholder.com/150?text=Jay',
        variant: { name: 'Randomizing Jay', tier: 'MYTHICAL', img: 'https://via.placeholder.com/150?text=Randomizing+Jay' },
        abilities: {
            melee: { name: '👊 Quick Jab', dmg: 25, charge: 20 },
            skill1: { name: '🔥 Random Burst', dmg: 45, charge: 25 },
            skill2: { name: '⚡ Glitch Step', dmg: 30, charge: 30 },
            skill3: { name: '🌀 Shuffle', dmg: 0, charge: 50 },
            ultimate: { name: '🌈 JACKPOT CANNON', dmg: 800 }
        }
    }
};

const UserData = new Map();
const BattleStates = new Map();

function getUser(id) {
    if (!UserData.has(id)) UserData.set(id, { wc: 1000, collection: [], titles: ['Traveler'], activeTitle: 'Traveler' });
    return UserData.get(id);
}

// --- COMMAND REGISTRATION ---
client.on('ready', async () => {
    const commands = [
        new SlashCommandBuilder().setName('spawn').setDescription('Search for a Wild Niche character'),
        new SlashCommandBuilder().setName('shop').setDescription('Open the general store'),
        new SlashCommandBuilder().setName('profile').setDescription('View your collection and coins'),
        new SlashCommandBuilder().setName('help').setDescription('Learn how to play')
    ];
    await client.application.commands.set(commands);
    console.log("🤠 Wild Niche Animalers is READY!");
});

// --- INTERACTION HANDLER ---
client.on('interactionCreate', async (i) => {
    const u = getUser(i.user.id);

    // 1. HELP COMMAND
    if (i.commandName === 'help') {
        const hEmbed = new EmbedBuilder()
            .setTitle('📖 WILD NICHE ANIMALERS GUIDE')
            .setColor('#F1C40F')
            .addFields(
                { name: '🐾 Spawning', value: 'Use `/spawn` to find characters. 25% chance for a **Variant** to appear!' },
                { name: '⚔️ Combat', value: 'Attack to build your **Ultimate Meter**. Once it hits 100%, you can use your most powerful move.' },
                { name: '🌌 Singularity Raids', value: 'Singularity variants like **Galactic Louka** allow everyone to fight. Most damage wins the claim!' },
                { name: '💎 Rarities', value: 'Common, Uncommon, Rare, Legendary, Mythical, Godly, **SINGULARITY**.' }
            );
        return i.reply({ embeds: [hEmbed] });
    }

    // 2. SHOP COMMAND
    if (i.commandName === 'shop') {
        const sEmbed = new EmbedBuilder().setTitle('🌵 SHOP').setColor('#2ECC71').setDescription(`💰 Balance: ${u.wc} WC`);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('buy_bandage').setLabel('Buy Bandage (50)').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('buy_reroll').setLabel('Buy Re-Roll (500)').setStyle(ButtonStyle.Success)
        );
        return i.reply({ embeds: [sEmbed], components: [row] });
    }

    // 3. SPAWN COMMAND
    if (i.commandName === 'spawn') {
        const pool = Object.keys(Characters);
        const key = pool[Math.floor(Math.random() * pool.length)];
        const char = Characters[key];
        const isVar = Math.random() < 0.25 && char.variant;

        const tier = isVar ? char.variant.tier : 'COMMON';
        const name = isVar ? char.variant.name : key;
        const hp = isVar ? char.hp * 3 : char.hp;

        const embed = new EmbedBuilder()
            .setTitle(`✨ ${tier}: ${name.toUpperCase()}`)
            .setImage(isVar ? char.variant.img : char.img)
            .setColor(Rarities[tier].color)
            .setDescription(`**HP:** ${hp}\n${tier === 'SINGULARITY' ? "🌌 **RAID EVENT:** Most damage wins!" : "Fight to claim!"}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`init_fight_${key}_${!!isVar}`).setLabel('⚔️ ENTER BATTLE').setStyle(ButtonStyle.Danger)
        );

        const msg = await i.reply({ embeds: [embed], components: [row], fetchReply: true });
        BattleStates.set(msg.id, { hp, name, charKey: key, isVar: !!isVar, tier, board: {}, meter: {} });
    }

    // 4. BUTTON LOGIC (BATTLE & SHOP)
    if (i.isButton()) {
        const state = BattleStates.get(i.message.id);
        
        // Shop Logic
        if (i.customId.startsWith('buy_')) {
            const cost = i.customId.includes('bandage') ? 50 : 500;
            if (u.wc < cost) return i.reply({ content: "Insufficient WC!", ephemeral: true });
            u.wc -= cost;
            return i.reply({ content: `✅ Purchased! Balance: ${u.wc}`, ephemeral: true });
        }

        if (!state) return;

        // Battle Navigation
        if (i.customId.startsWith('init_fight') || i.customId === 'menu_back') {
            const m = state.meter[i.user.id] || 0;
            const embed = EmbedBuilder.from(i.message.embeds[0]).setDescription(`**HP:** ${state.hp}\n**💠 YOUR METER:** ${m}%`);
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_atk').setLabel('⚔️ ATTACK').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_act').setLabel('💬 ACT').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_item').setLabel('🎒 ITEMS').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_spare').setLabel('💛 SPARE').setStyle(ButtonStyle.Secondary)
            );
            return i.update({ embeds: [embed], components: [row1, row2] });
        }

        // Attack Menu
        if (i.customId === 'btn_atk') {
            const char = Characters[state.charKey];
            const m = state.meter[i.user.id] || 0;
            const r1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit_melee').setLabel(char.abilities.melee.name).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('hit_skill1').setLabel(char.abilities.skill1.name).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('hit_skill2').setLabel(char.abilities.skill2.name).setStyle(ButtonStyle.Danger)
            );
            const r2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hit_skill3').setLabel(char.abilities.skill3.name).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('hit_ultimate').setLabel(`🌈 ${char.abilities.ultimate.name}`).setStyle(ButtonStyle.Success).setDisabled(m < 100),
                new ButtonBuilder().setCustomId('menu_back').setLabel('🔙 BACK').setStyle(ButtonStyle.Secondary)
            );
            return i.update({ components: [r1, r2] });
        }

        // Combat Hit
        if (i.customId.startsWith('hit_')) {
            const type = i.customId.split('_')[1];
            const char = Characters[state.charKey];
            const move = char.abilities[type];

            state.meter[i.user.id] = Math.min(100, (state.meter[i.user.id] || 0) + (move.charge || 0));
            state.hp -= move.dmg;
            state.board[i.user.id] = (state.board[i.user.id] || 0) + move.dmg;

            // Gabor Cinematic
            if (state.charKey === 'Gabor' && state.isVar && type === 'ultimate') {
                const enl = new EmbedBuilder().setTitle("✨ THE HONOURED ONE").setColor('#F5F5DC').setDescription("**Gabor:** \"I alone am the Honored One.\"");
                await i.update({ embeds: [enl], components: [] });
                setTimeout(async () => {
                    enl.setTitle("☢️ TECHNIQUE: BEIGE").setImage('https://media.tenor.com/7p40PZ7vV00AAAAC/low-quality.gif');
                    await i.editReply({ embeds: [enl] });
                }, 4000);
            }

            // Win Condition
            if (state.hp <= 0) {
                const winnerId = Object.keys(state.board).reduce((a, b) => state.board[a] > state.board[b] ? a : b);
                const winner = await client.users.fetch(winnerId);
                getUser(winnerId).collection.push(state.name);
                BattleStates.delete(i.message.id);
                return i.update({ content: `🏆 **${state.name}** was claimed by **${winner.username}**!`, embeds: [], components: [] });
            }

            return i.update({ content: `💥 **${move.name}**! Enemy HP: ${state.hp} | Meter: ${state.meter[i.user.id]}%` });
        }
    }
});

client.login(process.env.TOKEN);
