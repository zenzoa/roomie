const MIN_SCALE = 0.5
const MAX_SCALE = 10

let main = null
let metaroomContainer = null

let canvasBG = null
let canvasRooms = null
let canvasOverlays = null
let canvasSelection = null

let ctxBG = null
let ctxRooms = null
let ctxOverlays = null
let ctxSelection = null

let scale = 1
let xOffset = 0
let yOffset = 0

const DPR = window.devicePixelRatio || 1

let showBGCanvas = true
let showRoomCanvas = true
let showOverlayCanvas = true

let showRoomColors = true

let bgImage = null
let faviconImage = null
let overlayImages = []

let isMovingOverlay = false

const circle = (ctx, x, y, r) => {
	ctx.beginPath()
	ctx.ellipse(x * scale, y * scale, r * DPR, r * DPR, 0, 0, Math.PI*2)
}

const line = (ctx, x1, y1, x2, y2) => {
	ctx.beginPath()
	ctx.moveTo(x1 * scale, y1 * scale)
	ctx.lineTo(x2 * scale, y2 * scale)
}

const polygon = (ctx, points) => {
	ctx.beginPath()
	for (i in points) {
		if (i === 0) {
			ctx.moveTo(points[i][0] * scale, points[i][1] * scale)
		} else {
			ctx.lineTo(points[i][0] * scale, points[i][1] * scale)
		}
	}
	ctx.closePath()
}

const setupCanvas = () => {
	main = document.getElementById('main')
	metaroomContainer = document.getElementById('metaroom-container')

	canvasBG = document.getElementById('canvas-bg')
	ctxBG = canvasBG.getContext('2d')

	canvasRooms = document.getElementById('canvas-rooms')
	ctxRooms = canvasRooms.getContext('2d')

	canvasOverlays = document.getElementById('canvas-overlays')
	ctxOverlays = canvasOverlays.getContext('2d')

	canvasSelection = document.getElementById('canvas-selection')
	ctxSelection = canvasSelection.getContext('2d')

	window.addEventListener('resize', drawAll)
}

const resizeCanvas = () => {
	if (!metaroom) return

	const main_rect = main.getBoundingClientRect()
	const width = Math.min(unadjustPos(metaroom.width), main_rect.width)
	const height = Math.min(unadjustPos(metaroom.height), main_rect.height)

	metaroomContainer.style.width = `${width}px`
	metaroomContainer.style.height = `${height}px`

	const setCanvasSize = (canvas) => {
		canvas.width = width * DPR
		canvas.height = height * DPR
		canvas.style.width = `${width}px`
		canvas.style.height = `${height}px`
	}

	setCanvasSize(canvasBG)
	setCanvasSize(canvasRooms)
	setCanvasSize(canvasOverlays)
	setCanvasSize(canvasSelection)
}

const drawAll = () => {
	if (!metaroom) return
	resizeCanvas()
	drawBG()
	drawRooms()
	drawOverlays()
	drawSelection()
}

const drawBG = () => {
	ctxBG.setTransform(1, 0, 0, 1, 0, 0);
	ctxBG.clearRect(0, 0, canvasBG.width, canvasBG.height)
	ctxBG.translate(xOffset, yOffset)

	if (!metaroom || !showBGCanvas) return

	if (bgImage) {
		ctxBG.drawImage(
			bgImage,
			0,
			0,
			bgImage.width * scale,
			bgImage.height * scale
		)
	}
}

