let isCtrlDown = false
let isShiftDown = false
let isSpaceDown = false

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

let isResizingSidebar = false
let xResizeStart = 0
let tempWidth = 0

const setupInput = () => {
	metaroomContainer.addEventListener('mousedown', mouseDown)

	metaroomContainer.addEventListener('wheel', mouseWheel)

	document.getElementById('main').addEventListener('mouseenter', (event) => {
		if (isMouseDown && !event.buttons) {
			mouseUp(event)
		}
	})

	document.getElementById('sidebar-handle').addEventListener('mousedown', (event) => {
		if (!isResizingSidebar) {
			isResizingSidebar = true
			xResizeStart = event.pageX
			tempWidth = Sidebar.width
		}
	})

	document.body.addEventListener('mousemove', (event) => {
		if (isResizingSidebar) {
			const dx = xResizeStart - event.pageX
			tempWidth = Math.min(600, Math.max(200, Math.floor(Sidebar.width + dx)))
			const style = document.documentElement.style
			style.setProperty(`--sidebar-width`, `${tempWidth}px`)
		} else {
			mouseMove(event)
		}
	})

	document.body.addEventListener('mouseup', (event) => {
		if (isResizingSidebar) {
			isResizingSidebar = false
			Sidebar.setWidth(tempWidth)
		} else if (event.pageX < window.innerWidth - Sidebar.width) {
			mouseUp(event)
		}
	})

	document.body.addEventListener('mouseenter', (event) => {
		isCtrlDown = event.ctrlKey || event.metaKey
		isShiftDown = event.shiftKey
		isResizingSidebar = false
		if (isMouseDown && !event.buttons) {
			mouseUp(event)
		}
	})

	document.body.addEventListener('keydown', (event) => {
		if (event.target.tagName !== 'INPUT') {
			const key = event.key.toLowerCase()
			isCtrlDown = event.ctrlKey || event.metaKey
			isShiftDown = event.shiftKey

			if (key === ' ' && !mouseAction) {
				isSpaceDown = true
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

			} else if (key === 'escape' && (mouseAction === 'addingRoom' || mouseAction === 'addingLink' || mouseAction === 'addingFavicon' || mouseAction === 'addingOverlay')) {
				event.preventDefault()
				cancelMouseAction()

			} else if (isCtrlDown && !isShiftDown && key === 'n') {
				event.preventDefault()
				tauri_invoke('new_file')

			} else if (isCtrlDown && !isShiftDown && key === 'o') {
				event.preventDefault()
				tauri_invoke('open_file')

			} else if (isCtrlDown && !isShiftDown && key === 's') {
				event.preventDefault()
				tauri_invoke('save_file')

			} else if (isCtrlDown && isShiftDown && key === 's') {
				event.preventDefault()
				tauri_invoke('save_as')

			} else if (isCtrlDown && !isShiftDown && key === 'q') {
				event.preventDefault()
				tauri_invoke('try_quit')

			} else if (isCtrlDown && !isShiftDown && key === 'z') {
				event.preventDefault()
				tauri_invoke('undo')

			} else if (isCtrlDown && isShiftDown && key === 'z') {
				event.preventDefault()
				tauri_invoke('redo')

			} else if (!isCtrlDown && isShiftDown && key === 'r') {
				event.preventDefault()
				startAddingRoom()

			} else if (!isCtrlDown && isShiftDown && key === 'l') {
				event.preventDefault()
				startAddingLink()

			} else if (!isCtrlDown && isShiftDown && key === 'o') {
				event.preventDefault()
				tauri_invoke('try_adding_favicon')

			} else if (!isCtrlDown && isShiftDown && key === 'f') {
				event.preventDefault()
				tauri_invoke('try_adding_overlay')

			} else if (isCtrlDown && !isShiftDown && key === '0') {
				event.preventDefault()
				setScale(1)

			} else if (isCtrlDown && !isShiftDown && key === '=') {
				event.preventDefault()
				setScale(scale * 1.1)

			} else if (isCtrlDown && !isShiftDown && key === '-') {
				event.preventDefault()
				setScale(scale * 0.9)

			} else if (isCtrlDown && !isShiftDown && key === '9') {
				event.preventDefault()
				scaleToFill()

			} else if (isCtrlDown && !isShiftDown && key === 'a') {
				event.preventDefault()
				selectAllRooms()

			} else if (isCtrlDown && !isShiftDown && key === 'd') {
				event.preventDefault()
				clearSelection()

			} else if (isCtrlDown && isShiftDown && key === 'b') {
				event.preventDefault()
				tauri_invoke('toggle_bg_visibility')

			} else if (isCtrlDown && isShiftDown && key === 'r') {
				event.preventDefault()
				tauri_invoke('toggle_room_visibility')

			} else if (isCtrlDown && isShiftDown && key === 'o') {
				event.preventDefault()
				tauri_invoke('toggle_overlay_visibility')
			}
		}
	})

	document.body.addEventListener('keyup', (event) => {
		if (event.key === ' ') isSpaceDown = false

		if (event.target.tagName !== 'INPUT') {
			if (event.key === ' ' && !mouseAction) {
				event.preventDefault()
				canvasSelection.style.cursor = 'auto'
			}
		}
	})
}

