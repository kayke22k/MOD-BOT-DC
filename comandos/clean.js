const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'clean',
    aliases: ['clear', 'purge', 'limpar'],
    description: 'Deleta mensagens do canal. Pode filtrar por usuário.',
    usage: '!clean <1-999999999> [@usuario]',
    permission: 'clean',

    async execute(msg, args, client) {
        const amount = parseInt(args[0]);
        if (!amount || isNaN(amount) || amount < 1 || amount > 999999999)
            return msg.reply('❌ Use: `!clean <1-999999999> [@usuario]`');

        const filterUser = msg.mentions.members.first();

        // Deletar a mensagem do comando primeiro
        await msg.delete().catch(() => {});

        // Buscar mensagens
        const fetched = await msg.channel.messages.fetch({ limit: 100 }).catch(() => null);
        if (!fetched) return;

        let toDelete = fetched.filter(m =>
            // Só mensagens com menos de 14 dias (limite do Discord)
            Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
        );

        if (filterUser) {
            toDelete = toDelete.filter(m => m.author.id === filterUser.id);
        }

        // Pegar apenas a quantidade solicitada
        toDelete = toDelete.first(amount);

        if (toDelete.length === 0) {
            const n = await msg.channel.send('⚠️ Nenhuma mensagem encontrada para deletar (máx. 14 dias).');
            return setTimeout(() => n.delete().catch(() => {}), 4000);
        }

        const deleted = await msg.channel.bulkDelete(toDelete, true).catch(() => null);
        const count   = deleted?.size ?? toDelete.length;

        const confirmMsg = filterUser
            ? `🗑️ **${count}** mensagem(ns) de <@${filterUser.id}> deletadas.`
            : `🗑️ **${count}** mensagem(ns) deletadas.`;

        const n = await msg.channel.send(confirmMsg);
        setTimeout(() => n.delete().catch(() => {}), 4000);

        await client.sendLog(msg.guild, new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🗑️ Chat Limpo')
            .addFields(
                { name: '📊 Mensagens',  value: `${count}`, inline: true },
                { name: '👮 Moderador',  value: msg.author.tag, inline: true },
                { name: '📍 Canal',      value: `<#${msg.channel.id}>`, inline: true },
                ...(filterUser ? [{ name: '👤 Filtrado por', value: filterUser.user.tag, inline: true }] : [])
            ).setTimestamp());
    }
};
