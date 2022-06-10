let doorWeight = 2
let doorSelectedWeight = 4
let doorSelectDist = 6

class Metaroom {
	constructor(x = 0, y = 0, w = 800, h = 600, bg = '') {
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.path = ''
		this.filename = 'untitled.cos'

		this.bg = bg
		this.bgImage = null

		this.music = ''

		this.favPlace = new FavPlace(this)
		
		this.rooms = []
		this.doors = []
		
		this.selectedFavPlace = false
		this.selectedDoor = null
		this.selectedRoom = null
		this.selectedParts = []

		this.isModified = false

		this.ignoredLines = []
	}

	setModified(value) {
		this.isModified = value
		updatePanel(this)
	}

	setX(x) {
		if (x < 0) { x = 0 }
		if (x > window.sketch.mapWidth - this.w) { x = window.sketch.mapWidth - this.w }
		this.x = Math.floor(x)
		this.setModified(true)
	}

	setY(y) {
		if (y < 0) { y = 0 }
		if (y > window.sketch.mapHeight - this.h) { y = window.sketch.mapHeight - this.h }
		this.y = Math.floor(y)
		this.setModified(true)
	}

	setWidth(w) {
		if (w < 0) { w = 0 }
		if (w > window.sketch.mapWidth - this.x) { w = window.sketch.mapWidth - this.x }
		this.w = Math.floor(w)
		this.setModified(true)
	}

	setHeight(h) {
		if (h < 0) { h = 0 }
		if (h > window.sketch.mapHeight - this.y) { h = window.sketch.mapHeight - this.y }
		this.h = Math.floor(h)
		this.setModified(true)
	}

	addRoom(r) {
		r.parentMetaroom = this
		this.rooms.push(r)
	}

	removeRoom(r) {
		this.setModified(true)
		this.doors = this.doors.filter(d => {
			return d.r1 !== r && d.r2 !== r
		})
		this.rooms = this.rooms.filter(r2 => {
			return r !== r2
		})
	}

	addDoor(r1, r2, permeability = 100, init) {
		if (r1 === r2) { return }

		let p1, p2
		let collisionTB = geometry.lineLineOverlap(r1.xL, r1.yTL, r1.xR, r1.yTR, r2.xL, r2.yBL, r2.xR, r2.yBR)
		let collisionBT = geometry.lineLineOverlap(r1.xL, r1.yBL, r1.xR, r1.yBR, r2.xL, r2.yTL, r2.xR, r2.yTR)
		let collisionLR = geometry.lineLineOverlap(r1.xL, r1.yTL, r1.xL, r1.yBL, r2.xR, r2.yTR, r2.xR, r2.yBR)
		let collisionRL = geometry.lineLineOverlap(r1.xR, r1.yTR, r1.xR, r1.yBR, r2.xL, r2.yTL, r2.xL, r2.yBL)
		if (collisionTB) {
			p1 = collisionTB[0]
			p2 = collisionTB[1]
		} else if (collisionBT) {
			p1 = collisionBT[0]
			p2 = collisionBT[1]
		} else if (collisionLR) {
			p1 = collisionLR[0]
			p2 = collisionLR[1]
		} else if (collisionRL) {
			p1 = collisionRL[0]
			p2 = collisionRL[1]
		}

		if ((p1 && p2 && (p1.x !== p2.x || p1.y !== p2.y)) || init) {
			let existingDoor = false
			this.doors.forEach(d => {
				if ((d.r1 === r1 && d.r2 === r2) ||(d.r1 === r2 && d.r2 === r1)) {
					existingDoor = true
					d.active = true
					d.p1 = p1
					d.p2 = p2
				}
			})
			if (!existingDoor) {
				this.doors.push({
					active: true,
					r1: r1,
					r2: r2,
					p1: p1,
					p2: p2,
					permeability: permeability
				})
			}
			r1.links = r1.links.filter(l => l !== r2)
			r2.links = r2.links.filter(l => l !== r1)
		}
	}

	removeDoors(r) {
		this.doors.forEach(d => {
			if (d.r1 === r || d.r2 === r) {
				d.active = false
			}
		})
	}

	checkForDoor(r1, r2) {
		let door = null
		this.doors.forEach(d => {
			if (d.active && ((d.r1 === r1 && d.r2 === r2) || (d.r1 === r2 && d.r2 === r1))) {
				door = d
			}
		})
		return door
	}

	checkSides(a, b) {
		let i = geometry.lineLineIntersection(a[0].x, a[0].y, a[1].x, a[1].y, b[0].x, b[0].y, b[1].x, b[1].y)
		if (
			geometry.pointOnLine(a[0].x, a[0].y,  b[0].x, b[0].y, b[1].x, b[1].y) ||
			geometry.pointOnLine(a[1].x, a[1].y,  b[0].x, b[0].y, b[1].x, b[1].y) ||
			geometry.pointOnLine(b[0].x, b[0].y,  a[0].x, a[0].y, a[1].x, a[1].y) ||
			geometry.pointOnLine(b[1].x, b[1].y,  a[0].x, a[0].y, a[1].x, a[1].y)
		) {
			i = null
		}
		return i
	}