const drawRooms = () => {
	ctxRooms.setTransform(1, 0, 0, 1, 0, 0);
	ctxRooms.clearRect(0, 0, canvasRooms.width, canvasRooms.height)
	ctxRooms.translate(xOffset, yOffset)

	if (!metaroom || !showRoomCanvas) return

	positionEl.classList.remove('hidden')

	ctxRooms.lineJoin = 'round'
	ctxRooms.lineCap = 'round'

	ctxRooms.lineWidth = 2 * DPR
	ctxRooms.strokeStyle = 'white'
	for (const room of metaroom.rooms) {
		if (mouseAction !== 'moving' || !tempRooms.find(r => r.id === room.id)) {
			drawRoom(ctxRooms, room, true)
		}
	}

	if (mouseAction !== 'moving' && selectionType === 'Rooms') {
		ctxRooms.lineWidth = 6 * DPR
		for (const room_id of selectedRooms) {
			drawRoom(ctxRooms, metaroom.rooms[room_id])
		}
	}

	if (mouseAction !== 'moving') {
		ctxRooms.lineWidth = 2 * DPR
		for (const door of metaroom.doors) {
			drawDoor(ctxRooms, door)
		}
	}

	ctxRooms.lineWidth = 2 * DPR
	ctxRooms.strokeStyle = 'cyan'
	ctxRooms.fillStyle = 'cyan'
	const affectedRooms = tempRooms.map(r => r.id)
	for (const link of metaroom.links) {
		if (mouseAction !== 'moving' || (!selectedLinks.includes(link.id) && !affectedRooms.includes(link.room1_id) && !affectedRooms.includes(link.room2_id))) {
			drawLink(ctxRooms, link)
		}
	}

	if (mouseAction !== 'moving' && selectionType === 'Sides') {
		ctxRooms.lineWidth = 6 * DPR
		ctxRooms.strokeStyle = 'white'
		for (const side_id of selectedSides) {
			drawSide(ctxRooms, metaroom.sides[side_id])
		}
	}

	if (mouseAction !== 'moving') {
		ctxRooms.lineWidth = 6 * DPR
		for (const door_id of selectedDoors) {
			drawDoor(ctxRooms, metaroom.doors[door_id])
		}
	}

	if (mouseAction !== 'moving' && selectionType === 'Corners') {
		ctxRooms.fillStyle = 'white'
		for (const corner_id of selectedCorners) {
			drawCorner(ctxRooms, metaroom.corners[corner_id])
		}
	}

	if (mouseAction !== 'moving' && selectionType === 'Links') {
		ctxRooms.lineWidth = 6 * DPR
		ctxRooms.strokeStyle = 'cyan'
		ctxRooms.fillStyle = 'cyan'
		for (const link_id of selectedLinks) {
			drawLink(ctxRooms, metaroom.links[link_id], true)
		}
	}

	if (mouseAction !== 'moving' || selectionType !== 'Favicon') {
		ctxRooms.lineWidth = (isFaviconSelected ? 6 : 2) * DPR
		ctxRooms.strokeStyle = 'cyan'
		drawFavicon(ctxRooms, metaroom.favicon, true)
	};
}

const drawOverlays = () => {
	ctxOverlays.setTransform(1, 0, 0, 1, 0, 0);
	ctxOverlays.clearRect(0, 0, canvasOverlays.width, canvasOverlays.height)
	ctxOverlays.translate(xOffset, yOffset)

	if (!metaroom || !showOverlayCanvas) return

	ctxOverlays.lineJoin = 'round'
	ctxOverlays.lineCap = 'round'

	ctxOverlays.lineWidth = 2 * DPR
	ctxOverlays.strokeStyle = 'lime'
	for (const overlay of metaroom.overlays) {
		if (mouseAction !== 'moving' || selectionType !== 'Overlays' || !selectedOverlays.includes(overlay.id)) {
			drawOverlay(ctxOverlays, overlay, true, false)
		}
	}
}

