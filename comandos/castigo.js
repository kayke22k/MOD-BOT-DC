const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
 
module.exports = {
    name: 'castigo',
    aliases: ['jail', 'preso', 'timeout', 'mute'],
    description: 'Coloca um membro em castigo (timeout nativo do Discord)',
    usage: '!castigo @usuario <tempo> <motivo>  (ex: 1h, 30m, 1d)',
    permission: 'castigo',
 
    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!castigo @usuario 1h motivo`');
        if (target.id === msg.author.id)
            return msg.reply('❌ Você não pode se colocar em castigo.');
        if (!target.moderatable)
            return msg.reply('❌ Não consigo colocar este usuário em castigo. Meu cargo é menor que o dele.');
 
        const durStr = args[1];
        if (!durStr)
            return msg.reply('❌ Informe o tempo. Ex: `30m`, `1h`, `1d`');
 
        const reason = args.slice(2).join(' ');
        if (!reason)
            return msg.reply('❌ Informe o motivo do castigo.');
 
        const duration = ms(durStr);
        if (!duration || duration <= 0)
            return msg.reply('❌ Tempo inválido. Use: `30m`, `1h`, `1d`');
 
        const MAX = 28 * 24 * 60 * 60 * 1000;
        if (duration > MAX)
            return msg.reply('❌ Tempo máximo é **28 dias**.');
 
        await target.timeout(duration, `${msg.author.tag} | ${reason}`);
 
        const expiresAt   = Date.now() + duration;
        const expireStamp = Math.floor(expiresAt / 1000);
 
        // Salvar no JSON
        const casc = client.loadData('castigados.json');
        casc[target.id] = {
            tag:       target.user.tag,
            reason,
            moderator: msg.author.tag,
            modId:     msg.author.id,
            timestamp: Date.now(),
            expiresAt,
            duration:  durStr
        };
        client.saveData('castigados.json', casc);
 
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#888888')
            .setTitle(`🔒 Você foi colocado em castigo — ${msg.guild.name}`)
            .addFields(
                { name: '📋 Motivo',      value: reason },
                { name: '⏰ Duração',     value: durStr, inline: true },
                { name: '📅 Liberado em', value: `<t:${expireStamp}:F>`, inline: true },
                { name: '👮 Moderador',   value: msg.author.tag }
            ).setTimestamp()
        ]}).catch(() => {});
 
        const embed = new EmbedBuilder()
            .setColor('#888888')
            .setTitle('🔒 Castigo Aplicado')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',     value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Autor',   value: msg.author.tag, inline: true },
                { name: '⏰ Duração',     value: durStr, inline: true },
                { name: '📅 Liberado em', value: `<t:${expireStamp}:F>`, inline: true },
                { name: '📋 Motivo',      value: reason }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();
 
        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};