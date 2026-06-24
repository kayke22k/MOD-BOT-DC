const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'consadvstaff',
    aliases: ['advsstaff', 'advsstaf', 'staffwarns', 'consstaffwarns'],
    description: 'Mostra as advertências de um membro da staff',
    usage: '!consadvstaff @staff',
    permission: 'consadvstaff',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first() ?? msg.member;

        const staffWarns = client.loadData('staffwarns.json');
        const userData = staffWarns[target.id];

        if (!userData || userData.warns.length === 0) {
            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#00FF88')
                .setDescription(`✅ **${target.user.tag}** não possui advertências de staff.`)
            ]});
        }

        const list = userData.warns.map((w, i) => {
            const date = `<t:${Math.floor(w.timestamp / 1000)}:d>`;
            return `\`${i + 1}.\` ${w.reason}\n> 👮 ${w.moderator} • ${date} • \`${w.id}\``;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#FFAA00')
            .setTitle(`⚠️ Warns Staff — ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL())
            .setDescription(list)
            .addFields({ name: '📊 Total', value: `${userData.warns.length} advertência(s)` })
            .setFooter({ text: 'SPRP • Staff • Registro interno' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
    }
};
