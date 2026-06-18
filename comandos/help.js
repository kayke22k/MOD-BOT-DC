const { EmbedBuilder } = require('discord.js');

const CATEGORIAS = {
    '🔨 Punições': [
        { cmd: '!ban @user [motivo]',                desc: 'Ban permanente' },
        { cmd: '!tempban @user <tempo> [motivo]',    desc: 'Ban temporário (1d, 2h, 30m)' },
        { cmd: '!rban <ID> [motivo]',               desc: 'Desbanir pelo ID' },
        { cmd: '!kick @user [motivo]',               desc: 'Expulsar do servidor' },
    ],
    '⚠️ Advertências': [
        { cmd: '!adv @user <motivo>',               desc: 'Advertir (3 = ban auto)' },
        { cmd: '!advs @user',                       desc: 'Ver advertências' },
        { cmd: '!radv @user ',                 desc: 'Remover advertência ' },
        { cmd: '!advstaff @staff <motivo>',         desc: 'Advertir membro da staff' },
        { cmd: '!advsstaf @staff',                  desc: 'Ver warns da staff' },
    ],
    '🔒 Restrições': [
        { cmd: '!castigo @user <tempo|perm> <motivo>', desc: 'Colocar em castigo' },
        { cmd: '!rcastigo @user',                    desc: 'Remover castigo' },
    ],
    '🔍 Anti-Alt': [
        { cmd: '!altban @alt [@principal] [motivo]', desc: 'Banir alt e registrar (auto-ban em reentradas)' },
        { cmd: '!linkalts @principal @alt [motivo]', desc: 'Vincular contas manualmente' },
        { cmd: '!alts @user',                        desc: 'Ver alts registradas' },
        { cmd: '!containfo @user',                   desc: 'Info da conta (idade, flags, warns)' },
    ],
    '🛠️ Utilitários': [
        { cmd: '!clean <1-9999999999> [@user]',             desc: 'Limpar mensagens do canal' },
        { cmd: '!tp @user',                 desc: 'Vá para a call do membro desejado' },
        {cmd: '!puxar @user', desc: 'Puxar membro para sua call'},
        { cmd: '!perms set @user/cargo <perm> <true|false>', desc: 'Definir permissão customizada' },
        { cmd: '!perms list @user/cargo',            desc: 'Ver permissões customizadas' },
        { cmd: '!perms reset @user/cargo',           desc: 'Resetar permissões' },
    ],
};

module.exports = {
    name: 'help',
    aliases: ['ajuda', 'comandos'],
    description: 'Lista todos os comandos',
    usage: '!help',

    async execute(msg, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📋 SPRP — Comandos')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: `SPRP • Moderação | Prefixo: ${client.config.prefix}` })
            .setTimestamp();

        for (const [categoria, cmds] of Object.entries(CATEGORIAS)) {
            const value = cmds.map(c => `\`${c.cmd}\`\n↳ ${c.desc}`).join('\n');
            embed.addFields({ name: categoria, value });
        }

        embed.addFields({
            name: '🤖 AutoMod (automático)',
            value: '`Anti-link` • `Anti-invite` • `Anti-flood` • `Anti-bot` • `Anti-alt` (conta nova / alt conhecida)'
        });

        await msg.reply({ embeds: [embed] });
    }
};
