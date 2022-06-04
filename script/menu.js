exports.save = null
exports.saveAs = null
exports.exportBgAsBLK = null
exports.exportBgAsPNG = null
exports.createRoom = null
exports.extrude = null
exports.delete = null

let makeFileMenu = (sketch, isMac) => {
	let fileMenu = new nw.Menu()

	fileMenu.append(new nw.MenuItem({
		label: 'New Metaroom',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 'n',
		click: sketch.newMetaroom.bind(sketch)
	}))

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	fileMenu.append(new nw.MenuItem({
		label: 'Open...',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 'o',
		click: sketch.openMetaroom.bind(sketch)
	}))

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.save = new nw.MenuItem({
		label: 'Save',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 's',
		enabled: false,
		click: sketch.saveMetaroom.bind(sketch)
	})
	fileMenu.append(exports.save)

	exports.saveAs = new nw.MenuItem({
		label: 'Save As...',
		modifiers: isMac ? 'cmd+shift' : 'ctrl+shift',
		key: 's',
		enabled: false,
		click: sketch.saveAsMetaroom.bind(sketch)
	})
	fileMenu.append(exports.saveAs)

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.exportBgAsBLK = new nw.MenuItem({
		label: 'Export Background As BLK...',
		enabled: false,
		click: sketch.exportBgAsBLK.bind(sketch)
	})
	fileMenu.append(exports.exportBgAsBLK)

	exports.exportBgAsPNG = new nw.MenuItem({
		label: 'Export Background As PNG...',
		enabled: false,
		click: sketch.exportBgAsPNG.bind(sketch)
	})
	fileMenu.append(exports.exportBgAsPNG)

	return fileMenu
}

let makeRoomMenu = (sketch, isMac) => {
	let roomMenu = new nw.Menu()

	exports.createRoom = new nw.MenuItem({
		label: 'Create',
		key: 'a',
		enabled: false,
		click: sketch.createRoom.bind(sketch)
	})
	roomMenu.append(exports.createRoom)

	roomMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.extrude = new nw.MenuItem({
		label: 'Extrude',
		key: 'e',
		enabled: false,
		click: sketch.extrudeRoom.bind(sketch)
	})
	roomMenu.append(exports.extrude)

	roomMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.delete = new nw.MenuItem({
		label: 'Delete',
		key: 'Backspace',
		enabled: false,
		click: sketch.deleteRoom.bind(sketch)
	})
	roomMenu.append(exports.delete)

	return roomMenu
}

let makeViewMenu = (sketch, isMac) => {
	let viewMenu = new nw.Menu()

	viewMenu.append(new nw.MenuItem({
		label: '100%',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '0',
		click: sketch.zoomReset.bind(sketch)
	}))

	viewMenu.append(new nw.MenuItem({
		label: 'Zoom In',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '=',
		click: sketch.zoomIn.bind(sketch)
	}))

	viewMenu.append(new nw.MenuItem({
		label: 'Zoom Out',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '-',
		click: sketch.zoomOut.bind(sketch)
	}))

	return viewMenu
}

exports.setup = (sketch) => {

	const isMac = process.platform === 'darwin'

	let menu = new nw.Menu({ type: 'menubar' })

	let fileMenu = new nw.MenuItem({
		label: 'File',
		submenu: makeFileMenu(sketch, isMac)
	})

	let roomMenu = new nw.MenuItem({
		label: 'Room',
		submenu: makeRoomMenu(sketch, isMac)
	})

	let viewMenu = new nw.MenuItem({
		label: 'View',
		submenu: makeViewMenu(sketch, isMac)
	})

	if (isMac) {
		menu.createMacBuiltin('Roomie')
		menu.insert(fileMenu, 1)
		menu.insert(roomMenu, 3)
		menu.insert(viewMenu, 4)
	} else {
		menu.append(fileMenu)
		menu.append(roomMenu)
		menu.append(viewMenu)
	}

	nw.Window.get().menu = menu
}