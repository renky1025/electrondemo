const {ipcRenderer} = require ('electron');
const button = document.querySelector('#button')


const ul = document.querySelector('ul')
button.onclick = () => {
  ipcRenderer.send('update')
}

ipcRenderer.on('message', (event, {message,data }) => {
  let li = document.createElement('li')
  li.innerHTML = message + " <br>data:" + JSON.stringify(data) +"<hr>";
  ul.appendChild(li)
  if (message === 'isUpdateNow') {
    if (confirm('是否现在更新？')) {
        ipcRenderer.send('updateNow');
    }
  }
})
