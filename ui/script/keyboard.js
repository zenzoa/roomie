function keyPressed() {
	if (document.activeElement.tagName === 'INPUT') return

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	UI.isStartDrawingRoom = false
	UI.isStartDrawingLink = false
	cursor('auto')

	if (key === ' ') {
		UI.startPan(mouseX / UI.zoomLevel, mouseY / UI.zoomLevel)
		cursor('grab')
		return false

	} else if (key === 'r') {
		newRoom()
		return false

	} else if (key === 'l') {
		newLink()
		return false

	} else if (keyCode === ESCAPE) {
		if (UI.isDrawingRoom || UI.isStartDrawingRoom) {
			UI.cancelNewRoom()
		} else if (UI.isDrawingLink || UI.isStartDrawingLink) {
			UI.cancelNewLink()
		} else if (UI.isExtrudingRoom) {
			UI.cancelExtrudeRoom()
		} else {
			UI.clearSelection()
		}
		return false

	} else if (key === 'z' && keyIsDown(CONTROL)) {
		undo()
		return false

	} else if (key === 'Z' && keyIsDown(CONTROL)) {
		redo()
		return false

	} else if (key === 'n' && keyIsDown(CONTROL)) {
		newFile()
		return false

	} else if (key === 'o' && keyIsDown(CONTROL)) {
		openFile()
		return false

	} else if (key === 's' && keyIsDown(CONTROL)) {
		saveFile()
		return false

	} else if (key === 'S' && keyIsDown(CONTROL)) {
		saveAsFile()
		return false

	} else if (key === '-') {
		zoomOut()
		return false

	} else if (key === '=') {
		zoomIn()
		return false

	} else if (key === '0') {
		zoomReset()
		return false

	} else if (key === 'e') {
		extrudeRoom()
		return false

	} else if (key === 'd') {
		duplicateSelection()
		return false

	} else if (key === '[' && keyIsDown(CONTROL)) {
		config.bg_opacity = Math.max(0, config.bg_opacity - 16)
		saveConfig()
		return false

	} else if (key === ']' && keyIsDown(CONTROL)) {
		config.bg_opacity = Math.min(255, config.bg_opacity + 16)
		saveConfig()
		return false

	} else if (key === 't' && keyIsDown(CONTROL)) {
		UI.roomColorEnabled = !UI.roomColorEnabled
		return false

	} else if (key === 'p' && keyIsDown(CONTROL)) {
		toggleMousePos()
		return false

	} else if (key === 'g' && keyIsDown(CONTROL)) {
		toggleGuide()
		return false

	} else if (keyCode === DELETE || keyCode === BACKSPACE) {
		deleteSelection()
		return false

	} else if (keyCode === CONTROL) {
		UI.snapEnabled = false
		return false
	}
}

function keyReleased() {
	if (document.activeElement.tagName === 'INPUT') return

	if (UI.isPanning) {
		UI.endPan()
		cursor('auto')
	}

	UI.snapEnabled = true

	Metaroom.updateDoors(metaroom)
}
