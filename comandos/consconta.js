const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'consconta',
    aliases: ['containfo', 'userinfo', 'conta'],
    description: 'Mostra informações de uma conta (idade, suspeitas de alt, histórico)',
    usage: '!consconta @usuario',
    permission: 'consconta',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first() ?? msg.member;

        const ageDays     = (Date.now() - target.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        const hasAvatar   = !!target.user.avatar;
        const createStamp = Math.floor(target.user.createdTimestamp / 1000);
        const joinStamp   = Math.floor(target.joinedTimestamp / 1000);

        // Flags de suspeita
        const flags = [];
        if (!hasAvatar)     flags.push('⚠️ Sem foto de perfil');
        if (ageDays < 7)    flags.push('🔴 Conta com menos de 7 dias');
        else if (ageDays < 30) flags.push('🟡 Conta com menos de 30 dias');

        // Checar se é alt conhecida
        const alts = client.loadData('alts.json');
        let altInfo = null;
        for (const [mainId, data] of Object.entries(alts)) {
            const found = (data.alts ?? []).find(a => a.id === target.id && a.id !== mainId);
            if (found) { altInfo = { mainId, mainTag: data.tag }; break; }
        }
        if (altInfo) flags.push(`🔗 Alt de \`${altInfo.mainTag}\``);

        // Warns do usuário
        const warns   = client.loadData('warns.json');
        const warnCount = warns[target.id]?.warns?.length ?? 0;

        // Cor baseada no risco
        const color = flags.some(f => f.startsWith('🔴') || f.includes('Alt'))
            ? '#FF0000'
            : flags.length > 0 ? '#FFAA00' : '#00FF88';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`🔍 Info da Conta — ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL())
            .addFields(
                { name: '🆔 ID',             value: `\`${target.id}\``, inline: true },
                { name: '📅 Conta criada em', value: `<t:${createStamp}:F>`, inline: true },
                { name: '⏱️ Idade da conta',  value: `${ageDays.toFixed(1)} dias`, inline: true },
                { name: '📥 Entrou no server', value: `<t:${joinStamp}:F>`, inline: true },
                { name: '🖼️ Avatar',          value: hasAvatar ? '✅ Tem' : '❌ Sem avatar', inline: true },
                { name: '⚠️ Advertências',    value: `${warnCount} / ${client.config.warns.maxWarns}`, inline: true },
                { name: '🚩 Flags de suspeita', value: flags.length > 0 ? flags.join('\n') : '✅ Nenhuma' }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
    }
};
