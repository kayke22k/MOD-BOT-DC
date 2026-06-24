const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const PERMS_VALIDAS = [
    'ban', 'tempban', 'rban', 'consbans', 'kick',
    'adv', 'consadv', 'radv', 'advstaff', 'consadvstaff',
    'castigo', 'rcastigo',
    'altban', 'linkalts', 'rlinkalts', 'consalts', 'consconta',
    'clean', 'tp', 'puxar'
];

module.exports = {
    name: 'perms',
    aliases: ['permissao', 'perm'],
    description: 'Gerencia permissões customizadas para usuários ou cargos',
    usage: '!perms <set|list|reset> @usuario/cargo [permissao] [true|false]',

    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return msg.reply('❌ Apenas administradores podem gerenciar permissões.');

        const sub = args[0]?.toLowerCase();
        if (!['set', 'list', 'reset'].includes(sub))
            return msg.reply('❌ Subcomandos: `set` `list` `reset`\nEx: `!perms set @mod ban true`');

        const targetUser = msg.mentions.members.first();
        const targetRole = msg.mentions.roles.first();
        const target     = targetUser ?? targetRole;

        if (!target)
            return msg.reply('❌ Mencione um @usuário ou @cargo.');

        const isRole = !!targetRole && !targetUser;
        const key    = isRole ? `role_${target.id}` : target.id;
        const label  = isRole ? `Cargo @${target.name}` : target.user.tag;

        const perms = client.loadData('permissions.json');

        // ── SET ──
        if (sub === 'set') {
            const perm  = args[2]?.toLowerCase();
            const value = args[3]?.toLowerCase();

            if (!perm || !PERMS_VALIDAS.includes(perm))
                return msg.reply(`❌ Permissão inválida.\nVálidas: \`${PERMS_VALIDAS.join('`, `')}\``);
            if (!['true', 'false'].includes(value))
                return msg.reply('❌ Valor deve ser `true` ou `false`.');

            if (!perms[key]) perms[key] = {};
            perms[key][perm] = value === 'true';
            client.saveData('permissions.json', perms);

            const embed = new EmbedBuilder()
                .setColor(value === 'true' ? '#00FF88' : '#FF4444')
                .setTitle('⚙️ Permissão Atualizada')
                .addFields(
                    { name: '👤 Alvo',       value: label, inline: true },
                    { name: '🔑 Permissão',  value: `\`${perm}\``, inline: true },
                    { name: '✅ Valor',      value: value === 'true' ? '✅ Permitido' : '❌ Negado', inline: true }
                )
                .setTimestamp();

            await msg.reply({ embeds: [embed] });
            await client.sendLog(msg.guild, embed, 'staff');
        }

        // ── LIST ──
        else if (sub === 'list') {
            const userPerms = perms[key] ?? {};
            const entries   = Object.entries(userPerms);

            if (entries.length === 0)
                return msg.reply({ embeds: [new EmbedBuilder()
                    .setColor('#5865F2')
                    .setDescription(`ℹ️ **${label}** não tem permissões customizadas. Usa as permissões padrão do cargo.`)
                ]});

            const list = entries.map(([p, v]) =>
                `${v ? '✅' : '❌'} \`${p}\``
            ).join('\n');

            await msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`⚙️ Permissões — ${label}`)
                .setDescription(list)
                .setFooter({ text: 'Estas permissões sobrescrevem as nativas do Discord' })
                .setTimestamp()
            ]});
        }

        // ── RESET ──
        else if (sub === 'reset') {
            delete perms[key];
            client.saveData('permissions.json', perms);

            await msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('♻️ Permissões Resetadas')
                .setDescription(`Todas as permissões customizadas de **${label}** foram removidas.\nAgora usa as permissões padrão do cargo.`)
                .setTimestamp()
            ]});
        }
    }
};
