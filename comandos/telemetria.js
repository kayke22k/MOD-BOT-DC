const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'telemetria',
    aliases: ['status'],
    description: 'Mostra telemetria do bot',
    usage: '!telemetria',

    async execute(msg, args, client) {
        if (!client.canViewTelemetry(msg.member)) {
            return msg.reply('❌ Apenas o dono ou cargos de programador podem ver a telemetria.');
        }

        try {
            const mem = process.memoryUsage();
            const used = (mem.heapUsed / 1024 / 1024).toFixed(2);
            const total = (mem.heapTotal / 1024 / 1024).toFixed(2);
            const percent = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1);

            const uptime = Math.floor(client.uptime / 1000);
            const hours = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);
            const ping = Date.now() - msg.createdTimestamp;

            const servidores = client.guilds.cache.size;
            const usuarios = client.users.cache.size;
            const comandos = new Set(client.commands.values()).size;

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📊 Status SPRP')
                .addFields(
                    { name: '💾 RAM', value: `${used}MB / ${total}MB (${percent}%)`, inline: true },
                    { name: '📡 Ping', value: `${ping}ms`, inline: true },
                    { name: '⏱️ Tempo Ativo', value: `${hours}h ${mins}m`, inline: true },
                    { name: '👥 População', value: usuarios.toString(), inline: true },
                    { name: '⚙️ Comandos', value: comandos.toString(), inline: true }
                )
                .setTimestamp();

            await msg.reply({ embeds: [embed] });
        } catch (err) {
            console.error('[Erro telemetria]:', err);
            await msg.reply('❌ Erro ao buscar status.');
        }
    }
};
