let keysDown = []

let isMouseDown = false
let mouseAction = null

let xMouse = 0
let yMouse = 0
let xDragStart = 0
let yDragStart = 0

let xMouseRel = 0
let yMouseRel = 0
let xDragStartRel = 0
let yDragStartRel = 0

let xOffsetStart = 0
let yOffsetStart = 0

let scrollAmount = 0

const setupInput = () => {
	metaroomContainer.addEventListener('mousedown', mouseDown)

	metaroomContainer.addEventListener('mousemove', mouseMove)

	metaroomContainer.addEventListener('mouseup', mouseUp)

	metaroomContainer.addEventListener('mouseenter', (event) => {
		if (isMouseDown && !event.buttons) {
			mouseUp(event)
		}
	})

	metaroomContainer.addEventListener('mouseleave', mouseMove)

	metaroomContainer.addEventListener('wheel', mouseWheel)

	document.body.addEventListener('keydown', (event) => {
		if (event.target.tagName !== 'INPUT') {
			const key = event.key.toLowerCase()
			if (event.shiftKey && !keysDown.includes('shift')) {
				keysDown.push('shift')
			} else if (!keysDown.includes(key)) {
				keysDown.push(key)
			}

			const ctrlCmdKey = event.ctrlKey || event.metaKey
			const shiftKey = event.shiftKey

			if (key === ' ' && !mouseAction) {
				event.preventDefault()
				canvasSelection.style.cursor = 'grab'

			} else if (key.startsWith('arrow')) {
				if (selectionType !== 'Any') {
					event.preventDefault()
					nudgeSelection(key)
				} else {
					event.preventDefault()
					nudgeOffset(key)
				}

			} else if (key === 'delete' || key === 'backspace') {
				event.preventDefault()
				removeSelectedObjects()

			} else if (key === 'escape' && (mouseAction === 'addingLink' || mouseAction === 'addingFavicon' || mouseAction === 'addingOverlay')) {
				event.preventDefault()
				cancelMouseAction()

			} else if (ctrlCmdKey && !shiftKey && key === 'n') {
				event.preventDefault()
				tauri_invoke('new_file')

			} else if (ctrlCmdKey && !shiftKey && key === 'o') {
				event.preventDefault()
				tauri_invoke('open_file')

			} else if (ctrlCmdKey && !shiftKey && key === 's') {
				event.preventDefault()
				tauri_invoke('save_file')

			} else if (ctrlCmdKey && shiftKey && key === 's') {
				event.preventDefault()
				tauri_invoke('save_as')

			} else if (ctrlCmdKey && !shiftKey && key === 'q') {
				event.preventDefault()
				tauri_invoke('try_quit')

			} else if (ctrlCmdKey && !shiftKey && key === 'z') {
				event.preventDefault()
				tauri_invoke('undo')

			} else if (ctrlCmdKey && shiftKey && key === 'z') {
				event.preventDefault()
				tauri_invoke('redo')

			} else if (!ctrlCmdKey && shiftKey && key === 'r') {
				event.preventDefault()
				tauri_invoke('add_room')

			} else if (!ctrlCmdKey && shiftKey && key === 'l') {
				event.preventDefault()
				startAddingLink()

			} else if (!ctrlCmdKey && shiftKey && key === 'o') {
				event.preventDefault()
				tauri_invoke('try_adding_favicon')

			} else if (!ctrlCmdKey && shiftKey && key === 'f') {
				event.preventDefault()
				tauri_invoke('try_adding_overlay')

			} else if (ctrlCmdKey && !shiftKey && key === '0') {
				event.preventDefault()
				setScale(1)

			} else if (ctrlCmdKey && !shiftKey && key === '=') {
				event.preventDefault()
				setScale(scale * 1.1)

			} else if (ctrlCmdKey && !shiftKey && key === '-') {
				event.preventDefault()
				setScale(scale * 0.9)

			} else if (ctrlCmdKey && !shiftKey && key === '9') {
				event.preventDefault()
				scaleToFill()

			} else if (ctrlCmdKey && !shiftKey && key === 'a') {
				event.preventDefault()
				selectAllRooms()

			} else if (ctrlCmdKey && !shiftKey && key === 'd') {
				event.preventDefault()
				clearSelection()

			} else if (ctrlCmdKey && shiftKey && key === 'b') {
				event.preventDefault()
				tauri_invoke('toggle_bg_visibility')

			} else if (ctrlCmdKey && shiftKey && key === 'r') {
				event.preventDefault()
				tauri_invoke('toggle_room_visibility')

			} else if (ctrlCmdKey && shiftKey && key === 'o') {
				event.preventDefault()
				tauri_invoke('toggle_overlay_visibility')
			}
		}
	})

	document.body.addEventListener('keyup', (event) => {
		if (event.target.tagName !== 'INPUT') {
			const key = event.key.toLowerCase()
			keysDown = keysDown.filter(k => k != key)
			if (!event.shiftKey && keysDown.includes('shift')) {
				keysDown = keysDown.filter(k => k != 'shift')
			}

			if (key === ' ' && !mouseAction) {
				event.preventDefault()
				canvasSelection.style.cursor = 'auto'
			}
		}
	})
}

