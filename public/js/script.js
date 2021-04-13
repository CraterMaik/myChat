$(function () {
    const popup = document.getElementById('openedImage');
    const modal = document.getElementById('modal');
    const openOriginal = document.getElementById('openOriginal');
    modal.onclick = function (e) {
        if (e.target !== popup) modal.style.display = 'none';
    };
    window.addEventListener('pageshow', function (event) {
        const historyTraversal =
            event.persisted ||
            (typeof performance != 'undefined' &&
                performance.navigation.type === 2);
        if (historyTraversal) {
            location.reload();
        }
    });
    const key = document
        .querySelector('meta[name="app-token"]')
        .getAttribute('content');
    let $window = $(window);
    let typingArea = $('.typingArea');
    const cooldownArea = document.getElementById('cooldownArea');
    let idSaveLocal = '';
    let lastMessage = JSON.parse(
        document
            .querySelector('meta[name="first-last-message"]')
            .getAttribute('content')
    );
    Map.prototype.onChange = function () {};
    Map.prototype.add = function (key, value) {
        this.set(key, value);
        this.onChange();
    };
    Map.prototype.remove = function (key, value) {
        this.delete(key);
        this.onChange();
    };
    let typing = new Map();
    typing.onChange = function () {
        const users = Array.from(typing.values());
        if (users.length > 1) users.splice(-1, 0, 'y');
        typingArea.text(
            users.length > 0
                ? `${users.join(', ')} está${
                      users.length > 1 ? 'n' : ''
                  } escribiendo...`
                : ''
        );
    };
    const messages = {
        _counter: 0,
        onChange: function () {
            if (this._counter === 0)
                document.getElementById('newMessages').style.display = 'none';
            else {
                $('#newMessages').text(
                    `${this._counter} mensaje${
                        this._counter > 1 ? 's' : ''
                    } nuevo${this._counter > 1 ? 's' : ''}.`
                );
                document.getElementById('newMessages').style.display = 'block';
            }
        },
        set new(value) {
            this._counter = value;
            this.onChange();
        },
        get new() {
            return this._counter;
        },
    };

    const socket = io();

    $inputMessage = $('.inputMSG');
    $inputMessage.focus();
    $messages = $('.messages');
    $messages[0].scrollTop = $messages[0].scrollHeight;

    $('#boxChat').on('scroll', function () {
        if (
            parseInt($('#boxChat').scrollTop()) ===
            parseInt($('#boxChat')[0].scrollHeight - $('#boxChat').height())
        )
            messages.new = 0;
    });

    socket.emit('join', key);
    let md = window.markdownit().use(window.markdownitEmoji);
    md.renderer.rules.emoji = function (token, idx) {
        return `<i class="twa twa-3x twa-${token[idx].markup}"></i>`;
    };

    function extractContent(html) {
        if (html.replace(/<[^>]+>/g, '').trim()) {
            return true;
        } else {
            return false;
        }
    }

    function emoji_animated() {
        $('.d-emoji-animated').each(function (index, element) {
            element.src = element.src.replace('.png', '.gif');
        });
    }

    function emoji_only() {
        $('.messages li:last-child p .d-emoji').each(function (e) {
            $(this).addClass('d-emoji-only');
        });
    }

    socket.on('typingStart', (data) => {
        if (typing.has(data.user.id)) return;
        typing.add(data.user.id, data.user.username);
        setTimeout(() => typing.remove(data.user.id), 6000);
    });

    socket.on('new message', (data) => {
        typing.remove(data.id);
        msgTemplate(data);
        emoji_animated();

        if (!extractContent(data.content)) emoji_only();
    });

    socket.on('add message', function (data) {
        renderMessage(data);
    });
    socket.on('cooldown', async function (remaining, cooldown) {
        if (!cooldown) return;
        if (!remaining) {
            cooldownArea.innerText = moment
                .duration(cooldown, 'seconds')
                .format('h:mm:ss', { trim: false });
            let e = Number(cooldown);
            var interval = setInterval(() => {
                if (e == 0) {
                    cooldownArea.innerText = 'El modo lento está activado';
                    return clearInterval(interval);
                }
                e--;
                cooldownArea.innerText = moment
                    .duration(e, 'seconds')
                    .format('h:mm:ss', { trim: false });
            }, 1000);
            return;
        }
        for (let i = 0; i < 3; i++) {
            cooldownArea.style.color = '#FF2727';
            await new Promise((s) => setTimeout(s, 100));
            cooldownArea.style.color = '#FFFFFF';
            await new Promise((s) => setTimeout(s, 100));
        }
    });

    function clearInput(msg) {
        return $('<div/>').text(msg).text();
    }

    function addMessageElement(el, options) {
        var $el = $(el);

        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }
        if (typeof options.scroll === 'undefined') {
            options.scroll = true;
        }

        if (options.fade) {
            $el.hide().fadeIn(120);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }

        document.querySelectorAll('img.img-content').forEach((img) => {
            img.onclick = function () {
                popup.src = img.src;
                popup.onload = function () {
                    modal.style.display = 'flex';
                    openOriginal.href = img.src;
                };
            };
        });

        if (options.scroll) $messages[0].scrollTop = $messages[0].scrollHeight;
        else messages.new++;
    }
    function addMessage() {
        let addMgs = $inputMessage.val();
        addMsg = clearInput(addMgs);
        if (addMsg) {
            $inputMessage.val('');
            socket.emit('add message', key, addMsg);
        }
    }

    function renderMessage(data, options) {
        options = options || {};
        let $messageDiv = '';
        $imgAvatar = $(
            `<img src="${data.avatarURL}" alt="${data.username}-avatar" class="circle">`
        );
        $divUserTwo = md.render(data.content);
        $divUser = $(`<span class="title" style="color: ${data.userColor}">${
            data.username
        }</span>
                ${md.render(data.content)}`);

        if (lastMessage.id === data.id && lastMessage.author === data.author) {
            $messageDiv = $(
                `<li id=${data.messageID} class="collection-item item-chat" id="msg-el"/>`
            ).append($divUserTwo);
        } else {
            lastMessage.id = data.id;
            lastMessage.author = data.author;
            $messageDiv = $(
                `<li id=${data.messageID} class="collection-item avatar"/>`
            ).append($imgAvatar, $divUser);
        }

        addMessageElement($messageDiv, options);
    }

    function msgTemplate(data) {
        if (data.attachmentURL) {
            $divUser = $(
                `<span class="title" style="color: ${data.colorName}">${
                    data.author
                } <span class="datep">${data.date}</span></span><p>${
                    data.content
                }<${
                    data.attachmentURL.endsWith('.mp4')
                        ? 'video controls'
                        : 'img'
                } class="img-content" src=${data.attachmentURL} /></p>`
            );
            $divUserTwo = $(
                `<p>${data.content}<img class="img-content" src=${data.attachmentURL} /></p>`
            );
        } else {
            $divUser = $(
                `<span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span><p>${data.content} </p>`
            );
            $divUserTwo = $(`<p>${data.content}</p>`);
        }
        $imgAvatar = $(
            `<img src="${data.avatarURL}" alt="${data.author}-avatar" class="circle">`
        );

        if (lastMessage.id === data.id && lastMessage.author === data.author) {
            $messageDiv = $(
                `<li id=${data.messageID} class="collection-item item-chat" id="msg-el" />`
            ).append($divUserTwo);
        } else {
            lastMessage.id = data.id;
            lastMessage.author = data.author;
            $messageDiv = $(
                `<li id=${data.messageID} class="collection-item avatar"/>`
            ).append($imgAvatar, $divUser);
        }

        addMessageElement($messageDiv, {
            scroll:
                parseInt($('#boxChat').scrollTop()) ===
                parseInt(
                    $('#boxChat')[0].scrollHeight - $('#boxChat').height()
                ),
        });
    }

    $window.keydown(function (event) {
        if (!(event.ctrlKey || event.metaKey || event.altKey))
            $inputMessage.focus();

        if (event.which === 13) addMessage();
    });
});
