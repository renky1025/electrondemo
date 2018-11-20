const {app, Tray, BrowserWindow, globalShortcut, dialog,  Menu, ipcMain} = require('electron')
const { autoUpdater } = require('electron-updater')

//更新服务： 本地服务器地址
const feedURL = `http://10.101.0.121:8080/`

// 创建全局变量并在下面引用，避免被GC
let mainWindow;
let tray;
const template = [
  {
    label: '操作',
    submenu: [{
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    }, {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    }, {
        label: '重新加载',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(function (win) {
                        if (win.id > 1) {
                            win.close()
                        }
                    })
                }
                focusedWindow.reload()
            }
        }
    }]
  },
  {
    label: '加载网页',
    submenu: [
      {
        label: '优酷',
        accelerator: 'CmdOrCtrl+P',
        click: () => { console.log('time to print stuff') }
      },
      {
        type: 'separator'
      },
      {
        label: '百度',
      }
    ]
  }
]

if (process.platform === 'darwin') {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [{
        label: `关于 ${name}`,
        role: 'about'
      }, {
        type: 'separator'
      }, {
        label: '服务',
        role: 'services',
        submenu: []
      }, {
        type: 'separator'
      }, {
        label: `隐藏 ${name}`,
        accelerator: 'Command+H',
        role: 'hide'
      }, {
        label: '隐藏其它',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      }, {
        label: '显示全部',
        role: 'unhide'
      }, {
        type: 'separator'
      }, {
        label: '退出',
        accelerator: 'Command+Q',
        click: function () {
          app.quit()
        }
      }]
    })
}


function createWindow () {
    // 创建浏览器窗口并设置宽高
    mainWindow = new BrowserWindow({ width: 800, height: 600 })
    
    // 加载页面
    mainWindow.loadFile('./index.html')
    
    // 打开开发者工具
    //mainWindow.webContents.openDevTools()
    
    // 添加window关闭触发事件

    // 监听快捷键
    globalShortcut.register('CmdOrCtrl+1', () => {
        dialog.showMessageBox({
            type: 'info',
            message: '你按下了全局注册的快捷键'
        })
    })

    //添加主程序 菜单
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    const path = __dirname
    tray = new Tray(path+ '/static/icon.png');//系统托盘图标
    
    const contextMenu = Menu.buildFromTemplate([ // 菜单项
      {label: '显示', type: 'radio', click: () => {mainWindow.show()}},
      {label: '隐藏', type: 'radio', click: () => {mainWindow.hide()}},
    ])
    
    // tray.on('click', () => { //  鼠标点击事件最好和菜单只设置一种
    //   win.isVisible() ? win.hide() : win.show()
    // })
    // 图标菜单
    tray.setToolTip('This is my application.') // 鼠标放上时候的提示
    
    tray.setContextMenu(contextMenu) // 应用菜单项

    mainWindow.on('closed', () => {
        mainWindow = null  // 取消引用
    })
}

// 初始化后 调用函数
app.on('ready', createWindow)  

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
   // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
   // 否则绝大部分应用及其菜单栏会保持激活。
   if (process.platform !== 'darwin') {
        app.quit()
   }
})
  
app.on('activate', () => {
// 在macOS上，当单击dock图标并且没有其他窗口打开时，
// 通常在应用程序中重新创建一个窗口。
    if (mainWindow === null) {
      createWindow()
    }
})

ipcMain.on('update', (e, arg) => {
    checkForUpdate()
})

  const checkForUpdate = () => {
    // 设置检查更新的 url，并且初始化自动更新
    autoUpdater.setFeedURL(feedURL)
  
   // 监听错误 
    autoUpdater.on('error', message => {
      sendUpdateMessage('err', message)
    })
   // 当开始检查更新的时候触发
    autoUpdater.on('checking-for-update', message => {
      sendUpdateMessage('checking-for-update', message);
    })
   // 
    autoUpdater.on('download-progress', function(progressObj) {
      sendUpdateMessage('downloadProgress', progressObj);
    });
    // 更新下载完成事件
    autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        
        ipcMain.on('updateNow', (e, arg) => {
            autoUpdater.quitAndInstall();
        });
        sendUpdateMessage('isUpdateNow');
    });
   // 向服务端查询现在是否有可用的更新
    autoUpdater.checkForUpdates();
  }
  
  // 发送消息触发message事件
  function sendUpdateMessage(message, data) {
    mainWindow.webContents.send('message', { message, data });
  }
