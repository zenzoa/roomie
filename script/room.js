let edgeWeight = 2
let edgeSelectedWeight = 4
let edgeSelectDist = 6

let cornerRadius = 5
let cornerSelectedRadius = 7
let cornerSelectDist = 7
let snapDist = 10

class Room {
	constructor(xL = 0, xR = 0, yTL = 0, yTR = 0, yBL = 0, yBR = 0) {
		this.parentMetaroom = null
		this.type = 0
		this.music = ''

		this.emitterClassifier = 1000
		this.smells = []

		this.links = []

		this.xL = xL
		this.xR = xR
		this.yTL = yTL
		this.yTR = yTR
		this.yBL = yBL
		this.yBR = yBR

		this.xLStart = xL
		this.xRStart = xR
		this.yTLStart = yTL
		this.yTRStart = yTR
		this.yBLStart = yBL
		this.yBRStart = yBR

		this.selectedPart = null

		this.xDrag = 0
		this.yDrag = 0

		this.sides = [ 'Top', 'Bottom', 'Left', 'Right' ]
		this.corners = [ 'TL', 'TR', 'BL', 'BR' ]

		this.hasCollisions = false
	}

	setType(type) {
		this.type = type
		this.parentMetaroom.setModified(true)
	}

	setProperty(propName, propValue) {
		this[propName] = propValue
		this.checkConstraints()
		this.updatePositions()
		this.removeDoors()
		this.findDoors()
		updatePanel(this.parentMetaroom)
	}

	getCorners() {
		return [
			{ x: this.xL, y: this.yTL },
			{ x: this.xR, y: this.yTR },
			{ x: this.xR, y: this.yBR },
			{ x: this.xL, y: this.yBL }
		]
	}

	getCornersTable() {
		return {
			tl: { x: this.xL, y: this.yTL },
			tr: { x: this.xR, y: this.yTR },
			br: { x: this.xR, y: this.yBR },
			bl: { x: this.xL, y: this.yBL }
		}
	}

	getCenter() {
		let xRoomCenter = this.xL + Math.floor((this.xR - this.xL) / 2)
		let yRoomCenterLeft = this.yTL + Math.floor((this.yBL - this.yTL) / 2)
		let yRoomCenterRight = this.yTR + Math.floor((this.yBR - this.yTR) / 2)
		let yRoomCenter = Math.min(yRoomCenterLeft, yRoomCenterRight) + Math.abs(Math.floor((yRoomCenterRight - yRoomCenterLeft) / 2))
		return {
			x: xRoomCenter,
			y: yRoomCenter
		}
	}

	oppositeSide(side) {
		if (side === 'Top') {
			return 'Bottom'
		} else if (side === 'Bottom') {
			return 'Top'
		} else if (side === 'Left') {
			return 'Right'
		} else {
			return 'Left'
		}
	}

	isPointInside(x, y) {
		return geometry.pointPolyCollision(x, y, this.getCorners())
	}

	updatePositions() {
		this.xL = Math.floor(this.xL)
		this.xR = Math.floor(this.xR)
		this.yTL = Math.floor(this.yTL)
		this.yTR = Math.floor(this.yTR)
		this.yBL = Math.floor(this.yBL)
		this.yBR = Math.floor(this.yBR)
	}

	snapToCorners() {
		this.parentMetaroom.rooms.forEach((r) => {
			if (r !== this) {
				let r1 = this.getCornersTable()
				let r2 = r.getCornersTable()

				if (geometry.distance(r1.tl, r2.tr) < snapDist) {
					this.xL = r2.tr.x
					this.yTL = r2.tr.y
				} else if (geometry.distance(r1.tl, r2.bl) < snapDist) {
					this.xL = r2.bl.x
					this.yTL = r2.bl.y
				} else if (geometry.distance(r1.tl, r2.br) < snapDist) {
					this.xL = r2.br.x
					this.yTL = r2.br.y
				}

				if (geometry.distance(r1.tr, r2.tl) < snapDist) {
					this.xR = r2.tl.x
					this.yTR = r2.tl.y
				} else if (geometry.distance(r1.tr, r2.br) < snapDist) {
					this.xR = r2.br.x
					this.yTR = r2.br.y
				} else if (geometry.distance(r1.tr, r2.bl) < snapDist) {
					this.xR = r2.bl.x
					this.yTR = r2.bl.y
				}

				if (geometry.distance(r1.bl, r2.br) < snapDist) {
					this.xL = r2.br.x
					this.yBL = r2.br.y
				} else if (geometry.distance(r1.bl, r2.tl) < snapDist) {
					this.xL = r2.tl.x
					this.yBL = r2.tl.y
				} else if (geometry.distance(r1.bl, r2.tr) < snapDist) {
					this.xL = r2.tr.x
					this.yBL = r2.tr.y
				}

				if (geometry.distance(r1.br, r2.bl) < snapDist) {
					this.xR = r2.bl.x
					this.yBR = r2.bl.y
				} else if (geometry.distance(r1.br, r2.tr) < snapDist) {
					this.xR = r2.tr.x
					this.yBR = r2.tr.y
				} else if (geometry.distance(r1.br, r2.tl) < snapDist) {
					this.xR = r2.tl.x
					this.yBR = r2.tl.y
				}
			}
		})
	}

