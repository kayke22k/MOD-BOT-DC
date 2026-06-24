// ═══════════════════════════════════════════════════════════════
//   Bot de Moderação
// ══════════════════════════════════════════════════════════════

const {
    Client, GatewayIntentBits, Collection, Partials,
    EmbedBuilder, PermissionsBitField, ActivityType
} = require('discord.js');
const fs   = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const config = require('./config.json');

// ── Cliente ───────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();
client.config   = config;

// ── Helpers de dados (JSON simples) ──────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

client.loadData = (file) => {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) { fs.writeFileSync(fp, '{}'); return {}; }
    try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return {}; }
};

client.saveData = (file, data) => {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
};

// ── Log helper ────────────────────────────────────────────────────
// type: 'mod' → canal de logs principal | 'staff' → canal de logs da staff
client.sendLog = async (guild, embed, type = 'mod') => {
    try {
        const id = type === 'staff' ? config.channels.stafflogs : config.channels.logs;
        const ch = guild.channels.cache.get(id);
        if (ch) await ch.send({ embeds: [embed] });
    } catch {}
};

// ── Sistema de permissões customizado ────────────────────────────
// Sobrescreve as permissões nativas do Discord.
// Prioridade: custom user → custom role → cargo staff → negar.
const idList = (...values) => values
    .flatMap(v => Array.isArray(v) ? v : [v])
    .filter(Boolean)
    .map(String);

client.isOwner = (member) => {
    const id = String(member?.id ?? member?.user?.id ?? '');
    if (!id) return false;

    const ownerIds = idList(config.ownerId, config.donoId, config.ownerIds, config.owners, config.donos);
    return ownerIds.includes(id) || member?.guild?.ownerId === id;
};

client.isProgrammer = (member) => {
    if (client.isOwner(member)) return true;

    const roleIds = idList(
        config.roles?.programadores,
        config.roles?.developers,
        config.roles?.devs,
        config.programmerRoleIds,
        config.developerRoleIds
    );
    return member?.roles?.cache?.some(role => roleIds.includes(role.id)) ?? false;
};

client.canViewTelemetry = (member) => client.isProgrammer(member);
client.canManageBotAuth = (member) => client.isProgrammer(member);

client.getConfiguredAllowedBotIds = () => new Set(idList(config.allowedBots));

client.getAuthorizedBotIds = () => {
    const ids = client.getConfiguredAllowedBotIds();
    const saved = client.loadData('authorizedbots.json');
    for (const id of Object.keys(saved)) ids.add(String(id));
    return ids;
};

client.isBotAuthorized = (botId) => client.getAuthorizedBotIds().has(String(botId));

client.hasPermission = (member, perm) => {
    if (client.isOwner(member)) return true;

    // Administrador tem tudo
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

    const perms = client.loadData('permissions.json');

    // Permissão direta no usuário
    const up = perms[member.id] ?? {};
    if (up[perm] === true)  return true;
    if (up[perm] === false) return false;

    // Permissão nos cargos do usuário
    for (const roleId of member.roles.cache.keys()) {
        const rp = perms[`role_${roleId}`] ?? {};
        if (rp[perm] === true)  return true;
        if (rp[perm] === false) return false;
    }

    // Fallback: verifica se é staff
    const isStaff = member.roles.cache.some(r => config.roles.staff.includes(r.id));
    const staffCmds = [
        'ban', 'tempban', 'rban', 'consbans', 'kick',
        'adv', 'consadv', 'radv', 'advstaff', 'consadvstaff',
        'castigo', 'rcastigo',
        'altban', 'linkalts', 'rlinkalts', 'consalts', 'consconta',
        'clean', 'tp', 'puxar'
    ];
    return isStaff ? staffCmds.includes(perm) : false;
};

