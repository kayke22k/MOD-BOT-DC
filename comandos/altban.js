const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'altban',
    description: 'Bane uma conta e a registra como alt. Futuras entradas serão banidas automaticamente.',
    usage: '!altban @alt [@contaPrincipal] [motivo]',
    permission: 'altban',

    async execute(msg, args, client) {
        const alt = msg.mentions.members.first();
        if (!alt)
            return msg.reply('❌ Use: `!altban @alt [@principal] motivo`');

        // Segundo mencionado = conta principal (opcional)
        const main = msg.mentions.members.size >= 2
            ? [...msg.mentions.members.values()][1]
            : null;

        // Motivo = tudo após as menções
        const mentionCount = msg.mentions.members.size;
        const reason = args.slice(mentionCount).join(' ') || 'Alt detectada pela staff';

        if (!alt.bannable)
            return msg.reply('❌ Não consigo banir este usuário.');

        const alts = client.loadData('alts.json');

        if (main) {
            // Vincular à conta principal
            if (!alts[main.id]) alts[main.id] = { tag: main.user.tag, alts: [] };

            // Checar duplicata
            const jaExiste = alts[main.id].alts.some(a => a.id === alt.id);
            if (!jaExiste) {
                alts[main.id].alts.push({
                    id:        alt.id,
                    tag:       alt.user.tag,
                    reason,
                    linkedBy:  msg.author.tag,
                    timestamp: Date.now()
                });
            }
        } else {
            // Sem conta principal — registra a alt solta (vinculada a si mesma como placeholder)
            if (!alts[alt.id]) alts[alt.id] = { tag: alt.user.tag, alts: [] };
            // Marca o próprio ID como alt de si para bloquear reentrada
            const jaExiste = alts[alt.id].alts.some(a => a.id === alt.id);
            if (!jaExiste) {
                alts[alt.id].alts.push({
                    id:        alt.id,
                    tag:       alt.user.tag,
                    reason,
                    linkedBy:  msg.author.tag,
                    timestamp: Date.now()
                });
            }
        }

        client.saveData('alts.json', alts);

        // DM antes de banir
        await alt.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`⛔ Você foi banido — ${msg.guild.name}`)
            .addFields(
                { name: '📋 Motivo',    value: reason },
                { name: '👮 Moderador', value: msg.author.tag }
            ).setTimestamp()
        ]}).catch(() => {});

        await alt.ban({ reason: `[ALT BAN] ${msg.author.tag} | ${reason}` });
        client.registerBan({
            userId: alt.id,
            tag: alt.user.tag,
            type: 'altban',
            reason,
            moderator: msg.author.tag,
            moderatorId: msg.author.id
        });

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Alt Banida e Registrada')
            .setThumbnail(alt.user.displayAvatarURL())
            .setDescription('Esta conta foi banida e registrada. Qualquer reentrada futura será banida **automaticamente**.')
            .addFields(
                { name: '👤 Alt banida',      value: `${alt.user.tag}\n\`${alt.id}\``, inline: true },
                { name: '👤 Conta principal', value: main ? `${main.user.tag}\n\`${main.id}\`` : '*(não vinculada)*', inline: true },
                { name: '👮 Autor',       value: msg.author.tag, inline: true },
                { name: '📋 Motivo',          value: reason }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
