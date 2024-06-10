const { EmbedBuilder, ChannelType, OAuth2Scopes, Partials, Client, Collection, GatewayIntentBits, ActivityType, PermissionsBitField, Events } = require("discord.js");
const config = require("./config.js");
require('./utils/process.js')();

const client = global.client = new Client({
    fetchAllMembers: true,
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.MessageContent
    ],
    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    partials: [
        Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember, Partials.ThreadMember, Partials.GuildScheduledEvent
    ],
    ws: { version: "10" }
});

client.commands = new Collection();
client.messages = new Collection();
require('./utils/commands')(client);

client.login(config.BotToken);

client.on("ready", () => {
    console.log(`Logged in as: ${client.user.username.green}`);
    console.log(`AppID: ${config.AppID.blue}`);
    console.log(`Presence: ${config.presence.yellow}`);
    console.log(`Status: ${config.status.green}`);
    console.log(`LogChannel: ${config.logChannelID.red}`);
    client.user.setPresence({
        activities: [{ name: config.presence, type: ActivityType.Watching }],
        status: config.status
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`Command not found: ${interaction.commandName}`);
        return await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true }).catch(() => {});
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("Error handling interaction:", error);
        await interaction.reply({ content: `There was an error while executing this command.\n\`\`\`${error}\`\`\``, ephemeral: true }).catch(() => {});
    }
});


// ------------------------------------------------------------------------------------------------| | -> [SERVER EVENTS LOGS BELOW THIS] <- | |------------------------------------------------------------------------------------------------
          

