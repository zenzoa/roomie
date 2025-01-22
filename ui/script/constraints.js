const MIN_DIM = 6

let new_x_left = null
let new_x_right = null
let new_y_top_left = null
let new_y_top_right = null
let new_y_bot_left = null
let new_y_bot_right = null

const resetTempPos = () => {
	new_x_left = null
	new_x_right = null
	new_y_top_left = null
	new_y_top_right = null
	new_y_bot_left = null
	new_y_bot_right = null
}

const updateFromTempPos = (room) => {
	if (new_x_left != null) room.x_left = new_x_left
	if (new_x_right != null) room.x_right = new_x_right
	if (new_y_top_left != null) room.y_top_left = new_y_top_left
	if (new_y_top_right != null) room.y_top_right = new_y_top_right
	if (new_y_bot_left != null) room.y_bot_left = new_y_bot_left
	if (new_y_bot_right != null) room.y_bot_right = new_y_bot_right
}

const checkRoomConstraints = (room) => {
	if (!keysDown.includes('control')) {
		const r = SNAP_RADIUS / scale * DPR
		const rSq = r*r

		resetTempPos()

		for (other of metaroom.rooms) {
			if (room.id !== other.id) {
				checkTLonR(room, other, rSq)
				checkBLonR(room, other, rSq)
				checkTRonL(room, other, rSq)
				checkBRonL(room, other, rSq)

				checkRonTL(room, other, rSq)
				checkRonBL(room, other, rSq)
				checkLonTR(room, other, rSq)
				checkLonBR(room, other, rSq)

				checkTLonB(room, other, rSq)
				checkTRonB(room, other, rSq)
				checkBLonT(room, other, rSq)
				checkBRonT(room, other, rSq)

				checkTonBLR(room, other, rSq)
				checkBonTLR(room, other, rSq)
			}
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
	if (!keysDown.includes('control')) {
		const r = SNAP_RADIUS / scale * DPR
		const rSq = r*r

		resetTempPos()

		for (other of metaroom.rooms) {
			if (room.id !== other.id) {
				if (side.position === 'Top') {
					checkTLonB(room, other, rSq)
					checkTRonB(room, other, rSq)
					checkTonBLR(room, other, rSq)
				} else if (side.position === 'Bottom') {
					checkBLonT(room, other, rSq)
					checkBRonT(room, other, rSq)
					checkBonTLR(room, other, rSq)
				} else if (side.position === 'Left') {
					checkTLonR(room, other, rSq)
					checkBLonR(room, other, rSq)
					checkLonTR(room, other, rSq)
					checkLonBR(room, other, rSq)
				} else if (side.position === 'Right') {
					checkTRonL(room, other, rSq)
					checkBRonL(room, other, rSq)
					checkRonTL(room, other, rSq)
					checkRonBL(room, other, rSq)
				}
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

const checkCornerConstraints = (corner, room) => {
	if (!keysDown.includes('control')) {
		const r = SNAP_RADIUS / scale * DPR
		const rSq = r*r

		resetTempPos()

		for (other of metaroom.rooms) {
			if (room.id !== other.id) {
				const otherCorners = [
					{ x: other.x_left, y: other.y_top_left },
					{ x: other.x_right, y: other.y_top_right },
					{ x: other.x_left, y: other.y_bot_left },
					{ x: other.x_right, y: other.y_bot_right },
				]

				if (corner.position === 'TopLeft') {
					for (const otherCorner of otherCorners) {
						checkTLonCorner(room, otherCorner.x, otherCorner.y, rSq)
					}
					checkTLonR(room, other, rSq)
					checkTLonB(room, other, rSq)
				} else if (corner.position === 'TopRight') {
					for (const otherCorner of otherCorners) {
						checkTRonCorner(room, otherCorner.x, otherCorner.y, rSq)
					}
					checkTRonL(room, other, rSq)
					checkTRonB(room, other, rSq)
				} else if (corner.position === 'BottomLeft') {
					for (const otherCorner of otherCorners) {
						checkBLonCorner(room, otherCorner.x, otherCorner.y, rSq)
					}
					checkBLonR(room, other, rSq)
					checkBLonT(room, other, rSq)
				} else if (corner.position === 'BottomRight') {
					for (const otherCorner of otherCorners) {
						checkBRonCorner(room, otherCorner.x, otherCorner.y, rSq)
					}
					checkBRonL(room, other, rSq)
					checkBRonT(room, other, rSq)
				}
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

const checkTLonCorner = (room, x, y, rSq) => {
	const snapPoint = cornerCornerSnapPoint(room.x_left, room.y_top_left, x, y, rSq)
	if (snapPoint && (
		new_x_left == null || new_y_top_left == null ||
		distSq(room.x_left, room.y_top_left, snapPoint.x, snapPoint.y) < distSq(room.x_left, room.y_top_left, new_x_left, new_y_top_left)
	)) {
		new_x_left = x
		new_y_top_left = y
	}
}

const checkTRonCorner = (room, x, y, rSq) => {
	const snapPoint = cornerCornerSnapPoint(room.x_right, room.y_top_right, x, y, rSq)
	if (snapPoint && (
		new_x_right == null || new_y_top_right == null ||
		distSq(room.x_right, room.y_top_right, snapPoint.x, snapPoint.y) < distSq(room.x_right, room.y_top_right, new_x_right, new_y_top_right)
	)) {
		new_x_right = x
		new_y_top_right = y
	}
}

const checkBLonCorner = (room, x, y, rSq) => {
	const snapPoint = cornerCornerSnapPoint(room.x_left, room.y_bot_left, x, y, rSq)
	if (snapPoint && (
		new_x_left == null || new_y_bot_left == null ||
		distSq(room.x_left, room.y_bot_left, snapPoint.x, snapPoint.y) < distSq(room.x_left, room.y_bot_left, new_x_left, new_y_bot_left)
	)) {
		new_x_left = x
		new_y_bot_left = y
	}
}

const checkBRonCorner = (room, x, y, rSq) => {
	const snapPoint = cornerCornerSnapPoint(room.x_right, room.y_bot_right, x, y, rSq)
	if (snapPoint && (
		new_x_right == null || new_y_bot_right == null ||
		distSq(room.x_right, room.y_bot_right, snapPoint.x, snapPoint.y) < distSq(room.x_right, room.y_bot_right, new_x_right, new_y_bot_right)
	)) {
		new_x_right = x
		new_y_bot_right = y
	}
}

const checkTLonR = (room, other, rSq) => {
	const snapPoint = cornerLineSnapPoint(room.x_left, room.y_top_left, other.x_right, other.y_top_right, other.x_right, other.y_bot_right, rSq)
	if (snapPoint && (new_x_left == null || Math.abs(room.x_left - other.x_right) < Math.abs(room.x_left - new_x_left))) {
		new_x_left = other.x_right
	}
}

const checkTLonB = (room, other, rSq) => {
	const TLonB = cornerLineSnapPoint(room.x_left, room.y_top_left, other.x_left, other.y_bot_left, other.x_right, other.y_bot_right, rSq)
	if (TLonB && (new_y_top_left == null || Math.abs(room.y_top_left - TLonB.y) < Math.abs(room.y_top_left - new_y_top_left))) {
		new_y_top_left = Math.min(Math.ceil(TLonB.y), room.y_bot_left - MIN_DIM)
	}
}

const checkTRonL = (room, other, rSq) => {
	const snapPoint = cornerLineSnapPoint(room.x_right, room.y_top_right, other.x_left, other.y_top_left, other.x_left, other.y_bot_left, rSq)
	if (snapPoint && (new_x_right == null || Math.abs(room.x_right - other.x_left) < Math.abs(room.x_right - new_x_right))) {
		new_x_right = other.x_left
	}
}

const checkTRonB = (room, other, rSq) => {
	const TRonB = cornerLineSnapPoint(room.x_right, room.y_top_right, other.x_left, other.y_bot_left, other.x_right, other.y_bot_right, rSq)
	if (TRonB && (new_y_top_right == null || Math.abs(room.y_top_right - TRonB.y) < Math.abs(room.y_top_right - new_y_top_right))) {
		new_y_top_right = Math.min(Math.ceil(TRonB.y), room.y_bot_right - MIN_DIM)
	}
}

const checkBLonR = (room, other, rSq) => {
	const snapPoint = cornerLineSnapPoint(room.x_left, room.y_bot_left, other.x_right, other.y_top_right, other.x_right, other.y_bot_right, rSq)
	if (snapPoint && (new_x_left == null || Math.abs(room.x_left - other.x_right) < Math.abs(room.x_left - new_x_left))) {
		new_x_left = other.x_right
	}
}

const checkBLonT = (room, other, rSq) => {
	const BLonT = cornerLineSnapPoint(room.x_left, room.y_bot_left, other.x_left, other.y_top_left, other.x_right, other.y_top_right, rSq)
	if (BLonT && (new_y_bot_left == null || Math.abs(room.y_bot_left - BLonT.y) < Math.abs(room.y_bot_left - new_y_bot_left))) {
		new_y_bot_left = Math.max(Math.floor(BLonT.y), room.y_top_left + MIN_DIM)
	}
}

const checkBRonL = (room, other, rSq) => {
	const snapPoint = cornerLineSnapPoint(room.x_right, room.y_bot_right, other.x_left, other.y_top_left, other.x_left, other.y_bot_left, rSq)
	if (snapPoint && (new_x_right == null || Math.abs(other.x_right - other.x_left) < Math.abs(other.x_right - new_x_right))) {
		new_x_right = other.x_left
	}
}

const checkBRonT = (room, other, rSq) => {
	const BRonT = cornerLineSnapPoint(room.x_right, room.y_bot_right, other.x_left, other.y_top_left, other.x_right, other.y_top_right, rSq)
	if (BRonT && (new_y_bot_right == null || Math.abs(room.y_bot_right - BRonT.y) < Math.abs(room.y_bot_right - new_y_bot_right))) {
		new_y_bot_right = Math.max(Math.floor(BRonT.y), room.y_top_right + MIN_DIM)
	}
}

const checkLonTR = (room, other, rSq) => {
	const leftSideOnTopRight = cornerLineSnapPoint(other.x_right, other.y_top_right, room.x_left, room.y_top_left, room.x_left, room.y_bot_left, rSq)
	if (leftSideOnTopRight && (new_x_left == null || Math.abs(room.x_left - other.x_right) < Math.abs(room.x_left - new_x_left))) {
		new_x_left = other.x_right
	}
}

const checkLonBR = (room, other, rSq) => {
	const leftSideOnBotRight = cornerLineSnapPoint(other.x_right, other.y_bot_right, room.x_left, room.y_top_left, room.x_left, room.y_bot_left, rSq)
	if (leftSideOnBotRight && (new_x_left == null || Math.abs(room.x_left - other.x_right) < Math.abs(room.x_left - new_x_left))) {
		new_x_left = other.x_right
	}
}

const checkRonTL = (room, other, rSq) => {
	const rightSideOnTopLeft = cornerLineSnapPoint(other.x_left, other.y_top_left, room.x_right, room.y_top_right, room.x_right, room.y_bot_right, rSq)
	if (rightSideOnTopLeft && (new_x_right == null || Math.abs(room.x_right - other.x_left) < Math.abs(room.x_right - new_x_right))) {
		new_x_right = other.x_left
	}
}

const checkRonBL = (room, other, rSq) => {
	const rightSideOnBotLeft = cornerLineSnapPoint(other.x_left, other.y_bot_left, room.x_right, room.y_top_right, room.x_right, room.y_bot_right, rSq)
	if (rightSideOnBotLeft && (new_x_right == null || Math.abs(room.x_right - other.x_left) < Math.abs(room.x_right - new_x_right))) {
		new_x_right = other.x_left
	}
}

const checkTonBLR = (room, other, rSq) => {
	const TonBL = cornerLineSnapPoint(other.x_left, other.y_bot_left, room.x_left, room.y_top_left, room.x_right, room.y_top_right, rSq)
	const TonBR = cornerLineSnapPoint(other.x_right, other.y_bot_right, room.x_left, room.y_top_left, room.x_right, room.y_top_right, rSq)
	const slope = (other.y_bot_right - other.y_bot_left) / (other.x_right - other.x_left)
	if (TonBL) {
		const yTL = Math.min(
			room.y_bot_left - MIN_DIM,
			Math.ceil(other.y_bot_left + slope * (room.x_left - other.x_left)))
		if (new_y_top_left == null || Math.abs(room.y_top_left - yTL) < Math.abs(room.y_top_left - new_y_top_left)) {
			new_y_top_left = yTL
		}
	}
	if (TonBR) {
		const yTR = Math.min(
			room.y_bot_right - MIN_DIM,
			Math.ceil(other.y_bot_right + slope * (room.x_right - other.x_right)))
		if (new_y_top_right == null || Math.abs(room.y_top_right - yTR) < Math.abs(room.y_top_right - new_y_top_right)) {
			new_y_top_right = yTR
		}
	}
}

const checkBonTLR = (room, other, rSq) => {
	const BonTL = cornerLineSnapPoint(other.x_left, other.y_top_left, room.x_left, room.y_bot_left, room.x_right, room.y_bot_right, rSq)
	const BonTR = cornerLineSnapPoint(other.x_right, other.y_top_right, room.x_left, room.y_bot_left, room.x_right, room.y_bot_right, rSq)
	const slope = (other.y_top_right - other.y_top_left) / (other.x_right - other.x_left)
	if (BonTL) {
		const yBL = Math.max(
			room.y_top_left + MIN_DIM,
			Math.floor(other.y_top_left + slope * (room.x_left - other.x_left)))
		if (new_y_bot_left == null || Math.abs(room.y_bot_left - yBL) < Math.abs(room.y_bot_left - new_y_bot_left)) {
			new_y_bot_left = yBL
		}
	}
	if (BonTR) {
		const yBR = Math.max(
			room.y_top_right + MIN_DIM,
			Math.floor(other.y_top_right + slope * (room.x_right - other.x_right)))
		if (new_y_bot_right == null || Math.abs(room.y_bot_right - yBR) < Math.abs(room.y_bot_right - new_y_bot_right)) {
			new_y_bot_right = yBR
		}
	}
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
		return { x: px2, y: py2 }
	} else {
		return null
	}
}

const cornerLineSnapPoint = (px, py, x1, y1, x2, y2, rSq) => {
	const closest = closestPointOnLine(px, py, x1, y1, x2, y2)
	const closestIsOnLine =
		Math.min(x1, x2) <= closest.x && closest.x <= Math.max(x1, x2) &&
		Math.min(y1, y2) <= closest.y && closest.y <= Math.max(y1, y2)
	if (closestIsOnLine && distSq(px, py, closest.x, closest.y) < rSq) {
		return closest
	} else {
		return null
	}
}

const closestPointOnLine = (px, py, x1, y1, x2, y2) => {
	const lenSq = distSq(x1, y1, x2, y2)
	const dot = (((px - x1) * (x2 - x1)) + ((py - y1) * (y2 - y1))) / lenSq
	return { x: x1 + (dot * (x2 - x1)), y: y1 + (dot * (y2 - y1)) }
}

const distSq = (x1, y1, x2, y2) => {
	return (x2 - x1)**2 + (y2 - y1)**2
}
