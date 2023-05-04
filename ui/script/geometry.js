const Geometry = {
	rectPolygon({ x, y, w, h }) {
		return {
			regions: [
				[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
			],
			inverted: false
		}
	},

	quadPolygon({ xL, yTL, yBL, xR, yTR, yBR }) {
		return {
			regions: [
				[[xL, yTL], [xR, yTR], [xR, yBR], [xL, yBL]]
			],
			inverted: false
		}
	},

	intersect(poly1, poly2) {
		const poly = PolyBool.intersect(poly1, poly2)
		return poly.regions.length >= 1
	},

	pointInCircle(px, py, cx, cy, cr) {
		let dSq = (px - cx)**2 + (py - cy)**2
		return dSq < cr ** 2
	},

	pointInRect(px, py, { x, y, w, h }) {
		return px >= x && px <= x + w && py >= y && py <= y + h
	},

	pointOnLine(px, py, x1, y1, x2, y2) {
		const d1 = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
		const d2 = Math.sqrt((px - x2) ** 2 + (py - y2) ** 2)
		const lineLength = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
		const buffer = 0.1
		return (d1 + d2 >= lineLength - buffer) && (d1 + d2 <= lineLength + buffer)
	},

	circleOnLine(cx, cy, cr, x1, y1, x2, y2) {
		// is either end inside the circle?
		const inside1 = this.pointInCircle(x1, y1, cx, cy, cr)
		const inside2 = this.pointInCircle(x2, y2, cx, cy, cr)
		if (inside1 || inside2) {
			return true
		}

		// find the closest point on the line
		const closest = this.closestPointOnLine(cx, cy, x1, y1, x2, y2)

		// is this point actually on the line segment?
		if (!this.pointOnLine(closest.x, closest.y, x1, y1, x2, y2)) {
			return false
		}

		// get distance to closest point
		const dx = closest.x - cx
		const dy = closest.y - cy
		const distSq = dx ** 2 + dy ** 2

		return distSq <= cr ** 2
	},

	closestPointOnLine(px, py, x1, y1, x2, y2) {
		// get length of the line
		let dx = x1 - x2
		let dy = y1 - y2
		const lenSq = dx ** 2 + dy ** 2

		// get dot product of the line and circle
		const dot = (((px-x1) * (x2-x1)) + ((py-y1) * (y2-y1))) / lenSq

		// find the closest point on the line
		return {
			x: x1 + (dot * (x2 - x1)),
			y: y1 + (dot * (y2 - y1))
		}
	}
}
