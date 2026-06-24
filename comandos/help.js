const { EmbedBuilder } = require('discord.js');

const CATEGORIAS = {
    '🔨 Punições': [
        { cmd: '!ban @user [motivo]',                desc: 'Ban permanente' },
        { cmd: '!tempban @user <tempo> [motivo]',    desc: 'Ban temporário (1d, 2h, 30m)' },
        { cmd: '!rban <ID> [motivo]',               desc: 'Desbanir pelo ID' },
        { cmd: '!consbans',                         desc: 'Consultar bans registrados' },
        { cmd: '!kick @user [motivo]',               desc: 'Expulsar do servidor' },
    ],
    '⚠️ Advertências': [
        { cmd: '!adv @user <motivo>',               desc: 'Advertir (3 = ban auto)' },
        { cmd: '!consadv @user',                    desc: 'Consultar advertências' },
        { cmd: '!radv @user',                       desc: 'Remover advertência' },
        { cmd: '!advstaff @staff <motivo>',         desc: 'Advertir membro da staff' },
        { cmd: '!consadvstaff @staff',              desc: 'Consultar warns da staff' },
    ],
    '🔒 Restrições': [
        { cmd: '!castigo @user <tempo|perm> <motivo>', desc: 'Colocar em castigo' },
        { cmd: '!rcastigo @user',                    desc: 'Remover castigo' },
    ],
    '🔍 Anti-Alt': [
        { cmd: '!altban @alt [@principal] [motivo]', desc: 'Banir alt e registrar (auto-ban em reentradas)' },
        { cmd: '!linkalts @principal @alt1 [@alt2...] [motivo]', desc: 'Vincular uma ou várias alts' },
        { cmd: '!rlinkalts @principal @alt',         desc: 'Remover vinculo de alt' },
        { cmd: '!consalts @user',                    desc: 'Consultar alts registradas' },
        { cmd: '!consconta @user',                   desc: 'Info da conta (idade, flags, warns)' },
    ],
    '🛠️ Utilitários': [
        { cmd: '!clean <1-9999999999> [@user]',             desc: 'Limpar mensagens do canal' },
        { cmd: '!tp @user',                 desc: 'Vá para a call do membro desejado' },
        {cmd: '!puxar @user', desc: 'Puxar membro para sua call'},
        { cmd: '!perms set @user/cargo <perm> <true|false>', desc: 'Definir permissão customizada' },
        { cmd: '!perms list @user/cargo',            desc: 'Ver permissões customizadas' },
        { cmd: '!perms reset @user/cargo',           desc: 'Resetar permissões' },
    ],
    '👨‍💻 Técnico': [
        { cmd: '!telemetria',                         desc: 'Status do bot (dono/programadores)' },
        { cmd: '!autorizarbot add @bot [motivo]',     desc: 'Autorizar bot no Anti-Bot' },
        { cmd: '!autorizarbot remove <ID>',           desc: 'Remover bot autorizado' },
        { cmd: '!autorizarbot list',                  desc: 'Listar bots autorizados' },
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
            value: '`Anti-link` • `Anti-invite` • `Anti-bot` • `Anti-alt` (conta nova / alt conhecida)\n`Anti-flood`: 3 alertas = castigo 10min + advertência automática'
        });

        await msg.reply({ embeds: [embed] });
    }
};
