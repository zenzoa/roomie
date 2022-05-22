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
		selectedRoom = nil,
		targetObject = nil
	}

	m.draw = function(self, offsetX, offsetY)
		if self.backgroundImage == nil then
			love.graphics.setColor(0.2, 0.2, 0.2)
			love.graphics.rectangle("fill", self.x + offsetX, self.y + offsetY, self.width, self.height)
		else
			love.graphics.setColor(1, 1, 1)
			love.graphics.draw(self.backgroundImage, self.x + offsetX, self.y + offsetY)
		end
		love.graphics.setColor(1, 0, 1)
		love.graphics.setLineWidth(4)
		love.graphics.rectangle("line", self.x + offsetX, self.y + offsetY, self.width, self.height)
		for i = 1, #self.rooms do
			local r = self.rooms[i]
			r:draw(offsetX, offsetY, self.selectedRoom, self.targetObject)
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

	m.selectObject = function(self, mx, my)
		local tempObject = nil
		for i = 1, #self.rooms do
			local r = self.rooms[i]
			tempObject = r:selectObject(mx, my)
			if tempObject ~= nil then
				break
			end
		end
		self.selectedRoom = tempObject
	end

	m.startDrag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:startDrag(x, y)
		end
	end

	m.drag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:drag(x, y)
		end
	end

	m.endDrag = function(self, x, y)
		if self.selectedRoom ~= nil then
			self.selectedRoom:endDrag(x, y)
		end
	end

	return m
end

return metaroom