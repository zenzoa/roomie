local geometry = {}

local length = function(x, y)
	return math.sqrt(x ^ 2 + y ^ 2)
end

local distance = function(a, b)
	return math.sqrt((a.x - b.x) ^ 2 + (a.y - b.y) ^ 2)
end

local normalize = function(a)
	local len = length(a.x, a.y)
	return {
		x = a.x / len,
		y = a.y / len
	}
end

local dotProduct = function(a, b)
	local ret = 0
  for i = 1, #a do
    ret = ret + a[i] * b[i]
  end
  return ret
end

geometry.pointPolyCollision = function(x, y, poly)
	local vertexCount = #poly
	local i = 0
	local j = 0
	local isPointInPolygon = false

	for i = 1, vertexCount do
		if i == vertexCount then
			j = 1
		else
			j = i + 1
		end

		local ax = poly[i].x
		local ay = poly[i].y
		local bx = poly[j].x
		local by = poly[j].y

		local belowLowY = ay > y
		local belowHighY = by > y
		local withinYs = belowLowY ~= belowHighY

		if withinYs then
			local slope = (bx - ax) / (by - ay)
			local pointOnLine = slope * (y - ay) + ax
			local isLeftOfLine = x < pointOnLine
			if isLeftOfLine then
				isPointInPolygon = not isPointInPolygon
			end
		end
	end

	return isPointInPolygon
end

geometry.polyPolyCollision = function(verticesA, verticesB)
	for current = 1, #verticesA do
		local next = current + 1
		if next > #verticesA then
			next = 1
		end
		local vc = verticesA[current]
		local vn = verticesA[next]
		local collision = geometry.polyLineCollision(verticesB, vc.x, vc.y, vn.x, vn.y)
    if collision then 
			return true
		elseif geometry.pointPolyCollision(verticesB[1].x, verticesB[1].y, verticesA) then
			return true
		elseif geometry.pointPolyCollision(verticesA[1].x, verticesA[1].y, verticesB) then
			return true
		end
	end
	return false
end

geometry.polyLineCollision = function(vertices, x1, y1, x2, y2)
	for current = 1, #vertices do
		local next = current + 1
		if next > #vertices then
			next = 1
		end
		local x3 = vertices[current].x
    local y3 = vertices[current].y
    local x4 = vertices[next].x
    local y4 = vertices[next].y
		local collision = geometry.lineLineCollision(x1, y1, x2, y2, x3, y3, x4, y4)
    if collision then
			return true
		end
	end
	return false
end

geometry.lineLineCollision = function(x1, y1, x2, y2, x3, y3, x4, y4)
	local uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
  local uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
	return (uA >= 0 and uA <= 1 and uB >= 0 and uB <= 1)
end

geometry.lineLineIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4)
	local uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
  local uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
	return {
		x = x1 + (uA * (x2-x1)),
		y = y1 + (uA * (y2-y1))
	}
end

geometry.linePointCollision = function(x1, y1, x2, y2, px, py)
	local d1 = math.sqrt((px - x1) ^ 2 + (py - y1) ^ 2)
  local d2 = math.sqrt((px - x2) ^ 2 + (py - y2) ^ 2)
  local lineLen = math.sqrt((x1 - x2) ^ 2 + (y1 - y2) ^ 2)
  local buffer = 0.1
  return (d1 + d2 >= lineLen - buffer) and (d1 + d2 <= lineLen + buffer)
end

geometry.circleCircleCollision = function(c1x, c1y, c1r, c2x, c2y, c2r)
	local dSq = (c1x - c2x) ^ 2 + (c1y - c2y) ^ 2
	return dSq < (c1r + c2r) ^ 2
end

geometry.lineCircleCollision = function(x1, y1, x2, y2, cx, cy, cr)
	-- is either end inside the circle?
  local inside1 = geometry.pointCircleCollision(x1, y1, cx, cy, cr)
  local inside2 = geometry.pointCircleCollision(x2, y2, cx, cy, cr)
  if inside1 or inside2 then
		return true
	end

  -- get length of the line
  local dx = x1 - x2
  local dy = y1 - y2
	local lenSq = dx ^ 2 + dy ^ 2

  -- get dot product of the line and circle
  local dot = (((cx-x1) * (x2-x1)) + ((cy-y1) * (y2-y1))) / lenSq;

  -- find the closest point on the line
  local closestX = x1 + (dot * (x2 - x1))
  local closestY = y1 + (dot * (y2 - y1))

  --is this point actually on the line segment?
  if not geometry.linePointCollision(x1, y1, x2, y2, closestX, closestY) then
		return false
	end

  -- get distance to closest point
  dx = closestX - cx
  dy = closestY - cy
  local distSq = dx ^ 2 + dy ^ 2

  return distSq <= cr ^ 2
end

geometry.pointCircleCollision = function(px, py, cx, cy, cr)
	local dSq = (px - cx) ^ 2 + (py - cy) ^ 2
	return dSq < cr ^ 2
end

geometry.lineMidpoint = function(x1, y1, x2, y2)
	local midpoint = {
		x = x1 + (x2 - x1) / 2,
		y = y1 + (y2 - y1) / 2
	}
	return midpoint
end

geometry.quadCenter = function(quad)
	return geometry.lineLineIntersection(
		quad.tl.x, quad.tl.y, quad.br.x, quad.br.y,
		quad.tr.x, quad.tr.y, quad.bl.x, quad.bl.y
	)
end

return geometry