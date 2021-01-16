$(function () {
  let $window = $(window)
  let avatarURL = $(".img-url").attr("src")
  let userName = $('.profile-username-footer').text()
  let idSaveLocal = ''
  let idLastMessage = ''

  const socket = io()

  $inputMessage = $('.inputMSG')
  $inputMessage.focus()
  $messages = $('.messages')
  let iduser = document.getElementById('iduser').dataset.test

  socket.emit('join', iduser)
  let md = window.markdownit().use(window.markdownitEmoji)
  md.renderer.rules.emoji = function (token, idx) {
    return `<i class="twa twa-3x twa-${token[idx].markup}"></i>`
  }

  function extractContent(html) {
    if (html.replace(/<[^>]+>/g, '').trim()) {
      return true
    } else {
      return false
    }
  }

  function emoji_animated() {
    $('.d-emoji-animated').each(function (index, element) {
      element.src = element.src.replace('.png', '.gif')
    })
  }

  function emoji_only() {
    $('.messages li:last-child p .d-emoji').each(function (e) {
      $(this).addClass("d-emoji-only")
    })

  }

  socket.on("new message", (data) => {
    msgTemplate(data)
    emoji_animated()

    if (!extractContent(data.content)) {
      emoji_only()
    }
  })

  socket.on('add message', function (data) {
    renderMessage(data)
  })

  function clearInput(msg) {
    return $('<div/>').text(msg).text()
  }

  function addMessageElement(el, options) {
    var $el = $(el)

    if (!options) {
      options = {}
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false
    }

    if (options.fade) {
      $el.hide().fadeIn(120)
    }
    if (options.prepend) {
      $messages.prepend($el)
    } else {
      $messages.append($el)
    }

    $messages[0].scrollTop = $messages[0].scrollHeight

  }
  function addMessage() {
    let addMgs = $inputMessage.val()
    addMsg = clearInput(addMgs)
    if (addMsg) {
      $inputMessage.val('')
      const data = {
        id: iduser,
        content: addMsg,
        avatarURL: avatarURL,
        username: userName
      }
      renderMessage(data)
      socket.emit('add message', data)
    }
  }

  function renderMessage(data, options) {
    options = options || {}
    let $messageDiv = ''
    $imgAvatar = $(`<img src="${data.avatarURL}" alt="${data.username}-avatar" class="circle">`)
    $divUserTwo = md.render(data.content)
    $divUser = $(`<span class="title" style="color: ${data.userColor}">${data.username}</span>
                ${md.render(data.content)}`)

    if (idLastMessage === data.id) {
      $messageDiv = $('<li class="collection-item item-chat" id="msg-el"/>')
        .append($divUserTwo)

    } else {
      idLastMessage = data.id
      $messageDiv = $('<li class="collection-item avatar"/>')
        .append($imgAvatar, $divUser)

    }

    addMessageElement($messageDiv, options)
  }

  function msgTemplate(data) {
    if (data.attachmentURL) {
      $divUser = $(`<span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span><p>${data.content}<${data.attachmentURL.endsWith('.mp4') ? 'video controls' : 'img'} class="img-content" src=${data.attachmentURL} /></p>`)
      $divUserTwo = $(`<p>${data.content}<img class="img-content" src=${data.attachmentURL} /></p>`)
    } else {
      $divUser = $(`<span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span><p>${data.content} </p>`)
      $divUserTwo = $(`<p>${data.content}</p>`)
    }
    $imgAvatar = $(`<img src="${data.avatarURL}" alt="${data.author}-avatar" class="circle">`)

    if (idLastMessage === data.id) {
      $messageDiv = $('<li class="collection-item item-chat" id="msg-el" />')
        .append($divUserTwo)

    } else {
      idLastMessage = data.id
      $messageDiv = $('<li class="collection-item avatar"/>')
        .append($imgAvatar, $divUser)

    }

    addMessageElement($messageDiv)
  }

  $window.keydown(function (event) {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $inputMessage.focus()
    }
    if (event.which === 13) {
      addMessage()
    }
  })
})
