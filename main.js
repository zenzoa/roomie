/*
- CA links (link vertical rooms)
- CA emitters
- favorite places code
- fix snap-to-edge when it's just edge-to-edge
*/

const path = require('path')
const { BrowserWindow, Menu, app, ipcMain, dialog } = require('electron')
const { menuTemplate } = require('./script/menu.js')

let mainWindow
let fileModified = false

const createWindow = () => {
	mainWindow = new BrowserWindow({
		title: 'Roomie',
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'script/preload.js')
		}
	})

	mainWindow.loadFile('index.html')

	mainWindow.on('close', (event) => {
		if (fileModified) {
			let response = dialog.showMessageBoxSync(mainWindow, {
				type: 'question',
				buttons: ['Yes', 'No'],
				title: 'Confirm',
				message: 'Are you sure you want to quit without saving?'
			})

			if (response === 1) event.preventDefault()
		}
	})
}

const createMenu = () => {
	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
	createWindow()
	createMenu()

	ipcMain.handle('dialog', (event, method, params) => {
		return dialog[method](params)
	})

	ipcMain.handle('metaroomOpen', (event, value) => {
		Menu.getApplicationMenu().getMenuItemById('save').enabled = value
		Menu.getApplicationMenu().getMenuItemById('save-as').enabled = value
		Menu.getApplicationMenu().getMenuItemById('create-room').enabled = value
		Menu.getApplicationMenu().getMenuItemById('reset-zoom').enabled = value
		Menu.getApplicationMenu().getMenuItemById('zoom-in').enabled = value
		Menu.getApplicationMenu().getMenuItemById('zoom-out').enabled = value
	})

	ipcMain.handle('roomSelect', (event, value) => {
		Menu.getApplicationMenu().getMenuItemById('delete-room').enabled = value
	})

	ipcMain.handle('edgeSelect', (event, value) => {
		Menu.getApplicationMenu().getMenuItemById('extrude-room').enabled = value
	})

	ipcMain.handle('bgImageOpen', (event, value) => {
		Menu.getApplicationMenu().getMenuItemById('export-blk').enabled = value
		Menu.getApplicationMenu().getMenuItemById('export-png').enabled = value
	})

	ipcMain.handle('fileModified', (event, value) => {
		fileModified = value
	})

	// file menu
	ipcMain.on('newMetaroom', () => { mainWindow.webContents.send('newMetaroom') })
	ipcMain.on('openMetaroom', () => { mainWindow.webContents.send('openMetaroom') })
	ipcMain.on('saveMetaroom', () => { mainWindow.webContents.send('saveMetaroom') })
	ipcMain.on('saveMetaroomAs', () => { mainWindow.webContents.send('saveMetaroomAs') })
	ipcMain.on('exportBgAsBLK', () => { mainWindow.webContents.send('exportBgAsBLK') })
	ipcMain.on('exportBgAsPNG', () => { mainWindow.webContents.send('exportBgAsPNG') })

	// room menu
	ipcMain.on('createRoom', () => { mainWindow.webContents.send('createRoom') })
	ipcMain.on('extrudeRoom', () => { mainWindow.webContents.send('extrudeRoom') })
	ipcMain.on('deleteRoom', () => { mainWindow.webContents.send('deleteRoom') })

	// zoom menu
	ipcMain.on('resetZoom', () => { mainWindow.webContents.send('resetZoom') })
	ipcMain.on('zoomIn', () => { mainWindow.webContents.send('zoomIn') })
	ipcMain.on('zoomOut', () => { mainWindow.webContents.send('zoomOut') })
})

app.on('window-all-closed', () => {
	app.quit()
})
