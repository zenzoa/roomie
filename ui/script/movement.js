let tempRooms = []
let tempSides = []
let tempCorners = []
let tempOverlays = []
let tempLink = null
let tempFavicon = null

let linkEnd = null
let xOriginalLinkEnd = 0
let yOriginalLinkEnd = 0

const tryMovingSelection = () => {
	const x = xDragStartRel
	const y = yDragStartRel
	const r = SELECT_RADIUS / scale * DPR

	linkEnd = null

	tauri_invoke('get_objects_at', { x, y, r, selectionType: 'AnyMoveable' }).then((result) => {
		let isMoving = false

		if (result && result.Overlays) {
			isMoving = true
			selectionType = 'Overlays'
			const clickExistingSelection = result.Overlays.find(o => selectedOverlays.includes(o)) != null
			if (!clickExistingSelection && !selectionStyle) {
				newSelection = result.Overlays
				finishSelectingObject()
			}

		} else if (result && result.Favicon) {
			isMoving = true
			selectionType = 'Favicon'
			if (!isFaviconSelected) {
				finishSelectingObject()
			}

		} else if (result && result.Links) {
			isMoving = true
			selectionType = 'Links'
			const clickExistingSelection = result.Links.find(l => selectedLinks.includes(l)) != null
			if (!clickExistingSelection && !selectionStyle) {
				newSelection = result.Links
				finishSelectingObject()
			}
			if (selectedLinks.length === 1) {
				const linkId = selectedLinks[0]
				const link = metaroom.links[linkId]
				if (link != null) {
					dx1 = x - link.line.a.x
					dy1 = y - link.line.a.y
					d1 = dx1*dx1 + dy1*dy1
					dx2 = x - link.line.b.x
					dy2 = y - link.line.b.y
					d2 = dx2*dx2 + dy2*dy2
					if (d1 < d2) {
						linkEnd = 'a'
						xOriginalLinkEnd = link.line.a.x
						yOriginalLinkEnd = link.line.a.y
					} else {
						linkEnd = 'b'
						xOriginalLinkEnd = link.line.b.x
						yOriginalLinkEnd = link.line.b.y
					}
				}
			}

		} else if (result && result.Corners) {
			isMoving = true
			selectionType = 'Corners'
			const clickExistingSelection = result.Corners.find(c => selectedCorners.includes(c)) != null
			if (!clickExistingSelection && !selectionStyle) {
				newSelection = result.Corners
				finishSelectingObject()
			}

		} else if (result && result.Sides) {
			isMoving = true
			selectionType = 'Sides'
			const clickExistingSelection = result.Sides.find(s => selectedSides.includes(s)) != null
			if (!clickExistingSelection && !selectionStyle) {
				newSelection = result.Sides
				finishSelectingObject()
			}

		} else if (result && result.Rooms) {
			isMoving = true
			selectionType = 'Rooms'
			const clickExistingSelection = result.Rooms.find(r => selectedRooms.includes(r)) != null
			if (!clickExistingSelection && !selectionStyle) {
				newSelection = result.Rooms
				finishSelectingObject()
			}

		} else {
			mouseAction = 'selecting'
			canvasSelection.style.cursor = 'crosshair'
		}

		if (isMoving) {
			setupSelectionForMovement()
			startMoving()
		}
	})
}

const startMoving = () => {
	mouseAction = 'moving'
	canvasRooms.style.opacity = '0.5'
	canvasSelection.style.cursor = 'move'
	drawAll()
}

const setupSelectionForMovement = () => {
	if (!metaroom) return

	if (selectionType === 'Rooms') {
		tempRooms = metaroom.rooms.filter(r => selectedRooms.includes(r.id)).map(r => ({...r}))

	} else if (selectionType === 'Sides') {
		tempSides = metaroom.sides.map((s, i) => ({id: i, ...s})).filter(s => selectedSides.includes(s.id))
		const roomIDs = tempSides.map(s => s.room_id)
		tempRooms = metaroom.rooms.filter(r => roomIDs.includes(r.id)).map(r => ({...r}))

	} else if (selectionType === 'Corners') {
		tempCorners = metaroom.corners.map((c, i) => ({id: i, ...c})).filter(c => selectedCorners.includes(c.id))
		const roomIDs = tempCorners.map(c => c.room_id)
		tempRooms = metaroom.rooms.filter(r => roomIDs.includes(r.id)).map(r => ({...r}))

	} else if (selectionType === 'Links') {
		tempLink = metaroom.links[selectedLinks[0]]
		tempLink.id = selectedLinks[0]

	} else if (selectionType === 'Overlays') {
		tempOverlays = metaroom.overlays.filter(o => selectedOverlays.includes(o.id)).map(o => ({...o}))

	} else if (selectionType === 'Favicon') {
		tempFavicon = { x: metaroom.favicon.x, y: metaroom.favicon.y, ...metaroom.favicon }
	}
}

