const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'consalts',
    aliases: ['alts'],
    description: 'Mostra as alts registradas de um usuário',
    usage: '!consalts @usuario',
    permission: 'consalts',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!alts @usuario`');

        const alts = client.loadData('alts.json');
        const data = alts[target.id];

        if (!data || !data.alts || data.alts.length === 0) {
            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#00FF88')
                .setDescription(`✅ Nenhuma alt registrada para **${target.user.tag}**.`)
            ]});
        }

        const list = data.alts
            .filter(a => a.id !== target.id) // Remove auto-referência
            .map((a, i) => {
                const date = `<t:${Math.floor(a.timestamp / 1000)}:d>`;
                return `\`${i + 1}.\` **${a.tag}** (\`${a.id}\`)\n> 📋 ${a.reason} — 👮 ${a.linkedBy} • ${date}`;
            }).join('\n\n');

        if (!list) {
            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#00FF88')
                .setDescription(`✅ Nenhuma alt vinculada para **${target.user.tag}**.`)
            ]});
        }

        const embed = new EmbedBuilder()
            .setColor('#FF4400')
            .setTitle(`🔗 Alts Registradas — ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL())
            .setDescription(list)
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
    }
};
