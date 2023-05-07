const UI = {

	zoomLevel: 1.0,
	xOffset: 20,
	yOffset: 68,

	mouseDownStartPoint: { x: 0, y: 0 },

	isPanning: false,
	lastPan: { x: 0, y: 0},

	isSelecting: false,
	selection: { x: 0, y: 0, w: 0, h: 0 },
	selectedRooms: [],
	selectedDoors: [],
	selectedLink: null,
	selectedFavicon: false,

	isStartDrawingRoom: false,
	isDrawingRoom: false,
	newRoom: { x: 0, y: 0, w: 0, h: 0 },

	isStartDrawingLink: false,
	isDrawingLink: false,
	newLink: { x1: 0, y1: 0, x2: 0, y2: 0, room1Id: 0, room2Id: 0 },

	isExtrudingRoom: false,
	extrudedRooms: [],

	isDragging: false,
	startDragPoint: { x: 0, y: 0 },
	dragParts: [],

	isStartDrawingOverlay: false,
	overlayMode: false,
	selectedOverlays: [],

	snapEnabled: true,
	roomColorEnabled: true,

	isResizingSidebar: false,
	sidebarWidth: parseInt(
		getComputedStyle(document.documentElement, null)
			.getPropertyValue('--sidebar-width'),
		10),
	sidebarResizeX: 0,

	toolbarHeight: parseInt(
		getComputedStyle(document.documentElement, null)
			.getPropertyValue('--toolbar-height'),
		10),

	inBounds() {
		return (mouseX < window.innerWidth - this.sidebarWidth && mouseY > this.toolbarHeight)
	},

	reset() {
		isModified = false
		undoStack = []
		redoStack = []
		bgImage = null
		faviconImage = null
		this.clearSelection()
		this.updateSidebar()
		this.updateTitle()
		Room.checkCollisions()
	},

	/* ===== */
	/*  PAN  */
	/* ===== */

	startPan(mx, my) {
		this.isPanning = true
		this.lastPan.x = mx
		this.lastPan.y = my
	},

	movePan(mx, my) {
		this.xOffset += mx - this.lastPan.x
		this.yOffset += my - this.lastPan.y
		this.lastPan.x = mx
		this.lastPan.y = my
	},

	endPan() {
		this.isPanning = false
	},

	/* ======== */
	/*  SELECT  */
	/* ======== */

	startSelection(mx, my) {
		if (this.inBounds(mx, my)) {
			this.isSelecting = true
			this.selection.x = mx
			this.selection.y = my
			this.selection.w = 0
			this.selection.h = 0

			if (!keyIsDown(SHIFT)) this.clearSelection()

			if (!UI.overlayMode) {
				const room = Metaroom.roomAt(metaroom, mx, my)
				const alreadySelectingDoors = keyIsDown(SHIFT) && this.selectedDoors.length > 0
				if (room && !alreadySelectingDoors) {
					this.selectedDoors = []
					this.selectedRooms.push(room)
				}
			}
		}
	},

	moveSelection(mx, my) {
		this.selection.w = mx - this.selection.x
		this.selection.h = my - this.selection.y
	},

	endSelection() {
		this.isSelecting = false
		const x = Math.min(this.selection.x, this.selection.x + this.selection.w)
		const y = Math.min(this.selection.y, this.selection.y + this.selection.h)
		const w = Math.max(Math.abs(this.selection.w), 1)
		const h = Math.max(Math.abs(this.selection.h), 1)
		if (w > 2 && h > 2) {
			if (this.overlayMode) {
				for (const overlay of metaroom.overlays) {
					if (Geometry.intersect(Geometry.rectPolygon(overlay), Geometry.rectPolygon({ x, y, w, h }))) {
						if (!this.selectedOverlays.includes(overlay)) {
							// add overlay to selection
							this.selectedOverlays.push(overlay)
						} else if (keyIsDown(SHIFT)) {
							// remove overlay from selection
							this.selectedOverlays = this.selectedOverlays.filter(o => o !== overlay)
						}
					}
				}

			} else {
				this.selectedDoors = []
				for (const room of metaroom.rooms) {
					if (Geometry.intersect(Geometry.quadPolygon(room), Geometry.rectPolygon({ x, y, w, h }))) {
							if (!this.selectedRooms.includes(room)) {
								// add room to selection
								this.selectedRooms.push(room)
							} else if (keyIsDown(SHIFT)) {
								// remove room from selection
								this.selectedRooms = this.selectedRooms.filter(r => r !== room)
							}
					}
				}
			}
		}
	},

	clearSelection() {
		this.selectedRooms = []
		this.selectedDoors = []
		this.selectedLink = null
		this.selectedFavicon = false
		this.selectedOverlays = []
	},

	drawSelection() {
		const x = Math.min(this.selection.x, this.selection.x + this.selection.w)
		const y = Math.min(this.selection.y, this.selection.y + this.selection.h)
		const w = Math.abs(this.selection.w)
		const h = Math.abs(this.selection.h)
		stroke(255, 255, 255, 128)
		strokeWeight(1)
		fill(255, 255, 255, 26)
		rect(x, y, w, h)
	},

	selectDoor(door) {
		this.selectedRooms = []
		if (keyIsDown(SHIFT)) {
			if (this.selectedDoors.includes(door)) {
				this.selectedDoors = this.selectedDoors.filter(d => d !== door)
			} else {
				this.selectedDoors.push(door)
			}
		} else {
			this.selectedDoors = [door]
		}
	},

	/* =========== */
	/*  DRAW ROOM  */
	/* =========== */

	startNewRoom(mx, my) {
		if (this.inBounds(mx, my)) {
			this.isDrawingRoom = true
			this.newRoom.x = Math.floor(mx)
			this.newRoom.y = Math.floor(my)
			this.newRoom.w = 0
			this.newRoom.h = 0
		}
	},

	moveNewRoom(mx, my) {
		this.newRoom.w = Math.floor(mx - this.newRoom.x)
		this.newRoom.h = Math.floor(my - this.newRoom.y)
	},

	endNewRoom() {
		this.isDrawingRoom = false
		const x = Math.min(this.newRoom.x, this.newRoom.x + this.newRoom.w)
		const y = Math.min(this.newRoom.y, this.newRoom.y + this.newRoom.h)
		const w = Math.max(Math.abs(this.newRoom.w), 50)
		const h = Math.max(Math.abs(this.newRoom.h), 50)
		saveState()
		metaroom.rooms.push(new Room({
			xL: x,
			yTL: y,
			yBL: y + h,
			xR: x + w,
			yTR: y,
			yBR: y + h
		}))
		this.selectedRooms = [metaroom.rooms[metaroom.rooms.length - 1]]
	},

	cancelNewRoom() {
		this.isStartDrawingRoom = false
		this.isDrawingRoom = false
	},

	drawNewRoom() {
		const x = Math.min(this.newRoom.x, this.newRoom.x + this.newRoom.w)
		const y = Math.min(this.newRoom.y, this.newRoom.y + this.newRoom.h)
		const w = Math.abs(this.newRoom.w)
		const h = Math.abs(this.newRoom.h)
		stroke(255, 255, 255)
		strokeWeight(1)
		noFill()
		rect(x, y, w, h)
	},

	/* =========== */
	/*  DRAW LINK  */
	/* =========== */

	startNewLink(mx, my) {
		const room = Metaroom.roomAt(metaroom, mx, my)
		if (room) {
			const center = Room.getCenter(room)
			newLink.x1 = center.x
			newLink.y1 = center.y
			newLink.room1Id = metaroom.rooms.findIndex(r => r === room)
			this.isDrawingLink = true
		}
	},

	moveNewLink(mx, my) {
		const room = Metaroom.roomAt(metaroom, mx, my)
		if (room) {
			const center = Room.getCenter(room)
			newLink.x2 = center.x
			newLink.y2 = center.y
		} else {
			newLink.x2 = mx
			newLink.y2 = my
		}
	},

	endNewLink(mx, my) {
		const room = Metaroom.roomAt(metaroom, mx, my)
		if (room) {
			const room1Id = newLink.room1Id
			const room2Id = metaroom.rooms.findIndex(r => r === room)
			const existingLink = metaroom.links.find(l =>
				(l.room1Id === room1Id && l.room2Id === room2Id) ||
				(l.room1Id === room2Id && l.room2Id === room1Id)
			)
			if (!existingLink) {
				saveState()
				metaroom.links.push(new Link({ room1Id, room2Id }))
				this.selectedLink = metaroom.links[metaroom.links.length - 1]
			}
		}
		this.isDrawingLink = false
	},

	cancelNewLink() {
		this.isStartDrawingLink = false
		this.isDrawingLink = false
	},

	drawNewLink() {
		strokeWeight(4)
		fill(255)
		line(newLink.x1, newLink.y1, newLink.x2, newLink.y2)
		circle(newLink.x1, newLink.y1, 6)
		circle(newLink.x2, newLink.y2, 6)
	},

	/* ============== */
	/*  EXTRUDE ROOM  */
	/* ============== */

	startExtrudeRoom(mx, my) {
		this.isExtrudingRoom = true
		this.extrudedRooms = []
	},

	moveExtrudeRoom(mx, my) {
		this.extrudedRooms = []

		let dy = 0
		mx = Math.floor(mx)
		my = Math.floor(my)

		let extrudeDirection = 'left'
		if (this.selectedRooms.length > 0) {
			const sourceRoom = this.selectedRooms[this.selectedRooms.length - 1]
			if (mx < sourceRoom.xL) {
				extrudeDirection = 'left'
				const midLeft = sourceRoom.yTL + (sourceRoom.yBL - sourceRoom.yTL) / 2
				if (!keyIsDown(SHIFT)) {
					dy = Math.floor(my - midLeft)
				}
			} else if (mx > sourceRoom.xR) {
				extrudeDirection = 'right'
				const midRight = sourceRoom.yTR + (sourceRoom.yBR - sourceRoom.yTR) / 2
				if (!keyIsDown(SHIFT)) {
					dy = Math.floor(my - midRight)
				}
			} else if (my < sourceRoom.yTL || my < sourceRoom.yTR) {
				extrudeDirection = 'up'
			} else {
				extrudeDirection = 'down'
			}
		}

		for (const sourceRoom of this.selectedRooms) {
			const gap = this.snapEnabled ? MIN_GAP : 1
			if (extrudeDirection === 'left' &&
				sourceRoom.xL + (mx - sourceRoom.xL) < sourceRoom.xL - gap) {
					this.extrudedRooms.push(new Room({
						xL: sourceRoom.xL + (mx - sourceRoom.xL),
						yTL: sourceRoom.yTL + dy,
						yBL: sourceRoom.yBL + dy,
						xR: sourceRoom.xL,
						yTR: sourceRoom.yTL,
						yBR: sourceRoom.yBL
					}))

			} else if (extrudeDirection === 'right' &&
				sourceRoom.xR + (mx - sourceRoom.xR) > sourceRoom.xR + gap) {
					this.extrudedRooms.push(new Room({
						xL: sourceRoom.xR,
						yTL: sourceRoom.yTR,
						yBL: sourceRoom.yBR,
						xR: sourceRoom.xR + (mx - sourceRoom.xR),
						yTR: sourceRoom.yTR + dy,
						yBR: sourceRoom.yBR + dy
					}))

			} else if (extrudeDirection === 'up') {
				const dLeft = (sourceRoom.yTR - sourceRoom.yTL) / 2
				this.extrudedRooms.push(new Room({
					xL: sourceRoom.xL,
					yTL: my - dLeft,
					yBL: sourceRoom.yTL,
					xR: sourceRoom.xR,
					yTR: my + dLeft,
					yBR: sourceRoom.yTR
				}))

			} else if (extrudeDirection === 'down') {
				const dRight = (sourceRoom.yBR - sourceRoom.yBL) / 2
				this.extrudedRooms.push(new Room({
					xL: sourceRoom.xL,
					yTL: sourceRoom.yBL,
					yBL: my - dRight,
					xR: sourceRoom.xR,
					yTR: sourceRoom.yBR,
					yBR: my + dRight
				}))

			}
		}
	},

	endExtrudeRoom() {
		this.isExtrudingRoom = false
		saveState()
		metaroom.rooms = metaroom.rooms.concat(this.extrudedRooms)
		this.selectedRooms = this.extrudedRooms
		this.extrudedRooms = []
	},

	cancelExtrudeRoom() {
		this.isExtrudingRoom = false
	},

	drawExtrudedRoom() {
		for (const extrudedRoom of this.extrudedRooms) {
			Room.draw(extrudedRoom)
		}
	},

	/* ====== */
	/*  DRAG  */
	/* ====== */

	startDrag(mx, my) {
		this.startDragPoint.x = mx
		this.startDragPoint.y = my
		this.isDragging = true
		if (this.overlayMode) {
			for (const overlay of this.selectedOverlays) {
				Overlay.startMove(overlay)
			}
		} else if (this.dragParts.length > 0) {
			for (const part of this.dragParts) {
				Room.startMove(part.room)
			}
		} else {
			for (const room of this.selectedRooms) {
				Room.startMove(room)
			}
		}
	},

	moveDrag(mx, my) {
		let dx = mx - this.startDragPoint.x
		let dy = my - this.startDragPoint.y
		if (dx !== 0 || dy !== 0) {
			if (keyIsDown(SHIFT)) {
				if (Math.abs(dx) > Math.abs(dy)) {
					dy = 0
				} else {
					dx = 0
				}
			}
			if (this.overlayMode) {
				for (const overlay of this.selectedOverlays) {
					Overlay.move(overlay, dx, dy)
				}
			} else if (this.dragParts.length > 0) {
				for (const part of this.dragParts) {
					Room.movePart(part.room, part.part, dx, dy)
				}
			} else {
				for (const room of this.selectedRooms) {
					Room.move(room, dx, dy)
				}
			}
		}
	},

	endDrag(mx, my) {
		this.isDragging = false

		const dx = mx - this.startDragPoint.x
		const dy = my - this.startDragPoint.y

		if (dx === 0 && dy === 0) {
			if (this.overlayMode) {
				const clickedOverlay = Metaroom.overlayAt(metaroom, mx, my)
				if (clickedOverlay) {
					if (this.selectedOverlays.includes(clickedOverlay) && keyIsDown(SHIFT)) {
						this.selectedOverlays = this.selectedOverlays.filter(o => o !== clickedOverlay)
					} else {
						this.selectedOverlays = [clickedOverlay]
					}
				}

			} else {
				const clickedDoor = Metaroom.doorAt(metaroom, mx, my)
				const clickedRoom = Metaroom.roomAt(metaroom, mx, my)
				const alreadySelectingRooms = keyIsDown(SHIFT) && this.selectedRooms.length > 0
				const alreadySelectingDoors = keyIsDown(SHIFT) && this.selectedDoors.length > 0

				if (clickedDoor && !alreadySelectingRooms) {
					if (this.selectedDoors.includes(clickedDoor) && keyIsDown(SHIFT)) {
						this.selectedDoors = this.selectedDoors.filter(r => r !== clickedDoor)
					} else {
						this.selectedDoors = [clickedDoor]
					}

				} else if (clickedRoom && !alreadySelectingDoors) {
					if (this.selectedRooms.includes(clickedRoom) && keyIsDown(SHIFT)) {
						this.selectedRooms = this.selectedRooms.filter(r => r !== clickedRoom)
					} else {
						this.selectedRooms = [clickedRoom]
					}
				}

			}

		} else {
			saveState()
		}

		if (this.overlayMode) {
			for (const overlay of this.selectedOverlays) {
				Overlay.endMove(overlay)
			}
		} else if (this.dragParts.length > 0) {
			for (const part of this.dragParts) {
				Room.endMove(part.room)
			}
		} else {
			for (const room of this.selectedRooms) {
				Room.endMove(room)
			}
		}
	},

	/* ============== */
	/*  OVERLAY MODE  */
	/* ============== */

	enableOverlayMode() {
		this.overlayMode = true
		document.getElementById('overlay-mode-indicator').className = ''
		this.clearSelection()
		this.updateSidebar()
	},

	disableOverlayMode() {
		this.overlayMode = false
		document.getElementById('overlay-mode-indicator').className = 'hidden'
		this.clearSelection()
		this.updateSidebar()
	},

	endNewOverlay(mx, my) {
		if (this.inBounds(mx, my)) {
			saveState()
			metaroom.overlays.push(new Overlay({ x: mx, y: my }))
			this.selectedOverlays = [metaroom.overlays[metaroom.overlays.length - 1]]
		}
	},

	/* ====== */
	/*  MISC  */
	/* ====== */

	nudge() {
		if (keyIsDown(LEFT_ARROW)) {
			this.xOffset += (keyIsDown(SHIFT) ? 100 : 10) / this.zoomLevel
		}
		if (keyIsDown(RIGHT_ARROW)) {
			this.xOffset -= (keyIsDown(SHIFT) ? 100 : 10) / this.zoomLevel
		}
		if (keyIsDown(UP_ARROW)) {
			this.yOffset += (keyIsDown(SHIFT) ? 100 : 10) / this.zoomLevel
		}
		if (keyIsDown(DOWN_ARROW)) {
			this.yOffset -= (keyIsDown(SHIFT) ? 100 : 10) / this.zoomLevel
		}
	},

	disableContextMenu() {
		document.body.addEventListener('contextmenu', event => {
			event.preventDefault()
			return false
		}, false)
	},

	setupResizeHandles() {
		const resizeHandles = document.querySelectorAll('.resize-handle')
		resizeHandles.forEach((resizeHandle) => {
			resizeHandle.addEventListener('mousedown', event => {
				this.isResizingSidebar = true
				this.sidebarResizeX = event.clientX
				this.sidebarWidth = parseInt(
					getComputedStyle(document.documentElement, null)
						.getPropertyValue('--sidebar-width'),
					10)
			})
		})

		document.body.addEventListener('mousemove', event => {
			if (this.isResizingSidebar) {
				dx = this.sidebarResizeX - event.clientX
				if (this.sidebarWidth + dx > 348) {
					document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth + dx}px`)
				}
			}
		})

		document.body.addEventListener('mouseup', event => {
			this.isResizingSidebar = false
		})
	},

	updateSidebar() {
		const sidebars = document.querySelectorAll('.sidebar')
		sidebars.forEach((sidebar) => {
			sidebar.className = 'sidebar hidden'
		})

		if (this.selectedDoors.length > 0) {
			Door.updateSidebar(this.selectedDoors[this.selectedDoors.length - 1])
			document.getElementById('door-props').className = 'sidebar'
		} else if (this.selectedRooms.length === 1) {
			Room.updateSidebar(this.selectedRooms[0])
			document.getElementById('room-props').className = 'sidebar'
		} else if (this.selectedRooms.length > 0) {
			Room.updateMultiSidebar(this.selectedRooms)
			document.getElementById('multi-room-props').className = 'sidebar'
		} else if (this.selectedOverlays.length > 0) {
			Overlay.updateSidebar(this.selectedOverlays)
			document.getElementById('overlay-props').className = 'sidebar'
		} else {
			Metaroom.updateSidebar(metaroom)
			document.getElementById('metaroom-props').className = 'sidebar'
		}

		this.updateTitle()
	},

	updateTitle() {
		Tauri.path.basename(metaroom.path, '.cos')
		.then((basename) => {
			const modified = isModified ? '*' : ''
			Tauri.window.appWindow.setTitle(`Roomie - ${basename}${modified}`)
		})
		.catch((_) => {
			const modified = isModified ? '*' : ''
			Tauri.window.appWindow.setTitle(`Roomie - untitled${modified}`)
		})
	},

	updateGuide() {
		const guide = document.getElementById('shortcut-guide')
		const guideButton = document.getElementById('guide-button')
		if (config.guide_enabled) {
			guide.className = ''
			guideButton.className = 'on'
		} else {
			guide.className = 'hidden'
			guideButton.className = 'off'
		}
	},

	updateMousePos() {
		const mousePos = document.getElementById('mouse-pos')
		const mousePosButton = document.getElementById('mouse-pos-button')
		if (config.mouse_pos_enabled) {
			mousePos.className = ''
			mousePosButton.className = 'on'
		} else {
			mousePos.className = 'hidden'
			mousePosButton.className = 'off'
		}
	}

}
