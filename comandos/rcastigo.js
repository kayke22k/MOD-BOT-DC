const { EmbedBuilder } = require('discord.js');
 
module.exports = {
    name: 'rcastigo',
    aliases: ['soltar', 'libertar'],
    description: 'Remove o castigo de um membro',
    usage: '!rcastigo @usuario',
    permission: 'rcastigo',
 
    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!rcastigo @usuario`');
 
        if (!target.isCommunicationDisabled())
            return msg.reply('⚠️ Este usuário não está em castigo.');
 
        await target.timeout(null, `Castigo removido por ${msg.author.tag}`);
 
        // Remover do JSON
        const casc = client.loadData('castigados.json');
        delete casc[target.id];
        client.saveData('castigados.json', casc);
 
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle(`🔓 Você saiu do castigo — ${msg.guild.name}`)
            .addFields({ name: '👮 Liberado por', value: msg.author.tag })
            .setTimestamp()
        ]}).catch(() => {});
 
        const embed = new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle('🔓 Castigo Removido')
            .addFields(
                { name: '👤 Usuário',      value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Liberado por', value: msg.author.tag, inline: true }
            )
            .setTimestamp();
 
        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
