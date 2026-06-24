const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');

const PAGE_SIZE = 8;

const formatEntry = (entry) => {
    const date = entry.timestamp ? `<t:${Math.floor(entry.timestamp / 1000)}:d>` : 'sem data';
    const status = entry.active
        ? 'ativo'
        : `removido${entry.unbannedBy ? ` por ${entry.unbannedBy}` : ''}`;

    return `\`${entry.id}\` **${entry.tag}** (\`${entry.userId}\`)\n> ${entry.type} • ${entry.reason} • ${entry.moderator} • ${date} • ${status}`;
};

const buildPage = (entries, page) => {
    const totalPages = Math.max(Math.ceil(entries.length / PAGE_SIZE), 1);
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * PAGE_SIZE;
    const pageEntries = entries.slice(start, start + PAGE_SIZE);
    const text = pageEntries.map(formatEntry).join('\n\n');

    const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('🔨 Bans Registrados')
        .setDescription(text)
        .setFooter({ text: `Página ${safePage + 1}/${totalPages} • ${entries.length} registro(s)` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('consbans:first')
            .setLabel('Primeira')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage === 0),
        new ButtonBuilder()
            .setCustomId('consbans:prev')
            .setLabel('Anterior')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(safePage === 0),
        new ButtonBuilder()
            .setCustomId('consbans:next')
            .setLabel('Próxima')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(safePage >= totalPages - 1),
        new ButtonBuilder()
            .setCustomId('consbans:last')
            .setLabel('Última')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage >= totalPages - 1)
    );

    return { embed, row, page: safePage, totalPages };
};

module.exports = {
    name: 'consbans',
    aliases: ['consban', 'bans'],
    description: 'Consulta os bans registrados pelo bot',
    usage: '!consbans',
    permission: 'consbans',

    async execute(msg, args, client) {
        const bans = client.loadData('bans.json');
        const entries = Object.entries(bans)
            .flatMap(([id, entries]) => Array.isArray(entries)
                ? entries.map(entry => ({ userId: id, ...entry }))
                : []
            )
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

        if (entries.length === 0) {
            return msg.reply('✅ Nenhum ban registrado ainda.');
        }

        let currentPage = 0;
        const firstPage = buildPage(entries, currentPage);
        const reply = await msg.reply({
            embeds: [firstPage.embed],
            components: firstPage.totalPages > 1 ? [firstPage.row] : []
        });

        if (firstPage.totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120_000
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== msg.author.id) {
                return interaction.reply({ content: '❌ Só quem abriu a consulta pode trocar as páginas.', ephemeral: true });
            }

            if (interaction.customId === 'consbans:first') currentPage = 0;
            else if (interaction.customId === 'consbans:prev') currentPage--;
            else if (interaction.customId === 'consbans:next') currentPage++;
            else if (interaction.customId === 'consbans:last') currentPage = firstPage.totalPages - 1;

            const pageData = buildPage(entries, currentPage);
            currentPage = pageData.page;

            await interaction.update({
                embeds: [pageData.embed],
                components: [pageData.row]
            });
        });

        collector.on('end', async () => {
            const pageData = buildPage(entries, currentPage);
            pageData.row.components.forEach(button => button.setDisabled(true));
            await reply.edit({ components: [pageData.row] }).catch(() => {});
        });
    }
};
