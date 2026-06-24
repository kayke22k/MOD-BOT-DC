const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'linkalts',
    aliases: ['linkalt', 'vincularalt'],
    description: 'Vincula uma ou múltiplas alts a uma conta principal',
    usage: '!linkalts @principal @alt1 [@alt2 @alt3...] [motivo]',
    permission: 'linkalts',

    async execute(msg, args, client) {
        const members = [...msg.mentions.members.values()];
        if (members.length < 2)
            return msg.reply('❌ Use: `!linkalts @principal @alt1 [@alt2...] motivo`\nEx: `!linkalts @João @João2 @João3 Mesma pessoa`');

        const main = members[0];
        const alts = members.slice(1);
        const reason = args.slice(alts.length + 1).join(' ') || 'Vinculadas pela staff';

        const altData = client.loadData('alts.json');
        if (!altData[main.id]) altData[main.id] = { tag: main.user.tag, alts: [] };

        const linkedAlts = [];
        let duplicates = 0;

        for (const alt of alts) {
            if (main.id === alt.id) {
                duplicates++;
                continue;
            }

            if (altData[main.id].alts.some(a => a.id === alt.id)) {
                duplicates++;
                continue;
            }

            altData[main.id].alts.push({
                id:        alt.id,
                tag:       alt.user.tag,
                reason,
                linkedBy:  msg.author.tag,
                timestamp: Date.now()
            });
            linkedAlts.push(alt);
        }

        if (linkedAlts.length === 0) {
            return msg.reply('⚠️ Nenhuma alt nova foi vinculada. Todas já estavam vinculadas ou eram inválidas.');
        }

        altData[main.id].tag = main.user.tag;
        client.saveData('alts.json', altData);

        const list = linkedAlts
            .map(a => `${a.user.tag} (\`${a.id}\`)`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔗 Alts Vinculadas')
            .setDescription(`Se estas alts entrarem novamente, serão **banidas automaticamente**.`)
            .addFields(
                { name: '👤 Conta principal', value: `${main.user.tag}\n\`${main.id}\``, inline: true },
                { name: `👤 Alts vinculadas (${linkedAlts.length})`, value: list, inline: true },
                { name: '👮 Vinculadas por',  value: msg.author.tag, inline: true },
                { name: '📋 Motivo',          value: reason }
            );

        if (duplicates > 0) {
            embed.addFields({ name: '⚠️ Nota', value: `${duplicates} conta(s) pulada(s) (já vinculada ou inválida)` });
        }

        embed.setFooter({ text: 'SPRP • Anti-Alt' }).setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