client.addAutomaticWarn = async ({ guild, member, channel, reason, source = 'Sistema Anti-Flood' }) => {
    const warns = client.loadData('warns.json');
    if (!warns[member.id]) warns[member.id] = { tag: member.user.tag, warns: [] };

    const warnEntry = {
        id:          'w_' + randomBytes(4).toString('hex'),
        tipo:        'CHAT',
        tipoLabel:   '💬 Flood / spam',
        reason,
        moderator:   source,
        moderatorId: client.user?.id ?? 'system',
        automatic:   true,
        timestamp:   Date.now()
    };

    warns[member.id].warns.push(warnEntry);
    warns[member.id].tag = member.user.tag;
    client.saveData('warns.json', warns);

    const count = warns[member.id].warns.length;
    const maxWarns = Number(client.config.warns?.maxWarns ?? 3);
    const remaining = Math.max(maxWarns - count, 0);

    await member.user.send({ embeds: [new EmbedBuilder()
        .setColor(count >= maxWarns ? '#FF0000' : '#FFAA00')
        .setTitle(`⚠️ Advertência automática — ${guild.name}`)
        .addFields(
            { name: '📋 Motivo', value: reason },
            { name: '🏷️ Tipo', value: warnEntry.tipoLabel, inline: true },
            { name: '⚠️ Advertências', value: `${count} / ${maxWarns}`, inline: true },
            { name: '👮 Responsável', value: source }
        )
        .setFooter({ text: count >= maxWarns ? '⛔ LIMITE ATINGIDO — BAN AUTOMÁTICO' : `Mais ${remaining} advertência(s) resultará em ban.` })
        .setTimestamp()
    ]}).catch(() => {});

    const warnEmbed = new EmbedBuilder()
        .setColor(count >= maxWarns ? '#FF0000' : '#FFAA00')
        .setTitle('⚠️ Advertência Automática')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: '👤 Usuário', value: `${member.user.tag}\n\`${member.id}\``, inline: true },
            { name: '🤖 Sistema', value: source, inline: true },
            { name: '🏷️ Tipo', value: warnEntry.tipoLabel, inline: true },
            { name: '⚠️ Advertências', value: `**${count} / ${maxWarns}**`, inline: true },
            { name: '📋 Motivo', value: reason }
        )
        .setFooter({ text: 'SPRP • Moderação automática' })
        .setTimestamp();

    await client.sendLog(guild, warnEmbed);

    let banned = false;
    if (count >= maxWarns) {
        const allWarns = warns[member.id].warns
            .map((w, i) => `**${i + 1}.** ${w.tipoLabel ?? 'Advertência'} — ${w.reason} *(${w.moderator})*`)
            .join('\n');

        const banEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Ban Automático — Limite de Advertências Atingido')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`<@${member.id}> foi banido automaticamente por atingir **${maxWarns} advertências**.`)
            .addFields({ name: '📋 Histórico de Advertências', value: allWarns.slice(0, 1024) })
            .setFooter({ text: 'SPRP • Sistema de Advertências' })
            .setTimestamp();

        await member.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`⛔ Você foi banido do ${guild.name}`)
            .setDescription(`Você atingiu o limite de **${maxWarns} advertências** e foi banido automaticamente.`)
            .addFields({ name: '📋 Histórico', value: allWarns.slice(0, 1024) })
            .setTimestamp()
        ]}).catch(() => {});

        banned = await member.ban({ reason: `Ban automático — ${maxWarns} advertências acumuladas` })
            .then(() => true)
            .catch(() => false);

        if (banned) {
            client.registerBan({
                userId: member.id,
                tag: member.user.tag,
                type: 'autoban_warns',
                reason: `Ban automático — ${maxWarns} advertências acumuladas`,
                moderator: 'Sistema de Advertências',
                moderatorId: client.user?.id
            });
        }

        if (channel) await channel.send({ embeds: [banEmbed] }).catch(() => {});
        await client.sendLog(guild, banEmbed);
    }

    return { count, maxWarns, warnId: warnEntry.id, banned };
};

