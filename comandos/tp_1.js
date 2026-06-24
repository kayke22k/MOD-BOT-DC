const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tp',
    description: 'Vai até a call do usuário',
    usage: '!tp @usuario',
    permission: 'tp',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!tp @usuario`');

        if (!target.voice.channel)
            return msg.reply(`❌ **${target.user.tag}** não está em nenhuma call.`);

        if (!msg.member.voice.channel)
            return msg.reply('❌ Você precisa estar em uma call para usar o !tp.');

        if (msg.member.voice.channel.id === target.voice.channel.id)
            return msg.reply(`⚠️ Você já está na mesma call que **${target.user.tag}**.`);

        await msg.member.voice.setChannel(target.voice.channel, `TP por ${msg.author.tag}`);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📡 TP Executado')
            .addFields(
                { name: '👮 Autor', value: `${msg.author.tag} foi até`, inline: true },
                { name: '🔊 Call',      value: `**${target.voice.channel.name}**`, inline: true },
                { name: '👤 Usuário',   value: target.user.tag, inline: true }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
