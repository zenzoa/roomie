function mousePressed() {
	if (UI.isPanning ||
		UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	UI.startDragPoint.x = mx
	UI.startDragPoint.y = my

	UI.selectedDoor = null
	UI.selectedLink = null
	UI.selectedFavicon = false

	cursor('auto')

	if (UI.isStartDrawingRoom) {
		UI.startNewRoom(mx, my)
		cursor('crosshair')

	} else if (UI.isDrawingRoom) {
		UI.endNewRoom(mx, my)

	} else if (UI.isStartDrawingLink) {
		UI.startNewLink(mx, my)
		cursor('crosshair')

	} else if (UI.isDrawingLink) {
		UI.endNewLink(mx, my)

	} else if (UI.isExtrudingRoom) {
		UI.endExtrudeRoom(mx, my)

	} else if (UI.isDragging) {
		UI.endDrag(mx, my)

	} else if (Favicon.mouseOn(mx, my)) {
		UI.clearSelection()
		UI.selectedFavicon = true

	} else if (Metaroom.linkAt(metaroom, mx, my)) {
		UI.clearSelection()
		UI.selectedLink = Metaroom.linkAt(metaroom, mx, my)

	} else {

		UI.dragParts = []

		let selectingCorner = false
		const selectOnlyCorners = () => {
			selectingCorner = true
			UI.dragParts = UI.dragParts.filter(p => p.part.includes('corner'))
		}

		for (const room of UI.selectedRooms) {
			if (Geometry.pointInCircle(mx, my, room.xL, room.yTL, SELECT_DIST)) {
				UI.dragParts.push({ room, part: 'top-left-corner' })
				selectOnlyCorners()

			} else if (Geometry.pointInCircle(mx, my, room.xL, room.yBL, SELECT_DIST)) {
				UI.dragParts.push({ room, part: 'bottom-left-corner' })
				selectOnlyCorners()

			} else if (Geometry.pointInCircle(mx, my, room.xR, room.yBR, SELECT_DIST)) {
				UI.dragParts.push({ room, part: 'bottom-right-corner' })
				selectOnlyCorners()

			} else if (Geometry.pointInCircle(mx, my, room.xR, room.yTR, SELECT_DIST)) {
				UI.dragParts.push({ room, part: 'top-right-corner' })
				selectOnlyCorners()

			} else if (!selectingCorner &&
				Geometry.circleOnLine(mx, my, SELECT_DIST, room.xL, room.yTL, room.xL, room.yBL)) {
					UI.dragParts.push({ room, part: 'left-side' })

			} else if (!selectingCorner &&
				Geometry.circleOnLine(mx, my, SELECT_DIST, room.xR, room.yTR, room.xR, room.yBR)) {
					UI.dragParts.push({ room, part: 'right-side' })

			} else if (!selectingCorner &&
				Geometry.circleOnLine(mx, my, SELECT_DIST, room.xL, room.yTL, room.xR, room.yTR)) {
					UI.dragParts.push({ room, part: 'top-side' })

			} else if (!selectingCorner &&
				Geometry.circleOnLine(mx, my, SELECT_DIST, room.xL, room.yBL, room.xR, room.yBR)) {
					UI.dragParts.push({ room, part: 'bottom-side' })
			}
		}

		if (UI.dragParts.length >= 1) {
			UI.startDrag(mx, my)
			UI.selectedDoor = Metaroom.doorAt(metaroom, mx, my)

		} else {
			const clickedDoor = Metaroom.doorAt(metaroom, mx, my)
			if (clickedDoor) {
				UI.selectedDoor = clickedDoor
				UI.selectedRooms = []

			} else {
				const clickedRoom = Metaroom.roomAt(metaroom, mx, my)
				if (clickedRoom && UI.selectedRooms.includes(clickedRoom)) {
					UI.startDrag(mx, my)
				} else {
					UI.startSelection(mx, my)
				}
			}
		}
	}

	UI.isStartDrawingRoom = false
	UI.isStartDrawingLink = false
}

function mouseDragged() {
	if (UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	if (UI.isPanning) {
		UI.movePan(mouseX / UI.zoomLevel, mouseY / UI.zoomLevel)

	} else if (UI.isSelecting) {
		UI.moveSelection(mx, my)

	} else if (UI.isDrawingRoom) {
		UI.moveNewRoom(mx, my)

	} else if (UI.isDrawingLink) {
		UI.moveNewLink(mx, my)

	} else if (UI.isDragging) {
		UI.moveDrag(mx, my)

	} else if (UI.selectedFavicon) {
		Favicon.move(mx, my)
	}
}

function mouseMoved() {
	if (UI.isPanning ||
		UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	if (UI.isDrawingRoom) {
		UI.moveNewRoom(mx, my)

	} else if (UI.isDrawingLink) {
		UI.moveNewLink(mx, my)

	} else if (UI.isExtrudingRoom) {
		UI.moveExtrudeRoom(mx, my)

	} else if (UI.isDragging) {
		UI.moveDrag(mx, my)
	}
}

function mouseReleased() {
	if (UI.isPanning ||
		UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	cursor('auto')

	if (UI.isSelecting) {
		UI.endSelection(mx, my)
	}

	if (UI.isDrawingRoom) {
		UI.endNewRoom(mx, my)
	}

	if (UI.isDrawingLink) {
		UI.endNewLink(mx, my)
	}

	if (UI.isDragging) {
		UI.endDrag(mx, my)
	}

	const dx = mx - UI.startDragPoint.x
	const dy = my - UI.startDragPoint.y
	if (dx !== 0 || dy !== 0) {
		UI.selectedDoor = null
	} else if (UI.selectedDoor) {
		UI.selectedRooms = []
	}

	UI.updateSidebar()
	Room.checkCollisions()
	Metaroom.updateDoors(metaroom)
}

function mouseWheel(event) {
	if (UI.isPanning ||
		UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	if (keyIsDown(CONTROL)) {
		if (event.delta > 0) {
			zoomIn(1.02)
		} else {
			zoomOut(0.98)
		}
	}
}
