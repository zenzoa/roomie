const menu = require('./menu')
const panel = require('./panel')
const caos = require('./caos')
const { Metaroom } = require('./metaroom')
const { Room } = require('./room')

exports.setup = (p5) => {
	let s = (p) => {
		let sketch = new exports.Sketch()
		p.setup = () => sketch.setup(p)
		p.draw = () => sketch.draw(p)
		p.windowResized = () => sketch.windowResized(p)
		p.mousePressed = () => sketch.mousePressed(p)
		p.mouseMoved = () => sketch.mouseMoved(p)
		p.mouseDragged = () => sketch.mouseDragged(p)
		p.mouseReleased = () => sketch.mouseReleased(p)
		p.mouseWheel = (event) => sketch.mouseWheel(p, event)
		p.keyPressed = () => sketch.keyPressed(p)
		p.keyReleased = () => sketch.keyReleased(p)

		menu.setup(sketch)

		nw.Window.get().on('close', () => {
			let reallyClose = () => {
				nw.Window.get().close(true)
				nw.App.quit()
			}
			if (sketch.metaroom && sketch.metaroom.isModified) {
				let dialog = confirm('Are you sure you want to quit without saving?')
				if (dialog) {
					reallyClose()
				}
			} else {
				reallyClose()
			}
		})
	}
	new p5(s, 'sketch')
}

