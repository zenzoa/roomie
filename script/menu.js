exports.setup = (sketch) => {

	const isMac = process.platform === 'darwin'

	let menu = new nw.Menu({ type: 'menubar' })
	menu.createMacBuiltin && menu.createMacBuiltin('Roomie')

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
	sketch.menuSave = new nw.MenuItem({
		label: 'Save',
		modifiers: isMac ? 'cmd' : 'ctrl',
		key: 's',
		enabled: false,
		click: sketch.saveMetaroom.bind(sketch)
	})
	fileMenu.append(sketch.menuSave)
	sketch.menuSaveAs = new nw.MenuItem({
		label: 'Save As...',
		modifiers: isMac ? 'cmd+shift' : 'ctrl+shift',
		key: 's',
		enabled: false,
		click: sketch.saveAsMetaroom.bind(sketch)
	})
	fileMenu.append(sketch.menuSaveAs)

	menu.insert(new nw.MenuItem({
		label: 'File',
		submenu: fileMenu
	}), 1)

	let roomMenu = new nw.Menu()
	sketch.menuCreateRoom = new nw.MenuItem({
		label: 'Create',
		key: 'a',
		enabled: false,
		click: sketch.createRoom.bind(sketch)
	})
	roomMenu.append(sketch.menuCreateRoom)
	roomMenu.append(new nw.MenuItem({ type: 'separator' }))
	sketch.menuExtrude = new nw.MenuItem({
		label: 'Extrude',
		key: 'e',
		enabled: false,
		click: sketch.extrudeRoom.bind(sketch)
	})
	roomMenu.append(new nw.MenuItem({ type: 'separator' }))
	roomMenu.append(sketch.menuExtrude)
	sketch.menuDelete = new nw.MenuItem({
		label: 'Delete',
		key: 'Backspace',
		enabled: false,
		click: sketch.deleteRoom.bind(sketch)
	})
	roomMenu.append(sketch.menuDelete)

	menu.insert(new nw.MenuItem({
		label: 'Room',
		submenu: roomMenu
	}), 3)

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

	menu.insert(new nw.MenuItem({
		label: 'View',
		submenu: viewMenu
	}), 4)

	nw.Window.get().menu = menu
}