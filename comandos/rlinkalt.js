const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'rlinkalts',
    aliases: ['rlinkalt', 'removerlinkalt'],
    description: 'Remover o vínculo entre uma alt e uma conta principal',
    usage: '!rlinkalts @principal @alt',
    permission: 'rlinkalts',

    async execute(msg, args, client) {
        const members = [...msg.mentions.members.values()];
        if (members.length < 2)
            return msg.reply('❌ Use: `!rlinkalts @principal @alt`');

        const main = members[0];
        const alt  = members[1];

        const alts = client.loadData('alts.json');
        if (!alts[main.id] || !alts[main.id].alts)
            return msg.reply(`⚠️ \`${main.user.tag}\` não tem alts vinculadas.`);

        const index = alts[main.id].alts.findIndex(a => a.id === alt.id);
        if (index === -1)
            return msg.reply(`❌ \`${alt.user.tag}\` não está vinculada como alt de \`${main.user.tag}\`.`);

        alts[main.id].alts.splice(index, 1);
        client.saveData('alts.json', alts);

        const embed = new EmbedBuilder()
            .setColor('#FFAA00')
            .setTitle('🔗 Alt Desvinculada')
            .setDescription('A conta agora poderá entrar no servidor novamente.')
            .addFields(
                { name: '👤 Conta principal', value: `${main.user.tag}\n\`${main.id}\``, inline: true },
                { name: '👤 Alt desvinculada', value: `${alt.user.tag}\n\`${alt.id}\``, inline: true },
                { name: '👮 Desvinculada por',  value: msg.author.tag, inline: true }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
}
