const { EmbedBuilder } = require('discord.js');
const { randomBytes } = require('crypto');

// Tipos de infração comuns em GTA RP
const TIPOS = {
    DM:     '🔫 DM (Deathmatch)',
    VDM:    '🚗 VDM (Vehicle Deathmatch)',
    RDM:    '💀 RDM (Random Deathmatch)',
    MG:     '🧠 META (Metagaming)',
    PG:     '⚡ POWER (Powergaming)',
    FAILRP: '🎭 Fail Roleplay',
    BUG:    '🐛 Bug Abuse',
    FUGA:   '🏃 Fuga de RP',
    CHAT:   '💬 Chat fora do personagem',
    ADM:    '🚫 Desrespeito à Staff',
    OUTROS: '📋 Outros'
};

module.exports = {
    name: 'adv',
    aliases: ['advertir'],
    description: 'Adverte um membro (3 warns = ban automático)',
    usage: '!adv @usuario <motivo>',
    permission: 'adv',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!warn @usuario motivo`');
        if (target.id === msg.author.id)
            return msg.reply('❌ Você não pode se advertir.');
        if (target.user.bot)
            return msg.reply('❌ Bots não podem receber advertências.');

        const reason = args.slice(1).join(' ');
        if (!reason)
            return msg.reply('❌ Informe o motivo da advertência.');

        // Detectar tipo automaticamente pela palavra-chave
        let tipo = 'OUTROS';
        const reasonUpper = reason.toUpperCase();
        for (const key of Object.keys(TIPOS)) {
            if (reasonUpper.includes(key)) { tipo = key; break; }
        }

        // Carregar e atualizar warns
        const warns = client.loadData('warns.json');
        if (!warns[target.id]) warns[target.id] = { tag: target.user.tag, warns: [] };

        const warnId = 'w_' + randomBytes(4).toString('hex');
        const warnEntry = {
            id:          warnId,
            tipo,
            tipoLabel:   TIPOS[tipo],
            reason,
            moderator:   msg.author.tag,
            moderatorId: msg.author.id,
            timestamp:   Date.now()
        };

        warns[target.id].warns.push(warnEntry);
        warns[target.id].tag = target.user.tag;
        client.saveData('warns.json', warns);

        const count    = warns[target.id].warns.length;
        const maxWarns = client.config.warns.maxWarns;
        const ateBan   = maxWarns - count;

        // DM para o advertido
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor(count >= maxWarns ? '#FF0000' : '#FFAA00')
            .setTitle(`⚠️ Você recebeu uma advertência — ${msg.guild.name}`)
            .addFields(
                { name: '📋 Motivo',       value: reason },
                { name: '🏷️ Tipo',         value: TIPOS[tipo], inline: true },
                { name: '⚠️ Advertências', value: `${count} / ${maxWarns}`, inline: true },
                { name: '👮 Moderador',    value: msg.author.tag }
            )
            .setFooter({ text: count >= maxWarns ? '⛔ LIMITE ATINGIDO — BAN AUTOMÁTICO' : `Mais ${ateBan} advertência(s) resultará em ban.` })
            .setTimestamp()
        ]}).catch(() => {});

        // Embed da resposta
        const embed = new EmbedBuilder()
            .setColor(count >= maxWarns ? '#FF0000' : '#FFAA00')
            .setTitle('⚠️ Advertência Aplicada')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',      value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Moderador',    value: msg.author.tag, inline: true },
                { name: '🏷️ Tipo',         value: TIPOS[tipo], inline: true },
                { name: '⚠️ Advertências', value: `**${count} / ${maxWarns}**`, inline: true },
                { name: '📋 Motivo',       value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);

        // ── BAN AUTOMÁTICO ao atingir o limite ──
        if (count >= maxWarns) {
            const allWarns = warns[target.id].warns
                .map((w, i) => `**${i + 1}.** ${w.tipoLabel} — ${w.reason} *(${w.moderator})*`)
                .join('\n');

            const banEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Ban Automático — Limite de Advertências Atingido')
                .setThumbnail(target.user.displayAvatarURL())
                .setDescription(`<@${target.id}> foi banido automaticamente por atingir **${maxWarns} advertências**.`)
                .addFields({ name: '📋 Histórico de Advertências', value: allWarns })
                .setFooter({ text: 'SPRP • Sistema de Advertências' })
                .setTimestamp();

            await target.user.send({ embeds: [new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`⛔ Você foi banido do ${msg.guild.name}`)
                .setDescription(`Você atingiu o limite de **${maxWarns} advertências** e foi banido automaticamente.`)
                .addFields({ name: '📋 Histórico', value: allWarns })
                .setTimestamp()
            ]}).catch(() => {});

            const banned = await target.ban({ reason: `Ban automático — ${maxWarns} advertências acumuladas` })
                .then(() => true)
                .catch(() => false);
            if (banned) {
                client.registerBan({
                    userId: target.id,
                    tag: target.user.tag,
                    type: 'autoban_warns',
                    reason: `Ban automático — ${maxWarns} advertências acumuladas`,
                    moderator: 'Sistema de Advertências',
                    moderatorId: client.user?.id
                });
            }

            await msg.channel.send({ embeds: [banEmbed] });
            await client.sendLog(msg.guild, banEmbed);
        }
    }
};
