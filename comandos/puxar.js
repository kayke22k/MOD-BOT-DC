const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'puxar',
    aliases: ['chamar'],
    description: 'Puxa um usuário para sua call atual (ou canal mencionado)',
    usage: '!puxar @usuario [#canal-de-voz]',
    permission: 'puxar',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!puxar @usuario` ou `!puxar @usuario #canal`');

        const channelMention = msg.mentions.channels.first();
        const modVoice       = msg.member.voice.channel;
        const destChannel    = channelMention ?? modVoice;

        if (!destChannel)
            return msg.reply('❌ Você precisa estar em uma call ou mencionar um canal.\nEx: `!puxar @usuario #sala-staff`');

        if (destChannel.type !== 2)
            return msg.reply('❌ O canal mencionado não é um canal de voz.');

        if (!target.voice.channel)
            return msg.reply(`❌ **${target.user.tag}** não está em nenhuma call.`);

        if (target.voice.channel.id === destChannel.id)
            return msg.reply(`⚠️ **${target.user.tag}** já está em **${destChannel.name}**.`);

        await target.voice.setChannel(destChannel, `Puxado por ${msg.author.tag}`);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📡 Usuário Puxado')
            .addFields(
                { name: '👤 Usuário',   value: target.user.tag, inline: true },
                { name: '🔊 Destino',   value: `**${destChannel.name}**`, inline: true },
                { name: '👮 Autor', value: msg.author.tag, inline: true }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
