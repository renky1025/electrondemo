const {ipcMain} = require('electron')

// 监听渲染程序发来的事件
ipcMain.on('something', (event, data) => {
    event.sender.send('something1', '我是主进程返回的值')
})

const { ipcRenderer} = require('electron') 

// 发送事件给主进程
ipcRenderer.send('something', '传输给主进程的值')  

// 监听主进程发来的事件
ipcRenderer.on('something1', (event, data) => {
    console.log(data) // 我是主进程返回的值
})
