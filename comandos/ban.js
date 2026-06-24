const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bane um membro permanentemente',
    usage: '!ban @usuario [motivo]',
    permission: 'ban',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!ban @usuario motivo`');
        if (target.id === msg.author.id)
            return msg.reply('❌ Você não pode se banir.');
        if (!target.bannable)
            return msg.reply('❌ Não consigo banir este usuário. Meu cargo é menor que o dele.');

        const isTargetStaff = target.roles.cache.some(r => client.config.roles.staff.includes(r.id));
        if (isTargetStaff && !msg.member.permissions.has(0x8n))
            return msg.reply('❌ Você não pode banir um membro da staff.');

        const reason = args.slice(1).join(' ') || 'Sem motivo informado';

        // DM antes de banir
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`🔨 Você foi banido do servidor ${msg.guild.name}`)
            .setDescription('Você foi banido permanentemente.')
            .addFields(
                { name: '📋 Motivo',    value: reason },
                { name: '👮 Moderador', value: msg.author.tag }
            ).setTimestamp()
        ]}).catch(() => {});

        await target.ban({ reason: `${msg.author.tag} | ${reason}` });
        client.registerBan({
            userId: target.id,
            tag: target.user.tag,
            type: 'ban',
            reason,
            moderator: msg.author.tag,
            moderatorId: msg.author.id
        });

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Membro Banido')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',   value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Moderador', value: msg.author.tag, inline: true },
                { name: '📋 Motivo',    value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