client.registerBan = (data) => {
    const userId = String(data.userId);
    const bans = client.loadData('bans.json');
    if (!Array.isArray(bans[userId])) bans[userId] = [];

    const entry = {
        id:          'b_' + randomBytes(4).toString('hex'),
        tag:         data.tag ?? 'Desconhecido',
        type:        data.type ?? 'ban',
        reason:      data.reason ?? 'Sem motivo informado',
        moderator:   data.moderator ?? 'Sistema',
        moderatorId: data.moderatorId ?? client.user?.id ?? 'system',
        timestamp:   Date.now(),
        expiresAt:   data.expiresAt ?? null,
        duration:    data.duration ?? null,
        active:      true
    };

    bans[userId].push(entry);
    client.saveData('bans.json', bans);
    return entry;
};

client.registerUnban = (data) => {
    const userId = String(data.userId);
    const bans = client.loadData('bans.json');
    const list = Array.isArray(bans[userId]) ? bans[userId] : [];
    const active = [...list].reverse().find(entry => entry.active);

    if (active) {
        active.active = false;
        active.unbannedAt = Date.now();
        active.unbannedBy = data.moderator ?? 'Sistema';
        active.unbannedById = data.moderatorId ?? client.user?.id ?? 'system';
        active.unbanReason = data.reason ?? 'Sem motivo informado';
        client.saveData('bans.json', bans);
    }

    return active ?? null;
};

// ── Carregar comandos ────────────────────────────────────────────
for (const file of fs.readdirSync('./comandos').filter(f => f.endsWith('.js'))) {
    const cmd = require(`./comandos/${file}`);
    client.commands.set(cmd.name, cmd);
    (cmd.aliases ?? []).forEach(a => client.commands.set(a, cmd));
}

// ── Anti-flood (tracker em memória) ──────────────────────────────
const floodMap = new Map();    // userId -> { count, firstMs }
const floodAlerts = new Map(); // userId -> alertas antes do timeout

// ── Verificação de punições temporárias ──────────────────────────
async function checkExpiry() {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;
    const now = Date.now();

    // — TempBans —
    const bans = client.loadData('tempbans.json');
    let bansChanged = false;
    for (const [uid, d] of Object.entries(bans)) {
        if (d.expiresAt && now >= d.expiresAt) {
            try {
                await guild.members.unban(uid, 'TempBan expirado automaticamente');
                client.registerUnban({
                    userId: uid,
                    reason: 'TempBan expirado automaticamente',
                    moderator: 'Sistema TempBan',
                    moderatorId: client.user?.id
                });
                delete bans[uid];
                bansChanged = true;
                await client.sendLog(guild, new EmbedBuilder()
                    .setColor('#00FF88')
                    .setTitle('🔓 TempBan Expirado')
                    .setDescription(`<@${uid}> (\`${d.tag}\`) foi desbanido automaticamente.`)
                    .setTimestamp());
            } catch {}
        }
    }
    if (bansChanged) client.saveData('tempbans.json', bans);

    // — Castigados —
    const casc = client.loadData('castigados.json');
    let cascChanged = false;
    for (const [uid, d] of Object.entries(casc)) {
        if (d.expiresAt && now >= d.expiresAt) {
            try {
                const member = await guild.members.fetch(uid).catch(() => null);
                if (member && config.roles?.castigo && !String(config.roles.castigo).startsWith('ID_')) {
                    await member.roles.remove(config.roles.castigo, 'Castigo expirado').catch(() => {});
                }

                delete casc[uid];
                cascChanged = true;
                await client.sendLog(guild, new EmbedBuilder()
                    .setColor('#00FF88')
                    .setTitle('🔓 Castigo Expirado')
                    .setDescription(`<@${uid}> (\`${d.tag}\`) saiu do castigo automaticamente.`)
                    .setTimestamp());
            } catch {}
        }
    }
    if (cascChanged) client.saveData('castigados.json', casc);
}

