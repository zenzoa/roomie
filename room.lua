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

		hasUpdatedPositions = false,
		hasUpdatedTempPositions = false,
		hasUpdatedConnections = false,
		hasUpdatedTempConnections = false,
		hasCheckedCollisions = false,
		hasCheckedConstraints = false,
	}

	r.resetRoomStatuses = function(self)
		for i = 1, #self.metaroom.rooms do
			local otherRoom = self.metaroom.rooms[i]
			otherRoom.hasUpdatedPositions = false
			otherRoom.hasUpdatedTempPositions = false
			otherRoom.hasUpdatedConnections = false
			otherRoom.hasUpdatedTempConnections = false
			otherRoom.hasCheckedCollisions = false
			otherRoom.hasCheckedConstraints = false
		end
	end

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

	r.updatePositions = function(self)
		if not self.hasUpdatedPositions then
			self.hasUpdatedPositions = true

			self.xLeft = math.floor(self.xLeftTemp)
			self.xRight = math.floor(self.xRightTemp)
			self.yTopLeft = math.floor(self.yTopLeftTemp)
			self.yTopRight = math.floor(self.yTopRightTemp)
			self.yBottomLeft = math.floor(self.yBottomLeftTemp)
			self.yBottomRight = math.floor(self.yBottomRightTemp)

			if self.connectedRoomTop ~= nil then
				self.connectedRoomTop:updatePositions()
			end
			if self.connectedRoomBottom ~= nil then
				self.connectedRoomBottom:updatePositions()
			end
			if self.connectedRoomLeft ~= nil then
				self.connectedRoomLeft:updatePositions()
			end
			if self.connectedRoomRight ~= nil then
				self.connectedRoomRight:updatePositions()
			end
		end
	end

	r.updateTempPositions = function(self)
		if not self.hasUpdatedTempPositions then
			self.hasUpdatedTempPositions = true

			self.xLeftTemp = math.floor(self.xLeft)
			self.xRightTemp = math.floor(self.xRight)
			self.yTopLeftTemp = math.floor(self.yTopLeft)
			self.yTopRightTemp = math.floor(self.yTopRight)
			self.yBottomLeftTemp = math.floor(self.yBottomLeft)
			self.yBottomRightTemp = math.floor(self.yBottomRight)

			if self.connectedRoomTop ~= nil then
				self.connectedRoomTop:updateTempPositions()
			end
			if self.connectedRoomBottom ~= nil then
				self.connectedRoomBottom:updateTempPositions()
			end
			if self.connectedRoomLeft ~= nil then
				self.connectedRoomLeft:updateTempPositions()
			end
			if self.connectedRoomRight ~= nil then
				self.connectedRoomRight:updateTempPositions()
			end
		end
	end

	r.updateTempConnections = function(self)
		if not self.hasUpdatedTempConnections then
			self.hasUpdatedTempConnections = true
			if self.connectedRoomTop ~= nil then
				self.connectedRoomTop.xLeftTemp = self.xLeftTemp
				self.connectedRoomTop.xRightTemp = self.xRightTemp
				self.connectedRoomTop.yBottomLeftTemp = self.yTopLeftTemp
				self.connectedRoomTop.yBottomRightTemp = self.yTopRightTemp
				self.connectedRoomTop.permeabilityBottom = self.permeabilityTop
			end
			if self.connectedRoomBottom ~= nil then
				self.connectedRoomBottom.xLeftTemp = self.xLeftTemp
				self.connectedRoomBottom.xRightTemp = self.xRightTemp
				self.connectedRoomBottom.yTopLeftTemp = self.yBottomLeftTemp
				self.connectedRoomBottom.yTopRightTemp = self.yBottomRightTemp
				self.connectedRoomBottom.permeabilityTop = self.permeabilityBottom
			end
			if self.connectedRoomLeft ~= nil then
				self.connectedRoomLeft.xRightTemp = self.xLeftTemp
				self.connectedRoomLeft.yTopRightTemp = self.yTopLeftTemp
				self.connectedRoomLeft.yBottomRightTemp = self.yBottomLeftTemp
				self.connectedRoomLeft.permeabilityRight = self.permeabilityLeft
			end
			if self.connectedRoomRight ~= nil then
				self.connectedRoomRight.xLeftTemp = self.xRightTemp
				self.connectedRoomRight.yTopLeftTemp = self.yTopRightTemp
				self.connectedRoomRight.yBottomLeftTemp = self.yBottomRightTemp
				self.connectedRoomRight.permeabilityLeft = self.permeabilityRight
			end

			if self.connectedRoomTop ~= nil then
				self.connectedRoomTop:updateTempConnections()
			end
			if self.connectedRoomBottom ~= nil then
				self.connectedRoomBottom:updateTempConnections()
			end
			if self.connectedRoomLeft ~= nil then
				self.connectedRoomLeft:updateTempConnections()
			end
			if self.connectedRoomRight ~= nil then
				self.connectedRoomRight:updateTempConnections()
			end
		end
	end

	r.cleanUpConnections = function(self)
		if not self.hasUpdatedConnections then
			self.hasUpdatedConnections = true

			if self.connectedRoomTop ~= nil
				and (self.connectedRoomTop.xLeft ~= self.xLeft
				or self.connectedRoomTop.xRight ~= self.xRight
				or self.connectedRoomTop.yBottomLeft ~= self.yTopLeft
				or self.connectedRoomTop.yBottomRight ~= self.yTopRight) then
					self.connectedRoomTop.connectedRoomBottom = nil
					self.connectedRoomTop = nil
			end
			if self.connectedRoomBottom ~= nil
				and (self.connectedRoomBottom.xLeft ~= self.xLeft
				or self.connectedRoomBottom.xRight ~= self.xRight
				or self.connectedRoomBottom.yTopLeft ~= self.yBottomLeft
				or self.connectedRoomBottom.yTopRight ~= self.yBottomRight) then
					self.connectedRoomBottom.connectedRoomTop = nil
					self.connectedRoomBottom = nil
			end
			if self.connectedRoomLeft ~= nil
				and (self.connectedRoomLeft.xRight ~= self.xLeft
				or self.connectedRoomLeft.yTopRight ~= self.yTopLeft
				or self.connectedRoomLeft.yBottomRight ~= self.yBottomLeft) then
					self.connectedRoomLeft.connectedRoomRight = nil
					self.connectedRoomLeft = nil
			end
			if self.connectedRoomRight ~= nil
				and (self.connectedRoomRight.xLeft ~= self.xRight
				or self.connectedRoomRight.yTopLeft ~= self.yTopRight
				or self.connectedRoomRight.yBottomLeft ~= self.yBottomRight) then
					self.connectedRoomRight.connectedRoomLeft = nil
					self.connectedRoomRight = nil
			end

			for i = 1, #self.metaroom.rooms do
				local otherRoom = self.metaroom.rooms[i]
				if otherRoom ~= self then
					if otherRoom.xRight == self.xLeft
						and otherRoom.yTopRight == self.yTopLeft
						and otherRoom.yBottomRight == self.yBottomLeft
						and self.connectedRoomLeft == nil
						and otherRoom.connectedRoomRight == nil then
							self.connectedRoomLeft = otherRoom
							otherRoom.connectedRoomRight = self
					elseif otherRoom.xLeft == self.xRight
						and otherRoom.yTopLeft == self.yTopRight
						and otherRoom.yBottomLeft == self.yBottomRight
						and self.connectedRoomRight == nil
						and otherRoom.connectedRoomLeft == nil then
							self.connectedRoomRight = otherRoom
							otherRoom.connectedRoomLeft = self
					elseif  otherRoom.xLeft == self.xLeft
						and otherRoom.xRight == self.xRight
						and otherRoom.yBottomLeft == self.yTopLeft
						and otherRoom.yBottomRight == self.yTopRight
						and self.connectedRoomTop == nil
						and otherRoom.connectedRoomBottom == nil then
							self.connectedRoomTop = otherRoom
							otherRoom.connectedRoomBottom = self
					elseif otherRoom.xLeft == self.xLeft
						and otherRoom.xRight == self.xRight
						and otherRoom.yTopLeft == self.yBottomLeft
						and otherRoom.yTopRight == self.yBottomRight
						and self.connectedRoomBottom == nil
						and otherRoom.connectedRoomTop == nil then
							self.connectedRoomBottom = otherRoom
							otherRoom.connectedRoomTop = self
					end
				end
			end

			if self.connectedRoomTop ~= nil then
				self.connectedRoomTop:cleanUpConnections()
			end
			if self.connectedRoomBottom ~= nil then
				self.connectedRoomBottom:cleanUpConnections()
			end
			if self.connectedRoomLeft ~= nil then
				self.connectedRoomLeft:cleanUpConnections()
			end
			if self.connectedRoomRight ~= nil then
				self.connectedRoomRight:cleanUpConnections()
			end
		end
	end

	r.hasCollision = function(self)
		local hasCollision = false
		if not self.hasCheckedCollisions then
			self.hasCheckedCollisions = true

			local tl, tr, br, bl = self:getTempCorners()

			local roomsToIgnore = {}
			local partiallyConnectedTopLeft = nil
			local partiallyConnectedBottomLeft = nil
			local partiallyConnectedTopRight = nil
			local partiallyConnectedBottomRight = nil

			if self.connectedRoomTop ~= nil then
				table.insert(roomsToIgnore, self.connectedRoomTop)
				if self.connectedRoomTop.connectedRoomLeft ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomTop.connectedRoomLeft)
				end
				if self.connectedRoomTop.connectedRoomRight ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomTop.connectedRoomRight)
				end
			end

			if self.connectedRoomBottom ~= nil then
				table.insert(roomsToIgnore, self.connectedRoomBottom)
				if self.connectedRoomBottom.connectedRoomLeft ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomBottom.connectedRoomLeft)
				end
				if self.connectedRoomBottom.connectedRoomRight ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomBottom.connectedRoomRight)
				end
			end

			if self.connectedRoomLeft ~= nil then
				table.insert(roomsToIgnore, self.connectedRoomLeft)
				if self.connectedRoomLeft.connectedRoomTop ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomLeft.connectedRoomTop)
					if self.connectedRoomLeft.connectedRoomTop.connectedRoomRight ~= nil then
						partiallyConnectedTopLeft = self.connectedRoomLeft.connectedRoomTop.connectedRoomRight
						table.insert(roomsToIgnore, self.connectedRoomLeft.connectedRoomTop.connectedRoomRight)
					end
				end
				if self.connectedRoomLeft.connectedRoomBottom ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomLeft.connectedRoomBottom)
					if self.connectedRoomLeft.connectedRoomBottom.connectedRoomRight ~= nil then
						partiallyConnectedBottomLeft = self.connectedRoomLeft.connectedRoomBottom.connectedRoomRight
						table.insert(roomsToIgnore, self.connectedRoomLeft.connectedRoomBottom.connectedRoomRight)
					end
				end
			end

			if self.connectedRoomRight ~= nil then
				table.insert(roomsToIgnore, self.connectedRoomRight)
				if self.connectedRoomRight.connectedRoomTop ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomRight.connectedRoomTop)
					if self.connectedRoomRight.connectedRoomTop.connectedRoomRight ~= nil then
						partiallyConnectedTopRight = self.connectedRoomRight.connectedRoomTop.connectedRoomLeft
						table.insert(roomsToIgnore, self.connectedRoomRight.connectedRoomTop.connectedRoomLeft)
					end
				end
				if self.connectedRoomRight.connectedRoomBottom ~= nil then
					table.insert(roomsToIgnore, self.connectedRoomRight.connectedRoomBottom)
					if self.connectedRoomRight.connectedRoomBottom.connectedRoomRight ~= nil then
						partiallyConnectedBottomRight = self.connectedRoomRight.connectedRoomBottom.connectedRoomLeft
						table.insert(roomsToIgnore, self.connectedRoomRight.connectedRoomBottom.connectedRoomLeft)
					end
				end
			end

			for i = 1, #self.metaroom.rooms do
				local otherRoom = self.metaroom.rooms[i]
				if otherRoom ~= self then
					if (otherRoom == partiallyConnectedTopLeft and otherRoom.yTopRightTemp > self.yTopRightTemp)
						or (otherRoom == partiallyConnectedTopRight and otherRoom.yTopLeftTemp > self.yTopLeftTemp)
						or (otherRoom == partiallyConnectedBottomRight and otherRoom.yBottomLeftTemp < self.yBottomLeftTemp)
						or (otherRoom == partiallyConnectedBottomLeft and otherRoom.yBottomRightTemp < self.yBottomRightTemp) then
								hasCollision = true
						else

							local ignoreRoom = false
							for j = 1, #roomsToIgnore do
								local roomToIgnore = roomsToIgnore[j]
								if otherRoom == roomToIgnore then
									ignoreRoom = true
									break
								end
							end
							
							if not ignoreRoom then
								local tl2, tr2, br2, bl2 = otherRoom:getCorners()
								if geometry.polyPolyCollision({ tl, tr, br, bl }, { tl2, tr2, br2, bl2 }) then
									hasCollision = true
									break
								end
							end
						end
				end
			end

			if not hasCollision and self.connectedRoomTop ~= nil and self.connectedRoomTop:hasCollision() then
				hasCollision = true
			end
			if not hasCollision and self.connectedRoomBottom ~= nil and self.connectedRoomBottom:hasCollision() then
				hasCollision = true
			end
			if not hasCollision and self.connectedRoomLeft ~= nil and self.connectedRoomLeft:hasCollision() then
				hasCollision = true
			end
			if not hasCollision and self.connectedRoomRight ~= nil and self.connectedRoomRight:hasCollision() then
				hasCollision = true
			end
		end
		return hasCollision
	end

	r.breaksConstraint = function(self)
		local breaksConstraint = false

		if not self.hasCheckedConstraints then
			self.hasCheckedConstraints = true
			local topY = math.max(self.yTopLeftTemp, self.yTopRightTemp)
			local bottomY = math.min(self.yBottomLeftTemp, self.yBottomRightTemp)
			if self.xLeftTemp > self.xRightTemp - 10 or self.xRightTemp < self.xLeftTemp + 10 then
				breaksConstraint = true
			elseif topY > bottomY - 10 or bottomY < topY + 10 then
				breaksConstraint = true
			elseif self.connectedRoomTop ~= nil
				and (self.connectedRoomTop.xLeftTemp ~= self.xLeftTemp or self.connectedRoomTop.xRightTemp ~= self.xRightTemp) then
					breaksConstraint = true
			end

			if not breaksConstraint and self.connectedRoomTop ~= nil and self.connectedRoomTop:breaksConstraint() then
				breaksConstraint = true
			end
			if not breaksConstraint and self.connectedRoomBottom ~= nil and self.connectedRoomBottom:breaksConstraint() then
				breaksConstraint = true
			end
			if not breaksConstraint and self.connectedRoomLeft ~= nil and self.connectedRoomLeft:breaksConstraint() then
				breaksConstraint = true
			end
			if not breaksConstraint and self.connectedRoomRight ~= nil and self.connectedRoomRight:breaksConstraint() then
				breaksConstraint = true
			end
		end

		return breaksConstraint
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

		self:resetRoomStatuses()

		if self.selectedPart == "Room" then
			self:dragRoom(x, y, dx, dy)
		elseif self.selectedPart == "Top" or self.selectedPart == "Bottom" or self.selectedPart == "Left" or self.selectedPart == "Right" then
			self:dragEdge(x, y, dx, dy)
		elseif self.selectedPart == "tl" or self.selectedPart == "tr" or self.selectedPart == "br" or self.selectedPart == "bl" then
			self:dragCorner(x, y, dx, dy)
		end
	end

	r.dragRoom = function(self, x, y, dx, dy)
		self:setTargetObject(x, y)
		self:disconnect()
		self:updateTempPositions()

		self.xLeftTemp = self.xLeftStart + dx
		self.xRightTemp = self.xRightStart + dx
		self.yTopLeftTemp = self.yTopLeftStart + dy
		self.yTopRightTemp = self.yTopRightStart + dy
		self.yBottomLeftTemp = self.yBottomLeftStart + dy
		self.yBottomRightTemp = self.yBottomRightStart + dy

		if self:hasCollision() then
			self:resetRoomStatuses()
			self:updateTempPositions()
		end
		self:updatePositions()
	end

	r.dragEdge = function(self, x, y, dx, dy)
		self:setTargetObject(x, y)
		self:updateTempPositions()

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

		self:updateTempConnections()
		if self:hasCollision() or self:breaksConstraint() then
			self:resetRoomStatuses()
			self:updateTempPositions()
		end
		self:updatePositions()
	end

	r.dragCorner = function(self, x, y, dx, dy)
		self:updateTempPositions()

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

		self:updateTempConnections()
		if self:hasCollision() or self:breaksConstraint() then
			self:resetRoomStatuses()
			self:updateTempPositions()
		end
		self:updatePositions()
	end

	r.endDrag = function(self, x, y)
		self.isBeingDragged = false

		for i = 1, #self.metaroom.rooms do
			local otherRoom = self.metaroom.rooms[i]
		end
		
		if self.selectedPart == "Room"
			or self.selectedPart == "Top"
			or self.selectedPart == "Bottom"
			or self.selectedPart == "Left"
			or self.selectedPart == "Right" then
				for i = 1, #self.metaroom.rooms do
					local otherRoom = self.metaroom.rooms[i]
					if otherRoom ~= self and otherRoom:isPointInside(x, y) then
						self:connectRoom(otherRoom)
						break
					end
				end
		end

		if self.targetObject ~= nil then
			self.targetObject.isTarget = false
			self.targetObject = nil
		end
	end

	r.setProperty = function(self, propName, propValue)
		self:resetRoomStatuses()
		self:updateTempPositions()
		self[propName .. "Temp"] = propValue
		if not self:hasCollision() and not self:breaksConstraint() then
			self:updatePositions()
		end
	end

	r.connectRoom = function(self, otherRoom, initialConnection, permeability)
		local connection = nil
		local otherConnection = nil

		self:resetRoomStatuses()
		self:updateTempPositions()

		local selfTopY = math.max(self.yTopLeft, self.yTopRight) 
		local selfBottomY = math.min(self.yBottomLeft, self.yBottomRight)
		local otherTopY = math.max(otherRoom.yTopLeft, otherRoom.yTopRight) 
		local otherBottomY = math.min(otherRoom.yBottomLeft, otherRoom.yBottomRight)

		if (initialConnection or self.selectedPart == "Room" or self.selectedPart == "Left")
			and otherRoom.xRight <= self.xLeft and self.connectedRoomLeft == nil and otherRoom.connectedRoomRight == nil then
				connection = "Left"
				otherConnection = "Right"
		elseif (initialConnection or self.selectedPart == "Room" or self.selectedPart == "Right")
			and otherRoom.xLeft >= self.xRight and self.connectedRoomRight == nil and otherRoom.connectedRoomLeft == nil then
				connection = "Right"
				otherConnection = "Left"
		elseif (initialConnection or self.selectedPart == "Room" or self.selectedPart == "Top")
			and otherBottomY <= selfTopY and self.connectedRoomTop == nil and otherRoom.connectedRoomBottom == nil then
				connection = "Top"
				otherConnection = "Bottom"
		elseif (initialConnection or self.selectedPart == "Room" or self.selectedPart == "Bottom")
			and otherTopY >= selfBottomY and self.connectedRoomBottom == nil and otherRoom.connectedRoomTop == nil then
				connection = "Bottom"
				otherConnection = "Top"
		end

		permeability = 0

		if connection ~= nil then
			if permeability ~= nil then
				self["permeability" .. connection] = permeability
				otherRoom["permeability" .. otherConnection] = permeability
			end
			self["connectedRoom" .. connection] = otherRoom
			otherRoom["connectedRoom" .. otherConnection] = self

			otherRoom:updateTempConnections()

			if self:hasCollision() or self:breaksConstraint() then
				self["connectedRoom" .. connection] = nil
				otherRoom["connectedRoom" .. otherConnection] = nil
				self:resetRoomStatuses()
				self:updateTempPositions()
			else
				self:updatePositions()
				-- self:cleanUpConnections()
			end
		end
	end

	r.disconnect = function(self)
		if self.connectedRoomTop ~= nil then
			self.connectedRoomTop.connectedRoomBottom = nil
			self.connectedRoomTop = nil
		end
		if self.connectedRoomBottom ~= nil then
			self.connectedRoomBottom.connectedRoomTop = nil
			self.connectedRoomBottom = nil
		end
		if self.connectedRoomLeft ~= nil then
			self.connectedRoomLeft.connectedRoomRight = nil
			self.connectedRoomLeft = nil
		end
		if self.connectedRoomRight ~= nil then
			self.connectedRoomRight.connectedRoomLeft = nil
			self.connectedRoomRight = nil
		end
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
				local otherRoom = self.metaroom.rooms[i]
				if otherRoom ~= self and
					otherRoom ~= self.connectedRoomTop and
					otherRoom ~= self.connectedRoomBottom and
					otherRoom ~= self.connectedRoomLeft and
					otherRoom ~= self.connectedRoomRight and
					otherRoom:isPointInside(x, y) then
						self.targetObject = otherRoom
						otherRoom.isTarget = true
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