const { EmbedBuilder } = require('discord.js');
const { randomBytes } = require('crypto');

module.exports = {
    name: 'advstaff',
    aliases: ['warnstaff', 'advertirstaff'],
    description: 'Adverte um membro da staff (registrado no canal de logs da staff)',
    usage: '!advstaff @staff <motivo>',
    permission: 'advstaff',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!advstaff @staff motivo`');
        if (target.id === msg.author.id)
            return msg.reply('❌ Você não pode se advertir.');

        const isTargetStaff = target.roles.cache.some(r => client.config.roles.staff.includes(r.id));
        if (!isTargetStaff)
            return msg.reply('❌ Este usuário não é membro da staff. Use `!advs` para membros comuns.');

        const reason = args.slice(1).join(' ');
        if (!reason)
            return msg.reply('❌ Informe o motivo da advertência.');

        // Carregar e salvar warn da staff
        const staffWarns = client.loadData('staffwarns.json');
        if (!staffWarns[target.id]) staffWarns[target.id] = { tag: target.user.tag, warns: [] };

        const warnId = 'sw_' + randomBytes(4).toString('hex');
        const warnEntry = {
            id:          warnId,
            reason,
            moderator:   msg.author.tag,
            moderatorId: msg.author.id,
            timestamp:   Date.now()
        };

        staffWarns[target.id].warns.push(warnEntry);
        staffWarns[target.id].tag = target.user.tag;
        client.saveData('staffwarns.json', staffWarns);

        const count = staffWarns[target.id].warns.length;

        // DM para o membro da staff advertido
        await target.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FFAA00')
            .setTitle(`⚠️ Advertência Staff — ${msg.guild.name}`)
            .setDescription('Você recebeu uma advertência da administração como membro da staff.')
            .addFields(
                { name: '📋 Motivo',       value: reason },
                { name: '👮 Emitida por',  value: msg.author.tag },
                { name: '🆔 ID',           value: `\`${warnId}\`` }
            ).setTimestamp()
        ]}).catch(() => {});

        const embed = new EmbedBuilder()
            .setColor('#FFAA00')
            .setTitle('⚠️ Advertência Staff Aplicada')
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '👤 Staff',        value: `${target.user.tag}\n\`${target.id}\``, inline: true },
                { name: '👮 Emitida por',  value: msg.author.tag, inline: true },
                { name: '📊 Total warns',  value: `${count}`, inline: true },
                { name: '🆔 ID',           value: `\`${warnId}\``, inline: true },
                { name: '📋 Motivo',       value: reason }
            )
            .setFooter({ text: 'SPRP • Staff • Registro interno' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        // Log vai para o canal da staff
        await client.sendLog(msg.guild, embed, 'staff');
    }
};
