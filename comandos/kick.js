const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulsa um membro do servidor',
    usage: '!kick @usuario [motivo]',
    permission: 'kick',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!kick @usuario motivo`');
        if (target.id === msg.author.id)
            return msg.reply('❌ Você não pode se expulsar.');
        if (!target.kickable)
            return msg.reply('❌ Não consigo expulsar este usuário.');

        const reason = args.slice(1).join(' ') || 'Sem motivo informado';

        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF8800')
            .setTitle(`👢 Você foi expulso do ${msg.guild.name}`)
            .addFields(
                { name: '📋 Motivo',    value: reason },
                { name: '👮 Autor', value: msg.author.tag }
            ).setTimestamp()
        ]}).catch(() => {});

        await target.kick(`${msg.author.tag} | ${reason}`);

        const embed = new EmbedBuilder()
            .setColor('#FF8800')
            .setTitle('👢 Membro Expulso')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',   value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Autor', value: msg.author.tag, inline: true },
                { name: '📋 Motivo',    value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
