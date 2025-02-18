const MIN_DIM = 6

let newCoords = {
	x_left: null,
	x_right: null,
	y_top_left: null,
	y_top_right: null,
	y_bot_left: null,
	y_bot_right: null
}

const sideNames = [ 'Top', 'Bottom', 'Left', 'Right' ]
const sideProps = {
	'Top': { x1: 'x_left', y1: 'y_top_left', x2: 'x_right', y2: 'y_top_right' },
	'Bottom': { x1: 'x_left', y1: 'y_bot_left', x2: 'x_right', y2: 'y_bot_right' },
	'Left': { x1: 'x_left', y1: 'y_top_left', x2: 'x_left', y2: 'y_bot_left' },
	'Right': { x1: 'x_right', y1: 'y_top_right', x2: 'x_right', y2: 'y_bot_right' },
}

const resetTempPos = () => {
	newCoords.x_left = null
	newCoords.x_right = null
	newCoords.y_top_left = null
	newCoords.y_top_right = null
	newCoords.y_bot_left = null
	newCoords.y_bot_right = null
}

const updateFromTempPos = (room) => {
	if (newCoords.x_left != null) room.x_left = newCoords.x_left
	if (newCoords.x_right != null) room.x_right = newCoords.x_right
	if (newCoords.y_top_left != null) room.y_top_left = newCoords.y_top_left
	if (newCoords.y_top_right != null) room.y_top_right = newCoords.y_top_right
	if (newCoords.y_bot_left != null) room.y_bot_left = newCoords.y_bot_left
	if (newCoords.y_bot_right != null) room.y_bot_right = newCoords.y_bot_right
}

const checkRoomConstraints = (room) => {
	if (!isCtrlDown) {
		const rSq = (SNAP_RADIUS / scale * DPR)**2

		resetTempPos()

		for (other of metaroom.rooms) {
			if (other.id === room.id) continue
			checkSideToSideSnap(room, 'Top', other, 'Bottom', rSq)
			checkSideToSideSnap(room, 'Bottom', other, 'Top', rSq)
			checkSideToSideSnap(room, 'Left', other, 'Right', rSq)
			checkSideToSideSnap(room, 'Right', other, 'Left', rSq)
		}

		updateFromTempPos(room)
	}

	const dx = room.x_right - room.x_left
	if (room.x_left < 0) {
		room.x_left = 0
		room.x_right = Math.min(dx, metaroom.width - 1)
	}
	if (room.x_right >= metaroom.width) {
		room.x_right = metaroom.width - 1
		room.x_left = Math.max(room.x_right - dx, 0)
	}

	const dyLeft = room.y_bot_left - room.y_top_left
	const dyRight = room.y_bot_right - room.y_top_right
	if (room.y_top_left < 0 && room.y_top_left <= room.y_top_right) {
		const dy = room.y_top_right - room.y_top_left
		room.y_top_left = 0
		room.y_bot_left = dyLeft
		room.y_top_right = dy
		room.y_bot_right = Math.min(dy + dyRight, metaroom.height - 1)
	} else if (room.y_top_right < 0) {
		const dy = room.y_top_left - room.y_top_right
		room.y_top_right = 0
		room.y_bot_right = dyRight
		room.y_top_left = dy
		room.y_bot_left = Math.min(dy + dyLeft, metaroom.height - 1)
	}
	if (room.y_bot_left >= metaroom.height && room.y_bot_left >= room.y_bot_right) {
		const dy = room.y_bot_left - room.y_bot_right
		room.y_bot_left = metaroom.height - 1
		room.y_top_left = room.y_bot_left - dyLeft
		room.y_bot_right = room.y_bot_left - dy
		room.y_top_right = Math.max(room.y_bot_right - dyRight, 0)
	} else if (room.y_bot_right >= metaroom.height) {
		const dy = room.y_bot_right - room.y_bot_left
		room.y_bot_right = metaroom.height - 1
		room.y_top_right = room.y_bot_right - dyRight
		room.y_bot_left = room.y_bot_right - dy
		room.y_top_left = Math.max(room.y_bot_left - dyLeft, 0)
	}
}