	snapToEdges() {
		this.parentMetaroom.rooms.forEach((r) => {
			if (r !== this) {
				if (geometry.lineCircleCollision(r.xR, r.yTR, r.xR, r.yBR, this.xL, this.yTL, snapDist) ||
					geometry.lineCircleCollision(r.xR, r.yTR, r.xR, r.yBR, this.xL, this.yBL, snapDist)) { //||
					// Math.abs(this.xL - r.xR) < snapDist) {
						this.xL = r.xR
				}
				if (geometry.lineCircleCollision(r.xL, r.yTL, r.xL, r.yBL, this.xR, this.yTR, snapDist) ||
					geometry.lineCircleCollision(r.xL, r.yTL, r.xL, r.yBL, this.xR, this.yBR, snapDist)) { //||
					// Math.abs(this.xR - r.xL) < snapDist) {
						this.xR = r.xL
				}
				if (geometry.lineCircleCollision(r.xL, r.yBL, r.xR, r.yBR, this.xL, this.yTL, snapDist)) {
					let slope = (r.yBR - r.yBL) / (r.xR - r.xL)
					this.yTL = r.yBR - slope * (r.xR - this.xL)
				}
				if (geometry.lineCircleCollision(r.xL, r.yBL, r.xR, r.yBR, this.xR, this.yTR, snapDist)) {
					let slope = (r.yBR - r.yBL) / (r.xR - r.xL)
					this.yTR = r.yBL + slope * (this.xR - r.xL)
				}
				if (geometry.lineCircleCollision(r.xL, r.yTL, r.xR, r.yTR, this.xL, this.yBL, snapDist)) {
					let slope = (r.yTR - r.yTL) / (r.xR - r.xL)
					this.yBL = r.yTR - slope * (r.xR - this.xL)
				}
				if (geometry.lineCircleCollision(r.xL, r.yTL, r.xR, r.yTR, this.xR, this.yBR, snapDist)) {
					let slope = (r.yTR - r.yTL) / (r.xR - r.xL)
					this.yBR = r.yTL + slope * (this.xR - r.xL)
				}
			}
		})
	}

	checkConstraints() {
		if (this.xL < 0) {
			this.xL = 0
		}
		if (this.xR > this.parentMetaroom.w) {
			this.xR = this.parentMetaroom.w
		}
		if (this.yTL < 0) {
			this.yTL = 0
		}
		if (this.yTR < 0) {
			this.yTR = 0
		}
		if (this.yBL > this.parentMetaroom.h) {
			this.yBL = this.parentMetaroom.h
		}
		if (this.yBR > this.parentMetaroom.h) {
			this.yBR = this.parentMetaroom.h
		}

		if (this.yTL !== this.yTLStart && this.yTL > this.yBL - 10) {
			this.yTL = this.yBL - 10
		} else if (this.yBL !== this.yBLStart && this.yBL < this.yTL + 10) {
			this.yBL = this.yTL + 10
		}

		if (this.yTR !== this.yTRStart && this.yTR > this.yBR - 10) {
			this.yTR = this.yBR - 10
		} else if (this.yBR !== this.yBRStart && this.yBR < this.yTR + 10) {
			this.yBR = this.yTR + 10
		}

		if (this.xL !== this.xLStart && this.xL > this.xR - 10) {
			this.xL = this.xR - 10
		} else if (this.xR !== this.xRStart && this.xR < this.xL + 10) {
			this.xR = this.xL + 10
		}
	}

	startDrag(x, y) {
		this.xDrag = x
		this.yDrag = y

		this.xLStart = this.xL
		this.xRStart = this.xR
		this.yTLStart = this.yTL
		this.yTRStart = this.yTR
		this.yBLStart = this.yBL
		this.yBRStart = this.yBR
		
		this.removeDoors()
	}

