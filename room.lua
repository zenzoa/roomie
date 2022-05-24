local geometry = require("geometry")

local room = {}

local lineWidth = 2
local lineConnectedWidth = 1
local lineSelectedWidth = 4
local lineSelectDist = 6

local cornerRadius = 5
local cornerSelectedRadius = 7
local cornerSelectDist = 7
local cornerSnapDist = 10

local colorSelectedBackground = { 1, 1, 1, 0.5 }
local colorSolid = { 1, 1, 1 }
local colorPermeable0 = { 0.99, 0.10, 0.26 }
local colorPermeable50 = { 1.0, 0.87, 0.36 }
local colorPermeable100 = { 0.45, 0.92, 0.84 }
local colorCorner = { 1, 1, 1 }
local colorTextShadow = { 0, 0, 0 }
local colorText = { 1, 1, 1 }

local sides = { "Top", "Bottom", "Left", "Right" }

room.oppositeSide = function(side)
	local opposite = "Left"
	if side == "Top" then
		opposite = "Bottom"
	elseif side == "Bottom" then
		opposite = "Top"
	elseif side == "Left" then
		opposite = "Right"
	end
	return opposite
end

room.create = function(xLeft, xRight, yTopLeft, yTopRight, yBottomLeft, yBottomRight)
	local r = {
		class = "room",
		metaroom = nil,
		type = 0,
		music = "",

		xLeft = xLeft or 0,
		xRight = xRight or 0,
		yTopLeft = yTopLeft or 0,
		yTopRight = yTopRight or 0,
		yBottomLeft = yBottomLeft or 0,
		yBottomRight = yBottomRight or 0,

		xLeftStart = xLeft or 0,
		xRightStart = xRight or 0,
		yTopLeftStart = yTopLeft or 0,
		yTopRightStart = yTopRight or 0,
		yBottomLeftStart = yBottomLeft or 0,
		yBottomRightStart = yBottomRight or 0,

		connections = {},

		permeabilityTop = 100,
		permeabilityBottom = 100,
		permeabilityLeft = 100,
		permeabilityRight = 100,

		selectedPart = nil,

		dragX = 0,
		dragY = 0,
	}

	r.getCorners = function(self)
		local tl = { x = self.xLeft, y = self.yTopLeft }
		local tr = { x = self.xRight, y = self.yTopRight }
		local br = { x = self.xRight, y = self.yBottomRight }
		local bl = { x = self.xLeft, y = self.yBottomLeft }
		return tl, tr, br, bl
	end

	r.isPointInside = function(self, px, py)
		local tl, tr, br, bl = self:getCorners()
		return geometry.pointPolyCollision(px, py, { tl, tr, br, bl })
	end

	r.centerX = function(self)
		return self.xLeft + math.floor((self.xRight - self.xLeft) / 2)
	end

	r.centerY = function(self)
		local centerLeftY = self.yTopLeft + math.floor((self.yBottomLeft - self.yTopLeft) / 2)
		local centerRightY = self.yTopRight + math.floor((self.yBottomRight - self.yTopRight) / 2)
		return math.min(centerLeftY, centerRightY) + math.abs(math.floor((centerRightY - centerLeftY) / 2))
	end

	r.updatePositions = function(self)
		self.xLeft = math.floor(self.xLeft)
		self.xRight = math.floor(self.xRight)
		self.yTopLeft = math.floor(self.yTopLeft)
		self.yTopRight = math.floor(self.yTopRight)
		self.yBottomLeft = math.floor(self.yBottomLeft)
		self.yBottomRight = math.floor(self.yBottomRight)
		for i = 1, #self.connections do
			local connection = self.connections[i]
			local other = connection.room
			local side = connection.side
			local otherSide = room.oppositeSide(side)
			local permeability = self["permeability" .. side]
			other["permeability" .. otherSide] = permeability
			for j = 1, #other.connections do
				local otherConnection = other.connections[j]
				if otherConnection.side == otherSide then
					otherConnection.room["permeability" .. side] = permeability
				end
			end
		end
	end

	r.snapToCorners = function(self)
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]
			local tl, tr, br, bl = self:getCorners()
			local tl2, tr2, br2, bl2 = other:getCorners()
			if other ~= self then
				if geometry.distance(tl, tr2) < cornerSnapDist then
					self.xLeft = tr2.x
					self.yTopLeft = tr2.y
				elseif geometry.distance(tl, bl2) < cornerSnapDist then
					self.xLeft = bl2.x
					self.yTopLeft = bl2.y
				elseif geometry.distance(tl, br2) < cornerSnapDist then
					self.xLeft = br2.x
					self.yTopLeft = br2.y
				end
				if geometry.distance(tr, tl2) < cornerSnapDist then
					self.xRight = tl2.x
					self.yTopRight = tl2.y
				elseif geometry.distance(tr, br2) < cornerSnapDist then
					self.xRight = br2.x
					self.yTopRight = br2.y
				elseif geometry.distance(tr, bl2) < cornerSnapDist then
					self.xRight = bl2.x
					self.yTopRight = bl2.y
				end
				if geometry.distance(bl, br2) < cornerSnapDist then
					self.xLeft = br2.x
					self.yBottomLeft = br2.y
				elseif geometry.distance(bl, tl2) < cornerSnapDist then
					self.xLeft = tl2.x
					self.yBottomLeft = tl2.y
				elseif geometry.distance(bl, tr2) < cornerSnapDist then
					self.xLeft = tr2.x
					self.yBottomLeft = tr2.y
				end
				if geometry.distance(br, bl2) < cornerSnapDist then
					self.xRight = bl2.x
					self.yBottomRight = bl2.y
				elseif geometry.distance(br, tr2) < cornerSnapDist then
					self.xRight = tr2.x
					self.yBottomRight = tr2.y
				elseif geometry.distance(br, tl2) < cornerSnapDist then
					self.xRight = tl2.x
					self.yBottomRight = tl2.y
				end
			end
		end
	end

	r.snapToEdges = function(self)
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]
			local tl, tr, br, bl = self:getCorners()
			local tl2, tr2, br2, bl2 = other:getCorners()
			if other ~= self then
				if geometry.lineCircleCollision(tr2.x, tr2.y, br2.x, br2.y, tl.x, tl.y, cornerSnapDist) then
					self.xLeft = other.xRight
				elseif geometry.lineCircleCollision(tr2.x, tr2.y, br2.x, br2.y, bl.x, bl.y, cornerSnapDist) then
					self.xLeft = other.xRight
				elseif geometry.lineCircleCollision(tl2.x, tl2.y, bl2.x, bl2.y, tr.x, tr.y, cornerSnapDist) then
					self.xRight = other.xLeft
				elseif geometry.lineCircleCollision(tl2.x, tl2.y, bl2.x, bl2.y, br.x, br.y, cornerSnapDist) then
					self.xRight = other.xLeft
				end
			end
		end
	end

	r.checkCollisions = function(self)
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]

			local x, y
			local tl, tr, br, bl = self:getCorners()
			local tl2, tr2, br2, bl2 = other:getCorners()

			if other ~= self and
				geometry.polyPolyCollision({ tl, tr, br, bl }, { tl2, tr2, br2, bl2 })
				then
					-- left side intersects other's right side
					if self.xLeft < other.xRight and
						self.xRight > other.xRight and
						self.xLeft > other.xLeft and
						self.yTopLeft < other.yBottomRight and
						self.yBottomLeft > other.yTopRight
						then
							self.xLeft = other.xRight
					end

					-- right side intersects other's left side
					if self.xRight > other.xLeft and
						self.xLeft < other.xLeft and
						self.xRight < other.xRight and
						self.yTopRight < other.yBottomLeft and
						self.yBottomRight > other.yTopLeft
						then
							self.xRight = other.xLeft
					end

					-- left or right side intersects other's top side
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yTopLeft, self.xLeft, self.yBottomLeft,
						other.xLeft, other.yBottomLeft, other.xRight, other.yBottomRight)
					if y ~= nil and self.xLeft ~= other.xRight then
						self.yTopLeft = y
					end
					x, y = geometry.lineLineIntersection(
						self.xRight, self.yTopRight, self.xRight, self.yBottomRight,
						other.xLeft, other.yBottomLeft, other.xRight, other.yBottomRight)
					if y ~= nil and self.xRight ~= other.xLeft then
						self.yTopRight = y
					end

					-- left or right side intersects other's bottom side
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yTopLeft, self.xLeft, self.yBottomLeft,
						other.xLeft, other.yTopLeft, other.xRight, other.yTopRight)
					if y ~= nil and self.xLeft ~= other.xRight then
						self.yBottomLeft = y
					end
					x, y = geometry.lineLineIntersection(
						self.xRight, self.yTopRight, self.xRight, self.yBottomRight,
						other.xLeft, other.yTopLeft, other.xRight, other.yTopRight)
						if y ~= nil and self.xRight ~= other.xLeft then
						self.yBottomRight = y
					end

					-- top side intersects with other's left or right sides
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yTopLeft, self.xRight, self.yTopRight,
						other.xLeft, other.yTopLeft, other.xLeft, other.yBottomLeft)
					if y ~= nil and self.xRight ~= other.xLeft and self.yTopLeft ~= other.yBottomLeft then
						local slope = (self.yTopRightStart - self.yTopLeftStart) / (self.xRightStart - self.xLeftStart)
						local dLeft = self.xLeft - x
						local dRight = self.xRight - x
						self.yTopLeft = other.yBottomLeft + (slope * dLeft)
						self.yTopRight = other.yBottomLeft + (slope * dRight)
					end
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yTopLeft, self.xRight, self.yTopRight,
						other.xRight, other.yTopRight, other.xRight, other.yBottomRight)
					if y ~= nil and self.xLeft ~= other.xRight and self.yTopRight ~= other.yBottomRight then
						local slope = (self.yTopRightStart - self.yTopLeftStart) / (self.xRightStart - self.xLeftStart)
						local dLeft = self.xLeft - x
						local dRight = self.xRight - x
						self.yTopLeft = other.yBottomRight + (slope * dLeft)
						self.yTopRight = other.yBottomRight + (slope * dRight)
					end

					-- bottom side intersects with other's left or right sides
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yBottomLeft, self.xRight, self.yBottomRight,
						other.xLeft, other.yTopLeft, other.xLeft, other.yBottomLeft)
					if y ~= nil and self.xRight ~= other.xLeft and self.yBottomLeft ~= other.yTopLeft then
						local slope = (self.yBottomRightStart - self.yBottomLeftStart) / (self.xRightStart - self.xLeftStart)
						local dLeft = self.xLeft - x
						local dRight = self.xRight - x
						self.yBottomLeft = other.yTopLeft + (slope * dLeft)
						self.yBottomRight = other.yTopLeft + (slope * dRight)
					end
					x, y = geometry.lineLineIntersection(
						self.xLeft, self.yBottomLeft, self.xRight, self.yBottomRight,
						other.xRight, other.yTopRight, other.xRight, other.yBottomRight)
					if y ~= nil and self.xLeft ~= other.xRight and self.yBottomRight ~= other.yTopRight then
						local slope = (self.yBottomRightStart - self.yBottomLeftStart) / (self.xRightStart - self.xLeftStart)
						local dLeft = self.xLeft - x
						local dRight = self.xRight - x
						self.yBottomLeft = other.yTopRight + (slope * dLeft)
						self.yBottomRight = other.yTopRight + (slope * dRight)
					end
			end
		end
	end

	r.checkConstraints = function(self)
		if self.xLeft < 0 then
			self.xLeft = 0
		end
		if self.xRight > self.metaroom.width then
			self.xRight = self.metaroom.width
		end
		if self.yTopLeft < 0 then
			self.yTopLeft = 0
		end
		if self.yTopRight < 0 then
			self.yTopRight = 0
		end
		if self.yBottomLeft > self.metaroom.height then
			self.yBottomLeft = self.metaroom.height
		end
		if self.yBottomRight > self.metaroom.height then
			self.yBottomRight = self.metaroom.height
		end

		if self.yTopLeft ~= self.yTopLeftStart and self.yTopLeft > self.yBottomLeft - 10 then
			self.yTopLeft = self.yBottomLeft - 10
		elseif self.yBottomLeft ~= self.yBottomLeftStart and self.yBottomLeft < self.yTopLeft + 10 then
			self.yBottomLeft = self.yTopLeft + 10
		end

		if self.yTopRight ~= self.yTopRightStart and self.yTopRight > self.yBottomRight - 10 then
			self.yTopRight = self.yBottomRight - 10
		elseif self.yBottomRight ~= self.yBottomRightStart and self.yBottomRight < self.yTopRight + 10 then
			self.yBottomRight = self.yTopRight + 10
		end

		if self.xLeft ~= self.xLeftStart and self.xLeft > self.xRight - 10 then
			self.xLeft = self.xRight - 10
		elseif self.xRight ~= self.xRightStart and self.xRight < self.xLeft + 10 then
			self.xRight = self.xLeft + 10
		end
	end

	r.startDrag = function(self, x, y)
		self.dragX = x
		self.dragY = y

		self.xLeftStart = self.xLeft
		self.xRightStart = self.xRight
		self.yTopLeftStart = self.yTopLeft
		self.yTopRightStart = self.yTopRight
		self.yBottomLeftStart = self.yBottomLeft
		self.yBottomRightStart = self.yBottomRight
		
		self:disconnectRoom()
	end

	r.drag = function(self, x, y)
		local dx = x - self.dragX
		local dy = y - self.dragY
		
		if self.selectedPart == "Room" then
			self:dragRoom(x, y, dx, dy)
		elseif self.selectedPart == "Top" or self.selectedPart == "Bottom" or self.selectedPart == "Left" or self.selectedPart == "Right" then
			self:dragEdge(x, y, dx, dy)
		elseif self.selectedPart == "tl" or self.selectedPart == "tr" or self.selectedPart == "br" or self.selectedPart == "bl" then
			self:dragCorner(x, y, dx, dy)
		end
		
		self:snapToCorners()
		self:snapToEdges()
		self:checkCollisions()
		self:checkConstraints()
		self:updatePositions()
	end

	r.dragRoom = function(self, x, y, dx, dy)
		self.xLeft = self.xLeftStart + dx
		self.xRight = self.xRightStart + dx
		self.yTopLeft = self.yTopLeftStart + dy
		self.yTopRight = self.yTopRightStart + dy
		self.yBottomLeft = self.yBottomLeftStart + dy
		self.yBottomRight = self.yBottomRightStart + dy
	end

	r.dragEdge = function(self, x, y, dx, dy)
		if self.selectedPart == "Top" then
			self.yTopLeft = self.yTopLeftStart + dy
			self.yTopRight = self.yTopRightStart + dy
		elseif self.selectedPart == "Bottom" then
			self.yBottomLeft = self.yBottomLeftStart + dy
			self.yBottomRight = self.yBottomRightStart + dy
		elseif self.selectedPart == "Left" then
			self.xLeft = self.xLeftStart + dx
			self.yTopLeft = self.yTopLeftStart + dy
			self.yBottomLeft = self.yBottomLeftStart + dy
		elseif self.selectedPart == "Right" then
			self.xRight = self.xRightStart + dx
			self.yTopRight = self.yTopRightStart + dy
			self.yBottomRight = self.yBottomRightStart + dy
		end
	end

	r.dragCorner = function(self, x, y, dx, dy)
		if self.selectedPart == "tl" then
			self.xLeft = self.xLeftStart + dx
			self.yTopLeft = self.yTopLeftStart + dy
		elseif self.selectedPart == "tr" then
			self.xRight = self.xRightStart + dx
			self.yTopRight = self.yTopRightStart + dy
		elseif self.selectedPart == "br" then
			self.xRight = self.xRightStart + dx
			self.yBottomRight = self.yBottomRightStart + dy
		elseif self.selectedPart == "bl" then
			self.xLeft = self.xLeftStart + dx
			self.yBottomLeft = self.yBottomLeftStart + dy
		end
	end

	r.endDrag = function(self, x, y)
		self:findConnections()
	end

	r.setProperty = function(self, propName, propValue)
		self[propName] = propValue
		self:checkCollisions()
		self:checkConstraints()
		self:updatePositions()
	end

	r.setPermeability = function(self, side, newValue)
		self["permeability" .. side] = newValue
		self:updatePositions()
	end

	r.findConnections = function(self)
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]
			local tl, tr, br, bl = self:getCorners()
			local tl2, tr2, br2, bl2 = other:getCorners()
			local topCollidesBottom = geometry.lineLineOverlap(tl.x, tl.y, tr.x, tr.y, bl2.x, bl2.y, br2.x, br2.y)
			local bottomCollidesTop = geometry.lineLineOverlap(bl.x, bl.y, br.x, br.y, tl2.x, tl2.y, tr2.x, tr2.y)
			local leftCollidesRight = geometry.lineLineOverlap(tl.x, tl.y, bl.x, bl.y, tr2.x, tr2.y, br2.x, br2.y)
			local rightCollidesLeft = geometry.lineLineOverlap(tr.x, tr.y, br.x, br.y, tl2.x, tl2.y, bl2.x, bl2.y)
			if other ~= self and (topCollidesBottom or bottomCollidesTop or leftCollidesRight or rightCollidesLeft) then
				local oppositeCornersTouch1 = (tl.x == br2.x and tl.y == br2.y)
				local oppositeCornersTouch2 = (tr.x == bl2.x and tr.y == bl2.y)
				local oppositeCornersTouch3 = (bl.x == tr2.x and bl.y == tr2.y)
				local oppositeCornersTouch4 = (br.x == tl2.x and br.y == tl2.y)
				if not (oppositeCornersTouch1 or oppositeCornersTouch2 or oppositeCornersTouch3 or oppositeCornersTouch4) then
					self:connectRoom(other)
				end
			end
		end
	end

	r.connectRoom = function(self, other, permeability)
		local selfTopY = math.max(self.yTopLeft, self.yTopRight) 
		local selfBottomY = math.min(self.yBottomLeft, self.yBottomRight)
		local otherTopY = math.max(other.yTopLeft, other.yTopRight) 
		local otherBottomY = math.min(other.yBottomLeft, other.yBottomRight)

		local side
		if other.xRight <= self.xLeft then
				side = "Left"
		elseif other.xLeft >= self.xRight then
				side = "Right"
		elseif otherBottomY <= selfTopY then
				side = "Top"
		elseif otherTopY >= selfBottomY then
				side = "Bottom"
		end
		local otherSide = room.oppositeSide(side)

		if permeability ~= nil then
			self["permeability" .. side] = permeability
			other["permeability" .. otherSide] = permeability
		end

		table.insert(self.connections, {
			room = other,
			side = side
		})

		local newConnections = {}
		for i = 1, #other.connections do
			local connection = other.connections[i]
			if connection.room ~= self then
				table.insert(newConnections, connection)
			end
		end
		other.connections = newConnections

		table.insert(other.connections, {
			room = self,
			side = otherSide
		})
	end

	r.disconnectRoom = function(self)
		self.connections = {}
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]
			local newConnections = {}
			for j = 1, #other.connections do
				local connection = other.connections[j]
				if connection.room ~= self then
					table.insert(newConnections, connection)
				end
			end
			other.connections = newConnections
		end
	end

	r.selectCorner = function(self, x, y)
		self.selectedPart = nil
		local tl, tr, br, bl = self:getCorners()
		if geometry.pointCircleCollision(x, y, tl.x, tl.y, cornerSelectDist) then
			self.selectedPart = "tl"
		elseif geometry.pointCircleCollision(x, y, tr.x, tr.y, cornerSelectDist) then
			self.selectedPart = "tr"
		elseif geometry.pointCircleCollision(x, y, br.x, br.y, cornerSelectDist) then
			self.selectedPart = "br"
		elseif geometry.pointCircleCollision(x, y, bl.x, bl.y, cornerSelectDist) then
			self.selectedPart = "bl"
		end
		if self.selectedPart ~= nil then
			return self
		end
	end

	r.selectEdge = function(self, x, y)
		self.selectedPart = nil
		local tl, tr, br, bl = self:getCorners()
		if geometry.lineCircleCollision(tl.x, tl.y, tr.x, tr.y, x, y, lineSelectDist) then
			self.selectedPart = "Top"
		elseif geometry.lineCircleCollision(bl.x, bl.y, br.x, br.y, x, y, lineSelectDist) then
			self.selectedPart = "Bottom"
		elseif geometry.lineCircleCollision(tl.x, tl.y, bl.x, bl.y, x, y, lineSelectDist) then
			self.selectedPart = "Left"
		elseif geometry.lineCircleCollision(tr.x, tr.y, br.x, br.y, x, y, lineSelectDist) then
			self.selectedPart = "Right"
		end
		if self.selectedPart ~= nil then
			return self
		end
	end

	r.selectRoom = function(self, x, y)
		local tl, tr, br, bl = self:getCorners()
		if geometry.pointPolyCollision(x, y, { tl, tr, br, bl }) then
			self.selectedPart = "Room"
			return self
		end
	end

	r.drawRoom = function(self, selectedRoom)
		if (self == selectedRoom and self.selectedPart == "Room") then
			local tl, tr, br, bl = self:getCorners()
			love.graphics.setColor(colorSelectedBackground)
			love.graphics.polygon("fill",
				tl.x, tl.y,
				tr.x, tr.y,
				br.x, br.y,
				bl.x, bl.y)
		end	
	end

	r.drawEdges = function(self, selectedRoom)
		local tl, tr, br, bl = self:getCorners()
		self:drawEdge("Top", tl, tr, selectedRoom)
		self:drawEdge("Bottom", bl, br, selectedRoom)
		self:drawEdge("Left", tl, bl, selectedRoom)
		self:drawEdge("Right", tr, br, selectedRoom)
	end

	r.drawEdge = function(self, side, p1, p2, selectedRoom)
		local hasConnection = false
		local permeability = 100
		for i = 1, #self.connections do
			local connection = self.connections[i]
			if connection.side == side then
				hasConnection = true
			end
		end

		if hasConnection then
			love.graphics.setLineWidth(lineConnectedWidth)
			if self["permeability" .. side] == 100 then
				love.graphics.setColor(colorPermeable100)
			elseif self["permeability" .. side] == 0 then
				love.graphics.setColor(colorPermeable0)
			else
				love.graphics.setColor(colorPermeable50)
			end
		else
			love.graphics.setLineWidth(lineWidth)
			love.graphics.setColor(colorSolid)
		end
		if selectedRoom == self and side == self.selectedPart then
			love.graphics.setLineWidth(lineSelectedWidth)
		end
		love.graphics.line(p1.x, p1.y, p2.x, p2.y)

		if self == selectedRoom then
			local slope = math.abs(math.ceil((p2.y - p1.y) / (p2.x - p1.x) * 1000) / 10)
			local rotation = math.atan2(p2.y - p1.y, p2.x - p1.x)
			if (side == "Top" and self.selectedPart == "Top")
				or (side == "Bottom" and self.selectedPart == "Bottom") then
					if hasConnection then
						love.graphics.setColor(colorTextShadow)
						love.graphics.print("PERM " .. self["permeability" .. side] .. "%", p1.x, p1.y, rotation, 1, 1, -11, 19)
						love.graphics.setColor(colorText)
						love.graphics.print("PERM " .. self["permeability" .. side] .. "%", p1.x, p1.y, rotation, 1, 1, -10, 20)
					end
					love.graphics.setColor(colorTextShadow)
					love.graphics.print("SLOPE " .. slope .. "%", p1.x, p1.y, rotation, 1, 1, -11, -6)
					love.graphics.setColor(colorText)
					love.graphics.print("SLOPE " .. slope .. "%", p1.x, p1.y, rotation, 1, 1, -10, -5)
			elseif ((side == "Left" and self.selectedPart == "Left")
				or (side == "Right" and self.selectedPart == "Right"))
				and hasConnection then
					love.graphics.setColor(colorTextShadow)
					love.graphics.print("PERM " .. self["permeability" .. side] .. "%", p1.x + 21, p1.y + 11, math.pi / 2)
					love.graphics.setColor(colorText)
					love.graphics.print("PERM " .. self["permeability" .. side] .. "%", p1.x + 20, p1.y + 10, math.pi / 2)
			end
		end
	end

	r.drawCorners = function(self, selectedRoom)
		local tl, tr, br, bl = self:getCorners()
		love.graphics.setColor(colorCorner)
		self:drawCorner("tl", tl, selectedRoom)
		self:drawCorner("tr", tr, selectedRoom)
		self:drawCorner("br", br, selectedRoom)
		self:drawCorner("bl", bl, selectedRoom)
	end

	r.drawCorner = function(self, name, p, selectedRoom)
		local radius = cornerRadius
		if selectedRoom == self and name == self.selectedPart then
			radius = cornerSelectedRadius
		end
		love.graphics.circle("fill", p.x, p.y, radius)
	end

	return r
end

return room