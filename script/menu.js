const { ipcMain } = require('electron')

const isMac = process.platform === 'darwin'

exports.menuTemplate = [
	...(isMac ? [{
		label: 'Roomie',
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
		]
	}] : []),
	{
		label: 'File',
		submenu: [
			{
				label: 'New Metaroom',
				accelerator: 'CommandOrControl+N',
				click: () => ipcMain.emit('newMetaroom')
			},
			{
				label: 'Open...',
				accelerator: 'CommandOrControl+O',
				click: () => ipcMain.emit('openMetaroom')
			},
			{ type: 'separator' },
			{
				label: 'Save',
				id: 'save',
				enabled: false,
				accelerator: 'CommandOrControl+S',
				click: () => ipcMain.emit('saveMetaroom')
			},
			{
				label: 'Save As',
				id: 'save-as',
				enabled: false,
				accelerator: 'Shift+CommandOrControl+S',
				click: () => ipcMain.emit('saveMetaroomAs')
			},
			{ type: 'separator' },
			{
				label: 'Export Background As BLK...',
				id: 'export-blk',
				enabled: false,
				click: () => ipcMain.emit('exportBgAsBLK')
			},
			{
				label: 'Export Background As PNG...',
				id: 'export-png',
				enabled: false,
				click: () => ipcMain.emit('exportBgAsPNG')
			}
		]
	},
	{
		label: 'Room',
		submenu: [
			{
				label: 'Create',
				id: 'create-room',
				accelerator: 'a',
				enabled: false,
				click: () => ipcMain.emit('createRoom')
			},
			{
				label: 'Extrude',
				id: 'extrude-room',
				accelerator: 'e',
				enabled: false,
				click: () => ipcMain.emit('extrudeRoom')
			},
			{
				label: 'Delete',
				id: 'delete-room',
				accelerator: 'Backspace',
				enabled: false,
				click: () => ipcMain.emit('deleteRoom')
			}
		]
	},
	{
		label: 'View',
		submenu: [
			{
				label: 'Reset Zoom',
				id: 'reset-zoom',
				accelerator: 'CommandOrControl+0',
				enabled: false,
				click: () => ipcMain.emit('resetZoom')
			},
			{
				label: 'Zoom In',
				id: 'zoom-in',
				accelerator: 'CommandOrControl+=',
				enabled: false,
				click: () => ipcMain.emit('zoomIn')
			},
			{
				label: 'Zoom Out',
				id: 'zoom-out',
				accelerator: 'CommandOrControl+-',
				enabled: false,
				click: () => ipcMain.emit('zoomOut')
			}
		]
	},
	{
		label: 'Window',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },

			{ role: 'minimize' },
			{ role: 'zoom' },
			...(isMac ? [
				{ type: 'separator' },
				{ role: 'front' }
			] : [
				{ role: 'close' }
			])
		]
	}
]
