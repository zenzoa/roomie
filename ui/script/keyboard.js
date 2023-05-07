let META_KEY_PRESSED = false

function keyPressed(event) {
	if (event.key === 'Meta') {
		META_KEY_PRESSED = true
	}

	if (document.activeElement.tagName === 'INPUT') return

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	UI.isStartDrawingRoom = false
	UI.isStartDrawingLink = false
	UI.isDrawingOverlay = false
	cursor('auto')

	const ctrlCmd = keyIsDown(CONTROL) || META_KEY_PRESSED

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

	} else if (key === 'z' && ctrlCmd) {
		undo()
		return false

	} else if (key === 'Z' && ctrlCmd) {
		redo()
		return false

	} else if (key === 'n' && ctrlCmd) {
		newFile()
		return false

	} else if (key === 'o' && ctrlCmd) {
		openFile()
		return false

	} else if (key === 's' && ctrlCmd) {
		saveFile()
		return false

	} else if (key === 'S' && ctrlCmd) {
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

	} else if (key === '[' && ctrlCmd) {
		config.bg_opacity = Math.max(0, config.bg_opacity - 16)
		saveConfig()
		return false

	} else if (key === ']' && ctrlCmd) {
		config.bg_opacity = Math.min(255, config.bg_opacity + 16)
		saveConfig()
		return false

	} else if (key === 't' && ctrlCmd) {
		UI.roomColorEnabled = !UI.roomColorEnabled
		return false

	} else if (key === 'p' && ctrlCmd) {
		toggleMousePos()
		return false

	} else if (key === 'g' && ctrlCmd) {
		toggleGuide()
		return false

	} else if (key === 'b' && ctrlCmd) {
		toggleOverlayView()
		return false

	} else if (key === 'b') {
		newOverlay()
		return false

	} else if (keyCode === DELETE || keyCode === BACKSPACE) {
		deleteSelection()
		return false

	} else if (keyCode === CONTROL || META_KEY_PRESSED) {
		UI.snapEnabled = false
		return false

	} else if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW ||
		keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
			nudgeRepeatCounter = 0
	}
}

function keyReleased(event) {
	META_KEY_PRESSED = false

	if (document.activeElement.tagName === 'INPUT') return

	if (UI.isPanning) {
		UI.endPan()
		cursor('auto')
	}

	UI.snapEnabled = true

	Metaroom.updateDoors(metaroom)
}
