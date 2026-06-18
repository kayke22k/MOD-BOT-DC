const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'advs',
    aliases: ['warns', 'advertencias'],
    description: 'Mostra as advertências de um membro',
    usage: '!advs @usuario',
    permission: 'advs.view',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first() ?? msg.member;

        const warns = client.loadData('warns.json');
        const userData = warns[target.id];

        if (!userData || userData.warns.length === 0) {
            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#00FF88')
                .setDescription(`✅ **${target.user.tag}** não possui advertências.`)
            ]});
        }

        const maxWarns = client.config.warns.maxWarns;
        const list = userData.warns.map((w, i) => {
            const date = `<t:${Math.floor(w.timestamp / 1000)}:d>`;
            return `\`${i + 1}.\` ${w.tipoLabel} — ${w.reason}\n> 👮 ${w.moderator} • ${date} • \`${w.id}\``;
        }).join('\n\n');

        const count = userData.warns.length;
        const color = count >= maxWarns ? '#FF0000' : count >= maxWarns - 1 ? '#FF8800' : '#FFAA00';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`⚠️ Advertências — ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL())
            .setDescription(list)
            .addFields({
                name: '📊 Total',
                value: `**${count} / ${maxWarns}** warns${count >= maxWarns ? ' — ⛔ LIMITE ATINGIDO' : ''}`
            })
            .setFooter({ text: 'Use !radv @usuario <ID> para remover uma advertência' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
    }
};
