const { toHTML } = require('discord-markdown');
const emoji = require('node-emoji');

function isValidEmoji(text) {
    const invalidEmojiPatterns = [':o', ':O', ':(', ':)', ':p', ':P', ':d', ':D', ':v', ':V', ':/'];
    return !invalidEmojiPatterns.includes(text);
}

function validInvs(txt) {
    const regex = /((http|https)?:\/\/)?(www\.)?((discord|invite|dis)\.(gg|io|li|me|gd)|(discordapp|discord)\.com\/invite)\/[aA-zZ|0-9]{2,25}/gim;
    const invs = txt.match(regex);

    return invs ? true : false;
}

function extractContent(html) {
    if (html.replace(/<[^>]+>/g, '').trim()) {
        return true;
    } else {
        return false;
    }
}

function parseDate(date) {
    if (
        date.toLocaleDateString('es-ES') ===
        new Date().toLocaleDateString('es-ES')
    )
        return `Hoy a las ${date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
        })}`;
    return date.toLocaleDateString('es-ES');
}

function processFrontEndMessage(client, message) {
    const dataMDiscord = toHTML(message.content, {
        discordCallback: {
            user: (node) => {
                return (
                    '@' +
                    (message.guild.members.cache.get(node.id)
                        ? message.guild.members.cache.get(node.id).displayName
                        : client.users.cache.get(node.id)
                        ? client.users.cache.get(node.id).username
                        : 'Deleted User')
                );
            },
            channel: (node) => {
                return (
                    '#' +
                    (message.guild.channels.cache.get(node.id)
                        ? message.guild.channels.cache.get(node.id).name
                        : 'deleted-channel')
                );
            },
            role: (node) => {
                return (
                    '@' +
                    (message.guild.roles.cache.get(node.id)
                        ? message.guild.roles.cache.get(node.id).name
                        : 'deleted-role')
                );
            },
        },
        escapeHTML: true,
    });

    // Implementando un reemplazo más seguro para emojis
    let emojiFind = dataMDiscord.replace(/:([\w+-]+):/g, (match, emojiName) => {
        if (!isValidEmoji(match)) return match;
        
        const foundEmoji = emoji.get(emojiName);
        return foundEmoji !== `:${emojiName}:` 
            ? `<i class="twa twa-3x twa-${emojiName}"></i>` 
            : match;
    });
    
    if (extractContent(emojiFind)) {
        emojiFind = emojiFind.replace(/:([\w+-]+):/g, (match, emojiName) => {
            if (!isValidEmoji(match)) return match;
            
            const foundEmoji = emoji.get(emojiName);
            return foundEmoji !== `:${emojiName}:` 
                ? `<i class="twa twa-1x twa-${emojiName}"></i>` 
                : match;
        });
    }

    if (validInvs(emojiFind))
        emojiFind = `**${message.author.username}** invalid link.`;

    return {
        content: emojiFind,
        author: message.member
            ? message.member.displayName
            : message.author.username,
        avatarURL: message.author.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 1024,
        }),
        id: message.author.id,
        messageID: message.id,
        date: parseDate(message.createdAt),
        colorName: message.member ? message.member.displayHexColor : '#FFFFFF',
        attachmentURL:
            message.attachments.first() &&
            message.attachments.first().height !== null
                ? message.attachments.first().attachment
                : null,
    };
}

module.exports = {
    validInvs,
    extractContent,
    processFrontEndMessage,
    parseDate,
    isValidEmoji
};