exports.Sketch = class Sketch {
	constructor() {
		this.metaroom = null

		this.xOffset = 0
		this.yOffset = 0
		this.scale = 1

		this.dragStartDistSq = 20 ^ 2

		this.isDragging = false
		this.isPanning = false

		this.isCreatingRoom = false
		this.isExtrudingRoom = false

		this.xStart = 0
		this.yStart = 0
		this.xLast = 0
		this.yLast = 0
	}

	setup(p) {
		nw.Window.get().window.p = p
		p.createCanvas(p.windowWidth, p.windowHeight)
		panel.update(this.metaroom)
	}

	draw(p) {
		p.background(0)

		if (this.metaroom) {
			p.push()
			p.scale(this.scale)
			p.translate(this.xOffset, this.yOffset)
			this.metaroom.draw(p)
			p.pop()
		}
	}

	windowResized(p) {
		p.resizeCanvas(p.windowWidth, p.windowHeight)
	}

	mousePressed(p) {
		let x = p.mouseX
		let y = p.mouseY

		if (x >= p.windowWidth - 200) {
			return // we're over the panel
		}

		let x2 = x / this.scale - this.xOffset
		let y2 = y / this.scale - this.yOffset

		this.xStart = x
		this.yStart = y
		this.xLast = x
		this.yLast = y

		this.menuExtrude.enabled = false
		this.menuDelete.enabled = false

		if ((p.keyIsDown(32)) || p.mouseButton === p.CENTER) {
			this.isPanning = true

		} else if (p.mouseButton === p.LEFT) {
			if (this.metaroom) {
				if (this.isCreatingRoom) {
					let newRoom = new Room(x2, x2 + 10, y2, y2, y2 + 10, y2 + 10)
					this.metaroom.addRoom(newRoom)
					this.metaroom.selectedRoom = newRoom
					newRoom.selectedPart = 'BR'
					newRoom.startDrag(x2, y2)
				} else {
					this.metaroom.selectObject(x2, y2)
					if (this.metaroom.selectedRoom) {
						if (this.metaroom.selectedRoom.selectedPart === 'Room') {
							this.menuDelete.enabled = true
						} else if (['Top', 'Bottom', 'Left', 'Right'].includes(this.metaroom.selectedRoom.selectedPart)) {
							this.menuExtrude.enabled = true
						}
					}
				}
				if (!this.metaroom.selectedRoom) {
					this.isPanning = true
				}
			}

		} else if (p.mouseButton === p.RIGHT) {
			this.metaroom && this.metaroom.selectObject(x2, y2, 'edge')
			this.isExtrudingRoom = true
		}
		panel.update(this.metaroom)
	}

	mouseMoved(p) {
		if (this.isExtrudingRoom || this.isDragging) {
			p.mouseDragged(p)
		}
	}

	mouseDragged(p) {
		let x = p.mouseX
		let y = p.mouseY

		if (x >= p.windowWidth - 200) {
			return // we're over the panel
		}

		let dx = x - this.xLast
		let dy = y - this.yLast

		this.xLast = x
		this.yLast = y

		let x2 = x / this.scale - this.xOffset
		let y2 = y / this.scale - this.yOffset

		let xStart2 = this.xStart / this.scale - this.xOffset
		let yStart2 = this.yStart / this.scale - this.yOffset

		if (this.isPanning) {
			this.xOffset += dx / this.scale
			this.yOffset += dy / this.scale

		} else if (this.isDragging && this.metaroom && this.metaroom.selectedRoom) {
			this.metaroom.drag(x2, y2)
			if (this.isCreatingRoom) {
				this.metaroom.selectedRoom.yBL = this.metaroom.selectedRoom.yBR
			}

		} else if (this.isExtrudingRoom && this.metaroom) {
			const distSq = (x - this.xStart) ** 2 + (y - this.yStart) ** 2
			if (distSq > this.dragStartDistSq) {
				const rm = this.metaroom.selectedRoom
				let newRoom = null
				if (rm) {
					this.metaroom.deselect()
					let side = rm.selectedPart
					if (side === 'Top') {
						newRoom = new Room(rm.xL, rm.xR, rm.yTL - 10, rm.yTR - 10, rm.yTL, rm.yTR)
						newRoom.selectedPart = 'Top'
					} else if (side === 'Bottom') {
						newRoom = new Room(rm.xL, rm.xR, rm.yBL, rm.yBR, rm.yBL + 10, rm.yBR + 10)
						newRoom.selectedPart = 'Bottom'
					} else if (side === 'Left') {
						newRoom = new Room(rm.xL, rm.xL + 10, rm.yTL, rm.yTL, rm.yBL, rm.yBL)
						newRoom.selectedPart = 'Left'
					} else if (side === 'Right') {
						newRoom = new Room(rm.xR, rm.xR - 10, rm.yTR, rm.yTR, rm.yBR, rm.yBR)
						newRoom.selectedPart = 'Right'
					}
					if (newRoom) {
						this.metaroom.addRoom(newRoom)
						this.metaroom.selectedRoom = newRoom
						this.metaroom.startDrag(xStart2, yStart2)
						this.isExtrudingRoom = false
						this.isDragging = true
					}
				} else {
					newRoom = new Room(xStart2, xStart2 + 10, yStart2, yStart2, yStart2 + 10, yStart2 + 10)
					newRoom.selectedPart = 'BR'
					this.metaroom.addRoom(newRoom)
					this.metaroom.selectedRoom = newRoom
					this.metaroom.startDrag(xStart2, yStart2)
					this.isCreatingRoom = true
					this.isExtrudingRoom = false
					this.isDragging = true
				}
			}

		} else if (this.metaroom) {
			const distSq = (x - this.xStart) ** 2 + (y - this.yStart) ** 2
			if (distSq > this.dragStartDistSq) {
				this.isDragging = true
				this.metaroom.startDrag(xStart2, yStart2)
			}
		}
		panel.update(this.metaroom)
	}

	mouseReleased(p) {
		let x = p.mouseX
		let y = p.mouseY

		let x2 = x / this.scale - this.xOffset
		let y2 = y / this.scale - this.yOffset

		this.isPanning = false
		this.isDragging = false
		this.isExtrudingRoom = false
		this.isCreatingRoom = false

		this.metaroom && this.metaroom.endDrag(x2, y2)

		this.updateTitle()

		if (x < p.windowWidth - 200) {
			panel.update(this.metaroom)
		}
	}

	mouseWheel(p, event) {
		if (event.delta > 0) {
			this.zoomIn()
		} else if (event.delta < 0) {
			this.zoomOut()
		}
	}

	zoomReset() {
		this.scale = 1
		this.xOffset = 0
		this.yOffset = 0
	}

	zoomIn() {
		if (this.scale < 3) {
			this.scale = this.scale + 0.1
		}
	}

	zoomOut() {
		if (this.scale > 0.5) {
			this.scale = this.scale - 0.1
		}
	}

	keyPressed(p) {
		if (p.key === 'a') {
			this.createRoom()
		} else if (p.key === 'e') {
			this.extrudeRoom()
		} else if (p.keyCode === p.BACKSPACE || p.keyCode === p.DELETE) {
			this.deleteRoom()
		}
	}

	keyReleased(p) {
	}

	updateTitle() {
		let title = 'Roomie'
		if (this.metaroom) {
			title += ' - ' + this.metaroom.filename.replace('.cos', '')
			if (this.metaroom.isModified) {
				title += '*'
			}
		}
		nw.Window.get().window.document.title = title
	}

	newMetaroom() {
		if (this.metaroom && this.metaroom.isModified) {
			// ask first
		} else {
			this.metaroom = new Metaroom()
			this.menuSave.enabled = true
			this.menuSaveAs.enabled = true
			this.menuCreateRoom.enabled = true
			this.xOffset = 20
			this.yOffset = 20
			this.scale = 1
			panel.update(this.metaroom)
			this.updateTitle()
		}
	}

	openMetaroom() {
		let okToOpen = true
		if (this.metaroom && this.metaroom.isModified) {
			okToOpen = confirm('Are you sure you want to open a new metaroom?\nYou will lose all unsaved changes.')
		}
		if (okToOpen) {
			const fileInput = nw.Window.get().window.document.getElementById('fileOpen')
			fileInput.accept = '.cos'
			fileInput.onchange = (event) => {
				const file = event.target.files[0]
				if (file) {
					const reader = new FileReader()
					reader.addEventListener('load', () => {
						try {
							const caosFile = reader.result
							const tokens = caos.parse(caosFile)
							const m = caos.decode(tokens)
							m.filename = file.name
							m.path = file.path.match(/^.*[\\\/]/)[0]
							m.loadBackground()
							this.metaroom = m
							this.menuSave.enabled = true
							this.menuSaveAs.enabled = true
							this.menuCreateRoom.enabled = true
							this.updateTitle()
							panel.update(this.metaroom)
						} catch(error) {
							alert('Unable to open metaroom. Invalid data.')
							console.log(error)
						}
					}, false)
					reader.readAsText(file)
				}
			}
			fileInput.click()
		}
	}

	saveMetaroom() {
		if (this.metaroom && this.metaroom.path) {
			this.metaroom.save()
		} else {
			this.saveAsMetaroom()
		}
		this.updateTitle()
	}

	saveAsMetaroom() {
		if (this.metaroom) {
			const fileInput = nw.Window.get().window.document.getElementById('fileSaveAs')
			fileInput.nwsaveas = this.metaroom.filename + '.cos'
			if (this.metaroom.path) {
				fileInput.nwworkingdir = this.metaroom.path
			}
			fileInput.onchange = (event) => {
				const file = event.target.files[0]
				this.metaroom.filename = file.name
				this.metaroom.path = file.path.match(/^.*[\\\/]/)[0]
				this.metaroom.save()
			}
			fileInput.click()
			this.updateTitle()
		}
	}

	createRoom() {
		if (this.metaroom) {
			this.metaroom.deselect()
			this.isCreatingRoom = true
		}
	}

	extrudeRoom() {
		if (this.metaroom && this.metaroom.selectedRoom &&
			['Top', 'Bottom', 'Left', 'Right'].includes(this.metaroom.selectedRoom.selectedPart)
			) {
				let p = nw.Window.get().window.p
				this.isExtrudingRoom = true
				this.xStart = p.mouseX
				this.yStart = p.mouseY
				this.xLast = p.mouseX
				this.yLast = p.mouseY
		}
	}

	deleteRoom() {
		if (this.metaroom && this.metaroom.selectedRoom) {
			let dialog = confirm('Are you sure you want to delete this room?')
			if (dialog) {
				this.metaroom.removeRoom(this.metaroom.selectedRoom)
			}
		}
	}
}
