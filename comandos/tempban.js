const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'tempban',
    aliases: ['tban'],
    description: 'Bane um membro temporariamente',
    usage: '!tempban @usuario <tempo> [motivo]  (ex: 1d, 2h, 30m)',
    permission: 'tempban',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!tempban @usuario 1d motivo`');
        if (!args[1])
            return msg.reply('❌ Informe o tempo. Exemplos: `1d` `2h` `30m` `1h30m`');
        if (!target.bannable)
            return msg.reply('❌ Não consigo banir este usuário.');

        const duration = ms(args[1]);
        if (!duration || duration <= 0)
            return msg.reply('❌ Tempo inválido. Use: `1d`, `2h`, `30m`');

        const reason       = args.slice(2).join(' ') || 'Sem motivo informado';
        const expiresAt    = Date.now() + duration;
        const expireStamp  = Math.floor(expiresAt / 1000);

        // Salvar tempban nos dados
        const bans = client.loadData('tempbans.json');
        bans[target.id] = {
            tag:         target.user.tag,
            reason,
            bannedBy:    msg.author.tag,
            bannedById:  msg.author.id,
            timestamp:   Date.now(),
            expiresAt,
            duration:    args[1]
        };
        client.saveData('tempbans.json', bans);

        // DM antes de banir
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF8800')
            .setTitle(`⏱️ Você foi banido temporariamente do ${msg.guild.name}`)
            .addFields(
                { name: '⏰ Duração',   value: args[1], inline: true },
                { name: '📅 Expira em', value: `<t:${expireStamp}:F>`, inline: true },
                { name: '📋 Motivo',    value: reason },
                { name: '👮 Moderador', value: msg.author.tag }
            ).setTimestamp()
        ]}).catch(() => {});

        await target.ban({ reason: `[TEMPBAN ${args[1]}] ${msg.author.tag} | ${reason}` });

        const embed = new EmbedBuilder()
            .setColor('#FF8800')
            .setTitle('⏱️ TempBan Aplicado')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',   value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Moderador', value: msg.author.tag, inline: true },
                { name: '⏰ Duração',   value: args[1], inline: true },
                { name: '📅 Expira em', value: `<t:${expireStamp}:F>`, inline: true },
                { name: '📋 Motivo',    value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
