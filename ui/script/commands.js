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
							for (const overlay of metaroom.overlays) {
								Overlay.importSprite(overlay)
							}
						})
						.catch((why) => console.error(why))
						UI.reset()
					} else {
						Tauri.dialog.message(
							'Unable to load metaroom from COS file',
							{ title: 'File Error', type: 'error' }
						)
					}
				})
				.catch((why) => console.error(why))
			}
		})
		.catch((why) => console.error(why))
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
				.catch((why) => console.error(why))
				isModified = false
				UI.updateTitle()
			})
			.catch((why) => {
				Tauri.dialog.message(why, { title: 'File Error', type: 'error' })
			})
		}
	})
	.catch((why) => console.error(why))
}

function saveState() {
	undoStack.push(JSON.stringify(metaroom))
	isModified = true
}

function undo() {
	if (undoStack.length > 0) {
		redoStack.push(JSON.stringify(metaroom))
		metaroom = JSON.parse(undoStack.pop())
		isModified = true
		UI.clearSelection()

		Room.checkCollisions()
		UI.updateSidebar()
	}
}

function redo() {
	if (redoStack.length > 0) {
		undoStack.push(JSON.stringify(metaroom))
		metaroom = JSON.parse(redoStack.pop())
		isModified = true
		UI.clearSelection()

		Room.checkCollisions()
		UI.updateSidebar()
	}
}

function zoomIn(amt) {
	amt = isNaN(amt) ? 1.1 : amt
	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset
	UI.zoomLevel *= amt
	UI.xOffset = mouseX / UI.zoomLevel - mx
	UI.yOffset = mouseY / UI.zoomLevel - my
}

function zoomOut(amt) {
	amt = isNaN(amt) ? 0.9 : amt
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
	UI.disableOverlayMode()
	UI.isStartDrawingRoom = true
	cursor(CROSS)
}

function newLink() {
	UI.disableOverlayMode()
	UI.isStartDrawingLink = true
	cursor(CROSS)
}

function newOverlay() {
	UI.enableOverlayMode()
	UI.isStartDrawingOverlay = true
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

	} else if (UI.selectedDoors.length > 0) {
		UI.selectedDoors.forEach(d => {
			d.permeability = 0
		})

	} else if (UI.selectedOverlays.length > 0) {
		metaroom.overlays = metaroom.overlays.filter(o => !UI.selectedOverlays.includes(o))
		UI.selectedOverlays = []

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

function toggleMousePos() {
	config.mouse_pos_enabled = !config.mouse_pos_enabled
	UI.updateMousePos()
	saveConfig()
}

function toggleOverlayView() {
	if (!UI.overlayMode) {
		UI.enableOverlayMode()
	} else {
		UI.disableOverlayMode()
	}
}
