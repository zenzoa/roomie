const isMac = process.platform === 'darwin'

exports.newMetaroom = null
exports.openMetaroom = null
exports.save = null
exports.saveAs = null

exports.exportBlk = null
exports.exportPng = null

exports.createRoom = null
exports.extrudeRoom = null
exports.deleteRoom = null

exports.resetZoom = null
exports.zoomIn = null
exports.zoomOut = null

let buildFileMenu = () => {
	let fileMenu = new nw.Menu()

	exports.newMetaroom = new nw.MenuItem({
		label: 'New Metaroom',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 'n',
		click: () => nw.Window.get().window.sketch.newMetaroom()
	})
	fileMenu.append(exports.newMetaroom)

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.openMetaroom = new nw.MenuItem({
		label: 'Open...',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 'o',
		click: () => nw.Window.get().window.sketch.openMetaroom()
	})
	fileMenu.append(exports.openMetaroom)

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.save = new nw.MenuItem({
		label: 'Save',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 's',
		enabled: false,
		click: () => nw.Window.get().window.sketch.saveMetaroom()
	})
	fileMenu.append(exports.save)

	exports.saveAs = new nw.MenuItem({
		label: 'Save As...',
		modifiers: isMac ? 'cmd+shift' : 'ctrl+shift',
		key: 's',
		enabled: false,
		click: () => nw.Window.get().window.sketch.saveMetaroomAs()
	})
	fileMenu.append(exports.saveAs)

	fileMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.exportBlk = new nw.MenuItem({
		label: 'Export Background As BLK...',
		enabled: false,
		click: () => nw.Window.get().window.sketch.exportBgAsBLK()
	})
	fileMenu.append(exports.exportBlk)

	exports.exportPng = new nw.MenuItem({
		label: 'Export Background As PNG...',
		enabled: false,
		click: () => nw.Window.get().window.sketch.exportBgAsPNG()
	})
	fileMenu.append(exports.exportPng)

	return fileMenu
}

let buildRoomMenu = () => {
	let roomMenu = new nw.Menu()

	exports.createRoom = new nw.MenuItem({
		label: 'Create',
		key: 'a',
		enabled: false,
		click: () => nw.Window.get().window.sketch.createRoom()
	})
	roomMenu.append(exports.createRoom)

	exports.extrudeRoom = new nw.MenuItem({
		label: 'Extrude',
		key: 'e',
		enabled: false,
		click: () => nw.Window.get().window.sketch.extrudeRoom()
	})
	roomMenu.append(exports.extrudeRoom)

	exports.deleteRoom = new nw.MenuItem({
		label: 'Delete',
		key: 'Backspace',
		enabled: false,
		click: () => nw.Window.get().window.sketch.deleteRoom()
	})
	roomMenu.append(exports.deleteRoom)

	roomMenu.append(new nw.MenuItem({ type: 'separator' }))

	exports.addLink = new nw.MenuItem({
		label: 'Add CA Link',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 'l',
		enabled: false,
		click: () => nw.Window.get().window.sketch.addLink()
	})
	roomMenu.append(exports.addLink)

	exports.removeLinks = new nw.MenuItem({
		label: 'Remove CA Links',
		modifiers: isMac ? 'cmd+shift' : 'ctrl+shift',
		key: 'l',
		enabled: false,
		click: () => nw.Window.get().window.sketch.removeLinks()
	})
	roomMenu.append(exports.removeLinks)

	return roomMenu
}

let buildViewMenu = () => {
	let viewMenu = new nw.Menu()

	exports.resetZoom = new nw.MenuItem({
		label: '100%',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '0',
		click: () => nw.Window.get().window.sketch.resetZoom()
	})
	viewMenu.append(exports.resetZoom)

	exports.zoomIn = new nw.MenuItem({
		label: 'Zoom In',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '=',
		click: () => nw.Window.get().window.sketch.zoomIn()
	})
	viewMenu.append(exports.zoomIn)

	exports.zoomOut = new nw.MenuItem({
		label: 'Zoom Out',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: '-',
		click: () => nw.Window.get().window.sketch.zoomOut()
	})
	viewMenu.append(exports.zoomOut)

	return viewMenu
}

exports.buildMenu = () => {
	let menu = new nw.Menu({ type: 'menubar' })

	let fileMenu = new nw.MenuItem({
		label: 'File',
		submenu: buildFileMenu()
	})

	let roomMenu = new nw.MenuItem({
		label: 'Room',
		submenu: buildRoomMenu()
	})

	let viewMenu = new nw.MenuItem({
		label: 'View',
		submenu: buildViewMenu()
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

	return menu
}