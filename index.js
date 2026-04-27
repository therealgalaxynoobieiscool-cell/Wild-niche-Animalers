const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Niche Animalers: COSMIC EDITION ONLINE'));
app.listen(3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// --- DATA & ROSTER ---
const Characters = {
    'Gabor': { hp: 400, tier: 'RARE', cosmic: { name: 'COSMIC: The Noober One', hp: 2000, uDmg: 2500 }, acts: [{name: 'Fix WiFi', text: 'Router reset!'}] },
    'Jay': { hp: 400, tier: 'RARE', cosmic: { name: 'COSMIC: The Brainrotted', hp: 1500, uDmg: 2000 }, acts: [{name: 'Coin Toss', text: 'He is mesmerized!'}] },
    'Besumss': { hp: 500, tier: 'UNCOMMON', variant: { name: 'Papa Besumss', hp: 1200, uDmg: 1800 }, acts: [{name: 'Tell Joke', text: 'Papa laughs!'}] },
    'Smile': { hp: 450, tier: 'LEGENDARY', variant: { name: 'Divine Smile', hp: 1800, uDmg: 3000 }, acts: [{name: 'Pray', text: 'Light shines!'}] },
    'Helper': { hp: 300, tier: 'COMMON', variant: { name: 'The Architect', hp: 900, uDmg: 1000 }, acts: [{name: 'Read Wiki', text: 'Knowledge!'}] },
    'Laggyboi': { hp: 450, tier: 'UNCOMMON', variant: { name: 'Absolute Zero', hp: 1100, uDmg: 2000 }, acts: [{name: 'Lower FPS', text: 'Smooth!'}] }
};

const ShopItems = {
    'bandage': { name: '🩹 Bandage', cost: 50, cur: 'WC', effect: 'HEAL' },
    'milk': { name: '🥛 Papa\'s Secret Milk', cost: 200, cur: 'WC', effect: 'SILENCE' },
    'skibidi': { name: '🚽 sk-ski-skibidi', cost: 150, cur: 'WC', effect: 'METER' },
    'essence': { name: '✨ Niche Essence', cost: 50, cur: 'NC', effect: 'BUFF' },
    'gold_card': { name: '💳 Niche Gold Card', cost: 1000, cur: 'NC', effect: 'CATCH' }
};

const UserData = new Map();
const BattleStates = new Map();

function getU(id) {
    if (!UserData.has(id)) UserData.set(id, { 
        wc: 200, nc: 0, collection: ['Helper'], activeChar: 'Helper', 
        playerHP: 300, items: { bandage: 1, milk: 0, skibidi: 0, essence: 0, gold_card: 0 }, 
        activeTitle: 'Newcomer', titles: ['Newcomer'], achievements: [] 
    });
    return UserData.get(id);
}

client.on('ready', async () => {
    const cmds = [
        new SlashCommandBuilder().setName('spawn').setDescription('Find a wild Animaler'),
        new SlashCommandBuilder().setName('shop').setDescription('Niche Market'),
        new SlashCommandBuilder().setName('profile').setDescription('Check stats/NC balance')
    ];
    await client.application.commands.set(cmds);
    console.log("🚀 Niche Engine V3: Fully Loaded");
});

client.on('interactionCreate', async (i) => {
    const u = getU(i.user.id);

    if (i.isChatInputCommand()) {
        if (i.commandName === 'profile') {
            const pEmbed = new EmbedBuilder().setTitle(`👤 ${i.user.username}`).setColor('#00FBFF')
                .addFields(
                    { name: '🎖️ Title', value: `\`${u.activeTitle}\``, inline: true },
                    { name: '💰 WC', value: `${u.wc}`, inline: true },
                    { name: '✨ NC', value: `${u.nc}`, inline: true },
                    { name: '🏆 Achievements', value: u.achievements.length > 0 ? u.achievements.join(', ') : 'None' }
                );
            return i.reply({ embeds: [pEmbed] });
        }

        if (i.commandName === 'shop') {
            const sEmbed = new EmbedBuilder().setTitle('🛒 THE NICHE MARKET').setDescription(`💰: ${u.wc} WC | ✨: ${u.nc} NC`).setColor('#2ECC71');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('buy_bandage').setLabel('🩹 Bandage (50 WC)').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('buy_milk').setLabel('🥛 Secret Milk (200 WC)').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('buy_essence').setLabel('✨ Essence (50 NC)').setStyle(ButtonStyle.Primary)
            );
            return i.reply({ embeds: [sEmbed], components: [row] });
        }

        if (i.commandName === 'spawn') {
            const keys = Object.keys(Characters);
            const key = keys[Math.floor(Math.random() * keys.length)];
            const isCosmic = (key === 'Gabor' || key === 'Jay') && Math.random() < 0.03;
            const isVariant = !isCosmic && Math.random() < 0.15;

            const name = isCosmic ? Characters[key].cosmic.name : (isVariant ? Characters[key].variant.name : key);
            const hp = isCosmic ? Characters[key].cosmic.hp : (isVariant ? Characters[key].variant.hp : Characters[key].hp);
            
            const bEmbed = new EmbedBuilder().setTitle(isCosmic ? `🌌 ! COSMIC DETECTED !` : `✨ WILD ${name.toUpperCase()}`).setDescription(`HP: ${hp}`).setColor(isCosmic ? '#00FBFF' : '#FFEE00');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`btn_battle_${key}_${isCosmic?'C':'N'}`).setLabel('⚔️ BATTLE').setStyle(ButtonStyle.Danger));
            const msg = await i.reply({ embeds: [bEmbed], components: [row], fetchReply: true });
            
            BattleStates.set(msg.id, { hp, maxHP: hp, name, meter: 0, canSpare: false, isCosmic, itemsUsed: false });
            return;
        }
    }

    if (!i.isButton()) return;
    const state = BattleStates.get(i.message.id);

    // --- BATTLE UI & BRAINROT ---
    if (i.customId.startsWith('btn_battle') || i.customId === 'back') {
        const battleState = state || BattleStates.get(i.message.id);
        const r1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('menu_atk').setLabel('⚔️ ATTACK').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('menu_items').setLabel('🎒 ITEMS').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('hit_ult').setLabel(`🌈 ULT`).setStyle(ButtonStyle.Success).setDisabled(battleState.meter < 100)
        );
        
        const content = `**Enemy:** ${battleState.name} (${battleState.hp} HP)\n**You:** ${u.activeChar} (${u.playerHP} HP)\n**Meter:** ${battleState.meter}%`;
        const embed = new EmbedBuilder().setColor(battleState.isCosmic ? '#00FBFF' : '#FF0000').setDescription(content);
        
        if (battleState.name.includes('Brainrotted')) {
            embed.setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R4bmZ4bmZ4bmZ4/subway-surfers.gif');
            embed.setFooter({ text: "SENSORY OVERLOAD ACTIVE" });
        }

        return i.update({ embeds: [embed], components: [r1], content: '' });
    }

    // --- ITEM SYSTEM ---
    if (i.customId === 'menu_items') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('use_bandage').setLabel(`🩹 Bandage (${u.items.bandage})`).setStyle(ButtonStyle.Success).setDisabled(u.items.bandage <= 0),
            new ButtonBuilder().setCustomId('use_milk').setLabel(`🥛 Milk (${u.items.milk})`).setStyle(ButtonStyle.Secondary).setDisabled(u.items.milk <= 0),
            new ButtonBuilder().setCustomId('back').setLabel('🔙 BACK').setStyle(ButtonStyle.Secondary)
        );
        return i.update({ content: "🎒 SELECT AN ITEM:", components: [row], embeds: [] });
    }

    if (i.customId === 'use_milk') {
        u.items.milk--; state.itemsUsed = true;
        return i.update({ content: "🥛 Threw the Expired Milk! Enemy can only use Melee!", components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }

    // --- COMBAT LOGIC & ACHIEVEMENTS ---
    if (i.customId === 'menu_atk') {
        state.hp -= 150; state.meter = Math.min(100, state.meter + 25);
        if (state.hp <= 0) {
            u.collection.push(state.name); u.wc += 250;
            let ncReward = state.isCosmic ? 5 : 0; u.nc += ncReward;
            
            // THE HONORED ONE CHECK
            if (state.name.includes('Divine') && !state.itemsUsed && u.collection.includes('COSMIC: The Noober One') && u.collection.includes('COSMIC: The Brainrotted')) {
                u.activeTitle = 'The Honored One'; u.achievements.push('The Honored One'); u.nc += 100;
            }

            BattleStates.delete(i.message.id);
            return i.update({ content: `🏆 Captured ${state.name}! Earned 250 WC and ${ncReward} NC.`, components: [], embeds: [] });
        }
        u.playerHP -= 50;
        return i.update({ content: `💥 Hit enemy! Enemy hit back!`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('CONTINUE').setStyle(ButtonStyle.Primary))] });
    }

    // --- SHOP LOGIC ---
    if (i.customId.startsWith('buy_')) {
        const itemKey = i.customId.split('_')[1];
        const item = ShopItems[itemKey];
        if (item.cur === 'WC' && u.wc < item.cost) return i.reply({ content: "Too broke!", ephemeral: true });
        if (item.cur === 'NC' && u.nc < item.cost) return i.reply({ content: "Not enough NC!", ephemeral: true });
        
        item.cur === 'WC' ? u.wc -= item.cost : u.nc -= item.cost;
        u.items[itemKey]++;
        return i.reply({ content: `✅ Purchased ${item.name}!`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