const setMousePos = (x, y) => {
	xMouse = Math.floor(x)
	yMouse = Math.floor(y)

	xMouseRel = Math.min(Math.max(0, adjustPos(x) - Math.floor(xOffset / scale)), metaroom ? metaroom.width : 0)
	yMouseRel = Math.min(Math.max(0, adjustPos(y) - Math.floor(yOffset / scale)), metaroom ? metaroom.height : 0)
}

const setDragPos = (x, y) => {
	xDragStart = Math.floor(x)
	yDragStart = Math.floor(y)

	xDragStartRel = adjustPos(x) - Math.floor(xOffset / scale)
	yDragStartRel = adjustPos(y) - Math.floor(yOffset / scale)
}

const adjustPos = (n) => {
	return Math.floor(n / scale * DPR)
}

const unadjustPos = (n) => {
	return Math.floor(n * scale / DPR)
}

const mouseDown = (event) => {
	event.preventDefault()

	if (!mouseAction && event.buttons > 1) {
		isMouseDown = true
		startPanning(event.offsetX, event.offsetY)

	} else if (mouseAction === 'moving') {
		finishMovingSelection()

	} else if (mouseAction === 'addingLink') {
		const x = xMouseRel
		const y = yMouseRel
		const r = SELECT_RADIUS / scale * DPR
		tauri_invoke('get_object_at', { x, y, r, selectionType: 'Rooms' }).then((result) => {
			if (result && result.Rooms && result.Rooms.length) {
				if (newLinkRoom1 == null) {
					newLinkRoom1 = result.Rooms[0]
				} else if (newLinkRoom2 == null) {
					newLinkRoom2 = result.Rooms[0]
					addedLink = true
					cancelMouseAction()
					tauri_invoke('add_link', { room1Id: newLinkRoom1, room2Id: newLinkRoom2 })
				}
			} else {
				cancelMouseAction()
			}
			drawSelection()
		})

	} else if (mouseAction === 'addingFavicon') {
		const x = Math.max(0, xMouseRel)
		const y = Math.max(0, yMouseRel)
		addedFavicon = true
		cancelMouseAction()
		tauri_invoke('add_favicon', { x, y })

	} else if (mouseAction === 'addingOverlay') {
		const x = Math.max(0, xMouseRel)
		const y = Math.max(0, yMouseRel)
		addedOverlay = true
		cancelMouseAction()
		tauri_invoke('add_overlay', { x, y })

	} else {
		isMouseDown = true
		setDragPos(event.offsetX, event.offsetY)
		startSelectingObject(event)
	}
}

const mouseMove = (event) => {
	xLast = xMouse
	yLast = yMouse

	setMousePos(event.offsetX, event.offsetY)

	xPositionEl.innerText = xMouseRel
	yPositionEl.innerText = yMouseRel

	if (isMouseDown || mouseAction === 'moving' || mouseAction === 'addingLink' || mouseAction === 'addingFavicon' || mouseAction === 'addingOverlay') {
		event.preventDefault()

		let dx = xMouse - xDragStart
		let dy = yMouse - yDragStart
		let dist = Math.sqrt(dx*dx + dy*dy)

		if (!mouseAction && dist > 10) {
			if (keysDown.includes(' ')) {
				startPanning(event.offsetX, event.offsetY)
			} else if (selectionType !== 'Any') {
				tryMovingSelection()
			} else {
				mouseAction = 'selecting'
				canvasSelection.style.cursor = 'crosshair'
			}

		} else if (mouseAction === 'panning') {
			setOffset(xOffsetStart + dx, yOffsetStart + dy)
			drawAll()

		} else if (mouseAction === 'moving') {
			moveSelection(adjustPos(dx), adjustPos(dy))
			drawSelection()

		} else if (mouseAction === 'selecting') {
			startSelectingArea(event)
			drawAll()

		} else if (mouseAction === 'addingLink') {
			drawSelection()

		} else if (mouseAction === 'addingFavicon') {
			tempFavicon.x = xMouseRel
			tempFavicon.y = yMouseRel
			drawSelection()

		} else if (mouseAction === 'addingOverlay' && tempOverlays.length) {
			tempOverlays[0].x = xMouseRel
			tempOverlays[0].y = yMouseRel
			drawSelection()
		}
	}
}

const mouseUp = (event) => {
	if (!mouseAction) {
		finishSelectingObject(event)
	} else if (mouseAction === 'moving') {
		canvasRooms.style.opacity = '1.0'
		finishMovingSelection()
	} else if (mouseAction === 'selecting') {
		finishSelectingArea()
	}

	if (mouseAction !== 'addingLink') {
		cancelMouseAction()
	}
}

const mouseWheel = (event) => {
	if (metaroom) {
		event.preventDefault()
		scrollAmount -= event.deltaY
		scrollAmount = Math.min(Math.max(scrollAmount, -1000), 1000)
		const newScale = (scrollAmount + 1000) / 2000 * (MAX_SCALE - MIN_SCALE)
		setScale(newScale)
	}
}

const cancelMouseAction = () => {
	isMouseDown = false
	mouseAction = null
	canvasSelection.style.cursor = 'auto'
	canvasRooms.style.opacity = '1.0'
	drawSelection()
}

const startPanning = (x, y) => {
	mouseAction = 'panning'
	canvasSelection.style.cursor = 'grabbing'
	xOffsetStart = xOffset
	yOffsetStart = yOffset
	setDragPos(x, y)
}