const checkSideConstraints = (side, room) => {
	if (!isCtrlDown) {
		const rSq = (SNAP_RADIUS / scale * DPR)**2
		resetTempPos()
		for (other of metaroom.rooms) {
			if (other.id === room.id) continue
			for (otherSide of sideNames) {
				checkSideToSideSnap(room, side.position, other, otherSide, rSq)
			}
		}
		updateFromTempPos(room)
	}

	if (side.position === 'Top') {
		if (room.y_top_left > room.y_bot_left - MIN_DIM) {
			room.y_top_left = room.y_bot_left - MIN_DIM
		}
		if (room.y_top_right > room.y_bot_right - MIN_DIM) {
			room.y_top_right = room.y_bot_right - MIN_DIM
		}
	} else if (side.position === 'Bottom') {
		if (room.y_bot_left < room.y_top_left + MIN_DIM) {
			room.y_bot_left = room.y_top_left + MIN_DIM
		}
		if (room.y_bot_right < room.y_top_right + MIN_DIM) {
			room.y_bot_right = room.y_top_right + MIN_DIM
		}
	} else if (side.position === 'Left') {
		if (room.x_left > room.x_right - MIN_DIM) {
			room.x_left = room.x_right - MIN_DIM
		}
	} else if (side.position === 'Right') {
		if (room.x_right < room.x_left + MIN_DIM) {
			room.x_right = room.x_left + MIN_DIM
		}
	}

	checkMetaroomEdges(room)
}

const checkSideToSideSnap = (room, roomSide, other, otherSide, rSq) => {
	const roomCoords = sideProps[roomSide]
	const ax1 = room[roomCoords.x1]
	const ay1 = room[roomCoords.y1]
	const ax2 = room[roomCoords.x2]
	const ay2 = room[roomCoords.y2]

	const otherCoords = sideProps[otherSide]
	const bx1 = other[otherCoords.x1]
	const by1 = other[otherCoords.y1]
	const bx2 = other[otherCoords.x2]
	const by2 = other[otherCoords.y2]

	const aSlope = (ay2 - ay1) / (ax2 - ax1)
	const bSlope = (by2 - by1) / (bx2 - bx1)

	const a1onB = closestYOnLine(ax1, ay1, bx1, by1, bx2, by2, rSq)
	const a2onB = closestYOnLine(ax2, ay2, bx1, by1, bx2, by2, rSq)
	const b1onA = closestYOnLine(bx1, by1, ax1, ay1, ax2, ay2, rSq)
	const b2onA = closestYOnLine(bx2, by2, ax1, ay1, ax2, ay2, rSq)

	if ((roomSide === 'Left' && otherSide === 'Right') || (roomSide === 'Right' && otherSide === 'Left')) {
		const round = roomSide === 'Left' ? Math.ceil : Math.floor
		const d = bx1 - ax1
		if (d*d <= rSq && ay1 <= by2 && ay2 >= by1) {
			newCoords[roomCoords.x1] = round(bx1)
			newCoords[roomCoords.x2] = round(bx1)
			newCoords[roomCoords.y1] = ay1
			newCoords[roomCoords.y2] = ay2
		}

	} else if ((roomSide === 'Left' || roomSide === 'Right') && (otherSide === 'Top' || otherSide === 'Bottom')) {
		if (a1onB != null && otherSide === 'Bottom') {
			newCoords[roomCoords.y1] = Math.ceil(a1onB)
		} else if (a2onB != null && otherSide === 'Top') {
			newCoords[roomCoords.y2] = Math.floor(a2onB)
		}

	} else if ((roomSide === 'Top' && otherSide === 'Bottom') || (roomSide === 'Bottom' && otherSide === 'Top')) {
		const round = roomSide === 'Top' ? Math.ceil : Math.floor
		if (a1onB != null) {
			newCoords[roomCoords.y1] = round(a1onB)
			if (b2onA != null) {
				newCoords[roomCoords.y2] = newCoords[roomCoords.y1] + round(bSlope * (ax2 - ax1))
			}
		}
		if (a2onB != null) {
			newCoords[roomCoords.y2] = round(a2onB)
			if (b1onA != null) {
				newCoords[roomCoords.y1] = newCoords[roomCoords.y2] + round(bSlope * (ax1 - ax2))
			}
		}
		if (a1onB == null & a2onB == null) {
			if (b1onA != null && b2onA != null) {
				newCoords[roomCoords.y1] = round(by1 + bSlope * (ax1 - bx1))
				newCoords[roomCoords.y2] = round(by2 + bSlope * (ax2 - bx2))
			} else if (b1onA != null) {
				newCoords[roomCoords.y1] = by1 + aSlope * (ax1 - bx1)
				newCoords[roomCoords.y2] = by1 + aSlope * (ax2 - bx1)
			} else if (b2onA != null) {
				newCoords[roomCoords.y1] = by2 + aSlope * (ax1 - bx2)
				newCoords[roomCoords.y2] = by2 + aSlope * (ax2 - bx2)
			}
		}
	}
}