const drawSelection = () => {
	ctxSelection.setTransform(1, 0, 0, 1, 0, 0);
	ctxSelection.clearRect(0, 0, canvasSelection.width, canvasSelection.height)
	ctxSelection.translate(xOffset, yOffset)

	if (!metaroom) return

	ctxSelection.lineJoin = 'round'
	ctxSelection.lineCap = 'round'
	ctxSelection.setLineDash([])

	if (mouseAction === 'selecting') {
		ctxSelection.lineWidth = 1 * DPR
		ctxSelection.strokeStyle = 'white'
		ctxSelection.setLineDash([4 * DPR, 4 * DPR])
		const x = Math.min(xDragStartRel, xMouseRel)
		const y = Math.min(yDragStartRel, yMouseRel)
		const w = Math.abs(xDragStartRel - xMouseRel)
		const h = Math.abs(yDragStartRel - yMouseRel)
		ctxSelection.strokeRect(x * scale, y * scale, w * scale, h * scale)

	} else if (mouseAction === 'moving') {
		ctxSelection.strokeStyle = 'white'

		if (selectionType === 'Rooms') {
			ctxSelection.lineWidth = 6 * DPR
		} else {
			ctxSelection.lineWidth = 2 * DPR
		}
		for (const room of tempRooms) {
			drawRoom(ctxSelection, room)
		}

		if (selectionType === 'Sides') {
			ctxSelection.lineWidth = 6 * DPR
			for (const side of tempSides) {
				drawSide(ctxSelection, side)
			}
		}

		if (selectionType === 'Corners') {
			ctxSelection.fillStyle = 'white'
			for (const corner of tempCorners) {
				drawCorner(ctxSelection, corner)
			}
		}

		if (selectionType === 'Links') {
			ctxSelection.lineWidth = 6 * DPR
			ctxSelection.strokeStyle = 'cyan'
			ctxSelection.fillStyle = 'cyan'
			drawLink(ctxSelection, tempLink, true)
		}

		if (selectionType === 'Overlays') {
			ctxSelection.lineWidth = 6 * DPR
			ctxSelection.strokeStyle = 'lime'
			for (const overlay of tempOverlays) {
				drawOverlay(ctxSelection, overlay, true, true)
			}
		}

		if (selectionType === 'Favicon') {
			ctxSelection.lineWidth = 6 * DPR
			ctxSelection.strokeStyle = 'cyan'
			drawFavicon(ctxSelection, tempFavicon, false)
		}

	} else if (mouseAction === 'addingRoom') {
		ctxSelection.lineWidth = 6 * DPR
		ctxSelection.strokeStyle = 'white'
		ctxSelection.fillStyle = 'white'
		drawRoomInProgress(ctxSelection)

	} else if (mouseAction === 'addingLink') {
		ctxSelection.lineWidth = 6 * DPR
		ctxSelection.strokeStyle = 'cyan'
		ctxSelection.fillStyle = 'cyan'
		drawLinkInProgress(ctxSelection)

	} else if (mouseAction === 'addingFavicon') {
		ctxSelection.lineWidth = 6 * DPR
		ctxSelection.strokeStyle = 'cyan'
		drawFavicon(ctxSelection, tempFavicon, false)

	} else if (mouseAction === 'addingOverlay' && tempOverlays.length) {
		ctxSelection.lineWidth = 6 * DPR
		ctxSelection.strokeStyle = 'lime'
		drawOverlay(ctxSelection, tempOverlays[0], true)

	} else if (selectionType === 'Overlays' && !isMovingOverlay) {
		ctxSelection.lineWidth = 6 * DPR
		ctxSelection.strokeStyle = 'lime'
		for (const overlay_id of selectedOverlays) {
			drawOverlay(ctxSelection, metaroom.overlays[overlay_id], false, true)
		}
	}
}

const drawRoom = (ctx, room, fill) => {
	polygon(ctx, [
		[room.x_left, room.y_top_left],
		[room.x_right, room.y_top_right],
		[room.x_right, room.y_bot_right],
		[room.x_left, room.y_bot_left]
	])
	if (fill) {
		if (room.collision) {
			ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
			ctx.fill()
		} else if (showRoomColors) {
			const alpha = '40'
			if (room.room_type === 0) 		ctx.fillStyle = '#ffffff' + alpha / 2	// Atmosphere
			else if (room.room_type === 1)	ctx.fillStyle = '#f7cf91' + alpha		// Wooden Walkway
			else if (room.room_type === 2)	ctx.fillStyle = '#c3a79c' + alpha		// Concrete Walkway
			else if (room.room_type === 3)	ctx.fillStyle = '#3e3b66' + alpha		// Indoor Concrete
			else if (room.room_type === 4)	ctx.fillStyle = '#4a5786' + alpha		// Outdoor Concrete
			else if (room.room_type === 5)	ctx.fillStyle = '#a94b54' + alpha		// Normal Soil
			else if (room.room_type === 6)	ctx.fillStyle = '#7a3b4f' + alpha		// Boggy Soil
			else if (room.room_type === 7)	ctx.fillStyle = '#d8725e' + alpha		// Drained Soil
			else if (room.room_type === 8)	ctx.fillStyle = '#6fb0b7' + alpha		// Fresh Water
			else if (room.room_type === 9)	ctx.fillStyle = '#64b082' + alpha		// Salt Water
			else if (room.room_type === 10)	ctx.fillStyle = '#e76d46' + alpha		// Ettin Home
			else							ctx.fillStyle = '#ffffff' + alpha / 2	// Unknown
			ctx.fill()
		}
	}
	ctx.stroke()
}