const moveSelection = (dx, dy, ignoreShift) => {
	if (!ignoreShift && isShiftDown) {
		if (Math.abs(dx) >= Math.abs(dy)) {
			dy = 0
		} else {
			dx = 0
		}
	}

	if (selectionType === 'Rooms') {
		const idsToIgnore = tempRooms.map(room => room.id)
		for (let room of tempRooms) {
			const originalRoom = metaroom.rooms[room.id]
			if (originalRoom) {
				room.x_left = originalRoom.x_left + dx
				room.x_right = originalRoom.x_right + dx
				room.y_top_left = originalRoom.y_top_left + dy
				room.y_top_right = originalRoom.y_top_right + dy
				room.y_bot_left = originalRoom.y_bot_left + dy
				room.y_bot_right = originalRoom.y_bot_right + dy
				checkRoomConstraints(room, idsToIgnore)
			}
		}

	} else if (selectionType === 'Sides') {
		const idsToIgnore = tempSides.map(side => side.room_id)
		for (let side of tempSides) {
			const originalSide = metaroom.sides[side.id]
			if (originalSide) {
				const room = tempRooms.find(r => r.id === side.room_id)
				if (room) {
					const originalRoom = metaroom.rooms[room.id]
					if (side.position === 'Top') {
						room.y_top_left = originalRoom.y_top_left + dy
						room.y_top_right = originalRoom.y_top_right + dy
					} else if (side.position === 'Bottom') {
						room.y_bot_left = originalRoom.y_bot_left + dy
						room.y_bot_right = originalRoom.y_bot_right + dy
					} else if (side.position === 'Left') {
						room.x_left = originalRoom.x_left + dx
						room.y_top_left = originalRoom.y_top_left + dy
						room.y_bot_left = originalRoom.y_bot_left + dy
					} else if (side.position === 'Right') {
						room.x_right = originalRoom.x_right + dx
						room.y_top_right = originalRoom.y_top_right + dy
						room.y_bot_right = originalRoom.y_bot_right + dy
					}
					checkSideConstraints(side, room, idsToIgnore)
					updateSideXY(side, room)
				}
			}
		}

	} else if (selectionType === 'Corners') {
		const idsToIgnore = tempCorners.map(corner => corner.room_id)
		for (let corner of tempCorners) {
			const originalCorner = metaroom.corners[corner.id]
			if (originalCorner) {
				const room = tempRooms.find(r => r.id === corner.room_id)
				if (room) {
					const originalRoom = metaroom.rooms[room.id]
					if (corner.position === 'TopLeft') {
						room.x_left = originalRoom.x_left + dx
						room.y_top_left = originalRoom.y_top_left + dy
					} else if (corner.position === 'TopRight') {
						room.x_right = originalRoom.x_right + dx
						room.y_top_right = originalRoom.y_top_right + dy
					} else if (corner.position === 'BottomLeft') {
						room.x_left = originalRoom.x_left + dx
						room.y_bot_left = originalRoom.y_bot_left + dy
					} else if (corner.position === 'BottomRight') {
						room.x_right = originalRoom.x_right + dx
						room.y_bot_right = originalRoom.y_bot_right + dy
					}
					checkCornerConstraints(corner, room, idsToIgnore)
					updateCornerXY(corner, room)
				}
			}
		}

	} else if (selectionType === 'Links') {
		if (linkEnd) {
			tempLink.line[linkEnd].x = limitX(xOriginalLinkEnd + dx, 0)
			tempLink.line[linkEnd].y = limitY(yOriginalLinkEnd + dy, 0)
		}

	} else if (selectionType === 'Overlays') {
		for (let overlay of tempOverlays) {
			const originalOverlay = metaroom.overlays[overlay.id]
			if (originalOverlay) {
				overlay.x = limitX(originalOverlay.x + dx, originalOverlay.w)
				overlay.y = limitY(originalOverlay.y + dy, originalOverlay.h)
			}
		}

	} else if (selectionType === 'Favicon') {
		tempFavicon.x = limitX(metaroom.favicon.x + dx, 24)
		tempFavicon.y = limitY(metaroom.favicon.y + dy, 23)
	}
}