const checkCornerConstraints = (corner, room) => {
	if (!isCtrlDown) {
		const rSq = (SNAP_RADIUS / scale * DPR)**2

		resetTempPos()

		if (corner.position === 'TopLeft') {
			[newCoords.x_left, newCoords.y_top_left, hasSnap] = getSnapPoint(room.x_left, room.y_top_left, room.id, rSq)
			newCoords.x_left = Math.ceil(newCoords.x_left)
			newCoords.y_top_left = Math.ceil(newCoords.y_top_left)
			if (!hasSnap && Math.abs(room.y_top_left - room.y_top_right)**2 <= rSq) {
				newCoords.y_top_left = room.y_top_right
			}

		} else if (corner.position === 'TopRight') {
			[newCoords.x_right, newCoords.y_top_right, hasSnap] = getSnapPoint(room.x_right, room.y_top_right, room.id, rSq)
			newCoords.x_right = Math.floor(newCoords.x_right)
			newCoords.y_top_right = Math.ceil(newCoords.y_top_right)
			if (!hasSnap && Math.abs(room.y_top_left - room.y_top_right)**2 <= rSq) {
				newCoords.y_top_right = room.y_top_left
			}

		} else if (corner.position === 'BottomLeft') {
			[newCoords.x_left, newCoords.y_bot_left, hasSnap] = getSnapPoint(room.x_left, room.y_bot_left, room.id, rSq)
			newCoords.x_left = Math.ceil(newCoords.x_left)
			newCoords.y_bot_left = Math.floor(newCoords.y_bot_left)
			if (!hasSnap && Math.abs(room.y_bot_left - room.y_bot_right)**2 <= rSq) {
				newCoords.y_bot_left = room.y_bot_right
			}

		} else if (corner.position === 'BottomRight') {
			[newCoords.x_right, newCoords.y_bot_right, hasSnap] = getSnapPoint(room.x_right, room.y_bot_right, room.id, rSq)
			newCoords.x_right = Math.floor(newCoords.x_right)
			newCoords.y_bot_right = Math.floor(newCoords.y_bot_right)
			if (!hasSnap && Math.abs(room.y_bot_left - room.y_bot_right)**2 <= rSq) {
				newCoords.y_bot_right = room.y_bot_left
			}
		}

		updateFromTempPos(room)
	}

	if (corner.position === 'TopLeft') {
		if (room.x_left > room.x_right - MIN_DIM) {
			room.x_left = room.x_right - MIN_DIM
		}
		if (room.y_top_left > room.y_bot_left - MIN_DIM) {
			room.y_top_left = room.y_bot_left - MIN_DIM
		}

	} else if (corner.position === 'TopRight') {
		if (room.x_right < room.x_left + MIN_DIM) {
			room.x_right = room.x_left + MIN_DIM
		}
		if (room.y_top_right > room.y_bot_right - MIN_DIM) {
			room.y_top_right = room.y_bot_right - MIN_DIM
		}

	} else if (corner.position === 'BottomLeft') {
		if (room.x_left > room.x_right - MIN_DIM) {
			room.x_left = room.x_right - MIN_DIM
		}
		if (room.y_bot_left < room.y_top_left + MIN_DIM) {
			room.y_bot_left = room.y_top_left + MIN_DIM
		}

	} else if (corner.position === 'BottomRight') {
		if (room.x_right < room.x_left + MIN_DIM) {
			room.x_right = room.x_left + MIN_DIM
		}
		if (room.y_bot_right < room.y_top_right + MIN_DIM) {
			room.y_bot_right = room.y_top_right + MIN_DIM
		}
	}

	checkMetaroomEdges(room)
}