const drawRoomInProgress = (ctx) => {
	const [xSnap, ySnap] = getSnapPoint(xMouseRel, yMouseRel)
	circle(ctx, xSnap, ySnap, 6)
	ctx.fill()
	if (newRoomX != null && newRoomY != null) {
		polygon(ctx, [
			[newRoomX, newRoomY],
			[newRoomX, ySnap],
			[xSnap, ySnap],
			[xSnap, newRoomY]
		])
		ctx.stroke()
	}
}

const drawSide = (ctx, side) => {
	line(ctx, side.x1, side.y1, side.x2, side.y2)
	ctx.stroke()
}

const drawCorner = (ctx, corner) => {
	circle(ctx, corner.x, corner.y, 6)
	ctx.fill()
}

const drawDoor = (ctx, door) => {
	if (door.permeability >= 50) {
		const r = 1 - ((door.permeability - 50) / 50)
		ctx.strokeStyle = `rgb(${Math.floor(r * 255)}, 255, 0)`
	} else {
		let b = door.permeability / 50
		ctx.strokeStyle = `rgb(255, ${Math.floor(b * 255)}, 0)`
	}
	line(ctx, door.line.a.x, door.line.a.y, door.line.b.x, door.line.b.y)
	ctx.stroke()
}

const drawLink = (ctx, link, isSelected) => {
	line(ctx, link.line.a.x, link.line.a.y, link.line.b.x, link.line.b.y)
	ctx.stroke()
	circle(ctx, link.line.a.x, link.line.a.y, isSelected ? 8 : 6)
	ctx.fill()
	circle(ctx, link.line.b.x, link.line.b.y, isSelected ? 8 : 6)
	ctx.fill()
}

const drawLinkInProgress = (ctx) => {
	if (newLinkRoom1 == null) {
		circle(ctx, xMouseRel, yMouseRel, 8)
		ctx.fill()

	} else {
		const [x1, y1] = getRoomCenter(newLinkRoom1)
		if (x1 != null && y1 != null) {
			circle(ctx, x1, y1, 8)
			ctx.fill()
			if (newLinkRoom2 != null) {
				const [x2, y2] = getRoomCenter(newLinkRoom2)
				if (x2 != null && y2 != null) {
					circle(ctx, x2, y2, 8)
					ctx.fill()
					line(ctx, x1, y1, x2, y2)
					ctx.stroke()
				}
			} else {
				line(ctx, x1, y1, xMouseRel, yMouseRel)
				ctx.stroke()
				circle(ctx, xMouseRel, yMouseRel, 8)
				ctx.fill()
			}
		}
	}
}

const drawFavicon = (ctx, favicon, drawImage) => {
	if (favicon) {
		if (drawImage && faviconImage) {
			ctx.drawImage(
				faviconImage,
				(favicon.x - 24) * scale,
				(favicon.y - 23) * scale,
				50 * scale,
				45 * scale
			)
		}
		circle(ctx, favicon.x, favicon.y, (isFaviconSelected ? 24 : 22) * scale / DPR)
		ctx.stroke()
	}
}

const drawOverlay = (ctx, overlay, drawImage, drawOutline) => {
	if (drawImage && overlayImages[overlay.id]) {
		ctx.drawImage(
			overlayImages[overlay.id],
			overlay.x * scale,
			overlay.y * scale,
			overlay.w * scale,
			overlay.h * scale
		)
	}
	if (drawOutline || !(overlayImages[overlay.id])) {
		ctx.strokeRect(
			overlay.x * scale,
			overlay.y * scale,
			overlay.w * scale,
			overlay.h * scale
		)
	}
}