// ── READY ─────────────────────────────────────────────────────────
client.once('ready', () => {
    console.log(`\n✅  ${client.user.tag} online!`);
    console.log(`📋  Comandos carregados: ${new Set(client.commands.values()).size}`);

    const alts = client.loadData('alts.json');
    console.log(`🔍  Alts registradas: ${Object.keys(alts).length}`);

    // Checar punições expiradas a cada 1 minuto
    setInterval(checkExpiry, 60_000);
    checkExpiry();

    client.user.setActivity('SPRP | !help', { type: ActivityType.Watching });
    console.log(`\n🎮  Sou o bot do SPRP!\n`);
});

// ── MESSAGE CREATE ────────────────────────────────────────────────
client.on('messageCreate', async msg => {
    if (msg.author.bot || !msg.guild) return;
    const member = msg.member;
    if (!member) return;

    const isStaff = member.roles.cache.some(r => config.roles.staff.includes(r.id));

    // ── 2. AutoMod (apenas não-staff) ──
    if (!isStaff) {
        const c = msg.content;

        // Anti-link
        if (config.automod.antilink && /https?:\/\/\S+/i.test(c)) {
            await msg.delete().catch(() => {});
            const n = await msg.channel.send(
                `🚫 <@${msg.author.id}> Links não são permitidos neste servidor!`
            );
            setTimeout(() => n.delete().catch(() => {}), 5000);
            await client.sendLog(msg.guild, new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('🔗 Link Bloqueado')
                .addFields(
                    { name: '👤 Usuário', value: `<@${msg.author.id}> — ${msg.author.tag}`, inline: true },
                    { name: '📍 Canal',   value: `<#${msg.channel.id}>`, inline: true },
                    { name: '💬 Conteúdo', value: c.slice(0, 300) }
                ).setTimestamp());
            return;
        }

        // Anti-invite
        if (config.automod.antiinv && /(discord\.gg|discord(?:app)?\.com\/invite)\//i.test(c)) {
            await msg.delete().catch(() => {});
            const n = await msg.channel.send(
                `🚫 <@${msg.author.id}> Convites externos não são permitidos!`
            );
            setTimeout(() => n.delete().catch(() => {}), 5000);
            await client.sendLog(msg.guild, new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('📨 Invite Bloqueado')
                .addFields(
                    { name: '👤 Usuário', value: `<@${msg.author.id}> — ${msg.author.tag}`, inline: true },
                    { name: '📍 Canal',   value: `<#${msg.channel.id}>`, inline: true }
                ).setTimestamp());
            return;
        }

        // Anti-flood
       if (config.automod.antiflood) {
    const uid = msg.author.id;
    const now = Date.now();
    const fl  = floodMap.get(uid) ?? { count: 0, first: now };

    if (now - fl.first > config.automod.floodInterval) {
        fl.count = 1;
        fl.first = now;
    } else {
        fl.count++;
    }
    floodMap.set(uid, fl);

    if (fl.count >= config.automod.floodLimit) {
        floodMap.delete(uid);
        const alertCount = (floodAlerts.get(uid) ?? 0) + 1;
        floodAlerts.set(uid, alertCount);

        // Deletar mensagens
        const fetched = await msg.channel.messages.fetch({ limit: 10 }).catch(() => null);
        if (fetched) {
            const toDelete = fetched.filter(m =>
                m.author.id === uid &&
                Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );
            await msg.channel.bulkDelete(toDelete, true).catch(() => {});
        }

        // Se for o 3º alerta, aplica castigo automático
        if (alertCount >= 3) {
            floodAlerts.delete(uid);
            const castigoDuration = 10 * 60 * 1000;
            const castigoExpiresAt = Date.now() + castigoDuration;
            const castigoExpireStamp = Math.floor(castigoExpiresAt / 1000);
            const castigoReason = 'Anti-flood: 3º alerta';

            await msg.member.timeout(castigoDuration, castigoReason).catch(() => {});

            const casc = client.loadData('castigados.json');
            casc[uid] = {
                tag:       msg.author.tag,
                reason:    castigoReason,
                moderator: 'Sistema Anti-Flood',
                modId:     client.user?.id ?? 'system',
                timestamp: Date.now(),
                expiresAt: castigoExpiresAt,
                duration:  '10m',
                automatic: true,
                source:    'antiflood'
            };
            client.saveData('castigados.json', casc);

            const autoWarn = await client.addAutomaticWarn({
                guild: msg.guild,
                member: msg.member,
                channel: msg.channel,
                reason: 'Flood excessivo: 3 alertas de flood acumulados',
                source: 'Sistema Anti-Flood'
            });
            
            const n = await msg.channel.send(
                `🔒 <@${uid}> foi colocado em **castigo de 10 minutos** e recebeu **advertência automática (${autoWarn.count}/${autoWarn.maxWarns})** por flood excessivo.`
            );
            setTimeout(() => n.delete().catch(() => {}), 8000);

            await client.sendLog(msg.guild, new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Castigo Anti-Flood')
                .addFields(
                    { name: '👤 Usuário',   value: `<@${uid}> — ${msg.author.tag}`, inline: true },
                    { name: '📍 Canal',     value: `<#${msg.channel.id}>`, inline: true },
                    { name: '🔒 Castigo',   value: `10 minutos\nLibera <t:${castigoExpireStamp}:R>`, inline: true },
                    { name: '⏰ Motivo',    value: '3º alerta de flood', inline: true },
                    { name: '⚠️ Advertência automática', value: `${autoWarn.count} / ${autoWarn.maxWarns}`, inline: true }
                ).setTimestamp());
        } else {
            const n = await msg.channel.send(
                `⚠️ <@${uid}> **Alerta ${alertCount}/3 de flood!** 3 alertas = castigo 10min + advertência automática.`
            );
            setTimeout(() => n.delete().catch(() => {}), 5000);

            await client.sendLog(msg.guild, new EmbedBuilder()
                .setColor('#FF8800')
                .setTitle(`⚠️ Alerta de Flood ${alertCount}/3`)
                .addFields(
                    { name: '👤 Usuário',   value: `<@${uid}> — ${msg.author.tag}`, inline: true },
                    { name: '📍 Canal',     value: `<#${msg.channel.id}>`, inline: true }
                ).setTimestamp());
        }
        return;
    }
}
    }

    // ── 3. Processar Comandos ──
    if (!msg.content.startsWith(config.prefix)) return;

    const args    = msg.content.slice(config.prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const cmd     = client.commands.get(cmdName);
    if (!cmd) return;

    // Checar permissão customizada
    if (cmd.permission && !client.hasPermission(member, cmd.permission)) {
        return msg.reply({
            embeds: [new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('❌ Você não tem permissão para usar este comando.')
            ]
        });
    }

    try {
        await cmd.execute(msg, args, client);
    } catch (err) {
        console.error(`[Erro no comando ${cmdName}]:`, err);
        msg.reply('❌ Ocorreu um erro ao executar o comando.').catch(() => {});
    }
});

// ── GUILD MEMBER ADD — Anti-Alt + Anti-Bot ──────────────────────
client.on('guildMemberAdd', async member => {

    // ── Anti-Cheat de Bot ──
    if (member.user.bot) {
        if (!config.automod.antibot) return;
        const allowed = client.isBotAuthorized(member.id);
        if (!allowed) {
            await member.kick('Bot não autorizado — Anti-Cheat').catch(() => {});
        }
        await client.sendLog(member.guild, new EmbedBuilder()
            .setColor(allowed ? '#00FF88' : '#FF0000')
            .setTitle(allowed ? '🤖 Bot Autorizado Entrou' : '🤖 Bot Não Autorizado Removido')
            .addFields(
                { name: '🤖 Bot',    value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                { name: '📋 Status', value: allowed ? '✅ Permitido' : '❌ Removido automaticamente', inline: true }
            ).setTimestamp());
        return;
    }

    // ── Sistema Anti-Alt ──
    const cfg        = config.antialt ?? {};
    const ageDays    = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    const hasAvatar  = !!member.user.avatar;
    const createStamp = Math.floor(member.user.createdTimestamp / 1000);

    const flags = [];
    if (!hasAvatar) flags.push('⚠️ Sem foto de perfil');
    if (ageDays < 7)  flags.push('🔴 Conta com menos de 7 dias');
    else if (ageDays < 30) flags.push('🟡 Conta com menos de 30 dias');

    // Checar se é alt conhecida
    const alts = client.loadData('alts.json');
    let altEntry = null;
    for (const [mainId, data] of Object.entries(alts)) {
        const found = (data.alts ?? []).find(a => a.id === member.id);
        if (found) { altEntry = { mainId, mainTag: data.tag, ...found }; break; }
    }

    // ── Alt conhecida = ban automático ──
    if (altEntry) {
        await member.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`⛔ Acesso negado — ${member.guild.name}`)
            .setDescription('Esta conta foi identificada como alternativa de uma conta banida.')
            .setTimestamp()
        ]}).catch(() => {});

        const banReason = `Alt conhecida de ${altEntry.mainTag} — ${altEntry.reason ?? 'Ban automático'}`;
        const banned = await member.ban({ reason: banReason })
            .then(() => true)
            .catch(() => false);
        if (banned) {
            client.registerBan({
                userId: member.id,
                tag: member.user.tag,
                type: 'auto_altban',
                reason: banReason,
                moderator: 'Sistema Anti-Alt',
                moderatorId: client.user?.id
            });
        }

        await client.sendLog(member.guild, new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Alt Conhecida — Ban Automático')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 Alt detectada',  value: `${member.user.tag}\n\`${member.id}\``, inline: true },
                { name: '👤 Conta principal', value: `${altEntry.mainTag}\n\`${altEntry.mainId}\``, inline: true },
                { name: '📋 Motivo original', value: altEntry.reason ?? 'Sem motivo' }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp());
        return;
    }

    // ── Conta nova = kick automático se configurado ──
    if (ageDays < 7 && cfg.autoKickNewAccounts) {
        await member.user.send({ embeds: [new EmbedBuilder()
            .setColor('#FF8800')
            .setTitle(`⚠️ Entrada negada — ${member.guild.name}`)
            .setDescription('Sua conta é muito recente. Aguarde alguns dias e tente novamente.')
            .addFields({ name: '📅 Conta criada em', value: `<t:${createStamp}:F>` })
            .setTimestamp()
        ]}).catch(() => {});

        await member.kick('Conta com menos de 7 dias — Anti-Alt').catch(() => {});

        await client.sendLog(member.guild, new EmbedBuilder()
            .setColor('#FF4400')
            .setTitle('🚫 Conta Nova Removida Automaticamente')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 Usuário',     value: `${member.user.tag}\n\`${member.id}\``, inline: true },
                { name: '📅 Conta criada', value: `<t:${createStamp}:F>`, inline: true },
                { name: '⏱️ Idade',        value: `${ageDays.toFixed(1)} dias`, inline: true },
                { name: '🚩 Flags',        value: flags.join('\n') || 'Nenhuma' }
            )
            .setFooter({ text: 'SPRP • Anti-Alt' })
            .setTimestamp());
        return;
    }

    // ── Alerta para a staff se houver flags ──
    if (flags.length > 0) {
        await client.sendLog(member.guild, new EmbedBuilder()
            .setColor(ageDays < 7 ? '#FF4400' : '#FFAA00')
            .setTitle('🔍 Conta Suspeita Entrou')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription('Uma conta com indicadores de alt acabou de entrar. Verifique manualmente.')
            .addFields(
                { name: '👤 Usuário',      value: `${member.user.tag}\n\`${member.id}\``, inline: true },
                { name: '📅 Conta criada', value: `<t:${createStamp}:F>`, inline: true },
                { name: '⏱️ Idade',        value: `${ageDays.toFixed(1)} dias`, inline: true },
                { name: '🚩 Flags',        value: flags.join('\n') }
            )
            .setFooter({ text: 'Use !linkalts @principal @alt para vincular | !altban @alt para banir' })
            .setTimestamp());
    }
});

client.login(config.token);
