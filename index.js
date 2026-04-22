const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Wild Niche: ALL BUTTONS OPERATIONAL'));
app.listen(3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- DATA ---
const Characters = {
    'Gabor': { hp: 400, ult: '🌈 IMAGINARY: BEIGE', uDmg: 1000, acts: [{name: 'Check', text: 'Beige energy.'}, {name: 'Fix WiFi', text: 'Router reset!'}] },
    'Jay': { hp: 400, ult: '🌈 JACKPOT', uDmg: 888, acts: [{name: 'Check', text: 'RNG King.'}, {name: 'Coin Toss', text: 'He is mesmerized!'}] },
    'Besumss': { hp: 500, ult: '🌈 WHEEL OF DOOM', uDmg: 900, acts: [{name: 'Check', text: 'Fast wheels.'}, {name: 'Oil Wheels', text: 'Squeak gone!'}] },
    'Louka': { hp: 700, ult: '🌈 EVENT HORIZON', uDmg: 1500, acts: [{name: 'Check', text: 'Cosmic hair.'}, {name: 'Meditate', text: 'Inner peace.'}] },
    'Laggyboi': { hp: 450, ult: '🌈 TIMEOUT', uDmg: 1500, acts: [{name: 'Check', text: 'High ping.'}, {name: 'Lower Graphics', text: 'FPS Boost!'}] },
    'Helper': { hp: 300, ult: '🌈 WIKI BLAST', uDmg: 600, acts: [{name: 'Check', text: 'Tutorial bot.'}, {name: 'Read Manual', text: 'Helpful!'}] }
};

const UserData = new Map();
const BattleStates = new Map();

function getUser(id) {
    if (!UserData.has(id)) UserData.set(id, { 
        wc: 1000, collection: ['Helper', 'Gabor'], activeChar: 'Helper', 
        playerHP: 300, items: { bandage: 2 }, premium: false, 
        activeTitle: 'Newcomer', titles: ['Newcomer'], achievements: [], 
        switchedThisFight: false, turns: 0, jayUltCount: 0
    });
    return UserData.get(id);
}

client.on('ready', async () => {
    const cmds = [
        new SlashCommandBuilder().setName('spawn').setDescription('Find a wild Animaler'),
        new SlashCommandBuilder().setName('shop').setDescription('General Store'),
        new SlashCommandBuilder().setName('profile').setDescription('Check your stats')
    ];
    await client.application.commands.set(cmds);
    console.log("🤠 All buttons wired and ready!");
});

client.on('interactionCreate', async (i) => {
    const u = getUser(i.user.id);

    // --- NON-BATTLE COMMANDS ---
    if (i.isChatInputCommand()) {
        if (i.commandName === 'profile') {
            const pEmbed = new EmbedBuilder()
                .setTitle(`👤 ${i.user.username}'s Profile`)
                .setColor(u.premium ? '#F1C40F' : '#3498DB')
                .addFields(
                    { name: '🎖️ Title', value: `\`${u.activeTitle}\``, inline: true },
                    { name: '💰 Balance', value: `${u.wc} WC`, inline: true },
                    { name: '🏆 Achievements', value: u.achievements.length > 0 ? u.achievements.join(', ') : 'None' }
                );
            return i.reply({ embeds: [pEmbed] });
        }

        if (i.commandName === 'shop') {
            const sEmbed = new EmbedBuilder().setTitle('🌵 SHOP').setColor('#2ECC71').setDescription(`💰 Balance: ${u.wc} WC`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('buy_bandage').setLabel('🟢 BUY BANDAGE (50)').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('buy_premium').setLabel('🟢 BUY PREMIUM (5000)').setStyle(ButtonStyle.Success)
            );
            return i.reply({ embeds: [sEmbed], components: [row] });
        }

        if (i.commandName === 'spawn') {
            const keys = Object.keys(Characters);
            const key = keys[Math.floor(Math.random() * keys.length)];
            const char = Characters[key];
            u.playerHP = Characters[u.activeChar].hp;
            u.switchedThisFight = false; u.turns = 0; u.jayUltCount = 0;
            
            const bEmbed = new EmbedBuilder().setTitle(`✨ WILD ${key.toUpperCase()}`).setDescription(`HP: ${char.hp}`).setColor('#FFEE00');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_battle').setLabel('⚔️ BATTLE').setStyle(ButtonStyle.Danger));
            const msg = await i.reply({ embeds: [bEmbed], components: [row], fetchReply: true });
            BattleStates.set(msg.id, { hp: char.hp, name: key, meter: 0, canSpare: false });
            return;
        }
    }

    if (!i.isButton()) return;
    const state = BattleStates.get(i.message.id);

    // --- SHOP LOGIC ---
    if (i.customId.startsWith('buy_')) {
        const item = i.customId.split('_')[1];
        const cost = item === 'bandage' ? 50 : 5000;
        if (u.wc < cost) return i.reply({ content: "❌ Too broke!", ephemeral: true });
        u.wc -= cost;
        if (item === 'premium') { u.premium = true; u.activeTitle = 'The Elite'; }
        else u.items.bandage++;
        return i.reply({ content: `✅ Bought ${item}!`, ephemeral: true });
    }

    if (!state) return;
    const activeData = Characters[u.activeChar];

    // --- NAVIGATION ---
    if (i.customId === 'btn_battle' || i.customId === 'back') {
        const r1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('menu_atk').setLabel('⚔️ ATTACK').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('menu_act').setLabel('💬 ACT').setStyle(ButtonStyle.Secondary)
        );
        const r2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('menu_switch').setLabel('🔄 SWITCH').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('menu_items').setLabel('🎒 ITEMS').setStyle(ButtonStyle.Secondary)
        );
        const r3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('menu_spare').setLabel('💛 SPARE').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('hit_ult').setLabel(`🌈 ULT`).setStyle(ButtonStyle.Success).setDisabled(state.meter < 100)
        );
        return i.update({ content: `**Enemy:** ${state.name} (${state.hp} HP) | **You:** ${u.activeChar} (${u.playerHP} HP) | **Meter:** ${state.meter}%`, components: [r1, r2, r3] });
    }

    // --- ATTACK SUB-MENU ---
    if (i.customId === 'menu_atk') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('hit_normal').setLabel('👊 Punch').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('hit_skill').setLabel('🔥 Skill').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('back').setLabel('🔙 BACK').setStyle(ButtonStyle.Secondary)
        );
        return i.update({ components: [row] });
    }

    // --- ITEMS SUB-MENU ---
    if (i.customId === 'menu_items') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('use_bandage').setLabel(`🩹 Bandage (${u.items.bandage})`).setStyle(ButtonStyle.Success).setDisabled(u.items.bandage <= 0),
            new ButtonBuilder().setCustomId('back').setLabel('🔙 BACK').setStyle(ButtonStyle.Secondary)
        );
        return i.update({ content: "🎒 Select an item to use:", components: [row] });
    }

    if (i.customId === 'use_bandage') {
        u.items.bandage--;
        u.playerHP = Math.min(u.playerHP + 100, Characters[u.activeChar].hp);
        return i.update({ content: `🩹 Used a Bandage! Healed to ${u.playerHP} HP.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }

    // --- COMBAT LOGIC ---
    if (i.customId.startsWith('hit_')) {
        u.turns++;
        const type = i.customId.split('_')[1];
        let dmg = 40; 
        if (type === 'ult') dmg = activeData.uDmg;
        if (type === 'skill') dmg = 70;

        state.hp -= dmg;
        state.meter = type === 'ult' ? 0 : Math.min(100, state.meter + 34);

        if (state.hp <= 0) {
            // Achievements check
            if (u.activeChar === 'Gabor' && u.playerHP === 1) { u.achievements.push('The Honoured One'); u.activeTitle = 'The Honoured One'; }
            u.collection.push(state.name); u.wc += 200;
            BattleStates.delete(i.message.id);
            return i.update({ content: `🏆 Captured ${state.name}! Earned 200 WC.`, embeds: [], components: [] });
        }
        u.playerHP = Math.max(1, u.playerHP - 25);
        return i.update({ content: `💥 Dealt ${dmg} damage! Enemy hit back!`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }

    // --- SPARE & ACT LOGIC ---
    if (i.customId === 'menu_spare') {
        if (!state.canSpare) return i.reply({ content: "❌ Try ACTing first!", ephemeral: true });
        BattleStates.delete(i.message.id);
        return i.update({ content: `💛 You spared ${state.name}!`, embeds: [], components: [] });
    }

    if (i.customId === 'menu_act') {
        const row = new ActionRowBuilder().addComponents(
            Characters[state.name].acts.map((a, idx) => new ButtonBuilder().setCustomId(`doact_${idx}`).setLabel(a.name).setStyle(ButtonStyle.Secondary))
        );
        return i.update({ components: [row] });
    }

    if (i.customId.startsWith('doact_')) {
        state.canSpare = true;
        const actText = Characters[state.name].acts[i.customId.split('_')[1]].text;
        return i.update({ content: `💬 ${actText}`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }

    // --- SWITCH LOGIC ---
    if (i.customId === 'menu_switch') {
        const row = new ActionRowBuilder().addComponents(
            u.collection.slice(0, 5).map(c => new ButtonBuilder().setCustomId(`setchar_${c}`).setLabel(c).setStyle(ButtonStyle.Primary))
        );
        return i.update({ content: "🔄 Select an Animaler:", components: [row] });
    }

    if (i.customId.startsWith('setchar_')) {
        u.activeChar = i.customId.split('_')[1];
        u.playerHP = Characters[u.activeChar].hp;
        u.switchedThisFight = true;
        return i.update({ content: `✅ Switched to ${u.activeChar}!`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }
});

client.login(process.env.TOKEN);