	drag(x, y) {
		let dx = x - this.xDrag
		let dy = y - this.yDrag

		const dragRoom = () => {
			this.xL = this.xLStart + dx
			this.xR = this.xRStart + dx
			this.yTL = this.yTLStart + dy
			this.yTR = this.yTRStart + dy
			this.yBL = this.yBLStart + dy
			this.yBR = this.yBRStart + dy
		}

		const dragEdge = () => {
			if (this.selectedPart === 'Top') {
				this.yTL = this.yTLStart + dy
				this.yTR = this.yTRStart + dy
			} else if (this.selectedPart === 'Bottom') {
				this.yBL = this.yBLStart + dy
				this.yBR = this.yBRStart + dy
			} else if (this.selectedPart === 'Left') {
				this.xL = this.xLStart + dx
				this.yTL = this.yTLStart + dy
				this.yBL = this.yBLStart + dy
			} else if (this.selectedPart === 'Right') {
				this.xR = this.xRStart + dx
				this.yTR = this.yTRStart + dy
				this.yBR = this.yBRStart + dy
			}
		}

		const dragCorner = () => {
			if (this.selectedPart === 'TL') {
				this.xL = this.xLStart + dx
				this.yTL = this.yTLStart + dy
			} else if (this.selectedPart === 'TR') {
				this.xR = this.xRStart + dx
				this.yTR = this.yTRStart + dy
			} else if (this.selectedPart === 'BR') {
				this.xR = this.xRStart + dx
				this.yBR = this.yBRStart + dy
			} else if (this.selectedPart === 'BL') {
				this.xL = this.xLStart + dx
				this.yBL = this.yBLStart + dy
			}
		}

		if (this.selectedPart === 'Room') {
			dragRoom()
		} else if (this.selectedPart === 'Top' || this.selectedPart === 'Bottom' || this.selectedPart === 'Left' || this.selectedPart === 'Right') {
			dragEdge()
		} else if (this.selectedPart === 'TL' || this.selectedPart === 'TR' || this.selectedPart === 'BL' || this.selectedPart === 'BR') {
			dragCorner()
		}

		this.snapToCorners()
		this.snapToEdges()
		this.checkConstraints()
		this.updatePositions()
	}

	endDrag() {
		this.removeDoors()
		this.findDoors()
	}

	findDoors() {
		this.parentMetaroom.rooms.forEach(r => {
			this.parentMetaroom.addDoor(this, r)
		})
	}

	removeDoors() {
		this.parentMetaroom.removeDoors(this)
	}

	selectRoom(x, y) {
		if (this.isPointInside(x, y)) {
			this.selectedPart = 'Room'
			return this
		}
	}

	selectEdge(x, y) {
		this.selectedPart = null

		if (geometry.lineCircleCollision(this.xL, this.yTL, this.xR, this.yTR, x, y, edgeSelectDist)) {
			this.selectedPart = 'Top'
		} else if (geometry.lineCircleCollision(this.xL, this.yBL, this.xR, this.yBR, x, y, edgeSelectDist)) {
			this.selectedPart = 'Bottom'
		} else if (geometry.lineCircleCollision(this.xL, this.yTL, this.xL, this.yBL, x, y, edgeSelectDist)) {
			this.selectedPart = 'Left'
		} else if (geometry.lineCircleCollision(this.xR, this.yTR, this.xR, this.yBR, x, y, edgeSelectDist)) {
			this.selectedPart = 'Right'
		}

		if (this.selectedPart) {
			return this
		}
	}

	selectCorner(x, y) {
		this.selectedPart = null

		if (geometry.pointCircleCollision(x, y, this.xL, this.yTL, cornerSelectDist)) {
			this.selectedPart = 'TL'
		} else if (geometry.pointCircleCollision(x, y, this.xR, this.yTR, cornerSelectDist)) {
			this.selectedPart = 'TR'
		} else if (geometry.pointCircleCollision(x, y, this.xR, this.yBR, cornerSelectDist)) {
			this.selectedPart = 'BR'
		} else if (geometry.pointCircleCollision(x, y, this.xL, this.yBL, cornerSelectDist)) {
			this.selectedPart = 'BL'
		}

		if (this.selectedPart) {
			return this
		}
	}

