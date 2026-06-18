const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'linkalts',
    aliases: ['linkalt', 'vincularalt'],
    description: 'Vincula manualmente uma conta como alt de outra',
    usage: '!linkalts @principal @alt [motivo]',
    permission: 'ban',

    async execute(msg, args, client) {
        const members = [...msg.mentions.members.values()];
        if (members.length < 2)
            return msg.reply('❌ Use: `!linkalts @principal @alt motivo`\nEx: `!linkalts @João @João2 Mesma pessoa`');

        const main = members[0];
        const alt  = members[1];

        if (main.id === alt.id)
            return msg.reply('❌ As duas contas não podem ser iguais.');

        const reason = args.slice(2).join(' ') || 'Vinculadas manualmente pela staff';

        const alts = client.loadData('alts.json');
        if (!alts[main.id]) alts[main.id] = { tag: main.user.tag, alts: [] };

        // Checar duplicata
        if (alts[main.id].alts.some(a => a.id === alt.id)) {
            return msg.reply(`⚠️ \`${alt.user.tag}\` já está vinculada como alt de \`${main.user.tag}\`.`);
        }

        alts[main.id].alts.push({
            id:        alt.id,
            tag:       alt.user.tag,
            reason,
            linkedBy:  msg.author.tag,
            timestamp: Date.now()
        });

        alts[main.id].tag = main.user.tag;
        client.saveData('alts.json', alts);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔗 Contas Vinculadas')
            .setDescription('Se a alt entrar novamente, será **banida automaticamente**.')
            .addFields(
                { name: '👤 Conta principal', value: `${main.user.tag}\n\`${main.id}\``, inline: true },
                { name: '👤 Alt vinculada',   value: `${alt.user.tag}\n\`${alt.id}\``, inline: true },
                { name: '👮 Vinculadas por',  value: msg.author.tag, inline: true },
                { name: '📋 Motivo',          value: reason }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
