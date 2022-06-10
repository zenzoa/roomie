class Sketch {
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

		this.mapWidth = 200000
		this.mapHeight = 200000
	}

	setup(p) {
		window.p = p
		p.createCanvas(p.windowWidth, p.windowHeight)
		updatePanel(this.metaroom)

		document.body.addEventListener('contextmenu', (event) => {
			event.preventDefault()
			return false
		}, false)

		let mainWindow = nw.Window.get()
		mainWindow.on('close', () => {
			let reallyClose = true
			if (this.metaroom && this.metaroom.isModified) {
				let response = confirm('Are you sure you want to quit without saving?')
				if (!response) {
					reallyClose = false
				}
			}
			if (reallyClose) {
				mainWindow.close(true)
				nw.App.quit()
			}
		})
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

		if (this.isDragging) {
			this.mouseReleased(p)
			return
		}

		let x2 = x / this.scale - this.xOffset
		let y2 = y / this.scale - this.yOffset

		this.xStart = x
		this.yStart = y
		this.xLast = x
		this.yLast = y

		window.api.roomSelect(false)
		window.api.edgeSelect(false)

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
							window.api.roomSelect(true)
						} else if (['Top', 'Bottom', 'Left', 'Right'].includes(this.metaroom.selectedRoom.selectedPart)) {
							window.api.edgeSelect(true)
						}
					}
				}
				if (!this.metaroom.somethingSelected()) {
					this.isPanning = true
				}
			}

		} else if (p.mouseButton === p.RIGHT) {
			this.metaroom && this.metaroom.selectObject(x2, y2, 'edge')
			this.isExtrudingRoom = true
		}
		updatePanel(this.metaroom)
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

		if (p.keyIsDown(p.SHIFT)) {
			if (Math.abs(x - this.xStart) > Math.abs(y - this.yStart)) {
				y = this.yStart
			} else {
				x = this.xStart
			}
		}

		this.xLast = x
		this.yLast = y

		let x2 = x / this.scale - this.xOffset
		let y2 = y / this.scale - this.yOffset

		let xStart2 = this.xStart / this.scale - this.xOffset
		let yStart2 = this.yStart / this.scale - this.yOffset

		if (this.isPanning) {
			this.xOffset += dx / this.scale
			this.yOffset += dy / this.scale

		} else if (this.isDragging && this.metaroom && this.metaroom.somethingSelected()) {
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
					if (side === 'Top' && rm.yTL > 10 && rm.yTR > 10) {
						newRoom = new Room(rm.xL, rm.xR, rm.yTL - 10, rm.yTR - 10, rm.yTL, rm.yTR)
						newRoom.selectedPart = 'Top'
					} else if (side === 'Bottom' && rm.yBL < this.metaroom.h - 10 && rm.yBR < this.metaroom.h - 10) {
						newRoom = new Room(rm.xL, rm.xR, rm.yBL, rm.yBR, rm.yBL + 10, rm.yBR + 10)
						newRoom.selectedPart = 'Bottom'
					} else if (side === 'Left' && rm.xL > 10) {
						newRoom = new Room(rm.xL, rm.xL + 10, rm.yTL, rm.yTL, rm.yBL, rm.yBL)
						newRoom.selectedPart = 'Left'
					} else if (side === 'Right' && rm.xR < this.metaroom.w - 10) {
						newRoom = new Room(rm.xR, rm.xR - 10, rm.yTR, rm.yTR, rm.yBR, rm.yBR)
						newRoom.selectedPart = 'Right'
					}
					if (newRoom) {
						this.metaroom.addRoom(newRoom)
						this.metaroom.selectedRoom = newRoom
						this.metaroom.startDrag(xStart2, yStart2)
						this.isDragging = true
					}
					this.isExtrudingRoom = false
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
			updatePanel(this.metaroom)
		}
	}

	mouseWheel(p, event) {
		if (event.delta > 0) {
			this.zoomIn()
		} else if (event.delta < 0) {
			this.zoomOut()
		}
	}

	resetZoom() {
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
		if (document.activeElement.tagName === 'INPUT') { return }
		if (p.key === 'a') {
			this.createRoom()
		} else if (p.key === 'e') {
			this.extrudeRoom()
		} else if (p.keyCode === p.BACKSPACE || p.keyCode === p.DELETE) {
			this.deleteRoom()
		} else if (p.keyCode === p.ESCAPE) {
			this.isCreatingRoom = false
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
		document.title = title
	}

	newMetaroom() {
		let createIt = () => {
			this.metaroom = new Metaroom()
			this.metaroom.favPlace.enabled = true
			window.api.metaroomOpen(true)
			window.api.bgImageOpen(false)
			this.xOffset = 20
			this.yOffset = 20
			this.scale = 1
			updatePanel(this.metaroom)
			this.updateTitle()
		}

		if (this.metaroom && this.metaroom.isModified) {
			window.api.showConfirmDialog('Are you sure you want to create a new metaroom?\nUnsaved changes will be lost.').then((response) => {
				if (response === 0) {
					createIt()
				}
			})
		} else {
			createIt()
		}
	}

	openMetaroom() {
		let openIt = () => {
			window.api.showOpenDialog('', [
				{ name: 'Scripts', extensions: ['cos'] },
				{ name: 'All Files', extensions: ['*'] }
			]).then((result) => {
				if (result.filePaths.length > 0) {
					let filePath = result.filePaths[0]
					window.api.readFile(filePath, 'utf8').then((data) => {
						try {
							const tokens = caos.parse(data)
							const m = caos.decode(tokens)
							this.metaroom = m

							window.api.metaroomOpen(true)
							window.api.bgImageOpen(false)

							this.metaroom.filename = filePath.match(/[^\\//]+?$/)[0]
							this.metaroom.path = filePath.match(/^.*[\\\/]/)[0]
							if (this.metaroom.bg !== '') {
								this.metaroom.loadBackground()
							}

							this.updateTitle()
							updatePanel(this.metaroom)

						} catch (error) {
							window.api.showErrorDialog('Unable to open metaroom. Invalid data.')
							console.log(error)
						}
					}).catch((error) => {
						window.api.showErrorDialog('Unable to open COS file.')
						console.log(error)
					})
				}
			})
		}

		if (this.metaroom && this.metaroom.isModified) {
			window.api.showConfirmDialog('Are you sure you want to open a new metaroom?\nUnsaved changes will be lost.').then((response) => {
				if (response === 0) {
					openIt()
				}
			})
		} else {
			openIt()
		}
	}

	saveMetaroom() {
		if (this.metaroom && this.metaroom.path) {
			if (this.metaroom.containsCollisions()) {
				window.api.showConfirmDialog('This metaroom contains overlapping rooms. Save anyway?').then((response) => {
					if (response === 0) {
						this.metaroom.save()
					}
				})
			} else {
				this.metaroom.save()
			}
		} else {
			this.saveMetaroomAs()
		}
		this.updateTitle()
	}

	saveMetaroomAs() {
		let openSaveDialog = () => {
			let defaultPath = this.metaroom.path || ''
			let defaultName = (this.metaroom.filename || 'untitled.cos')
			window.api.showSaveDialog(defaultPath, defaultName, [
				{ name: 'Scripts', extensions: ['cos'] },
				{ name: 'All Files', extensions: ['*'] }
			]).then((filePath) => {
				if (filePath) {
					this.metaroom.filename = filePath.match(/[^\\//]+?$/)[0]
					this.metaroom.path = filePath.match(/^.*[\\\/]/)[0]
					this.metaroom.save()
					this.updateTitle()
				}
			})
		}
		if (this.metaroom) {
			if (this.metaroom.containsCollisions()) {
				window.api.showConfirmDialog('This metaroom contains overlapping rooms. Save anyway?').then((response) => {
					if (response === 0) {
						openSaveDialog()
					}
				})
			} else {
				openSaveDialog()
			}
		}
	}

	exportBgAsBLK() {
		if (this.metaroom && this.metaroom.bgImage) {
			let defaultPath = (this.metaroom.path || '')
			let defaultName = (this.metaroom.bg || 'untitled') + '.blk'
			window.api.showSaveDialog(defaultPath, defaultName, [
				{ name: 'Images', extensions: ['blk'] },
				{ name: 'All Files', extensions: ['*'] }
			]).then((filePath) => {
				if (filePath) {
					this.metaroom.saveBgAsBLK(filePath)
				}
			})
		}
	}

	exportBgAsPNG() {
		if (this.metaroom && this.metaroom.bgImage) {
			this.metaroom.saveBgAsPNG()
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
				this.isExtrudingRoom = true
				this.xStart = window.p.mouseX
				this.yStart = window.p.mouseY
				this.xLast = window.p.mouseX
				this.yLast = window.p.mouseY
		}
	}

	deleteRoom() {
		if (this.metaroom && this.metaroom.selectedRoom) {
			window.api.showConfirmDialog('Are you sure you want to delete this room?').then((response) => {
				if (response === 0) {
					this.metaroom.removeRoom(this.metaroom.selectedRoom)
				}
			})
		}
	}
}

let s = (p) => {
	let sketch = new Sketch()

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

	window.sketch = sketch
}
new p5(s, 'sketch')