const setMousePos = (x, y) => {
	xMouse = Math.floor(x)
	yMouse = Math.floor(y)

	const top = metaroomContainer.getBoundingClientRect().top
	xMouseRel = Math.min(Math.max(0, adjustPos(x) - Math.floor(xOffset / scale)), metaroom ? metaroom.width : 0)
	yMouseRel = Math.min(Math.max(0, adjustPos(y - top) - Math.floor(yOffset / scale)), metaroom ? metaroom.height : 0)
}

const setDragPos = (x, y) => {
	xDragStart = Math.floor(x)
	yDragStart = Math.floor(y)

	const top = metaroomContainer.getBoundingClientRect().top
	xDragStartRel = Math.min(Math.max(0, adjustPos(x) - Math.floor(xOffset / scale)), metaroom ? metaroom.width : 0)
	yDragStartRel = Math.min(Math.max(0, adjustPos(y - top) - Math.floor(yOffset / scale)), metaroom ? metaroom.height : 0)
}

const adjustPos = (n) => {
	return Math.floor(n / scale * DPR)
}

const unadjustPos = (n) => {
	return Math.floor(n * scale / DPR)
}

const mouseDown = (event) => {
	event.preventDefault()

	isCtrlDown = event.ctrlKey || event.metaKey
	isShiftDown = event.shiftKey

	if (!mouseAction && event.buttons > 1) {
		isMouseDown = true
		startPanning(event.pageX, event.pageY)

	} else if (mouseAction === 'moving') {
		finishMovingSelection()

	} else if (mouseAction === 'addingRoom') {
		const [xSnap, ySnap, _] = getSnapPoint(xMouseRel, yMouseRel)
		if (newRoomX == null || newRoomY == null) {
			newRoomX = Math.floor(xSnap)
			newRoomY = Math.floor(ySnap)
		} else {
			if (!finishAddingRoom(Math.floor(xSnap), Math.floor(ySnap))) {
				cancelMouseAction()
			}
		}

	} else if (mouseAction === 'addingLink') {
		const x = xMouseRel
		const y = yMouseRel
		const r = SELECT_RADIUS / scale * DPR
		tauri_invoke('get_object_at', { x, y, r, selectionType: 'Rooms' }).then(result => {
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
		setDragPos(event.pageX, event.pageY)
		startSelectingObject(event)
	}
}

const mouseMove = (event) => {
	xLast = xMouse
	yLast = yMouse

	setMousePos(event.pageX, event.pageY)

	xPositionEl.innerText = xMouseRel
	yPositionEl.innerText = yMouseRel

	isCtrlDown = event.ctrlKey || event.metaKey
	isShiftDown = event.shiftKey

	if (isMouseDown || mouseAction === 'addingRoom' ||  mouseAction === 'addingLink' || mouseAction === 'addingFavicon' || mouseAction === 'addingOverlay') {
		event.preventDefault()

		let dx = xMouse - xDragStart
		let dy = yMouse - yDragStart
		let dist = Math.sqrt(dx*dx + dy*dy)

		if (!mouseAction && dist > 10) {
			if (isSpaceDown) {
				startPanning(event.pageX, event.pageY)
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

		} else if (mouseAction === 'addingRoom') {
			drawSelection()

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
	isCtrlDown = event.ctrlKey || event.metaKey
	isShiftDown = event.shiftKey

	if (!mouseAction) {
		finishSelectingObject(event)
	} else if (mouseAction === 'moving') {
		canvasRooms.style.opacity = '1.0'
		finishMovingSelection()
	} else if (mouseAction === 'selecting') {
		finishSelectingArea()
	} else if (mouseAction === 'addingRoom') {
		const [xSnap, ySnap, _] = getSnapPoint(xMouseRel, yMouseRel)
		finishAddingRoom(Math.floor(xSnap), Math.floor(ySnap))
	}

	if (mouseAction !== 'addingRoom' && mouseAction !== 'addingLink') {
		cancelMouseAction()
	}
}

const mouseWheel = (event) => {
	isCtrlDown = event.ctrlKey || event.metaKey
	isShiftDown = event.shiftKey

	if (metaroom) {
		event.preventDefault()
		if (isCtrlDown) {
			scrollAmount -= event.deltaY
			scrollAmount = Math.min(Math.max(scrollAmount, -1000), 1000)
			const newScale = (scrollAmount + 1000) / 2000 * (MAX_SCALE - MIN_SCALE)
			setScale(newScale)
		} else {
			const scrollX = event.deltaX / scale * DPR * 2
			const scrollY = event.deltaY / scale * DPR * 2
			setOffset(xOffset - scrollX, yOffset - scrollY)
			drawAll()
		}
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
