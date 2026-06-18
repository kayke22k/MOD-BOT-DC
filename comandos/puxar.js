const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'puxar',
    aliases: ['puxar', 'chamar'],
    description: 'Puxa um usuário para sua call atual (ou canal mencionado)',
    usage: '!vir @usuario [#canal-de-voz]',
    permission: 'tp',

    async execute(msg, args, client) {
        const target = msg.mentions.members.first();
        if (!target)
            return msg.reply('❌ Use: `!vir @usuario` ou `!vir @usuario #canal`');

        const channelMention = msg.mentions.channels.first();
        const modVoice       = msg.member.voice.channel;
        const destChannel    = channelMention ?? modVoice;

        if (!destChannel)
            return msg.reply('❌ Você precisa estar em uma call ou mencionar um canal.\nEx: `!vir @usuario #sala-staff`');

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
                { name: '👮 Moderador', value: msg.author.tag, inline: true }
            )
            .setFooter({ text: 'SPRP • Moderação' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed);
    }
};
