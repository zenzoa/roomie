const fs = require('fs')
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
	'doOn': (message, callback) => {
		ipcRenderer.on(message, callback)
	},

	'doesFileExist': (filepath) => {
		try {
			fs.accessSync(filepath, fs.constants.R_OK)
			return true
		} catch (error) {
			return false
		}
	},

	'readFile': (filepath, encoding) => {
		return fs.promises.readFile(filepath, encoding)
	},

	'writeFile': (filepath, data) => {
		return fs.promises.writeFile(filepath, data)
	},

	'showOpenDialog': (defaultPath, filters) => {
		return ipcRenderer.invoke('dialog', 'showOpenDialog', {
			defaultPath, filters,
			properties: ['openFile']
		})
	},

	'showSaveDialog': (defaultPath, filters) => {
		return ipcRenderer.invoke('dialog', 'showSaveDialogSync', {
			defaultPath, filters
		})
	},

	'showConfirmDialog': (message, detail) => {
		return ipcRenderer.invoke('dialog', 'showMessageBoxSync', {
			message, detail,
			buttons: [ 'Yes', 'No'],
			title: 'Confirm',
			type: 'question'
		})
	},

	'showErrorDialog': (message, detail) => {
		return ipcRenderer.invoke('dialog', 'showMessageBoxSync', {
			message, detail,
			type: 'error',
			title: 'Error'
		})
	},

	'metaroomOpen': (value) => {
		return ipcRenderer.invoke('metaroomOpen', value)
	},

	'roomSelect': (value) => {
		return ipcRenderer.invoke('roomSelect', value)
	},

	'edgeSelect': (value) => {
		return ipcRenderer.invoke('edgeSelect', value)
	},

	'bgImageOpen': (value) => {
		return ipcRenderer.invoke('bgImageOpen', value)
	},

	'dataToString': (data) => {
		let buffer = new Buffer(data, 'binary')
		return buffer.toString('base64')
	},

	'fileModified': (value) => {
		ipcRenderer.invoke('fileModified', value)
	}
})
