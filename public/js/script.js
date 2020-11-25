/* function enviar() {
  document.getElementById('enviar_MSG').submit();
  
} */
$(function() {
  let $window = $(window);
  let avatarURL = $(".img-url").attr("src");
  let userName = $('.profile-username-footer').text();
  let idSave = '';
  const socket = io();
  $inputMessage = $('.inputMSG')
  $inputMessage.focus();

  socket.on("new message", (data) => {
    msgTemplate(data)

  });
  function clearInput(msg){
    return $('<div/>').text(msg).text();
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
  function renderMessage (data) {
    let boxMessage = document.querySelector('#boxChat');
    let templateMSG = `
          <li class="collection-item avatar">
            <img src="${avatarURL}" alt="" class="circle">
            <span class="title" style="color: white">${userName}</span>
            <p>${data.content}</p>
              
          </li>
        `;
    boxMessage.innerHTML += templateMSG;

  }
 
  function msgTemplate(data) {
    let boxMessage = document.querySelector('#boxChat');

    let template
    if (idSave === data.id) {
      
      template = `
          <li class="collection-item item-chat">
            <p>${data.content}</p>
          </li>
          `;
    } else {
      idSave = data.id
      template = `
          <li class="collection-item avatar">
            <img src="${data.avatarURL}" alt="" class="circle">
            <span class="title" style="color: ${data.colorName}">${data.author} <span class="datep">${data.date}</span></span>
            <p>${data.content}</p>
              
          </li>
        `;
    }


    boxMessage.innerHTML += template;
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

  
 

 


 