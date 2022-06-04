const fs = require('fs')
const geometry = require('./geometry')
const caos = require('./caos')
const panel = require('./panel')

let doorWeight = 2
let doorSelectedWeight = 4
let doorSelectDist = 6

exports.Metaroom = class Metaroom {
	constructor(x = 0, y = 0, w = 800, h = 600, bg = '') {
		this.x = x
		this.y = y
		this.w = w
		this.h = h

		this.path = ''
		this.filename = 'untitled'

		this.bg = bg
		this.bgImage = null

		this.music = ''

		this.rooms = []
		this.doors = []
		
		this.selectedDoor = null
		this.selectedRoom = null
		this.selectedParts = []

		this.isModified = false
	}

	addRoom(r) {
		r.parentMetaroom = this
		this.rooms.push(r)
	}

	removeRoom(r) {
		this.isModified = true
		this.doors = this.doors.filter((d) => {
			return d.r1 !== r && d.r2 !== r
		})
		this.rooms = this.rooms.filter((r2) => {
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

		if ((p1 && p2) || init) {
			let existingDoor = false
			this.doors.forEach((d) => {
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
		}
	}

	removeDoors(r) {
		this.doors.forEach((d) => {
			if (d.r1 === r || d.r2 === r) {
				d.active = false
			}
		})
	}

	checkForDoor(r1, r2) {
		let door = null
		this.doors.forEach((d) => {
			if (d.active && ((d.r1 === r1 && d.r2 === r2) || (d.r1 === r2 && d.r2 === r1))) {
				door = d
			}
		})
		return door
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
			this.doors.forEach((d) => {
				if (d.active && d.p1 && d.p2) {
					if (geometry.lineCircleCollision(d.p1.x, d.p1.y, d.p2.x, d.p2.y, x, y, doorSelectDist)) {
						this.selectedDoor = d
					}
				}
			})
		}

		if (type === 'corner' || !type) {
			this.rooms.forEach((r) => {
				tempObject = r.selectCorner(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}

		if ((type === 'edge' || !type) && !this.selectedRoom) {
			this.rooms.forEach((r) => {
				tempObject = r.selectEdge(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}

		if ((type === 'room' || !type) && !this.selectedRoom) {
			this.rooms.forEach((r) => {
				tempObject = r.selectRoom(x, y)
				if (tempObject) {
					this.selectedRoom = tempObject
					this.selectedParts.push({ room: tempObject })
				}
			})
		}
	}

	deselect() {
		this.selectedDoor = null
		this.selectedRoom = null
		this.selectedParts = []
	}

	startDrag(x, y) {
		if (this.selectedRoom) {
			this.isModified = true
			this.selectedRoom.startDrag(x, y)
		}
		this.selectedParts.forEach((part) => {
			if (part.room !== this.selectedRoom) {
				part.room.startDrag(x, y)
			}
		})
	}

	drag(x, y) {
		if (this.selectedRoom) {
			this.selectedRoom.drag(x, y)
		}
		this.selectedParts.forEach((part) => {
			if (part.room !== this.selectedRoom) {
				part.room.drag(x, y)
			}
		})
	}

	endDrag(x, y) {
		if (this.selectedRoom) {
			this.selectedRoom.endDrag(x, y)
		}
		this.selectedParts.forEach((part) => {
			if (part.room !== this.selectedRoom) {
				part.room.endDrag(x, y)
			}
		})
	}

	loadBackground() {
		let filePath = this.path + this.bg + '.png'
		fs.readFile(filePath, 'binary', (error, data) => {
			if (!error) {
				let buf = new Buffer(data, 'binary')
				let str = 'data:image/png;base64,' + buf.toString('base64')
				let p = nw.Window.get().window.p
				this.bgImage = p.loadImage(str, () => {
					this.w = this.bgImage.width
					this.h = this.bgImage.height
					panel.update(this)
				})
			}
		})
	}

	chooseBackground() {
		const fileInput = nw.Window.get().window.document.getElementById('fileOpen')
		fileInput.accept = '.png,.blk'
		if (this.path) {
			fileInput.nwworkingdir = this.path
		}
		fileInput.onchange = (event) => {
			const file = event.target.files[0]
			if (file) {
				this.bg = file.name.replace('.png', '').replace('.blk', '')
				if (this.path === '') {
					this.path = file.path.match(/^.*[\\\/]/)[0]
				}
				this.loadBackground()
				panel.update(this)
			}
		}
		fileInput.click()
	}

	chooseMusic() {
		const fileInput = nw.Window.get().window.document.getElementById('fileOpen')
		fileInput.accept = '.mng'
		if (this.path) {
			fileInput.nwworkingdir = this.path
		}
		fileInput.onchange = (event) => {
			const file = event.target.files[0]
			if (file) {
				this.music = file.name.replace('.mng', '')
				panel.update(this)
			}
		}
		fileInput.click()
	}

	save(filepath) {
		if (this.containsCollisions()) {
			let dialog = confirm('This metaroom contains overlapping rooms.\nSave anyway?')
			if (!dialog) {
				return
			}
		}
		this.isModified = false
		filepath = filepath || (this.path + this.filename)
		let contents = caos.encode(this)
		fs.writeFile(filepath, contents, (error) => {
			if (error) {
				alert('Unable to save metaroom. File not accessible.')
				console.log(error)
			}
		})
	}

	containsCollisions() {
		return this.rooms.filter(r => r.hasCollisions).length > 0
	}

	drawDoors(p) {
		this.doors.forEach((d) => {
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

		this.rooms.forEach((r) => {
			r.drawRoom(p, this.selectedRoom)
		})
		this.rooms.forEach((r) => {
			r.drawEdges(p, this.selectedRoom)
		})
		this.drawDoors(p)
		this.rooms.forEach((r) => {
			r.drawCorners(p, this.selectedRoom)
		})
	}
}