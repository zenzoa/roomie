function newFile() {
	if (isModified) {
		Tauri.dialog.ask(
			'You have unmodified changes to the current metaroom. Are you sure you want to discard the changes?',
			{ title: 'Discard changes?', type: 'warning' }
		)
		.then((confirmed) => {
			if (confirmed) {
				metaroom = new Metaroom({})
				UI.reset()
			}
		})
	} else {
		metaroom = new Metaroom({})
		UI.reset()
	}
}

function openFile() {
	const openFileDialog = () => {
		Tauri.dialog.open({ filters: [{ name: 'COS File', extensions: ['cos'] }] })
		.then((path) => {
			if (path) {
				Tauri.fs.readTextFile(path)
				.then((text) => {
					const tokens = Caos.parse(text)
					const newMetaroom = Caos.decode(tokens) || Caos.decode(tokens, true)
					if (newMetaroom) {
						metaroom = newMetaroom
						metaroom.path = path
						Tauri.path.dirname(path)
						.then((dir) => {
							metaroom.dir = dir
							Metaroom.importBgImage(metaroom)
							Favicon.importSprite()
						})
						UI.reset()
					} else {
						Tauri.dialog.message(
							'Unable to load metaroom from COS file',
							{ title: 'File Error', type: 'error' }
						)
					}
				})
			}
		})
	}
	if (isModified) {
		Tauri.dialog.ask(
			'You have unmodified changes to the current metaroom. Are you sure you want to discard the changes?',
			{ title: 'Discard changes?', type: 'warning' }
		)
		.then((confirmed) => {
			if (confirmed) {
				openFileDialog()
			}
		})
	} else {
		openFileDialog()
	}
}

function saveFile() {
	if (metaroom.path) {
		Tauri.fs.exists(metaroom.path)
		.then((fileExists) => {
			if (fileExists) {
				Tauri.fs.writeTextFile({
					path: metaroom.path,
					contents: Caos.encode(metaroom)
				})
				.then(() => {
					isModified = false
					UI.updateTitle()
				})
				.catch((why) => {
					Tauri.dialog.message(why, { title: 'File Error', type: 'error' })
				})
			} else {
				saveAsFile()
			}
		})
		.catch((why) => {
			console.error(why)
			saveAsFile()
		})
	} else {
		saveAsFile()
	}
}

function saveAsFile() {
	Tauri.dialog.save({
		filters: [{ name: 'COS File', extensions: ['cos'] }],
		defaultPath: metaroom.path || null
	})
	.then((path) => {
		if (path) {
			Tauri.fs.writeTextFile({
				path,
				contents: Caos.encode(metaroom)
			})
			.then(() => {
				metaroom.path = path
				Tauri.path.dirname(path)
				.then((dir) => {
					metaroom.dir = dir
				})
				isModified = false
				UI.updateTitle()
			})
			.catch((why) => {
				Tauri.dialog.message(why, { title: 'File Error', type: 'error' })
			})
		}
	})
}

function saveState() {
	undoStack.push(JSON.stringify(metaroom))
	isModified = true
}

function undo() {
	if (undoStack.length >= 1) {
		redoStack.push(JSON.stringify(metaroom))
		metaroom = JSON.parse(undoStack.pop())
		isModified = true
		UI.clearSelection()

		Room.checkCollisions()
		UI.updateSidebar()
	}
}

function redo() {
	if (redoStack.length >= 1) {
		undoStack.push(JSON.stringify(metaroom))
		metaroom = JSON.parse(redoStack.pop())
		isModified = true
		UI.clearSelection()

		Room.checkCollisions()
		UI.updateSidebar()
	}
}

function zoomIn(amt = 1.1) {
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.zoomLevel *= amt
	UI.xOffset = mouseX / UI.zoomLevel - mx
	UI.yOffset = mouseY / UI.zoomLevel - my
}

function zoomOut(amt = 0.9) {
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.zoomLevel *= amt
	UI.xOffset = mouseX / UI.zoomLevel - mx
	UI.yOffset = mouseY / UI.zoomLevel - my
}

function zoomReset() {
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.zoomLevel = 1.0
	UI.xOffset = mouseX / UI.zoomLevel - mx
	UI.yOffset = mouseY / UI.zoomLevel - my
}

function newRoom() {
	UI.isStartDrawingRoom = true
	cursor(CROSS)
}

function newLink() {
	UI.isStartDrawingLink = true
	cursor(CROSS)
}

function extrudeRoom() {
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.startExtrudeRoom(mx, my)
}

function duplicateSelection() {
	let newRooms = []
	for (const room of UI.selectedRooms) {
		const newRoom = Room.clone(room)
		metaroom.rooms.push(newRoom)
		newRooms.push(newRoom)
	}
	UI.selectedRooms = newRooms
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.dragParts = []
	UI.startDrag(mx, my)
	UI.updateSidebar()
}

function deleteSelection() {
	saveState()

	if (UI.selectedFavicon) {
		metaroom.hasFavicon = false
		UI.selectedFavicon = false

	} else if (UI.selectedLink) {
		metaroom.links = metaroom.links.filter(l => l !== UI.selectedLink)
		UI.selectedLink = null

	} else if (UI.selectedDoor) {
		UI.selectedDoor.permeability = 0

	} else {
		for (const selectedRoom of UI.selectedRooms) {
			metaroom.rooms.forEach((room, roomId) => {
				if (room === selectedRoom) {
					Metaroom.removeRoom(metaroom, roomId)
				}
			})
		}
		UI.clearSelection()
		Room.checkCollisions()
	}

	UI.updateSidebar()
}

function toggleGuide() {
	config.guide_enabled = !config.guide_enabled
	UI.updateGuide()
	saveConfig()
}