	chooseMusic() {
		window.api.showOpenDialog(this.parentMetaroom.path || '', [
			{ name: 'Music', extensions: ['mng'] },
			{ name: 'All Files', extensions: ['*'] }
		]).then(result => {
			if (result.filePaths.length > 0) {
				let filePath = result.filePaths[0]
				let fileName = filePath.match(/[^\\//]+?$/)[0]
				this.music = fileName.replace('.mng', '')
				this.parentMetaroom.setModified(true)
			}
		})
	}

	addSmell(caIndex = 15, amount = 0.02) {
		this.smells.push({ caIndex, amount })
		this.parentMetaroom.setModified(true)
	}

	removeSmell(index) {
		window.api.showConfirmDialog('Are you sure you want to remove this smell?').then(response => {
			if (response === 0) {
				this.smells.splice(index, 1)
				this.parentMetaroom.setModified(true)
			}
		})
	}

	addLink(otherRoom) {
		let roomsAreConnected = false
		this.parentMetaroom.doors.forEach((d) => {
			if (!d.active) { return }
			if ((d.r1 === this && d.r2 === otherRoom) || d.r1 === otherRoom && d.r2 === this) {
				roomsAreConnected = true
			}
		})
		if (!roomsAreConnected) {
			if (!this.links.includes(otherRoom)) {
				this.links.push(otherRoom)
			}
			if (!otherRoom.links.includes(this)) {
				otherRoom.links.push(this)
			}
		}
	}

	removeLinks() {
		this.links.forEach(otherRoom => {
			otherRoom.links = otherRoom.links.filter(l => l !== this)
		})
		this.links = []
	}

	drawLinks(p, selectedRoom) {
		p.fill(0, 255, 255)
		p.stroke(0, 255, 255)
		p.strokeWeight(1)
		let roomCenter = this.getCenter()
		this.links.forEach(otherRoom => {
			let otherCenter = otherRoom.getCenter()
			p.line(roomCenter.x, roomCenter.y, otherCenter.x, otherCenter.y)
			p.circle(roomCenter.x, roomCenter.y, selectedRoom === this ? 6 : 2)
			p.circle(otherCenter.x, otherCenter.y, 2)
		})
	}

	drawRoom(p, selectedRoom) {
		if (this === selectedRoom && this.selectedPart === 'Room') {
			p.fill(255, 100)
			p.noStroke()
			p.quad(
				this.xL, this.yTL,
				this.xR, this.yTR,
				this.xR, this.yBR,
				this.xL, this.yBL
			)
		}
		if (this.hasCollisions) {
			p.fill(255, 0, 0, 100)
			p.noStroke()
			p.quad(
				this.xL, this.yTL,
				this.xR, this.yTR,
				this.xR, this.yBR,
				this.xL, this.yBL
			)
		}
	}

	drawEdges(p, selectedRoom) {
		const drawEdge = (name, x1, y1, x2, y2) => {
			p.stroke(255)
			if (this === selectedRoom && this.selectedPart === name) {
				p.strokeWeight(edgeSelectedWeight)
			} else {
				p.strokeWeight(edgeWeight)
			}
			p.line(x1, y1, x2, y2)
		}
		drawEdge('Top', this.xL, this.yTL, this.xR, this.yTR)
		drawEdge('Bottom', this.xL, this.yBL, this.xR, this.yBR)
		drawEdge('Left', this.xL, this.yTL, this.xL, this.yBL)
		drawEdge('Right', this.xR, this.yTR, this.xR, this.yBR)

		if (this.smells.length > 0) {
			let roomCenter = this.getCenter()
			p.noFill()
			p.stroke(0, 255, 255)
			p.strokeWeight(1)
			p.circle(roomCenter.x, roomCenter.y, 10)
			p.circle(roomCenter.x, roomCenter.y, 17)
			p.circle(roomCenter.x, roomCenter.y, 24)
		}

		if (this === selectedRoom) {
			let slope = (this.yBR - this.yBL) / (this.xR - this.xL)
			let displaySlope = Math.abs(Math.floor(slope * 100 * 100)) / 100
			if (displaySlope !== 0) {
				let rotation = Math.atan2(this.yBR - this.yBL, this.xR - this.xL)
				p.push()
				p.translate(this.xL, this.yBL)
				p.rotate(rotation)
				p.fill(255)
				p.noStroke()
				p.text('Slope = ' + displaySlope + '%', 5, 15)
				p.pop()
			}
		}
	}

	drawCorners(p, selectedRoom) {
		const drawCorner = (name, x, y) => {
			let r = cornerRadius
			if (this === selectedRoom && this.selectedPart === name) {
				r = cornerSelectedRadius
			}
			p.fill(255)
			p.noStroke()
			p.circle(x, y, r * 2)
		}
		drawCorner('TL', this.xL, this.yTL)
		drawCorner('TR', this.xR, this.yTR)
		drawCorner('BL', this.xL, this.yBL)
		drawCorner('BR', this.xR, this.yBR)
	}
}
