function mousePressed() {
	if (UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	} else if (UI.isPanning) {
		UI.startPan(mouseX / UI.zoomLevel, mouseY / UI.zoomLevel)
		return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	UI.startDragPoint.x = mx
	UI.startDragPoint.y = my

	UI.selectedLink = null
	UI.selectedFavicon = false

	cursor('auto')

	if (UI.isStartDrawingRoom) {
		UI.startNewRoom(mx, my)

	} else if (UI.isDrawingRoom) {
		UI.endNewRoom(mx, my)

	} else if (UI.isStartDrawingLink) {
		UI.startNewLink(mx, my)

	} else if (UI.isDrawingLink) {
		UI.endNewLink(mx, my)

	} else if (UI.isDrawingOverlay) {
		UI.endNewOverlay(mx, my)

	} else if (UI.isExtrudingRoom) {
		UI.endExtrudeRoom(mx, my)

	} else if (UI.isDragging) {
		UI.endDrag(mx, my)

	} else if (UI.overlayMode) {
		const clickedOverlay = Metaroom.overlayAt(metaroom, mx, my)
		if (clickedOverlay) {
			if (UI.selectedOverlays.includes(clickedOverlay)) {
				UI.startDrag(mx, my)
			} else if (!UI.selectedOverlays.includes(clickedOverlay)) {
				if (keyIsDown(SHIFT)) {
					UI.selectedOverlays.push(clickedOverlay)
				} else {
					UI.clearSelection()
					UI.selectedOverlays = [clickedOverlay]
					UI.startDrag(mx, my)
				}
			}
		} else {
			UI.startSelection(mx, my)
		}

	} else if (Favicon.mouseOn(mx, my) && !keyIsDown(CONTROL) && !META_KEY_PRESSED) {
		UI.clearSelection()
		UI.selectedFavicon = true

	} else if (Metaroom.linkAt(metaroom, mx, my) && !keyIsDown(CONTROL) && !META_KEY_PRESSED) {
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

		if (UI.dragParts.length > 0) {
			UI.startDrag(mx, my)

		} else {
			const clickedDoor = Metaroom.doorAt(metaroom, mx, my)
			const alreadySelectingRooms = keyIsDown(SHIFT) && UI.selectedRooms.length > 0

			if (clickedDoor && !keyIsDown(CONTROL) && !META_KEY_PRESSED && !alreadySelectingRooms) {
				UI.selectDoor(clickedDoor)

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
	if (UI.isResizingSidebar) {
		cursor('ew-resize')
		return false
	} else if (mouseX > window.innerWidth - UI.sidebarWidth || mouseY < UI.toolbarHeight) {
		return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

	if (config.mouse_pos_enabled && mouseXEl && mouseYEl) {
		mouseXEl.innerText = Math.floor(mx) + metaroom.x
		mouseYEl.innerText = Math.floor(my) + metaroom.y
	}

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

	if (config.mouse_pos_enabled && mouseXEl && mouseYEl) {
		mouseXEl.innerText = Math.floor(mx) + metaroom.x
		mouseYEl.innerText = Math.floor(my) + metaroom.y
	}

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
	if (!UI.isPanning && !UI.isDrawingOverlay) {
		cursor('auto')
	}

	if (UI.isPanning ||
		UI.isResizingSidebar ||
		mouseX > window.innerWidth - UI.sidebarWidth ||
		mouseY < UI.toolbarHeight) {
			return
	}

	const mx = mouseX / UI.zoomLevel - UI.xOffset
	const my = mouseY / UI.zoomLevel - UI.yOffset

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
		UI.selectedDoors = []
	} else if (UI.selectedDoors.length > 0) {
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

	if (keyIsDown(CONTROL) || META_KEY_PRESSED) {
		if (event.delta > 0) {
			zoomIn(1.02)
		} else {
			zoomOut(0.98)
		}
	} else {
		UI.xOffset -= event.deltaX
		UI.yOffset -= event.deltaY
	}

	return false
}
