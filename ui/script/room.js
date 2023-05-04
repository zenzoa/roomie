class Room {

	constructor({ xL, yTL, yBL, xR, yTR, yBR }) {
		this.xL = xL || 0
		this.yTL = yTL || 0
		this.yBL = yBL || 0
		this.xR = xR || 0
		this.yTR = yTR || 0
		this.yBR = yBR || 0

		this.type = 0
		this.music = ''

		this.emitterClassifier = 1000
		this.smells = []

		this.hasCollision = false
	}

	static updateSidebar(room) {
		document.getElementById('room-type').value = room.type
		document.getElementById('room-music-value').innerText = room.music || '—'

		document.getElementById('room-x-left').value = room.xL
		document.getElementById('room-y-top-left').value = room.yTL
		document.getElementById('room-y-bottom-left').value = room.yBL
		document.getElementById('room-x-right').value = room.xR
		document.getElementById('room-y-top-right').value = room.yTR
		document.getElementById('room-y-bottom-right').value = room.yBR

		const topSlope = (room.yTR - room.yTL) / (room.xR - room.xL)
		const topSlopeDisplay = -Math.floor(topSlope * 100 * 100) / 100
		document.getElementById('room-top-slope').value = topSlopeDisplay + '%'

		const bottomSlope = (room.yBR - room.yBL) / (room.xR - room.xL)
		const bottomSlopeDisplay = -Math.floor(bottomSlope * 100 * 100) / 100
		document.getElementById('room-bottom-slope').value = bottomSlopeDisplay + '%'

		let smellListContents = ''
		for (const i in room.smells) {
			smellListContents += Smell.sidebarEntry(room.smells[i], i)
		}
		const smellList = document.getElementById('smell-list')
		smellList.innerHTML = smellListContents

		document.getElementById('room-emitter-classifier').value = room.emitterClassifier
	}

	static clone(room) {
		let newRoom = new Room(room)
		newRoom.type = room.type
		newRoom.music = room.music
		newRoom.emitterClassifier = room.emitterClassifier
		newRoom.smells = room.smells.slice()
		return newRoom
	}

	static draw(room, isSelected) {
		const { xL, yTL, yBL, xR, yTR, yBR } = this.getTempPositions(room, isSelected)
		const isLastSelected = room === UI.selectedRooms[UI.selectedRooms.length - 1]

		if (isSelected) {
			if (isLastSelected) { strokeWeight(4) }
			if (room.hasCollision) { stroke(200, 50, 50) }
		}

		if (UI.roomColorEnabled) {
			const alpha = 80
			if (room.type === 0) 		fill('#ffffff40')	// Atmosphere
			else if (room.type === 1)	fill('#f7cf91' + alpha)	// Wooden Walkway
			else if (room.type === 2)	fill('#c3a79c' + alpha)	// Concrete Walkway
			else if (room.type === 3)	fill('#3e3b66' + alpha)	// Indoor Concrete
			else if (room.type === 4)	fill('#4a5786' + alpha)	// Outdoor Concrete
			else if (room.type === 5)	fill('#a94b54' + alpha)	// Normal Soil
			else if (room.type === 6)	fill('#7a3b4f' + alpha)	// Boggy Soil
			else if (room.type === 7)	fill('#d8725e' + alpha)	// Drained Soil
			else if (room.type === 8)	fill('#6fb0b7' + alpha)	// Fresh Water
			else if (room.type === 9)	fill('#64b082' + alpha)	// Salt Water
			else if (room.type === 10)	fill('#e76d46' + alpha)	// Ettin Home
		}

		quad(xL, yTL, xL, yBL, xR, yBR, xR, yTR)

		if (isSelected) {
			if (isLastSelected) { strokeWeight(2) }
			if (room.hasCollision) { stroke(255) }
		}
	}

	static drawCorners(room) {
		const isLastSelected = room === UI.selectedRooms[UI.selectedRooms.length - 1]
		const { xL, yTL, yBL, xR, yTR, yBR } = this.getTempPositions(room, true)

		if (room.hasCollision) { fill(200, 50, 50) }

		const diameter = isLastSelected ? 10 : 7

		circle(xL, yTL, diameter)
		circle(xL, yBL, diameter)
		circle(xR, yBR, diameter)
		circle(xR, yTR, diameter)

		if (room.hasCollision) { fill(255) }
	}

	static drawSmells(room) {
		if (room.smells.length >= 1) {
			const { x, y } = Room.getCenter(room)
			circle(x, y, 10)
			circle(x, y, 17)
			circle(x, y, 24)
		}
	}

	static getTempPositions(room, isSelected) {
		const useTemp = UI.isDragging && isSelected && room.xL_temp && room.xR_temp
		const xL = useTemp ? room.xL_temp : room.xL
		const yTL = useTemp ? room.yTL_temp : room.yTL
		const yBL = useTemp ? room.yBL_temp : room.yBL
		const xR = useTemp ? room.xR_temp : room.xR
		const yTR = useTemp ? room.yTR_temp : room.yTR
		const yBR = useTemp ? room.yBR_temp : room.yBR
		return { xL, yTL, yBL, xR, yTR, yBR }
	}

	static startMove(room) {
		room.xL_temp = room.xL
		room.yTL_temp = room.yTL
		room.yBL_temp = room.yBL
		room.xR_temp = room.xR
		room.yTR_temp = room.yTR
		room.yBR_temp = room.yBR
	}

	static endMove(room) {
		room.xL = room.xL_temp
		room.yTL = room.yTL_temp
		room.yBL = room.yBL_temp
		room.xR = room.xR_temp
		room.yTR = room.yTR_temp
		room.yBR = room.yBR_temp

		delete room.xL_temp
		delete room.yTL_temp
		delete room.yBL_temp
		delete room.xR_temp
		delete room.yTR_temp
		delete room.yBR_temp
	}

	static move(room, dx, dy) {
		room.xL_temp = Math.floor(room.xL + dx)
		room.yTL_temp = Math.floor(room.yTL + dy)
		room.yBL_temp = Math.floor(room.yBL + dy)
		room.xR_temp = Math.floor(room.xR + dx)
		room.yTR_temp = Math.floor(room.yTR + dy)
		room.yBR_temp = Math.floor(room.yBR + dy)

		this.movePart(room, 'left-side', dx, dy, true)
		this.movePart(room, 'right-side', dx, dy, true)
		this.movePart(room, 'top-side', dx, dy, true)
		this.movePart(room, 'bottom-side', dx, dy, true)
	}

	static movePart(room, part, dx, dy, alreadyUpdatedTemp = false) {
		let xProps = []
		let yProps = []
		let isCorner = part.includes('corner')

		if (part === 'top-left-corner') {
			xProps.push('xL')
			yProps.push('yTL')
		} else if (part === 'bottom-left-corner') {
			xProps.push('xL')
			yProps.push('yBL')
		} else if (part === 'bottom-right-corner') {
			xProps.push('xR')
			yProps.push('yBR')
		} else if (part === 'top-right-corner') {
			xProps.push('xR')
			yProps.push('yTR')
		} else if (part === 'left-side') {
			xProps.push('xL')
			yProps.push('yTL')
			xProps.push('xL')
			yProps.push('yBL')
		} else if (part === 'right-side') {
			xProps.push('xR')
			yProps.push('yTR')
			xProps.push('xR')
			yProps.push('yBR')
		} else if (part === 'top-side') {
			xProps.push('xL')
			yProps.push('yTL')
			xProps.push('xR')
			yProps.push('yTR')
		} else if (part === 'bottom-side') {
			xProps.push('xL')
			yProps.push('yBL')
			xProps.push('xR')
			yProps.push('yBR')
		}

		if (!alreadyUpdatedTemp) {
			for (const xProp of xProps) {
				if (part === "top-side" || part === "bottom-side") {
					room[xProp + '_temp'] = Math.floor(room[xProp])
				} else {
					room[xProp + '_temp'] = Math.floor(room[xProp] + dx)
				}
			}
			for (const yProp of yProps) {
				room[yProp + '_temp'] = Math.floor(room[yProp] + dy)
			}
		}

		if (UI.snapEnabled > 0 && (xProps.length >= 1 || yProps.length >= 1)) {

			if (isCorner) {
				const snapCorner = this.getSnapCorner(room, room[xProps[0] + '_temp'], room[yProps[0] + '_temp'])
				if (snapCorner) {
					room[xProps[0] + '_temp'] = Math.floor(snapCorner.x)
					room[yProps[0] + '_temp'] = Math.floor(snapCorner.y)
				} else {
					if (yProps[0] === 'yTL' && Math.abs(room['yTL_temp'] - room['yTR_temp']) < SNAP_DIST) {
						room['yTL_temp'] = room['yTR_temp']
					} else if (yProps[0] === 'yTR' && Math.abs(room['yTL_temp'] - room['yTR_temp']) < SNAP_DIST) {
						room['yTR_temp'] = room['yTL_temp']
					} else if (yProps[0] === 'yBL' && Math.abs(room['yBL_temp'] - room['yBR_temp']) < SNAP_DIST) {
						room['yBL_temp'] = room['yBR_temp']
					} else if (yProps[0] === 'yBR' && Math.abs(room['yBL_temp'] - room['yBR_temp']) < SNAP_DIST) {
						room['yBR_temp'] = room['yBL_temp']
					}
				}

			} else {
				const snapSide = this.getSnapSide(room, part, room[xProps[0] + '_temp'], room[yProps[0] + '_temp'], room[xProps[1] + '_temp'], room[yProps[1] + '_temp'])
				if (snapSide) {
					room[xProps[0] + '_temp'] = Math.floor(snapSide.x1)
					room[yProps[0] + '_temp'] = Math.floor(snapSide.y1)
					room[xProps[1] + '_temp'] = Math.floor(snapSide.x2)
					room[yProps[1] + '_temp'] = Math.floor(snapSide.y2)
				}

				const snapCorner1 = this.getSnapCorner(room, room[xProps[0] + '_temp'], room[yProps[0] + '_temp'])
				if (snapCorner1) {
					room[xProps[0] + '_temp'] = Math.floor(snapCorner1.x)
					room[yProps[0] + '_temp'] = Math.floor(snapCorner1.y)
				}

				const snapCorner2 = this.getSnapCorner(room, room[xProps[1] + '_temp'], room[yProps[1] + '_temp'])
				if (snapCorner2) {
					room[xProps[1] + '_temp'] = Math.floor(snapCorner2.x)
					room[yProps[1] + '_temp'] = Math.floor(snapCorner2.y)
				}
			}
		}

		this.checkConstraints(room, part)
	}

	static getSnapCorner(room, x, y) {
		// check for corners
		for (const r of metaroom.rooms) {
			if (!UI.selectedRooms.includes(r)) {
				// snap to top-left corner
				if (Geometry.pointInCircle(x, y, r.xL, r.yTL, SNAP_DIST)) {
					return { x: r.xL, y: r.yTL }

				// snap to bottom-left corner
				} else if (Geometry.pointInCircle(x, y, r.xL, r.yBL, SNAP_DIST)) {
					return { x: r.xL, y: r.yBL }

				// snap to bottom-right corner
				} else if (Geometry.pointInCircle(x, y, r.xR, r.yBR, SNAP_DIST)) {
					return { x: r.xR, y: r.yBR }

				// snap to top-right corner
				} else if (Geometry.pointInCircle(x, y, r.xR, r.yTR, SNAP_DIST)) {
					return { x: r.xR, y: r.yTR }
				}
			}
		}

		// check for sides
		for (const r of metaroom.rooms) {
			if (!UI.selectedRooms.includes(r)) {
				// snap to left side
				if (Geometry.circleOnLine(x, y, SNAP_DIST, r.xL, r.yTL, r.xL, r.yBL)) {
					const point = Geometry.closestPointOnLine(x, y, r.xL, r.yTL, r.xL, r.yBL)
					if (Math.abs(point.x - x) > 1 || Math.abs(point.y - y) > 1) {
						return point
					}

				// snap to right side
				} else if (Geometry.circleOnLine(x, y, SNAP_DIST, r.xR, r.yTR, r.xR, r.yBR)) {
					const point = Geometry.closestPointOnLine(x, y, r.xR, r.yTR, r.xR, r.yBR)
					if (Math.abs(point.x - x) > 1 || Math.abs(point.y - y) > 1) {
						return point
					}

				// snap to top side
				} else if (Geometry.circleOnLine(x, y, SNAP_DIST, r.xL, r.yTL, r.xR, r.yTR)) {
					let point = Geometry.closestPointOnLine(x, y, r.xL, r.yTL, r.xR, r.yTR)
					let slope = (r.yTR - r.yTL)/(r.xR - r.xL)
					let perfectY = (point.x - r.xL) * slope + r.yTL
					if (Math.floor(point.y) > perfectY) {
						point.y = perfectY
					}
					if (Math.abs(point.x - x) > 1 || Math.abs(point.y - y) > 1) {
						return point
					}

				// snap to bottom side
				} else if (Geometry.circleOnLine(x, y, SNAP_DIST, r.xL, r.yBL, r.xR, r.yBR)) {
					let point = Geometry.closestPointOnLine(x, y, r.xL, r.yBL, r.xR, r.yBR)
					let slope = (r.yBR - r.yBL)/(r.xR - r.xL)
					let perfectY = (point.x - r.xL) * slope + r.yBL
					if (Math.floor(point.y) < perfectY) {
						point.y = perfectY
					}
					if (Math.abs(point.x - x) > 1 || Math.abs(point.y - y) > 1) {
						return point
					}
				}
			}
		}
	}

	static getSnapSide(room, part, x1, y1, x2, y2) {
		for (const r of metaroom.rooms) {
			if (!UI.selectedRooms.includes(r)) {
				// snap to right side
				if (part === 'left-side') {
					if (Geometry.circleOnLine(x1, y1, SNAP_DIST, r.xR, r.yTR, r.xR, r.yBR)) {
						let newY1 = Geometry.closestPointOnLine(x1, y1, r.xR, r.yTR, r.xR, r.yBR).y
						return { x1: r.xR, y1: newY1, x2: r.xR, y2: y2 }

					} else if (Geometry.circleOnLine(x2, y2, SNAP_DIST, r.xR, r.yTR, r.xR, r.yBR)) {
						let newY2 = Geometry.closestPointOnLine(x2, y2, r.xR, r.yTR, r.xR, r.yBR).y
						return { x1: r.xR, y1: y1, x2: r.xR, y2: newY2 }

					} else if (Geometry.circleOnLine(r.xR, r.yTR, SNAP_DIST, x1, y1, x2, y2)) {
						return { x1: r.xR, y1: y1, x2: r.xR, y2: y2 }

					} else if (Geometry.circleOnLine(r.xR, r.yBR, SNAP_DIST, x1, y1, x2, y2)) {
						return { x1: r.xR, y1: y1, x2: r.xR, y2: y2 }
					}

				// snap to left side
				} else if (part === 'right-side') {
					if (Geometry.circleOnLine(x1, y1, SNAP_DIST, r.xL, r.yTL, r.xL, r.yBL)) {
						let newY1 = Geometry.closestPointOnLine(x1, y1, r.xL, r.yTL, r.xL, r.yBL).y
						return { x1: r.xL, y1: newY1, x2: r.xL, y2: y2 }

					} else if (Geometry.circleOnLine(x2, y2, SNAP_DIST, r.xL, r.yTL, r.xL, r.yBL)) {
						let newY2 = Geometry.closestPointOnLine(x2, y2, r.xL, r.yTL, r.xL, r.yBL).y
						return { x1: r.xL, y1: y1, x2: r.xL, y2: newY2 }

					} else if (Geometry.circleOnLine(r.xL, r.yTL, SNAP_DIST, x1, y1, x2, y2)) {
						return { x1: r.xL, y1: y1, x2: r.xL, y2: y2 }

					} else if (Geometry.circleOnLine(r.xL, r.yBL, SNAP_DIST, x1, y1, x2, y2)) {
						return { x1: r.xL, y1: y1, x2: r.xL, y2: y2 }
					}

				// snap to bottom side
				} else if (part === 'top-side') {
					let slope = (r.yBR - r.yBL)/(r.xR - r.xL)
					if (Geometry.circleOnLine(x1, y1, SNAP_DIST, r.xL, r.yBL, r.xR, r.yBR) ||
						Geometry.circleOnLine(x2, y2, SNAP_DIST, r.xL, r.yBL, r.xR, r.yBR) ||
						Geometry.circleOnLine(r.xL, r.yBL, SNAP_DIST, x1, y1, x2, y2) ||
						Geometry.circleOnLine(r.xR, r.yBR, SNAP_DIST, x1, y1, x2, y2)) {
							const newY1 = Math.ceil(Geometry.closestPointOnLine(x1, y1, r.xL, r.yBL, r.xR, r.yBR).y)
							const newY2 = Math.ceil(Geometry.closestPointOnLine(x2, y2, r.xL, r.yBL, r.xR, r.yBR).y)
							return { x1: x1, y1: newY1, x2: x2, y2: newY2 }
					}

				// snap to top side
				} else if (part === 'bottom-side') {
					if (Geometry.circleOnLine(x1, y1, SNAP_DIST, r.xL, r.yTL, r.xR, r.yTR) ||
						Geometry.circleOnLine(x2, y2, SNAP_DIST, r.xL, r.yTL, r.xR, r.yTR) ||
						Geometry.circleOnLine(r.xL, r.yTL, SNAP_DIST, x1, y1, x2, y2) ||
						Geometry.circleOnLine(r.xR, r.yTR, SNAP_DIST, x1, y1, x2, y2)) {
							let newY1 = Math.floor(Geometry.closestPointOnLine(x1, y1, r.xL, r.yTL, r.xR, r.yTR).y)
							let newY2 = Math.floor(Geometry.closestPointOnLine(x2, y2, r.xL, r.yTL, r.xR, r.yTR).y)
							return { x1: x1, y1: newY1, x2: x2, y2: newY2 }
					}
				}
			}
		}
	}

	static checkConstraints(room, part) {
		const gap = UI.snapEnabled ? MIN_GAP : 1
		if ((part === 'top-left-corner' || part === 'bottom-left-corner' || part == 'left-side') &&
			room.xL_temp > room.xR_temp - gap) {
				room.xL_temp = room.xR_temp - gap
		} else if ((part === 'top-right-corner' || part === 'bottom-right-corner' || part === 'right-side') &&
			room.xR_temp < room.xL_temp + gap) {
				room.xR_temp = room.xL_temp + gap
		}

		if ((part === 'top-left-corner' || part === 'top-side') &&
			room.yTL_temp > room.yBL_temp - gap) {
				room.yTL_temp = room.yBL_temp - gap
		} else if ((part === 'bottom-left-corner' || part === 'bottom-side') &&
			room.yBL_temp < room.yTL_temp + gap) {
				room.yBL_temp = room.yTL_temp + gap
		}

		if ((part === 'top-right-corner' || part === 'top-side') &&
			room.yTR_temp > room.yBR_temp - gap) {
				room.yTR_temp = room.yBR_temp - gap
		} else if ((part === 'bottom-right-corner' || part === 'bottom-side') &&
			room.yBR_temp < room.yTR_temp + gap) {
				room.yBR_temp = room.yTR_temp + gap
		}
	}

	static checkCollisions() {
		for (const room of metaroom.rooms) {
			room.hasCollision = false
			const roomPoly = Geometry.quadPolygon(room)
			for (const r of metaroom.rooms) {
				if (r !== room && Geometry.intersect(roomPoly, Geometry.quadPolygon(r))) {
					room.hasCollision = true
				}
			}
			if (!Geometry.pointInRect(room.xL, room.yTL, { x: 0, y: 0, w: metaroom.w, h: metaroom.h }) ||
				!Geometry.pointInRect(room.xL, room.yBL, { x: 0, y: 0, w: metaroom.w, h: metaroom.h }) ||
				!Geometry.pointInRect(room.xR, room.yBR, { x: 0, y: 0, w: metaroom.w, h: metaroom.h }) ||
				!Geometry.pointInRect(room.xR, room.yTR, { x: 0, y: 0, w: metaroom.w, h: metaroom.h })) {
					room.hasCollision = true
			}
		}
	}

	static sideOverlap(r1, r2) {
		if (r1.xL === r2.xR && r1.yTL <= r2.yBR && r1.yBL >= r2.yTR) {
			// door on left
			return {
				x1: r1.xL,
				y1: Math.min(r1.yBL, r2.yBR),
				x2: r1.xL,
				y2: Math.max(r1.yTL, r2.yTR)
			}

		} else if (r1.xR === r2.xL && r1.yTR <= r2.yBL && r1.yBR >= r2.yTL) {
			// door on right
			return {
				x1: r1.xR,
				y1: Math.max(r1.yTR, r2.yTL),
				x2: r1.xR,
				y2: Math.min(r1.yBR, r2.yBL)
			}

		} else {
			// door at top
			let x1 = r1.xL
			let y1 = r1.yTL
			let x2 = r1.xR
			let y2 = r1.yTR

			let x3 = r2.xL
			let y3 = r2.yBL
			let x4 = r2.xR
			let y4 = r2.yBR

			let i1 = Geometry.pointOnLine(x1, y1, x3, y3, x4, y4)
			let i2 = Geometry.pointOnLine(x2, y2, x3, y3, x4, y4)
			let i3 = Geometry.pointOnLine(x3, y3, x1, y1, x2, y2)
			let i4 = Geometry.pointOnLine(x4, y4, x1, y1, x2, y2)

			if (i1 && i2) {
				return { x1: x1, y1: y1, x2: x2, y2: y2 }
			} else if (i3 && i4) {
				return { x1: x3, y1: y3, x2: x4, y2: y4 }
			} else if (i1 && i4) {
				return { x1: x1, y1: y1, x2: x4, y2: y4 }
			} else if (i2 && i3) {
				return { x1: x2, y1: y2, x2: x3, y2: y3 }
			}

			// door at bottom
			x1 = r1.xL
			y1 = r1.yBL
			x2 = r1.xR
			y2 = r1.yBR

			x3 = r2.xL
			y3 = r2.yTL
			x4 = r2.xR
			y4 = r2.yTR

			i1 = Geometry.pointOnLine(x1, y1, x3, y3, x4, y4)
			i2 = Geometry.pointOnLine(x2, y2, x3, y3, x4, y4)
			i3 = Geometry.pointOnLine(x3, y3, x1, y1, x2, y2)
			i4 = Geometry.pointOnLine(x4, y4, x1, y1, x2, y2)

			if (i1 && i2) {
				return { x1: x1, y1: y1, x2: x2, y2: y2 }
			} else if (i3 && i4) {
				return { x1: x3, y1: y3, x2: x4, y2: y4 }
			} else if (i1 && i4) {
				return { x1: x1, y1: y1, x2: x4, y2: y4 }
			} else if (i2 && i3) {
				return { x1: x2, y1: y2, x2: x3, y2: y3 }
			}
		}
	}

	static getCenter(room) {
		const isSelected = UI.selectedRooms.includes(room)
		const { xL, yTL, yBL, xR, yTR, yBR } = this.getTempPositions(room, isSelected)
		const x = xL + Math.floor((xR - xL) / 2)
		const yLeft = yTL + Math.floor((yBL - yTL) / 2)
		const yRight = yTR + Math.floor((yBR - yTR) / 2)
		const y = Math.min(yLeft, yRight) + Math.abs(Math.floor((yRight - yLeft) / 2))
		return { x, y }
	}

}

