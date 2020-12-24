
$(function() {
  let $window = $(window);
  let avatarURL = $(".img-url").attr("src");
  let userName = $('.profile-username-footer').text();
  let idSave = '';
  const socket = io();
  $inputMessage = $('.inputMSG')
  $inputMessage.focus();
  $messages = $('.messages');

  
  socket.on("new message", (data) => {
    msgTemplate(data)
 
  });
  function clearInput(msg){
    return $('<div/>').text(msg).text();
  }

  function addMessageElement (el, options) {
    var $el = $(el);

    if(!options) {
      options = {};
    }
    if(typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if(typeof options.prepend === 'undefined'){
      options.prepend = false;
    }

    if(options.fade) {
      $el.hide().fadeIn(120);

    }
    if(options.prepend){
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;

  }
  function addMessage() {
   
    let addMgs = $inputMessage.val();
    addMsg = clearInput(addMgs);

    if (addMsg) {
      $inputMessage.val('');
      const data = {
        content: addMsg,
        avatarURL: avatarURL,
        username: userName
      }
      renderMessage(data)
      
      idSave = userName;
      socket.emit('add message', data)

    }

  }
  function renderMessage (data, options) {

    options = options || {};
    let $messageDiv = '';

    $divUser = $(`<span class="title" style="color: white">${userName}</span><p>${data.content}</p>`)

    $imgAvatar = $(`<img src="${avatarURL}" alt="${userName}-avatar" class="circle">`);

    $messageDiv = $('<li class="collection-item avatar"/>')
      .append($imgAvatar, $divUser);

    addMessageElement($messageDiv, options);
    
  }
 
  function msgTemplate(data) {
    

    if (data.attachmentURL) {
      $divUser = $(`<span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span><p>${data.content}<img class="img-content" src=${data.attachmentURL} /></p>`)
      $divUserTwo = $(`<p>${data.content}<img class="img-content" src=${data.attachmentURL} /></p>`)

    } else {
      $divUser = $(`<span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span><p>${data.content} </p>`)
      $divUserTwo = $(`<p>${data.content}</p>`)

    }
    
    
    $imgAvatar = $(`<img src="${data.avatarURL}" alt="${data.author}-avatar" class="circle">`);

    if (idSave === data.id) {
      
       $messageDiv = $('<li class="collection-item item-chat" id="msg-el" />')
         .append($divUserTwo);

    } else {
      idSave = data.id

      $messageDiv = $('<li class="collection-item avatar"/>')
        .append($imgAvatar, $divUser);

     
    }
    addMessageElement($messageDiv);
  }

  $window.keydown(function (event) {
    if(!(event.ctrlKey || event.metaKey || event.altKey)) {
      $inputMessage.focus();
    }
    if(event.which === 13) {
      addMessage();
     
    }
  })

  socket.on('add message', function(data) {
    renderMessage(data)
  })
})

  
 

 


 