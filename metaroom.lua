local geometry = require("geometry")

local metaroom = {}

metaroom.create = function(x, y, width, height, background)
	local m = {
		class = "metaroom",
		x = x or 0,
		y = y or 0,
		width = width or 800,
		height = height or 600,
		path = "",
		filename = "",
		background = background or "",
		backgroundImage = nil,
		music = "",
		rooms = {},
		selectedParts = {},
		selectedRoom = nil,
	}

	m.draw = function(self)
		if self.backgroundImage == nil then
			love.graphics.setColor(0.2, 0.2, 0.2)
			love.graphics.rectangle("fill", 0, 0, self.width, self.height)
		else
			love.graphics.setColor(1, 1, 1)
			love.graphics.draw(self.backgroundImage, 0, 0)
		end
		love.graphics.setColor(1, 0, 1)
		love.graphics.setLineWidth(4)
		love.graphics.rectangle("line", 0, 0, self.width, self.height)
		
		for i = 1, #self.rooms do
			local r = self.rooms[i]
			r:drawRoom(self.selectedRoom)
		end
		for i = 1, #self.rooms do
			local r = self.rooms[i]
			r:drawEdges(self.selectedRoom)
		end
		for i = 1, #self.rooms do
			local r = self.rooms[i]
			r:drawCorners(self.selectedRoom)
		end
	end

	m.addRoom = function(self, newRoom)
		newRoom.metaroom = self
		table.insert(self.rooms, newRoom)
	end

	m.removeRoom = function(self, roomToRemove)
		local pressedButton = love.window.showMessageBox(
			"Remove Room",
			"Remove selected room?",
			{"Cancel", "Yes"})

		if pressedButton == 2 then
			local removalIndex = nil
			for i = 1, #self.rooms do
				local r = self.rooms[i]
				if r == roomToRemove then
					removalIndex = i
				end
			end
			if removalIndex ~= nil then
				table.remove(self.rooms, removalIndex)
			end
		end
	end

	m.isPointInside = function(self, px, py)
		local tl = { x = self.x, y = self.y }
		local tr = { x = self.x + self.width, y = self.y }
		local br = { x = self.x + self.width, y = self.y + self.height }
		local bl = { x = self.x, y = self.y + self.height }
		return geometry.pointPolyCollision(px, py, { tl, tr, br, bl })
	end

	m.selectObject = function(self, mx, my, type)
		self:deselect()

		local tempObject

		if type == "corner" or type == nil then
			for i = 1, #self.rooms do
				tempObject = self.rooms[i]:selectCorner(mx, my)
				if tempObject ~= nil then
					self.selectedRoom = tempObject
					table.insert(self.selectedParts, { room = tempObject })
				end
			end
		end

		if (type == "edge" or type == nil) and self.selectedRoom == nil then
			for i = 1, #self.rooms do
				tempObject = self.rooms[i]:selectEdge(mx, my)
				if tempObject ~= nil then
					self.selectedRoom = tempObject
					table.insert(self.selectedParts, { room = tempObject })
				end
			end
		end

		if (type == "room" or type == nil) and self.selectedRoom == nil then
			for i = 1, #self.rooms do
				tempObject = self.rooms[i]:selectRoom(mx, my)
				if tempObject ~= nil then
					self.selectedRoom = tempObject
					break
				end
			end
		end
	end

	m.deselect = function(self)
		self.selectedRoom = nil
		self.selectedParts = {}
	end

	m.startDrag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:startDrag(x, y)
		end
		for i = 1, #self.selectedParts do
			local part = self.selectedParts[i]
			if part.room ~= self.selectedRoom then
				part.room:startDrag(x, y)
			end
		end
	end

	m.drag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:drag(x, y)
		end
		for i = 1, #self.selectedParts do
			local part = self.selectedParts[i]
			if part.room ~= self.selectedRoom then
				part.room:drag(x, y)
			end
		end
	end

	m.endDrag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:endDrag(x, y)
		end
		for i = 1, #self.selectedParts do
			local part = self.selectedParts[i]
			if part.room ~= self.selectedRoom then
				part.room:endDrag(x, y)
			end
		end
	end

	return m
end

return metaroom