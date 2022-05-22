local geometry = require("geometry")

local room = {}

local lineWidth = 2
local lineConnectedWidth = 1
local lineSelectedWidth = 4
local lineSelectDist = 6

local cornerRadius = 5
local cornerSelectedRadius = 7
local cornerSelectDist = 7

local colorSelectedBackground = { 1, 1, 1, 0.5 }
local colorSolid = { 1, 1, 1 }
local colorPermeable0 = { 0.99, 0.10, 0.26 }
local colorPermeable50 = { 1.0, 0.87, 0.36 }
local colorPermeable100 = { 0.45, 0.92, 0.84 }
local colorCorner = { 1, 1, 1 }
local colorTextShadow = { 0, 0, 0 }
local colorText = { 1, 1, 1 }

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

		connectedRoomTop = nil,
		connectedRoomBottom = nil,
		connectedRoomLeft = nil,
		connectedRoomRight = nil,

		permeabilityTop = 100,
		permeabilityBottom = 100,
		permeabilityLeft = 100,
		permeabilityRight = 100,

		selectedPart = nil,
		isBeingDragged = false,
		targetObject = nil,
		isTarget = false,

		dragX = 0,
		dragY = 0,

		xLeftStart = xLeft or 0,
		xRightStart = xRight or 0,
		yTopLeftStart = yTopLeft or 0,
		yTopRightStart = yTopRight or 0,
		yBottomLeftStart = yBottomLeft or 0,
		yBottomRightStart = yBottomRight or 0,

		xLeftTemp = xLeft or 0,
		xRightTemp = xRight or 0,
		yTopLeftTemp = yTopLeft or 0,
		yTopRightTemp = yTopRight or 0,
		yBottomLeftTemp = yBottomLeft or 0,
		yBottomRightTemp = yBottomRight or 0,
	}

	r.getCorners = function(self)
		local tl = { x = self.xLeft, y = self.yTopLeft }
		local tr = { x = self.xRight, y = self.yTopRight }
		local br = { x = self.xRight, y = self.yBottomRight }
		local bl = { x = self.xLeft, y = self.yBottomLeft }
		return tl, tr, br, bl
	end

	r.getTempCorners = function(self)
		local tl = { x = self.xLeftTemp, y = self.yTopLeftTemp }
		local tr = { x = self.xRightTemp, y = self.yTopRightTemp }
		local br = { x = self.xRightTemp, y = self.yBottomRightTemp }
		local bl = { x = self.xLeftTemp, y = self.yBottomLeftTemp }
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
		self.xLeft = math.floor(self.xLeftTemp)
		self.xRight = math.floor(self.xRightTemp)
		self.yTopLeft = math.floor(self.yTopLeftTemp)
		self.yTopRight = math.floor(self.yTopRightTemp)
		self.yBottomLeft = math.floor(self.yBottomLeftTemp)
		self.yBottomRight = math.floor(self.yBottomRightTemp)
	end

	r.updateTempPositions = function(self)
		self.xLeftTemp = math.floor(self.xLeft)
		self.xRightTemp = math.floor(self.xRight)
		self.yTopLeftTemp = math.floor(self.yTopLeft)
		self.yTopRightTemp = math.floor(self.yTopRight)
		self.yBottomLeftTemp = math.floor(self.yBottomLeft)
		self.yBottomRightTemp = math.floor(self.yBottomRight)
	end

	r.checkCollisions = function(self, keepWidth, keepHeight)
		for i = 1, #self.metaroom.rooms do
			local other = self.metaroom.rooms[i]

			local x, y
			local tl, tr, br, bl = self:getTempCorners()
			local tl2, tr2, br2, bl2 = other:getTempCorners()

			if other ~= self and geometry.polyPolyCollision({ tl, tr, br, bl }, { tl2, tr2, br2, bl2 }) then
				-- left side intersects other's right side
				if self.xLeftTemp < other.xRightTemp and
					self.xRightTemp > other.xRightTemp and
					self.xLeftTemp > other.xLeftTemp and
					self.yTopLeftTemp < other.yBottomRightTemp and
					self.yBottomLeftTemp > other.yTopRightTemp
					then
						self.xLeftTemp = other.xRightTemp
				end

				-- right side intersects other's left side
				if self.xRightTemp > other.xLeftTemp and
					self.xLeftTemp < other.xLeftTemp and
					self.xRightTemp < other.xRightTemp and
					self.yTopRightTemp < other.yBottomLeftTemp and
					self.yBottomRightTemp > other.yTopLeftTemp
					then
						self.xRightTemp = other.xLeftTemp
				end

				-- left or right side intersects other's top side
				x, y = geometry.lineLineIntersection(
					self.xLeftTemp, self.yTopLeftTemp, self.xLeftTemp, self.yBottomLeftTemp,
					other.xLeftTemp, other.yBottomLeftTemp, other.xRightTemp, other.yBottomRightTemp)
				if y ~= nil and self.xLeftTemp ~= other.xRightTemp then
					self.yTopLeftTemp = y
				end
				x, y = geometry.lineLineIntersection(
					self.xRightTemp, self.yTopRightTemp, self.xRightTemp, self.yBottomRightTemp,
					other.xLeftTemp, other.yBottomLeftTemp, other.xRightTemp, other.yBottomRightTemp)
				if y ~= nil and self.xRightTemp ~= other.xLeftTemp then
					self.yTopRightTemp = y
				end

				-- left or right side intersects other's bottom side
				x, y = geometry.lineLineIntersection(
					self.xLeftTemp, self.yTopLeftTemp, self.xLeftTemp, self.yBottomLeftTemp,
					other.xLeftTemp, other.yTopLeftTemp, other.xRightTemp, other.yTopRightTemp)
				if y ~= nil and self.xLeftTemp ~= other.xRightTemp then
					self.yBottomLeftTemp = y
				end
				x, y = geometry.lineLineIntersection(
					self.xRightTemp, self.yTopRightTemp, self.xRightTemp, self.yBottomRightTemp,
					other.xLeftTemp, other.yTopLeftTemp, other.xRightTemp, other.yTopRightTemp)
					if y ~= nil and self.xRightTemp ~= other.xLeftTemp then
					self.yBottomRightTemp = y
				end

				-- top side intersects with other's left or right sides
				x, y = geometry.lineLineIntersection(
					self.xLeftTemp, self.yTopLeftTemp, self.xRightTemp, self.yTopRightTemp,
					other.xLeftTemp, other.yTopLeftTemp, other.xLeftTemp, other.yBottomLeftTemp)
				if x ~= nil and y ~= nil then
					local slope = (self.yTopRightTemp - self.yTopLeftTemp) / (self.xRightTemp - self.xLeftTemp)
					local dLeft = x - self.xLeftTemp
					local dRight = self.xRightTemp - x
					self.yTopLeftTemp = y
					-- self.yTopRightTemp = self.yTopRight
				end
				x, y = geometry.lineLineIntersection(
					self.xLeftTemp, self.yTopLeftTemp, self.xRightTemp, self.yTopRightTemp,
					other.xRightTemp, other.yTopRightTemp, other.xRightTemp, other.yBottomRightTemp)
				if y ~= nil then
					-- self.yTopLeftTemp = other.yBottomLeftTemp
					-- self.yTopRightTemp = other.yBottomRightTemp
				end

				-- bottom side intersects with other's left or right sides

				-- top side intersects other's left side
				x, y = geometry.lineLineIntersection(
					self.xLeftTemp, self.yTopLeftTemp, self.xRightTemp, self.yTopRightTemp,
					other.xLeftTemp, other.yTopLeftTemp, other.xLeftTemp, other.yBottomLeftTemp)
				if y ~= nil then

				end

				-- top side intersects other's right side

				-- bottom side intersects other's left side

				-- bottom side intersects other's right side

			end
		end
	end

	r.checkConstraints = function(self, keepWidth, keepHeight)
		if self.xLeftTemp < self.metaroom.x then
			self.xLeftTemp = self.metaroom.x
		end
		if self.xRightTemp > self.metaroom.x + self.metaroom.width then
			self.xRightTemp = self.metaroom.x + self.metaroom.width
		end
		if self.yTopLeftTemp < self.metaroom.y then
			self.yTopLeftTemp = self.metaroom.y
		end
		if self.yTopRightTemp < self.metaroom.y then
			self.yTopRightTemp = self.metaroom.y
		end
		if self.yBottomLeftTemp > self.metaroom.y + self.metaroom.height then
			self.yBottomLeftTemp = self.metaroom.y + self.metaroom.height
		end
		if self.yBottomRightTemp > self.metaroom.y + self.metaroom.height then
			self.yBottomRightTemp = self.metaroom.y + self.metaroom.height
		end

		if self.yTopLeftTemp ~= self.yTopLeft and self.yTopLeftTemp > self.yBottomLeftTemp - 5 then
			self.yTopLeftTemp = self.yBottomLeftTemp - 5
		elseif self.yBottomLeftTemp ~= self.yBottomLeft and self.yBottomLeftTemp < self.yTopLeftTemp + 5 then
			self.yBottomLeftTemp = self.yTopLeftTemp + 5
		end

		if self.yTopRightTemp ~= self.yTopRight and self.yTopRightTemp > self.yBottomRightTemp - 5 then
			self.yTopRightTemp = self.yBottomRightTemp - 5
		elseif self.yBottomRightTemp ~= self.yBottomRight and self.yBottomRightTemp < self.yTopRightTemp + 5 then
			self.yBottomRightTemp = self.yTopRightTemp + 5
		end

		if self.xLeftTemp ~= self.xLeft and self.xLeftTemp > self.xRightTemp - 5 then
			self.xLeftTemp = self.xRightTemp - 5
		elseif self.xRightTemp ~= self.xRight and self.xRightTemp < self.xLeftTemp + 5 then
			self.xRightTemp = self.xLeftTemp + 5
		end
	end

	r.startDrag = function(self, x, y)
		self.isBeingDragged = true
		self.dragX = x
		self.dragY = y
		self.xLeftStart = self.xLeft
		self.xRightStart = self.xRight
		self.yTopLeftStart = self.yTopLeft
		self.yTopRightStart = self.yTopRight
		self.yBottomLeftStart = self.yBottomLeft
		self.yBottomRightStart = self.yBottomRight
	end

	r.drag = function(self, x, y)
		local dx = x - self.dragX
		local dy = y - self.dragY

		self:setTargetObject(x, y)
		self:updateTempPositions()

		local keepWidth = false
		local keepHeight = false

		if self.selectedPart == "Room" then
			self:dragRoom(x, y, dx, dy)
		elseif self.selectedPart == "Top" or self.selectedPart == "Bottom" or self.selectedPart == "Left" or self.selectedPart == "Right" then
			self:dragEdge(x, y, dx, dy)
		elseif self.selectedPart == "tl" or self.selectedPart == "tr" or self.selectedPart == "br" or self.selectedPart == "bl" then
			self:dragCorner(x, y, dx, dy)
		end

		self:checkConstraints()
		self:checkCollisions()
		
		self:updatePositions()
	end

	r.dragRoom = function(self, x, y, dx, dy)
		self.xLeftTemp = self.xLeftStart + dx
		self.xRightTemp = self.xRightStart + dx
		self.yTopLeftTemp = self.yTopLeftStart + dy
		self.yTopRightTemp = self.yTopRightStart + dy
		self.yBottomLeftTemp = self.yBottomLeftStart + dy
		self.yBottomRightTemp = self.yBottomRightStart + dy
	end

	r.dragEdge = function(self, x, y, dx, dy)
		if self.selectedPart == "Top" then
			self.yTopLeftTemp = self.yTopLeftStart + dy
			self.yTopRightTemp = self.yTopRightStart + dy
		elseif self.selectedPart == "Bottom" then
			self.yBottomLeftTemp = self.yBottomLeftStart + dy
			self.yBottomRightTemp = self.yBottomRightStart + dy
		elseif self.selectedPart == "Left" then
			self.xLeftTemp = self.xLeftStart + dx
			self.yTopLeftTemp = self.yTopLeftStart + dy
			self.yBottomLeftTemp = self.yBottomLeftStart + dy
		elseif self.selectedPart == "Right" then
			self.xRightTemp = self.xRightStart + dx
			self.yTopRightTemp = self.yTopRightStart + dy
			self.yBottomRightTemp = self.yBottomRightStart + dy
		end
	end

	r.dragCorner = function(self, x, y, dx, dy)
		if self.selectedPart == "tl" then
			self.xLeftTemp = self.xLeftStart + dx
			self.yTopLeftTemp = self.yTopLeftStart + dy
		elseif self.selectedPart == "tr" then
			self.xRightTemp = self.xRightStart + dx
			self.yTopRightTemp = self.yTopRightStart + dy
		elseif self.selectedPart == "br" then
			self.xRightTemp = self.xRightStart + dx
			self.yBottomRightTemp = self.yBottomRightStart + dy
		elseif self.selectedPart == "bl" then
			self.xLeftTemp = self.xLeftStart + dx
			self.yBottomLeftTemp = self.yBottomLeftStart + dy
		end
	end

	r.endDrag = function(self, x, y)
		self.isBeingDragged = false
		if self.targetObject ~= nil then
			self.targetObject.isTarget = false
			self.targetObject = nil
		end
	end

	r.setProperty = function(self, propName, propValue)
		self:updateTempPositions()
		self[propName .. "Temp"] = propValue
		self:checkConstraints()
		self:checkCollisions()
		self:updatePositions()
	end

	r.setPermeability = function(self, side, newValue)
		self["permeability" .. side] = newValue
		if self["connectedRoom" .. side] ~= nil then
			local oppositeSide = "Left"
			if side == "Top" then
				oppositeSide = "Bottom"
			elseif side == "Bottom" then
				oppositeSide = "Top"
			elseif side == "Left" then
				oppositeSide = "Right"
			end
			self["connectedRoom" .. side]["permeability" .. oppositeSide] = newValue
		end
	end

	r.connectRoom = function(self, other, initialConnection, permeability)
	end

	r.disconnectRoom = function(self)
	end

	r.selectObject = function(self, x, y)
		self.selectedPart = nil

		local tl, tr, br, bl = self:getCorners()

		-- check corners
		if geometry.pointCircleCollision(x, y, tl.x, tl.y, cornerSelectDist) then
			self.selectedPart = "tl"
		elseif geometry.pointCircleCollision(x, y, tr.x, tr.y, cornerSelectDist) then
			self.selectedPart = "tr"
		elseif geometry.pointCircleCollision(x, y, br.x, br.y, cornerSelectDist) then
			self.selectedPart = "br"
		elseif geometry.pointCircleCollision(x, y, bl.x, bl.y, cornerSelectDist) then
			self.selectedPart = "bl"
		
		-- check edges
		elseif geometry.lineCircleCollision(tl.x, tl.y, tr.x, tr.y, x, y, lineSelectDist) then
			self.selectedPart = "Top"
		elseif geometry.lineCircleCollision(bl.x, bl.y, br.x, br.y, x, y, lineSelectDist) then
			self.selectedPart = "Bottom"
		elseif geometry.lineCircleCollision(tl.x, tl.y, bl.x, bl.y, x, y, lineSelectDist) then
			self.selectedPart = "Left"
		elseif geometry.lineCircleCollision(tr.x, tr.y, br.x, br.y, x, y, lineSelectDist) then
			self.selectedPart = "Right"
		
		-- check room itself
		elseif geometry.pointPolyCollision(x, y, { tl, tr, br, bl }) then
			self.selectedPart = "Room"
		end

		if self.selectedPart ~= nil then
			return self
		else
			return nil
		end
	end

	r.setTargetObject = function(self, x, y)
		if self.targetObject == nil or not self.targetObject:isPointInside(x, y) then
			if self.targetObject ~= nil then
				self.targetObject.isTarget = false
				self.targetObject = nil
			end
			for i = 1, #self.metaroom.rooms do
				local other = self.metaroom.rooms[i]
				if other ~= self and
					other:isPointInside(x, y) then
						self.targetObject = other
						other.isTarget = true
						break
				end
			end
		end
	end

	r.draw = function(self, oX, oY, selectedRoom)
		local tl, tr, br, bl = self:getCorners()

		if (self == selectedRoom and self.selectedPart == "Room") or self.isTarget then
			love.graphics.setColor(colorSelectedBackground)
			love.graphics.polygon("fill",
				tl.x + oX, tl.y + oY,
				tr.x + oX, tr.y + oY,
				br.x + oX, br.y + oY,
				bl.x + oX, bl.y + oY)
		end

		self:drawEdge("Top", tl, tr, oX, oY, selectedRoom)
		self:drawEdge("Bottom", bl, br, oX, oY, selectedRoom)
		self:drawEdge("Left", tl, bl, oX, oY, selectedRoom)
		self:drawEdge("Right", tr, br, oX, oY, selectedRoom)

		self:drawCorner("tl", tl, oX, oY, selectedRoom)
		self:drawCorner("tr", tr, oX, oY, selectedRoom)
		self:drawCorner("br", br, oX, oY, selectedRoom)
		self:drawCorner("bl", bl, oX, oY, selectedRoom)
	end

	r.drawEdge = function(self, name, p1, p2, oX, oY, selectedRoom)
		if self["connectedRoom" .. name] ~= nil then
			love.graphics.setLineWidth(lineConnectedWidth)
			if self["permeability" .. name] == 100 then
				love.graphics.setColor(colorPermeable100)
			elseif self["permeability" .. name] == 0 then
				love.graphics.setColor(colorPermeable0)
			else
				love.graphics.setColor(colorPermeable50)
			end
		else
			love.graphics.setLineWidth(lineWidth)
			love.graphics.setColor(colorSolid)
		end
		if selectedRoom == self and name == self.selectedPart then
			love.graphics.setLineWidth(lineSelectedWidth)
		end
		love.graphics.line(p1.x + oX, p1.y + oY, p2.x + oX, p2.y + oY)

		if self == selectedRoom then
			local slope = math.abs(math.ceil((p2.y - p1.y) / (p2.x - p1.x) * 1000) / 10)
			local rotation = math.atan2(p2.y - p1.y, p2.x - p1.x)
			if (name == "Top" and self.selectedPart == "Top")
				or (name == "Bottom" and self.selectedPart == "Bottom") then
					if self["connectedRoom" .. name] ~= nil then
						love.graphics.setColor(colorTextShadow)
						love.graphics.print("PERM " .. self["permeability" .. name] .. "%", p1.x + oX, p1.y + oY, rotation, 1, 1, -11, 19)
						love.graphics.setColor(colorText)
						love.graphics.print("PERM " .. self["permeability" .. name] .. "%", p1.x + oX, p1.y + oY, rotation, 1, 1, -10, 20)
					end
					love.graphics.setColor(colorTextShadow)
					love.graphics.print("SLOPE " .. slope .. "%", p1.x + oX, p1.y + oY, rotation, 1, 1, -11, -6)
					love.graphics.setColor(colorText)
					love.graphics.print("SLOPE " .. slope .. "%", p1.x + oX, p1.y + oY, rotation, 1, 1, -10, -5)
			elseif ((name == "Left" and self.selectedPart == "Left")
				or (name == "Right" and self.selectedPart == "Right"))
				and self["connectedRoom" .. name] ~= nil then
					love.graphics.setColor(colorTextShadow)
					love.graphics.print("PERM " .. self["permeability" .. name] .. "%", p1.x + 21 + oX, p1.y + 11 + oY, math.pi / 2)
					love.graphics.setColor(colorText)
					love.graphics.print("PERM " .. self["permeability" .. name] .. "%", p1.x + 20 + oX, p1.y + 10 + oY, math.pi / 2)
			end
		end
	end

	r.drawCorner = function(self, name, p, oX, oY, selectedRoom)
		local radius = cornerRadius
		if selectedRoom == self and name == self.selectedPart then
			radius = cornerSelectedRadius
		end
		love.graphics.setColor(colorCorner)
		love.graphics.circle("fill", p.x + oX, p.y + oY, radius)
	end

	return r
end

return room