const { EmbedBuilder } = require('discord.js');

const ACTIONS_ADD = ['add', 'autorizar', 'liberar', 'allow'];
const ACTIONS_REMOVE = ['remove', 'remover', 'revogar', 'del'];
const ACTIONS_LIST = ['list', 'lista', 'listar', 'cons'];

const parseId = (value = '') => value.match(/\d{17,20}/)?.[0] ?? null;

module.exports = {
    name: 'autorizarbot',
    aliases: ['authbot', 'allowbot', 'liberarbot', 'botsauth'],
    description: 'Gerencia bots autorizados pelo anti-bot',
    usage: '!autorizarbot <add|remove|list> <@bot/ID> [motivo]',

    async execute(msg, args, client) {
        if (!client.canManageBotAuth(msg.member)) {
            return msg.reply('❌ Apenas o dono ou cargos de programador podem gerenciar bots autorizados.');
        }

        const action = args[0]?.toLowerCase();
        const validActions = [...ACTIONS_ADD, ...ACTIONS_REMOVE, ...ACTIONS_LIST];
        if (!action || !validActions.includes(action)) {
            return msg.reply('❌ Use: `!autorizarbot add @bot motivo`, `!autorizarbot remove <ID>` ou `!autorizarbot list`.');
        }

        const saved = client.loadData('authorizedbots.json');
        const configuredIds = client.getConfiguredAllowedBotIds();

        if (ACTIONS_LIST.includes(action)) {
            const configList = [...configuredIds].map(id => `• \`${id}\` — config.json`);
            const savedList = Object.entries(saved).map(([id, data]) => {
                const date = data.timestamp ? `<t:${Math.floor(data.timestamp / 1000)}:d>` : 'sem data';
                return `• **${data.tag ?? 'Bot'}** (\`${id}\`) — ${data.reason ?? 'Sem motivo'} • ${date}`;
            });

            const list = [...configList, ...savedList].join('\n') || 'Nenhum bot autorizado.';
            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 Bots Autorizados')
                .setDescription(list)
                .setFooter({ text: 'Bots do config.json precisam ser removidos manualmente no arquivo.' })
                .setTimestamp()
            ]});
        }

        const botId = parseId(args[1]);
        if (!botId) return msg.reply('❌ Informe o ID ou mencione o bot.');

        if (ACTIONS_REMOVE.includes(action)) {
            if (configuredIds.has(botId) && !saved[botId]) {
                return msg.reply('⚠️ Esse bot está autorizado pelo banco de dados; peça ao programador que remova o ID.');
            }

            if (!saved[botId]) return msg.reply('⚠️ Esse bot não está na lista de autorizados.');

            const removed = saved[botId];
            delete saved[botId];
            client.saveData('authorizedbots.json', saved);

            return msg.reply({ embeds: [new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('🤖 Bot Removido da Autorização')
                .addFields(
                    { name: 'Bot', value: `${removed.tag ?? 'Desconhecido'}\n\`${botId}\``, inline: true },
                    { name: 'Removido por', value: msg.author.tag, inline: true }
                )
                .setTimestamp()
            ]});
        }

        const user = await client.users.fetch(botId).catch(() => null);
        if (!user) return msg.reply('❌ Não consegui encontrar esse bot pelo ID.');
        if (!user.bot) return msg.reply('❌ Esse ID pertence a um usuário, não a um bot.');

        const reason = args.slice(2).join(' ') || 'Autorizado pela equipe técnica';
        saved[botId] = {
            tag: user.tag,
            reason,
            addedBy: msg.author.tag,
            addedById: msg.author.id,
            timestamp: Date.now()
        };
        client.saveData('authorizedbots.json', saved);

        const embed = new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle('🤖 Bot Autorizado')
            .addFields(
                { name: 'Bot', value: `${user.tag}\n\`${botId}\``, inline: true },
                { name: 'Autorizado por', value: msg.author.tag, inline: true },
                { name: 'Motivo', value: reason }
            )
            .setFooter({ text: 'Este bot não será removido pelo Anti-Bot ao entrar.' })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
        await client.sendLog(msg.guild, embed, 'staff');
    }
};