const checkMetaroomEdges = (room) => {
	if (room.x_left < 0) {
		room.x_left = 0
	} else if (room.x_right >= metaroom.width) {
		room.x_right = metaroom.width - 1
	}

	if (room.y_top_left < 0) {
		room.y_top_left = 0
	} else if (room.y_bot_left >= metaroom.height) {
		room.y_bot_left = metaroom.height - 1
	}

	if (room.y_top_right < 0) {
		room.y_top_right = 0
	} else if (room.y_bot_right >= metaroom.height) {
		room.y_bot_right = metaroom.height - 1
	}
}

const cornerCornerSnapPoint = (px1, py1, px2, py2, rSq) => {
	if (distSq(px1, py1, px2, py2) < rSq) {
		return [px2, py2]
	} else {
		return [null, null]
	}
}

const cornerLineSnapPoint = (px, py, x1, y1, x2, y2, rSq) => {
	const [closestX, closestY] = closestPointOnLine(px, py, x1, y1, x2, y2)
	const closestIsOnLine =
		Math.min(x1, x2) <= closestX && closestX <= Math.max(x1, x2) &&
		Math.min(y1, y2) <= closestY && closestY <= Math.max(y1, y2)
	if (closestIsOnLine && distSq(px, py, closestX, closestY) < rSq) {
		return [closestX, closestY]
	} else {
		return [null, null]
	}
}

const closestPointOnLine = (px, py, x1, y1, x2, y2) => {
	const lenSq = distSq(x1, y1, x2, y2)
	const dot = (((px - x1) * (x2 - x1)) + ((py - y1) * (y2 - y1))) / lenSq
	return [
		x1 + (dot * (x2 - x1)),
		y1 + (dot * (y2 - y1))
	]
}

const closestYOnLine = (px, py, x1, y1, x2, y2, rSq) => {
	const slope = (y2 - y1) / (x2 - x1)
	const py2 = y1 + slope * (px - x1)
	const dy = Math.abs(py2 - py)
	if (px >= x1 && px < x2 && dy*dy <= rSq) {
		return py2
	} else {
		return null
	}
}

const distSq = (x1, y1, x2, y2) => {
	return (x2 - x1)**2 + (y2 - y1)**2
}

const getSnapPoint = (x, y, id, rSq) => {
	if (rSq == null) rSq = (SNAP_RADIUS / scale * DPR)**2

	let newX = null
	let newY = null

	for (room of metaroom.rooms) {
		if (id != null && room.id === id) continue

		const corners = [
			{ x: room.x_left, y: room.y_top_left },
			{ x: room.x_right, y: room.y_top_right },
			{ x: room.x_left, y: room.y_bot_left },
			{ x: room.x_right, y: room.y_bot_right },
		]
		let hasCornerSnap = false
		for (const corner of corners) {
			const [snapX, snapY] = cornerCornerSnapPoint(x, y, corner.x, corner.y, rSq)
			if (snapX != null & snapY != null && (
				newX == null || newY == null ||
				distSq(x, y, snapX, snapY) < distSq(x, y, newX, newY)
			)) {
				hasCornerSnap = true
				newX = snapX
				newY = snapY
			}
		}
		if (!hasCornerSnap) {
			const sides = [
				{ x1: room.x_left, y1: room.y_top_left, x2: room.x_right, y2: room.y_top_right },
				{ x1: room.x_left, y1: room.y_bot_left, x2: room.x_right, y2: room.y_bot_right },
				{ x1: room.x_left, y1: room.y_top_left, x2: room.x_left, y2: room.y_bot_left },
				{ x1: room.x_right, y1: room.y_top_right, x2: room.x_right, y2: room.y_bot_right }
			]
			for (const side of sides) {
				const [snapX, snapY] = cornerLineSnapPoint(x, y, side.x1, side.y1, side.x2, side.y2, rSq)
				if (snapX != null & snapY != null && (
					newX == null || newY == null ||
					distSq(x, y, snapX, snapY) < distSq(x, y, newX, newY)
				)) {
					newX = snapX
					newY = snapY
				}
			}
		}
	}

	const hasSnap = newX != null && newY != null

	if (newX == null) newX = x
	if (newX < 0) newX = 0
	if (newX >= metaroom.width) newX = metaroom.width - 1

	if (newY == null) newY = y
	if (newY < 0) newY = 0
	if (newY >= metaroom.height) newY = metaroom.height - 1

	return [newX, newY, hasSnap]
}
