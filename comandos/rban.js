const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rban',
    description: 'Desbane um usuário pelo ID',
    usage: '!rban <ID> [motivo]',
    permission: 'rban',

    async execute(msg, args, client) {
        const userId = args[0];
        if (!userId || !/^\d{17,19}$/.test(userId))
            return msg.reply('❌ Use: `!rban 123456789012345678 motivo`');

        const reason = args.slice(1).join(' ') || 'Sem motivo informado';

        const ban = await msg.guild.bans.fetch(userId).catch(() => null);
        if (!ban)
            return msg.reply('❌ Este usuário não está banido.');

        await msg.guild.members.unban(userId, `${msg.author.tag} | ${reason}`);
        client.registerUnban({
            userId,
            reason,
            moderator: msg.author.tag,
            moderatorId: msg.author.id
        });

        // Remover do registro de tempbans se existir
        const bans = client.loadData('tempbans.json');
        if (bans[userId]) {
            delete bans[userId];
            client.saveData('tempbans.json', bans);
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle('🔓 Membro Desbanido')
            .addFields(
                { name: '👤 Usuário',   value: `${ban.user.tag}\n\`${userId}\``, inline: true },
                { name: '👮 Autor', value: msg.author.tag, inline: true },
                { name: '📋 Motivo',    value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