// THREAD CREATE
client.on('threadCreate', async (thread) => {
    const embed = new EmbedBuilder()
        .setTitle('Thread Created')
        .setDescription(`**Thread Name:** ${thread.name}\n**Thread ID:** ${thread.id}\n**Thread Parent Channel:** ${thread.parent.name}`)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// THREAD DELETE
client.on('threadDelete', async (thread) => {
    const embed = new EmbedBuilder()
        .setTitle('Thread Deleted')
        .setDescription(`**Thread Name:** ${thread.name}\n**Thread ID:** ${thread.id}\n**Thread Parent Channel:** ${thread.parent.name}`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// THREAD UPDATE
client.on('threadUpdate', async (oldThread, newThread) => {
    const embed = new EmbedBuilder()
        .setTitle('Thread Updated')
        .setDescription(`**Old Thread Name:** ${oldThread.name}\n**New Thread Name:** ${newThread.name}\n**Thread ID:** ${newThread.id}\n**Thread Parent Channel:** ${newThread.parent.name}`)
        .setColor("#f39c12")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// MESSAGE REACTION ADD
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    const message = reaction.message;
    const emoji = reaction.emoji;

    const embed = new EmbedBuilder()
        .setTitle('Message Reaction Added')
        .setDescription(`**Message ID:** ${message.id}\n**Content:** ${message.content}\n**Channel:** ${message.channel.toString()}\n**Author:** ${message.author.toString()}\n**Reaction Emoji:** ${emoji}`)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// MESSAGE REACTION REMOVE
client.on(Events.MessageReactionRemove, async (reaction, user) => {
    const message = reaction.message;
    const emoji = reaction.emoji;

    // Check if the reaction count becomes zero
    if (reaction.count === 0) {
        const embed = new EmbedBuilder()
            .setTitle('Message Reaction Removed')
            .setDescription(`**Message ID:** ${message.id}\n**Content:** ${message.content}\n**Channel:** ${message.channel.toString()}\n**Author:** ${message.author.toString()}\n**Reaction Emoji:** ${emoji}`)
            .setColor("#e74c3c")
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        sendLog({ embeds: [embed] });
    }
});


// MESSAGE BULK DELETE
client.on(Events.MessageBulkDelete, (messages) => {
    const embed = new EmbedBuilder()
        .setTitle('Bulk Message Delete')
        .setDescription(`**Number of Messages:** ${messages.size}\n\n${messages.map(msg => `ID: ${msg.id}, Content: ${msg.content}`).join('\n')}`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// MESSAGE DELETE
client.on(Events.MessageDelete, (message) => {
    const embed = new EmbedBuilder()
        .setTitle('Message Deleted')
        .setDescription(`**Message ID:** ${message.id}\n**Content:** ${message.content}\n**Channel:** ${message.channel.toString()}\n**Author:** ${message.author.toString()}`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// MESSAGE UPDATE
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    // If the old message is not cached, fetch it
    if (!oldMessage.content) {
        oldMessage = await newMessage.channel.messages.fetch(oldMessage.id);
    }

    const pinnedStatus = newMessage.pinned ? "Pinned" : "Unpinned";

    const embed = new EmbedBuilder()
        .setTitle('Message Updated')
        .setDescription(`**Old Message Content:** ${oldMessage.content}\n**New Message Content:** ${newMessage.content}\n**Pinned Status:** ${pinnedStatus}\n**Channel:** ${newMessage.channel.toString()}\n**Author:** ${newMessage.author.toString()}`)
        .setColor("#f39c12")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// STICKER CREATE
client.on(Events.GuildStickerCreate, (sticker) => {
    const embed = new EmbedBuilder()
        .setTitle('Sticker Created')
        .setDescription(`**Sticker:** ${sticker.name} (\`${sticker.id}\`)`)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    // Check if the sticker has an associated emoji
    if (sticker.tags.includes("guild-emoji")) {
        embed.setDescription(`**Sticker:** ${sticker.name} (\`${sticker.id}\`) - ${sticker.emoji}`);
    }

    // Set the sticker image as the embed image
    embed.setImage(sticker.url);

    sendLog({ embeds: [embed] });
});


// STICKER UPDATE
client.on(Events.GuildStickerUpdate, (oldSticker, newSticker) => {
    const changes = [];

    if (oldSticker.name !== newSticker.name) {
        changes.push(`**Name:** \`${oldSticker.name}\` -> \`${newSticker.name}\``);
    }
    // Add more conditions to check other properties like description, tags, etc.

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle('Sticker Updated')
            .setDescription(`**Sticker:** ${newSticker.name} (\`${newSticker.id}\`)\n${changes.join('\n')}`)
            .setColor("#f39c12")
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        // Check if the sticker has an associated emoji
        if (newSticker.tags.includes("guild-emoji")) {
            embed.setDescription(`**Sticker:** ${newSticker.name} (\`${newSticker.id}\`) - ${newSticker.emoji}`);
        }

        // Set the sticker image as the embed image
        embed.setImage(newSticker.url);

        sendLog({ embeds: [embed] });
    }
});


// STICKER DELETE
client.on(Events.GuildStickerDelete, (sticker) => {
    const embed = new EmbedBuilder()
        .setTitle('Sticker Deleted')
        .setDescription(`**Sticker:** ${sticker.name} (\`${sticker.id}\`)`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});



// GUILD INTEGRATIONS UPDATE
client.on(Events.GuildIntegrationsUpdate, (guild) => {
    const embed = new EmbedBuilder()
        .setTitle('Guild Integrations Updated')
        .setDescription(`**Guild:** ${guild.name} (\`${guild.id}\`)`)
        .setColor("#3498db")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// CHANNEL CREATE
client.on(Events.ChannelCreate, async channel => {
    const embed = new EmbedBuilder()
        .setTitle('Channel Created')
        .setDescription(`**Name:** \`${channel.name}\`\n**ID:** \`${channel.id}\`\n**Type:** \`${ChannelType[channel.type]}\`\n**Category:** ${channel.parent ? channel.parent.name : 'None'}\n**NSFW:** \`${channel.nsfw}\`\n**Created At:** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>`)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// CHANNEL UPDATE
client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    const changes = [];

    if (oldChannel.name !== newChannel.name) {
        changes.push(`**Name:** \`${oldChannel.name}\` -> \`${newChannel.name}\``);
    }

    if (oldChannel.nsfw !== newChannel.nsfw) {
        changes.push(`**NSFW:** \`${oldChannel.nsfw}\` -> \`${newChannel.nsfw}\``);
    }

    if (oldChannel.parentId !== newChannel.parentId) {
        const oldParentName = oldChannel.parent ? oldChannel.parent.name : 'None';
        const newParentName = newChannel.parent ? newChannel.parent.name : 'None';
        changes.push(`**Category:** \`${oldParentName}\` -> \`${newParentName}\``);
    }

    if (oldChannel.type === ChannelType.GuildText && newChannel.type === ChannelType.GuildText) {
        if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
            changes.push(`**Slowmode:** \`${oldChannel.rateLimitPerUser}\` seconds -> \`${newChannel.rateLimitPerUser}\` seconds`);
        }

        if (oldChannel.topic !== newChannel.topic) {
            changes.push(`**Topic:** \`${oldChannel.topic || 'None'}\` -> \`${newChannel.topic || 'None'}\``);
        }
    }

    const oldPermissions = oldChannel.permissionOverwrites.cache;
    const newPermissions = newChannel.permissionOverwrites.cache;
    const permissionChanges = [];

    newPermissions.forEach((newOverwrite, id) => {
        const oldOverwrite = oldPermissions.get(id);
        if (!oldOverwrite) {
            permissionChanges.push(`**Added Overwrite:** \`${id}\` - ${getPermissionDetails(newOverwrite)}`);
        } else if (oldOverwrite.allow.bitfield !== newOverwrite.allow.bitfield || oldOverwrite.deny.bitfield !== newOverwrite.deny.bitfield) {
            permissionChanges.push(`**Updated Overwrite:** \`${id}\` - ${getPermissionDetails(newOverwrite)}`);
        }
    });

    oldPermissions.forEach((oldOverwrite, id) => {
        if (!newPermissions.has(id)) {
            permissionChanges.push(`**Removed Overwrite:** \`${id}\``);
        }
    });

    if (permissionChanges.length > 0) {
        changes.push(...permissionChanges);
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle('Channel Updated')
            .setDescription(`**Channel:** ${newChannel} (\`${newChannel.id}\`)\n**Type:** \`${ChannelType[newChannel.type]}\`\n\n${changes.join('\n')}`)
            .setColor("#f39c12")
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        sendLog({ embeds: [embed] });
    }
});

function getPermissionDetails(overwrite) {
    const allow = new PermissionsBitField(overwrite.allow).toArray().join(', ');
    const deny = new PermissionsBitField(overwrite.deny).toArray().join(', ');
    return `**Allow:** [${allow}]\n\n**Deny:** [${deny}]`;
}


// CHANNEL DELETE
client.on(Events.ChannelDelete, async channel => {
    const embed = new EmbedBuilder()
        .setTitle('Channel Deleted')
        .setDescription(`**Name:** \`${channel.name}\`\n**ID:** \`${channel.id}\`\n**Type:** \`${ChannelType[channel.type]}\`\n**Category:** ${channel.parent ? channel.parent.name : 'None'}\n**NSFW:** \`${channel.nsfw}\`\n**Created At:** <t:${Math.floor(channel.createdTimestamp / 1000)}:R>`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// CHANNEL PINS UPDATE
/*
client.on(Events.ChannelPinsUpdate, async (channel, time) => {
    const pins = await channel.messages.fetchPinned();
    const pinnedMessages = pins.map(message => {
        return {
            content: message.content,
            author: message.author.toString(),
            timestamp: message.createdTimestamp
        };
    });

    const embed = new EmbedBuilder()
        .setTitle('Channel Pins Updated')
        .setDescription(`**Channel:** ${channel.toString()}\n**Time:** ${new Date(time).toLocaleString()}\n**Pinned Messages:**\n${pinnedMessages.map(msg => `Content: ${msg.content}, Author: ${msg.author}, Timestamp: ${new Date(msg.timestamp).toLocaleString()}`).join('\n')}`)
        .setColor("#f39c12")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});
*/


// EMOJI CREATE
client.on(Events.GuildEmojiCreate, async emoji => {
    await emoji.fetchAuthor().catch(() => {});

    const embed = new EmbedBuilder()
        .setTitle('Emoji Created')
        .setDescription(`**Emoji:** ${emoji} (\`${emoji.id}\`)\n**Name:** \`${emoji.name}\`\n**URL:** [Link](${emoji.imageURL()})\n**Animated:** \`${emoji.animated}\`\n**Created By:** ${emoji.author ? emoji.author.tag : 'Unknown'}`)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// EMOJI UPDATE
client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
    await newEmoji.fetchAuthor().catch(() => {});

    const changes = [];

    if (oldEmoji.name !== newEmoji.name) {
        changes.push(`**Name:** \`${oldEmoji.name}\` -> \`${newEmoji.name}\``);
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle('Emoji Updated')
            .setDescription(`**Emoji:** ${newEmoji} (\`${newEmoji.id}\`)\n${changes.join('\n')}\n**URL:** [Link](${newEmoji.imageURL()})\n**Animated:** \`${newEmoji.animated}\`\n**Updated By:** ${newEmoji.author ? newEmoji.author.tag : 'Unknown'}`)
            .setColor("#f39c12")
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        sendLog({ embeds: [embed] });
    }
});


// EMOJI DELETE
client.on(Events.GuildEmojiDelete, emoji => {
    const embed = new EmbedBuilder()
        .setTitle('Emoji Deleted')
        .setDescription(`**Emoji:** \`${emoji.name}\` (\`${emoji.id}\`)\n**URL:** [Link](${emoji.imageURL()})\n**Animated:** \`${emoji.animated}\``)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// ROLE CREATE
client.on(Events.GuildRoleCreate, role => {
    const permissions = new PermissionsBitField(role.permissions.bitfield).toArray().join(', ') || 'None';

    const embed = new EmbedBuilder()
        .setTitle('Role Created')
        .setDescription(`**Role:** ${role} (\`${role.id}\`)\n**Name:** \`${role.name}\`\n**Color:** \`${role.color.toString(16)}\`\n**Permissions:** ${permissions}\n**Hoist:** \`${role.hoist}\`\n**Mentionable:** \`${role.mentionable}\``)
        .setColor("#2ecc71")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// ROLE DELETE
client.on(Events.GuildRoleDelete, role => {
    const permissions = new PermissionsBitField(role.permissions.bitfield).toArray().join(', ') || 'None';

    const embed = new EmbedBuilder()
        .setTitle('Role Deleted')
        .setDescription(`**Role:** \`${role.name}\` (\`${role.id}\`)\n**Color:** \`${role.color.toString(16)}\`\n**Permissions:** ${permissions}\n**Hoist:** \`${role.hoist}\`\n**Mentionable:** \`${role.mentionable}\``)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// ROLE UPDATE
client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    const changes = [];

    if (oldRole.name !== newRole.name) {
        changes.push(`**Name:** \`${oldRole.name}\` -> \`${newRole.name}\``);
    }
    if (oldRole.color !== newRole.color) {
        changes.push(`**Color:** \`${oldRole.color.toString(16)}\` -> \`${newRole.color.toString(16)}\``);
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        const oldPermissions = new PermissionsBitField(oldRole.permissions.bitfield).toArray().join(', ');
        const newPermissions = new PermissionsBitField(newRole.permissions.bitfield).toArray().join(', ');
        changes.push(`**Permissions:** \`${oldPermissions}\` -> \`${newPermissions}\``);
    }
    if (oldRole.hoist !== newRole.hoist) {
        changes.push(`**Hoist:** \`${oldRole.hoist}\` -> \`${newRole.hoist}\``);
    }
    if (oldRole.mentionable !== newRole.mentionable) {
        changes.push(`**Mentionable:** \`${oldRole.mentionable}\` -> \`${newRole.mentionable}\``);
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle('Role Updated')
            .setDescription(`**Role:** ${newRole} (\`${newRole.id}\`)\n${changes.join('\n')}`)
            .setColor("#f39c12")
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        sendLog({ embeds: [embed] });
    }
});


// MEMBER UPDATE
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    await oldMember.fetch();
    await newMember.fetch();
    await newMember.user.fetch();

    const accountCreationTimestamp = Math.floor(newMember.user.createdTimestamp / 1000);
    const joinTimestamp = Math.floor(newMember.joinedTimestamp / 1000);
    const roleList = newMember.roles.cache.map(r => r.name).join(', ') || 'None';
    const baseEmbed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    // Detect role additions and removals
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        addedRoles.forEach(role => {
            const embed = new EmbedBuilder(baseEmbed)
                .setTitle('Role Added')
                .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`)\n**Role:** ${role} (\`${role.id}\`)\n\n**Username:** ${newMember.user.tag} (\`${newMember.id}\`)\n**Account Creation Date:** <t:${accountCreationTimestamp}:R>\n**Server Join Date:** <t:${joinTimestamp}:R>\n**Current Roles:** ${roleList}`)
                .setColor("#2ecc71"); // Green for role addition
            sendLog({ embeds: [embed] });
        });
    }

    if (removedRoles.size > 0) {
        removedRoles.forEach(role => {
            const embed = new EmbedBuilder(baseEmbed)
                .setTitle('Role Removed')
                .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`)\n**Role:** ${role} (\`${role.id}\`)\n\n**Username:** ${newMember.user.tag} (\`${newMember.id}\`)\n**Account Creation Date:** <t:${accountCreationTimestamp}:R>\n**Server Join Date:** <t:${joinTimestamp}:R>\n**Current Roles:** ${roleList}`)
                .setColor("#e74c3c"); // Red for role removal
            sendLog({ embeds: [embed] });
        });
    }

    // Detect nickname changes
    if (oldMember.nickname !== newMember.nickname) {
        const embed = new EmbedBuilder(baseEmbed)
            .setTitle('Nickname Updated')
            .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`)\n**Old Nickname:** ${oldMember.nickname || 'None'}\n**New Nickname:** ${newMember.nickname || 'None'}`)
            .setColor("#3498db"); // Blue for nickname change
        sendLog({ embeds: [embed] });
    }

    // Detect boost changes
    if (!oldMember.premiumSince && newMember.premiumSince) {
        const embed = new EmbedBuilder(baseEmbed)
            .setTitle('Member Boosted')
            .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`) has started boosting the server.`)
            .setColor("#f1c40f"); // Yellow for boosting
        sendLog({ embeds: [embed] });
    } else if (oldMember.premiumSince && !newMember.premiumSince) {
        const embed = new EmbedBuilder(baseEmbed)
            .setTitle('Boost Removed')
            .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`) has stopped boosting the server.`)
            .setColor("#e74c3c"); // Red for boost removal
        sendLog({ embeds: [embed] });
    }

    // Detect avatar changes
    if (oldMember.avatar !== newMember.avatar) {
        const embed = new EmbedBuilder(baseEmbed)
            .setTitle('Avatar Updated')
            .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`) updated their avatar.`)
            .setImage(newMember.displayAvatarURL())
            .setColor("#9b59b6"); // Purple for avatar change
        sendLog({ embeds: [embed] });
    }

    // Detect timeout changes
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        const embed = new EmbedBuilder(baseEmbed)
            .setTitle('Timeout Updated')
            .setDescription(`**Member:** ${newMember} (\`${newMember.id}\`)\n**Timeout Until:** ${newMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>` : 'None'}`)
            .setColor("#e67e22"); // Orange for timeout change
        sendLog({ embeds: [embed] });
    }
});


// GUILD MEMBER ADD
client.on(Events.GuildMemberAdd, (member) => {
    const accountCreationTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinTimestamp = Math.floor(member.joinedTimestamp / 1000);

    const embed = new EmbedBuilder()
        .setTitle('Member Joined')
        .setDescription(`**Member:** ${member} (\`${member.id}\`)\n**Username:** ${member.user.tag}\n**Account Creation Date:** <t:${accountCreationTimestamp}:R>\n**Server Join Date:** <t:${joinTimestamp}:R>`)
        .setColor("#3498db")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


// GUILD MEMBER REMOVE
client.on(Events.GuildMemberRemove, (member) => {
    const accountCreationTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const leaveTimestamp = Math.floor(Date.now() / 1000);  // Current time

    const embed = new EmbedBuilder()
        .setTitle('Member Left')
        .setDescription(`**Member:** ${member} (\`${member.id}\`)\n**Username:** ${member.user.tag}\n**Account Creation Date:** <t:${accountCreationTimestamp}:R>\n**Server Leave Date:** <t:${leaveTimestamp}:R>`)
        .setColor("#e74c3c")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

    sendLog({ embeds: [embed] });
});


Collection.prototype.array = function () { return [...this.values()] }
async function sendLog(ertu) {
    let channel = client.channels.cache.get(config.logChannelID)
    if (!channel) return console.log("log Channel is undefined".red)
    channel.send(ertu)
}
