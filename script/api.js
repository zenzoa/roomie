const fs = require('fs')
const menu = require('./menu')

exports.api = {
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
		return new Promise((resolve, reject) => {
			let fileInput = nw.Window.get().window.document.getElementById('fileOpen')
			fileInput.accept = filters[0].extensions.map(e => '.' + e).join(',')
			fileInput.onchange = (event) => {
				const file = event.target.files[0]
				if (file) {
					let filePaths = [ file.path ]
					resolve({ filePaths })
				} else {
					reject()
				}
			}
			fileInput.click()
		})
	},

	'showSaveDialog': (defaultPath, defaultName, filters) => {
		return new Promise((resolve, reject) => {
			let fileInput = nw.Window.get().window.document.getElementById('fileSave')
			fileInput.nwsaveas = defaultName
			fileInput.nwworkingdir = defaultPath
			fileInput.onchange = (event) => {
				const file = event.target.files[0]
				if (file) {
					resolve(file.path)
				} else {
					reject()
				}
			}
			fileInput.click()
		})
	},

	'showConfirmDialog': (message) => {
		return new Promise((resolve) => {
			let result = confirm(message)
			if (result) {
				resolve(0)
			} else {
				resolve(1)
			}
		})
	},

	'showErrorDialog': (message) => {
		alert(message)
	},

	'metaroomOpen': (value) => {
		menu.save.enabled = value
		menu.saveAs.enabled = value
		menu.createRoom.enabled = value
		menu.resetZoom.enabled = value
		menu.zoomIn.enabled = value
		menu.zoomOut.enabled = value
	},

	'roomSelect': (value) => {
		menu.deleteRoom.enabled = value
	},

	'edgeSelect': (value) => {
		menu.extrudeRoom.enabled = value
	},

	'bgImageOpen': (value) => {
		menu.exportBlk.enabled = value
		menu.exportPng.enabled = value
	},

	'dataToString': (data) => {
		let buffer = new Buffer(data, 'binary')
		return buffer.toString('base64')
	}
}