const updateSideXY = (side, room) => {
	if (side.position === 'Top') {
		side.x1 = room.x_left
		side.y1 = room.y_top_left
		side.x2 = room.x_right
		side.y2 = room.y_top_right
	} else if (side.position === 'Bottom') {
		side.x1 = room.x_left
		side.y1 = room.y_bot_left
		side.x2 = room.x_right
		side.y2 = room.y_bot_right
	} else if (side.position === 'Left') {
		side.x1 = room.x_left
		side.y1 = room.y_top_left
		side.x2 = room.x_left
		side.y2 = room.y_bot_left
	} else if (side.position === 'Right') {
		side.x1 = room.x_right
		side.y1 = room.y_top_right
		side.x2 = room.x_right
		side.y2 = room.y_bot_right
	}
}

const updateCornerXY = (corner, room) => {
	if (corner.position === 'TopLeft') {
		corner.x = room.x_left
		corner.y = room.y_top_left
	} else if (corner.position === 'TopRight') {
		corner.x = room.x_right
		corner.y = room.y_top_right
	} else if (corner.position === 'BottomLeft') {
		corner.x = room.x_left
		corner.y = room.y_bot_left
	} else if (corner.position === 'BottomRight') {
		corner.x = room.x_right
		corner.y = room.y_bot_right
	}
}

const limitX = (x, w) => {
	return Math.min(Math.max(0, x), metaroom.width - w - 1)
}

const limitY = (y, h) => {
	return Math.min(Math.max(0, y), metaroom.height - h - 1)
}

const finishMovingSelection = () => {
	canvasRooms.style.opacity = '1.0'
	if (selectionType === 'Rooms' || selectionType === 'Sides' || selectionType === 'Corners') {
		tauri_invoke('update_rooms', { rooms: tempRooms })

	} else if (selectionType === 'Links' && linkEnd) {
		const x = Math.floor(tempLink.line[linkEnd].x)
		const y = Math.floor(tempLink.line[linkEnd].y)
		tauri_invoke('update_link', { id: tempLink.id, end: linkEnd, x, y })

	} else if (selectionType === 'Overlays') {
		isMovingOverlay = true // prevents flashing
		tauri_invoke('update_overlays', { overlays: tempOverlays, reloadImages: false }).then(() => {
			isMovingOverlay = false
			drawSelection()
		})

	} else if (selectionType === 'Favicon') {
		tauri_invoke('update_favicon', { favicon: tempFavicon, reloadImage: false })
	}
}

const nudgeSelection = (dir) => {
	setupSelectionForMovement()

	const d = isShiftDown ? 10 : 1;
	if (dir === 'arrowup') {
		moveSelection(0, -d, true)
	} else if (dir === 'arrowdown') {
		moveSelection(0, d, true)
	}
	if (dir === 'arrowleft') {
		moveSelection(-d, 0, true)
	} else if (dir === 'arrowright') {
		moveSelection(d, 0, true)
	}

	finishMovingSelection()
}

const startAddingRoom = () => {
	if (!metaroom) return
	clearSelection()
	mouseAction = 'addingRoom'
	newRoomX = null
	newRoomY = null
	canvasSelection.style.cursor = 'crosshair'
}

const finishAddingRoom = (endX, endY) => {
	const x = Math.min(newRoomX, endX)
	const y = Math.min(newRoomY, endY)
	const w = Math.abs(endX - newRoomX)
	const h = Math.abs(endY - newRoomY)
	if (w >= MIN_DIM && h >= MIN_DIM) {
		addedRoom = true
		cancelMouseAction()
		tauri_invoke('add_room', { x, y, w, h })
		return true
	} else {
		return false
	}
}

const startAddingLink = () => {
	if (!metaroom) return
	clearSelection()
	mouseAction = 'addingLink'
	newLinkRoom1 = null
	newLinkRoom2 = null
	canvasSelection.style.cursor = 'crosshair'
}

const startAddingFavicon = () => {
	if (!metaroom) return
	clearSelection()
	mouseAction = 'addingFavicon'
	tempFavicon = {
		x: xMouseRel,
		y: yMouseRel
	}
	canvasSelection.style.cursor = 'crosshair'
}

const startAddingOverlay = () => {
	if (!metaroom) return
	clearSelection()
	mouseAction = 'addingOverlay'
	tempOverlays = [{
		x: xMouseRel,
		y: yMouseRel,
		w: 50,
		h: 50
	}]
	canvasSelection.style.cursor = 'crosshair'
}