	checkCollisions() {
		this.rooms.forEach(r1 => {
			r1.hasCollisions = false
			let top1 = [ { x: r1.xL, y: r1.yTL }, { x: r1.xR, y: r1.yTR } ]
			let bottom1 = [ { x: r1.xL, y: r1.yBL }, { x: r1.xR, y: r1.yBR } ]
			let left1 = [ { x: r1.xL, y: r1.yTL }, { x: r1.xL, y: r1.yBL } ]
			let right1 = [ { x: r1.xR, y: r1.yTR }, { x: r1.xR, y: r1.yBR } ]
			this.rooms.forEach(r2 => {
				if (r1 !== r2) {
					let top2 = [ { x: r2.xL, y: r2.yTL }, { x: r2.xR, y: r2.yTR } ]
					let bottom2 = [ { x: r2.xL, y: r2.yBL }, { x: r2.xR, y: r2.yBR } ]
					let left2 = [ { x: r2.xL, y: r2.yTL }, { x: r2.xL, y: r2.yBL } ]
					let right2 = [ { x: r2.xR, y: r2.yTR }, { x: r2.xR, y: r2.yBR } ]
					if (this.checkSides(top1, top2) || this.checkSides(top1, bottom2) || this.checkSides(top1, left2) || this.checkSides(top1, right2)) {
						r1.hasCollisions = true
						return
					}
					if (this.checkSides(bottom1, top2) || this.checkSides(bottom1, bottom2) || this.checkSides(bottom1, left2) || this.checkSides(bottom1, right2)) {
						r1.hasCollisions = true
						return
					}
					if (this.checkSides(left1, top2) || this.checkSides(left1, bottom2) || this.checkSides(left1, left2) || this.checkSides(left1, right2)) {
						r1.hasCollisions = true
						return
					}
					if (this.checkSides(right1, top2) || this.checkSides(right1, bottom2) || this.checkSides(right1, left2) || this.checkSides(right1, right2)) {
						r1.hasCollisions = true
						return
					}
					if (r1.isPointInside(r2.xL, r2.yTL) && r1.isPointInside(r2.xR, r2.yTR) && r1.isPointInside(r2.xL, r2.yBL) && r1.isPointInside(r2.xR, r2.yBR)) {
						r1.hasCollisions = true
						return
					}
				}
			})
		})
	}

	isPointInside(x, y) {
		const tl = { x: this.x, y: this.y }
		const tr = { x: this.x + this.w, y: this.y }
		const br = { x: this.x + this.w, y: this.y + this.h }
		const bl = { x: this.x, y: this.y + this.h }
		return geometry.pointPolyCollision(x, y, { tl, tr, br, bl })
	}

