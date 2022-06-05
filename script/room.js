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
		this.parentMetaroom.rooms.forEach((r1) => {
			r1.hasCollisions = false
			let top1 = [ { x: r1.xL, y: r1.yTL }, { x: r1.xR, y: r1.yTR } ]
			let bottom1 = [ { x: r1.xL, y: r1.yBL }, { x: r1.xR, y: r1.yBR } ]
			let left1 = [ { x: r1.xL, y: r1.yTL }, { x: r1.xL, y: r1.yBL } ]
			let right1 = [ { x: r1.xR, y: r1.yTR }, { x: r1.xR, y: r1.yBR } ]
			this.parentMetaroom.rooms.forEach((r2) => {
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
					// also check to see if one's inside the other
				}
			})
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
		this.checkCollisions()
	}

	setProperty(propName, propValue) {
		this[propName] = propValue
		this.checkConstraints()
		this.updatePositions()
		this.removeDoors()
		this.findDoors()
		this.checkCollisions()
	}

	findDoors() {
		this.parentMetaroom.rooms.forEach((r) => {
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
		]).then((result) => {
			if (result.filePaths.length > 0) {
				let filePath = result.filePaths[0]
				let fileName = filePath.match(/[^\\//]+?$/)[0]
				this.music = fileName.replace('.mng', '')
				this.parentMetaroom.setModified(true)
				updatePanel(this.parentMetaroom)
			}
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