function changeRoomType() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-type')
		const type = parseInt(input.value)
		if (!isNaN(type) && type >= 0 && type <= 10) {
			saveState()
			room.type = type
		}
		UI.updateSidebar()
	}
}

function changeRoomMusic() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		Tauri.dialog.open({ filters: [{ name: 'Creatures Music File', extensions: ['mng'] }] })
		.then((filePath) => {
			Tauri.path.basename(filePath)
			.then((basename) => {
				saveState()
				room.music = basename.replace(/\.mng$/i, '')
				UI.updateSidebar()
			})
		})
	}
}

function changeRoomXL() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-x-left')
		const xL = parseInt(input.value)
		if (!isNaN(xL) && xL >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.xL = Math.min(xL, room.xR - gap)
		}
		UI.updateSidebar()
	}
}

function changeRoomYTL() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-y-top-left')
		const yTL = parseInt(input.value)
		if (!isNaN(yTL) && yTL >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.yTL = Math.min(yTL, room.yBL - gap)
		}
		UI.updateSidebar()
	}
}

function changeRoomYBL() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-y-bottom-left')
		const yBL = parseInt(input.value)
		if (!isNaN(yBL) && yBL >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.yBL = Math.max(yBL, room.yTL + gap)
		}
		UI.updateSidebar()
	}
}

function changeRoomXR() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-x-right')
		const xR = parseInt(input.value)
		if (!isNaN(xR) && xR >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.xR = Math.max(xR, room.xL + gap)
		}
		UI.updateSidebar()
	}
}

function changeRoomYTR() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-y-top-right')
		const yTR = parseInt(input.value)
		if (!isNaN(yTR) && yTR >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.yTR = Math.min(yTR, room.yBR - gap)
		}
		UI.updateSidebar()
	}
}

function changeRoomYBR() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-y-bottom-right')
		const yBR = parseInt(input.value)
		if (!isNaN(yBR) && yBR >= 0) {
			const gap = UI.snapEnabled ? MIN_GAP : 1
			saveState()
			room.yBR = Math.max(yBR, room.yTR + gap)
		}
		UI.updateSidebar()
	}
}