	selectObject(x, y, type) {
		this.deselect()

		let tempObject = null

		if (!type) {
			if (geometry.pointCircleCollision(x, y, this.favPlace.x + this.favPlace.r, this.favPlace.y + this.favPlace.r, this.favPlace.r)) {
				this.selectedFavPlace = true
				return
			}
		}

		if (!type) {
			this.doors.forEach(d => {
				if (d.active && d.p1 && d.p2) {
					if (geometry.lineCircleCollision(d.p1.x, d.p1.y, d.p2.x, d.p2.y, x, y, doorSelectDist)) {
						this.selectedDoor = d
					}
				}
			})
		}

		if (type === 'corner' || !type) {
			this.rooms.forEach(r => {
				tempObject = r.selectCorner(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}

		if ((type === 'edge' || !type) && !this.selectedRoom) {
			this.rooms.forEach(r => {
				tempObject = r.selectEdge(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}

		if ((type === 'room' || !type) && !this.selectedRoom) {
			this.rooms.forEach(r => {
				tempObject = r.selectRoom(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}
	}

	somethingSelected() {
		return this.selectedFavPlace || this.selectedRoom
	}

	deselect() {
		this.selectedFavPlace = false
		this.selectedDoor = null
		this.selectedRoom = null
		this.selectedParts = []
	}

	startDrag(x, y) {
		if (this.selectedFavPlace) {
			this.setModified(true)
			this.favPlace.startDrag(x, y)
			return
		}
		if (this.selectedRoom) {
			this.setModified(true)
			this.selectedRoom.startDrag(x, y)
		}
		this.selectedParts.forEach(part => {
			if (part.room !== this.selectedRoom) {
				part.room.startDrag(x, y)
			}
		})
	}

	drag(x, y) {
		if (this.selectedFavPlace) {
			this.favPlace.drag(x, y)
			return
		}
		if (this.selectedRoom) {
			this.selectedRoom.drag(x, y)
		}
		this.selectedParts.forEach(part => {
			if (part.room !== this.selectedRoom) {
				part.room.drag(x, y)
			}
		})
	}

	endDrag(x, y) {
		if (this.selectedFavPlace) {
			this.favPlace.endDrag(x, y)
			return
		}
		if (this.selectedRoom) {
			this.selectedRoom.endDrag(x, y)
		}
		this.selectedParts.forEach(part => {
			if (part.room !== this.selectedRoom) {
				part.room.endDrag(x, y)
			}
		})
		this.checkCollisions()
	}

	chooseBackground() {
		window.api.showOpenDialog(this.path || '', [
			{ name: 'Images', extensions: ['png', 'blk'] },
			{ name: 'All Files', extensions: ['*'] }
		]).then(result => {
			if (result.filePaths.length > 0) {
				let filePath = result.filePaths[0]
				let fileName = filePath.match(/[^\\//]+?$/)[0]
				this.bg = fileName.replace('.png', '').replace('.blk', '')
				if (this.path === '') {
					this.path = filePath.match(/^.*[\\\/]/)[0]
				}
				this.loadBackground()
			}
		})
	}

	setBackground(image) {
		window.api.bgImageOpen(true)
		this.bgImage = image
		this.w = image.width
		this.h = image.height
		this.setModified(true)
	}

	loadBackground() {
		let setBackground = this.setBackground.bind(this)
		let filepath = this.path + this.bg
		if (window.api.doesFileExist(filepath + '.blk')) {
			this.loadBgFromBLK(filepath + '.blk', setBackground)
		} else if (window.api.doesFileExist(filepath + '.png')) {
			this.loadBgFromPNG(filepath + '.png', setBackground)
		}
	}

	loadBgFromPNG(filePath, onSuccess) {
		window.api.readFile(filePath, 'binary').then(data => {
			let str = 'data:image/png;base64,' + window.api.dataToString(data)
			window.p.loadImage(str, onSuccess, () => {
				window.api.showErrorDialog('Unable to load PNG file.')
			})
		}).catch(error => {
			window.api.showErrorDialog('Unable to load PNG file.')
			console.log(error)
		})
	}

	loadBgFromBLK(filePath, onSuccess) {
		window.api.readFile(filePath).then(data => {
			try {
				let image = blk.toImage(data)
				onSuccess(image)
			} catch (e) {
				window.api.showErrorDialog('Unable to load BLK file.')
				console.log(e)
			}
		}).catch(error => {
			window.api.showErrorDialog('Unable to load PNG file.')
			console.log(error)
		})
	}

	saveBgAsPNG() {
		if (this.bgImage) {
			this.bgImage.save(this.bg, 'png')
		}
	}

	saveBgAsBLK(filepath) {
		if (this.bgImage && filepath) {
			let data = blk.fromImage(this.bgImage)
			window.api.writeFile(filepath, data).catch(error => {
				window.api.showErrorDialog('Unable to save BLK file. File not accessible.')
				console.log(error)
			})
		}
	}

	chooseMusic() {
		window.api.showOpenDialog(this.path || '', [
			{ name: 'Music', extensions: ['mng'] },
			{ name: 'All Files', extensions: ['*'] }
		]).then(result => {
			if (result.filePaths.length > 0) {
				let filePath = result.filePaths[0]
				let fileName = filePath.match(/[^\\//]+?$/)[0]
				this.music = fileName.replace('.mng', '')
				this.setModified(true)
				updatePanel(this)
			}
		})
	}

	save() {
		this.setModified(false)
		let filepath = this.path + this.filename
		let contents = caos.encode(this)
		window.api.writeFile(filepath, contents).catch(error => {
			window.api.showErrorDialog('Unable to save metaroom. File not accessible.')
			console.log(error)
		})
	}

	containsCollisions() {
		return this.rooms.filter(r => r.hasCollisions).length > 0
	}

	drawDoors(p) {
		this.doors.forEach(d => {
			if (d.active && d.p1 && d.p2) {
				if (d === this.selectedDoor) {
					p.strokeWeight(doorSelectedWeight)
				} else {
					p.strokeWeight(doorWeight)
				}
				if (d.permeability >= 50) {
					let r = 1 - ((d.permeability - 50) / 50)
					p.stroke(Math.floor(r * 255), 255, 0)
				} else if (d.permeability < 50) {
					let b = d.permeability / 50
					p.stroke(255, Math.floor(b * 255), 0)
				}
				p.line(d.p1.x, d.p1.y, d.p2.x, d.p2.y)
			}
		})
	}

	draw(p) {
		if (this.bgImage) {
			p.image(this.bgImage, 0, 0)
		} else {
			p.fill(50, 50, 50)
			p.noStroke()
			p.rect(0, 0, this.w, this.h)
		}
		p.noFill()
		p.stroke(255, 0, 255)
		p.strokeWeight(4)
		p.rect(0, 0, this.w, this.h)

		this.rooms.forEach(r => {
			r.drawLinks(p, this.selectedRoom)
		})
		this.rooms.forEach(r => {
			r.drawRoom(p, this.selectedRoom)
		})
		this.rooms.forEach(r => {
			r.drawEdges(p, this.selectedRoom)
		})
		this.drawDoors(p)
		this.rooms.forEach(r => {
			r.drawCorners(p, this.selectedRoom)
		})

		if (this.favPlace.enabled) {
			this.favPlace.draw(p, this.selectedFavPlace)
		}
	}
}
