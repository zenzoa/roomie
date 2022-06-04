exports.length = (x, y) => {
	return Math.sqrt(x**2 + y**2)
}

exports.distance = (a, b) => {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

exports.normalize = (a) => {
	let len = exports.length(a.x, a.y)
	return {
		x: a.x / len,
		y: a.y / len
	}
}

exports.dotProduct = (a, b) => {
	let ret = 0
	for (let i = 0; i < a.length; i++) {
		ret = ret + a[i] * b[i]
	}
	return ret
}

exports.pointPolyCollision = (x, y, poly) => {
	let vertexCount = poly.length
	let i = 0
	let j = 0
	let isPointInPolygon = false

	for (i = 0; i < vertexCount; i++) {
		if (i === vertexCount - 1) {
			j = 0
		} else {
			j = i + 1
		}

		let ax = poly[i].x
		let ay = poly[i].y
		let bx = poly[j].x
		let by = poly[j].y

		let belowLowY = ay > y
		let belowHighY = by > y
		let withinYs = belowLowY !== belowHighY

		if (withinYs) {
			let slope = (bx - ax) / (by - ay)
			let pointOnLine = slope * (y - ay) + ax
			let isLeftOfLine = x < pointOnLine
			if (isLeftOfLine) {
				isPointInPolygon = !isPointInPolygon
			}
		}
	}

	return isPointInPolygon
}

exports.polyPolyCollision = (verticesA, verticesB) => {
	for (let current = 0; current < verticesA.length; current++) {
		let next = current + 1
		if (next >= verticesA.length) {
			next = 0
		}
		let vc = verticesA[current]
		let vn = verticesA[next]
		let collision = exports.polyLineCollision(verticesB, vc.x, vc.y, vn.x, vn.y)
		if (collision) {
			return true
		} else if (exports.pointPolyCollision(verticesB[1].x, verticesB[1].y, verticesA)) {
			return true
		} else if (exports.pointPolyCollision(verticesA[1].x, verticesA[1].y, verticesB)) {
			return true
		}
	}
	return false
}

exports.polyLineCollision = (vertices, x1, y1, x2, y2) => {
	for (let current = 0; current < vertices.length; current++) {
		let next = current + 1
		if (next >= vertices.length) {
			next = 0
		}
		let x3 = vertices[current].x
		let y3 = vertices[current].y
		let x4 = vertices[next].x
		let y4 = vertices[next].y
		let collision = exports.lineLineCollision(x1, y1, x2, y2, x3, y3, x4, y4)
		if (collision) {
			return true
		}
	}
	return false
}

exports.lineLineOverlap = (x1, y1, x2, y2, x3, y3, x4, y4) => {
	let i1 = exports.pointOnLine(x1, y1, x3, y3, x4, y4)
	let i2 = exports.pointOnLine(x2, y2, x3, y3, x4, y4)
	let i3 = exports.pointOnLine(x3, y3, x1, y1, x2, y2)
	let i4 = exports.pointOnLine(x4, y4, x1, y1, x2, y2)
	if (i1 && i2) {
		return [ { x: x1, y: y1 }, { x: x2, y: y2 } ]
	} else if (i3 && i4) {
		return [ { x: x3, y: y3 }, { x: x4, y: y4 } ]
	} else if (i1 && i4) {
		return [ { x: x1, y: y1 }, { x: x4, y: y4 } ]
	} else if (i2 && i3) {
		return [ { x: x2, y: y2 }, { x: x3, y: y3 } ]
	}
}

exports.lineLineIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
	let uAt = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3)
  let uBt = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3)
	let uC = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1)
	let uA = uAt / uC
	let uB = uBt / uC
	if ((uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1)) {
		return { x: x1 + (uA * (x2-x1)), y: y1 + (uA * (y2-y1)) }
	} else {
		return null
	}
}

exports.lineLineCollision = (x1, y1, x2, y2, x3, y3, x4, y4) => {
	return exports.lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) !== null
}

exports.linePointCollision = (x1, y1, x2, y2, px, py) => {
	let d1 = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  let d2 = Math.sqrt((px - x2) ** 2 + (py - y2) ** 2)
  let lineLen = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
  let buffer = 0.1
  return (d1 + d2 >= lineLen - buffer) && (d1 + d2 <= lineLen + buffer)
}

exports.circleCircleCollision = (c1x, c1y, c1r, c2x, c2y, c2r) => {
	let dSq = (c1x - c2x) ** 2 + (c1y - c2y) ** 2
	return dSq < (c1r + c2r) ** 2
}

exports.pointOnLine = (x, y, ax, ay, bx, by) =>{
	return exports.lineCircleCollision(ax, ay, bx, by, x, y, 1)
}

exports.lineCircleCollision = (x1, y1, x2, y2, cx, cy, cr) => {
	// is either end inside the circle?
  let inside1 = exports.pointCircleCollision(x1, y1, cx, cy, cr)
  let inside2 = exports.pointCircleCollision(x2, y2, cx, cy, cr)
  if (inside1 || inside2) {
		return true
	}

  // get length of the line
  let dx = x1 - x2
  let dy = y1 - y2
	let lenSq = dx ** 2 + dy ** 2

  // get dot product of the line and circle
  let dot = (((cx-x1) * (x2-x1)) + ((cy-y1) * (y2-y1))) / lenSq;

  // find the closest point on the line
  let closestX = x1 + (dot * (x2 - x1))
  let closestY = y1 + (dot * (y2 - y1))

  //is this point actually on the line segment?
  if (!exports.linePointCollision(x1, y1, x2, y2, closestX, closestY)) {
		return false
	}

  // get distance to closest point
  dx = closestX - cx
  dy = closestY - cy
  let distSq = dx ** 2 + dy ** 2

  return distSq <= cr ** 2
}

exports.pointCircleCollision = (px, py, cx, cy, cr) => {
	let dSq = (px - cx) ** 2 + (py - cy) ** 2
	return dSq < cr ** 2
}

exports.lineMidpoint = (x1, y1, x2, y2) => {
	let midpoint = {
		x: x1 + (x2 - x1) / 2,
		y: y1 + (y2 - y1) / 2
	}
	return midpoint
}

exports.quadCenter = (quad) => {
	return exports.lineLineIntersection(
		quad.tl.x, quad.tl.y, quad.br.x, quad.br.y,
		quad.tr.x, quad.tr.y, quad.bl.x, quad.bl.y
	)
}