const getRoomCenter = (roomID) => {
	const room = metaroom.rooms[roomID]
	if (room) {
		const x = room.x_left + Math.floor((room.x_right - room.x_left) / 2)
		const y_left = room.y_top_left + Math.floor((room.y_top_right - room.y_top_left) / 2)
		const y_right = room.y_bot_left + Math.floor((room.y_bot_right - room.y_bot_left) / 2)
		const y = Math.min(y_left, y_right) + Math.abs(Math.floor((y_right - y_left) / 2))
		return [x, y]
	} else {
		return [null, null]
	}
}

const scaleToFill = () => {
	if (!metaroom) return
	const main_rect = main.getBoundingClientRect()
	const newScale = Math.max(
		main_rect.width / metaroom.width * DPR,
		main_rect.height / metaroom.height * DPR
	)
	setScale(newScale)
}

const setScale = (newScale) => {
	const display = metaroomContainer.getBoundingClientRect()
	newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
	scrollAmount = newScale / (MAX_SCALE - MIN_SCALE) * 2000 - 1000
	setOffset(
		(xMouse * DPR) - (xMouseRel * newScale),
		(yMouse * DPR) - (yMouseRel * newScale)
	)
	scale = newScale
	drawAll()
}

const setOffset = (x, y) => {
	if (!metaroom) return
	const display = metaroomContainer.getBoundingClientRect()
	xOffset = Math.floor(Math.max(Math.min(0, x), (display.width * DPR) - (metaroom.width * scale)))
	yOffset = Math.floor(Math.max(Math.min(0, y), (display.height * DPR) - (metaroom.height * scale)))
}

const nudgeOffset = (dir) => {
	const d = isShiftDown ? 500 : 50;

	if (dir === 'arrowup') {
		setOffset(xOffset, yOffset + d)
	} else if (dir === 'arrowdown') {
		setOffset(xOffset, yOffset - d)
	}
	if (dir === 'arrowleft') {
		setOffset(xOffset + d, yOffset)
	} else if (dir === 'arrowright') {
		setOffset(xOffset - d, yOffset)
	}

	drawAll()
}

const updateBGImage = (event) => {
	if (event.payload) {
		bgImage = new Image()
		bgImage.src = convertFileSrc(`${Date.now()}-background`, 'getimage')
		bgImage.onload = drawBG
	} else {
		bgImage = null
		drawBG()
	}
}

const updateFaviconImage = (event) => {
	if (event.payload) {
		faviconImage = new Image()
		faviconImage.src = convertFileSrc(`${Date.now()}-favicon`, 'getimage')
		faviconImage.onload = drawRooms
	} else {
		faviconImage = null
		drawRooms()
	}
}

const updateOverlayImage = (event) => {
	if (event.payload) {
		const overlayID = event.payload[1]
		if (overlayID != null) {
			if (overlayImages.length <= overlayID) {
				for (let i=(overlayImages.length-1); i <= overlayID; i++) {
					overlayImages.push(null)
				}
			}
			if (metaroom && metaroom.overlays[overlayID]) {
				metaroom.overlays[overlayID].w = event.payload[2]
				metaroom.overlays[overlayID].h = event.payload[3]
			}
			if (event.payload[0]) {
				overlayImages[overlayID] = new Image()
				overlayImages[overlayID].src = convertFileSrc(`${Date.now()}-overlay-${overlayID}`, 'getimage')
				overlayImages[overlayID].onload = drawOverlays
			} else {
				overlayImages[overlayID] = null
				drawOverlays()
			}
		}
	}
}

const setRoomColorVisibility = (value, redraw) => {
	showRoomColors = value
	if (redraw) drawRooms()
}

const setBGOpacity = (value) => {
	canvasBG.style.opacity = `${value / 100}`
}

const setOverlayOpacity = (value) => {
	canvasOverlays.style.opacity = `${value / 100}`
}

const setBGVisibility = (value) => {
	showBGCanvas = value
	canvasBG.style.display = value ? 'block' : 'none'
}

const setRoomVisibility = (value) => {
	showRoomCanvas = value
	canvasRooms.style.display = value ? 'block' : 'none'
	drawRooms()
}

const setOverlayVisibility = (value) => {
	showOverlayCanvas = value
	canvasOverlays.style.display = value ? 'block' : 'none'
	drawOverlays()
}
