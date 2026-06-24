const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'radv',
    aliases: ['removeradv'],
    description: 'Remove a advertência mais antiga de um usuário',
    usage: '!radv @usuario',
    permission: 'radv',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!radv @usuario`');

        const warns = client.loadData('warns.json');
        const userData = warns[target.id];

        if (!userData || userData.warns.length === 0)
            return msg.reply('❌ Este usuário não possui advertências.');

        const removed = userData.warns.shift(); // remove a mais antiga
        client.saveData('warns.json', warns);

        const embed = new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle('✅ Advertência Removida')
            .addFields(
                { name: '👤 Usuário',        value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Removida por',   value: msg.author.tag, inline: true },
                { name: '📋 Motivo original', value: removed.reason },
                { name: '📊 Advertências restantes', value: `${userData.warns.length} / ${client.config.warns.maxWarns}` }
            )
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
