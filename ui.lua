local loveframes = require("loveframes")
require("lovefs/lovefs")
require("lovefs/loveframesDialog")

local ui = {}

ui.metaroom = nil

ui.isAddingRoom = false

ui.sidePanelWidth = 200
ui.panelPadding = 10
ui.panelSpacing = 5
ui.itemWidth = ui.sidePanelWidth - (ui.panelPadding * 2)
ui.topItemWidth = 100
ui.itemHeight = 25
ui.topPanelHeight = ui.itemHeight + (ui.panelPadding * 2)

ui.topPanel = nil
ui.metaSidePanel = nil
ui.roomSidePanel = nil

ui.newMetaroomButton = nil
ui.openMetaroomButton = nil
ui.saveMetaroomButton = nil

ui.newRoomButton = nil
ui.deleteRoomButton = nil

ui.xLeftInput = nil
ui.xRightInput = nil
ui.yTopLeftInput = nil
ui.yTopRightInput = nil
ui.yBottomLeftInput = nil
ui.yBottomRightInput = nil

ui.permTopInput = nil
ui.permBottomInput = nil
ui.permLeftInput = nil
ui.permRightInput = nil

ui.setup = function(self, fsLoad, fsSave)
	local width, height = love.window.getMode()

	self.topPanel = loveframes.Create("panel")
	self.topPanel:SetPos(0, 0)
	self.topPanel:SetSize(width, self.topPanelHeight)

	local x = self.panelPadding

	self.newMetaroomButton = loveframes.Create("button", self.topPanel)
	self.newMetaroomButton:SetPos(x, self.panelPadding)
	self.newMetaroomButton:SetSize(self.topItemWidth, self.itemHeight)
	self.newMetaroomButton:SetText("New")
	self.newMetaroomButton.OnClick = function(obj)
		if self.metaroom == nil then
			newMetaroom()
		else
			local pressedButton = love.window.showMessageBox(
				"New Metaroom",
				"Close current metaroom and create new one? Changes will not be saved.",
				{"Cancel", "Yes"})
			if pressedButton == 2 then
				newMetaroom()
			end
		end
	end
	x = x + self.newMetaroomButton:GetWidth() + self.panelSpacing

	self.openMetaroomButton = loveframes.Create("button", self.topPanel)
	self.openMetaroomButton:SetPos(x, self.panelPadding)
	self.openMetaroomButton:SetSize(self.topItemWidth, self.itemHeight)
	self.openMetaroomButton:SetText("Open")
	self.openMetaroomButton.OnClick = function(obj)
		if self.metaroom == nil then
			fsLoad:loadDialog(loveframes, nil, { 'COS | *.cos' })
		else
			local pressedButton = love.window.showMessageBox(
				"Open Metaroom",
				"Close current metaroom and open another one? Changes will not be saved.",
				{"Cancel", "Yes"})
			if pressedButton == 2 then
				self.metaroom = nil
				fsLoad:loadDialog(loveframes, nil, { 'COS | *.cos' })
			end
		end
	end
	x = x + self.openMetaroomButton:GetWidth() + self.panelSpacing

	self.saveMetaroomButton = loveframes.Create("button", self.topPanel)
	self.saveMetaroomButton:SetPos(x, self.panelPadding)
	self.saveMetaroomButton:SetSize(self.topItemWidth, self.itemHeight)
	self.saveMetaroomButton:SetText("Save")
	self.saveMetaroomButton.OnClick = function(obj)
		if self.metaroom ~= nil then
			if self.metaroom.path == "" then
				fsSave:saveDialog(loveframes)
			else
				saveMetaroom(self.metaroom)
			end
		end
	end
	x = x + self.saveMetaroomButton:GetWidth() + self.panelSpacing

	self.saveAsMetaroomButton = loveframes.Create("button", self.topPanel)
	self.saveAsMetaroomButton:SetPos(x, self.panelPadding)
	self.saveAsMetaroomButton:SetSize(self.topItemWidth, self.itemHeight)
	self.saveAsMetaroomButton:SetText("Save As")
	self.saveAsMetaroomButton.OnClick = function(obj)
		if self.metaroom ~= nil then
			fsSave:saveDialog(loveframes)
		end
	end

	self.metaSidePanel = loveframes.Create("panel")
	self.metaSidePanel:SetPos(width - self.sidePanelWidth, self.topPanelHeight)
	self.metaSidePanel:SetSize(self.sidePanelWidth, height)

	local y = self.panelPadding

	self.newRoomButton = loveframes.Create("button", self.metaSidePanel)
	self.newRoomButton:SetPos(self.panelPadding, y)
	self.newRoomButton:SetSize(self.itemWidth, self.itemHeight)
	self.newRoomButton:SetText("Add Room")
	self.newRoomButton.OnClick = function(obj)
		self.isAddingRoom = not self.isAddingRoom
		obj:SetEnabled(false)
	end

	self.roomSidePanel = loveframes.Create("panel")
	self.roomSidePanel:SetPos(width - self.sidePanelWidth, self.topPanelHeight)
	self.roomSidePanel:SetSize(self.sidePanelWidth, height)
	self.roomSidePanel:SetVisible(false)

	y = self.panelPadding

	self.newRoomButton2 = loveframes.Create("button", self.roomSidePanel)
	self.newRoomButton2:SetPos(self.panelPadding, y)
	self.newRoomButton2:SetSize(self.itemWidth, self.itemHeight)
	self.newRoomButton2:SetText("Add Room")
	self.newRoomButton2.OnClick = function(obj)
		self.isAddingRoom = not self.isAddingRoom
		obj:SetEnabled(false)
	end
	y = y + self.newRoomButton2:GetHeight() + self.panelSpacing

	removeRoomButton = loveframes.Create("button", self.roomSidePanel)
	removeRoomButton:SetPos(self.panelPadding, y)
	removeRoomButton:SetSize(self.itemWidth, self.itemHeight)
	removeRoomButton:SetText("Remove Room")
	removeRoomButton.OnClick = function(obj)
		self.metaroom:removeRoom(self.metaroom.selectedRoom)
		self.metaroom.selectedRoom = nil
	end
	y = y + removeRoomButton:GetHeight() + self.panelSpacing

	local xLeftLabel = loveframes.Create("text", self.roomSidePanel)
	xLeftLabel:SetPos(self.panelPadding, y)
	xLeftLabel:SetSize(self.itemWidth, self.itemHeight)
	xLeftLabel:SetText("x Left")
	y = y + xLeftLabel:GetHeight() + self.panelSpacing
	self.xLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.xLeftInput:SetPos(self.panelPadding, y)
	self.xLeftInput:SetSize(self.itemWidth, self.itemHeight)
	self.xLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("xLeft", newValue)
		end
	end
	y = y + self.xLeftInput:GetHeight() + self.panelSpacing

	local xRightLabel = loveframes.Create("text", self.roomSidePanel)
	xRightLabel:SetPos(self.panelPadding, y)
	xRightLabel:SetSize(self.itemWidth, self.itemHeight)
	xRightLabel:SetText("x Right")
	y = y + xRightLabel:GetHeight() + self.panelSpacing
	self.xRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.xRightInput:SetPos(self.panelPadding, y)
	self.xRightInput:SetSize(self.itemWidth, self.itemHeight)
	self.xRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("xRight", newValue)
		end
	end
	y = y + self.xRightInput:GetHeight() + self.panelSpacing

	local yTopLeftLabel = loveframes.Create("text", self.roomSidePanel)
	yTopLeftLabel:SetPos(self.panelPadding, y)
	yTopLeftLabel:SetSize(self.itemWidth, self.itemHeight)
	yTopLeftLabel:SetText("y Top Left")
	y = y + yTopLeftLabel:GetHeight() + self.panelSpacing
	self.yTopLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yTopLeftInput:SetPos(self.panelPadding, y)
	self.yTopLeftInput:SetSize(self.itemWidth, self.itemHeight)
	self.yTopLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yTopLeft", newValue)
		end
	end
	y = y + self.yTopLeftInput:GetHeight() + self.panelSpacing

	local yTopRightLabel = loveframes.Create("text", self.roomSidePanel)
	yTopRightLabel:SetPos(self.panelPadding, y)
	yTopRightLabel:SetSize(self.itemWidth, self.itemHeight)
	yTopRightLabel:SetText("y Top Right")
	y = y + yTopRightLabel:GetHeight() + self.panelSpacing
	self.yTopRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yTopRightInput:SetPos(self.panelPadding, y)
	self.yTopRightInput:SetSize(self.itemWidth, self.itemHeight)
	self.yTopRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yTopRight", newValue)
		end
	end
	y = y + self.yTopRightInput:GetHeight() + self.panelSpacing

	local yBottomLeftLabel = loveframes.Create("text", self.roomSidePanel)
	yBottomLeftLabel:SetPos(self.panelPadding, y)
	yBottomLeftLabel:SetSize(self.itemWidth, self.itemHeight)
	yBottomLeftLabel:SetText("y Bottom Left")
	y = y + yBottomLeftLabel:GetHeight() + self.panelSpacing
	self.yBottomLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yBottomLeftInput:SetPos(self.panelPadding, y)
	self.yBottomLeftInput:SetSize(self.itemWidth, self.itemHeight)
	self.yBottomLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yBottomLeft", newValue)
		end
	end
	y = y + self.yBottomLeftInput:GetHeight() + self.panelSpacing

	local yBottomRightLabel = loveframes.Create("text", self.roomSidePanel)
	yBottomRightLabel:SetPos(self.panelPadding, y)
	yBottomRightLabel:SetSize(self.itemWidth, self.itemHeight)
	yBottomRightLabel:SetText("y Bottom Right")
	y = y + yBottomRightLabel:GetHeight() + self.panelSpacing
	self.yBottomRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yBottomRightInput:SetPos(self.panelPadding, y)
	self.yBottomRightInput:SetSize(self.itemWidth, self.itemHeight)
	self.yBottomRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yBottomRight", newValue)
		end
	end
	y = y + self.yBottomRightInput:GetHeight() + self.panelSpacing

	-- self.permTopInput = nil
	-- self.permBottomInput = nil
	-- self.permLeftInput = nil
	-- self.permRightInput = nil
end

ui.update = function(self)
	if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil and self.roomSidePanel:GetVisible() == false then
		self.metaSidePanel:SetVisible(false)
		self.roomSidePanel:SetVisible(true)
	elseif self.metaroom ~= nil and self.metaroom.selectedRoom == nil and self.metaSidePanel:GetVisible() == false then
		self.metaSidePanel:SetVisible(true)
		self.roomSidePanel:SetVisible(false)
	end

	loveframes.update(dt)
end

ui.draw = function(self)
	loveframes.draw()
end

ui.mousepressed = function(self, x, y, button)
	loveframes.mousepressed(x, y, button)
end

ui.mousereleased = function(self, x, y, button)
	loveframes.mousereleased(x, y, button)
end

ui.keypressed = function(self, key, isrepeat)
	loveframes.keypressed(key, isrepeat)
end

ui.keyreleased = function(self, key)
	loveframes.keyreleased(key)
end

ui.textinput = function(self, text)
	loveframes.textinput(text)
end

ui.resize = function(self, w, h)
	self.topPanel:SetWidth(w)
	self.metaSidePanel:SetX(w - self.sidePanelWidth)
	self.metaSidePanel:SetHeight(h)
	self.roomSidePanel:SetX(w - self.sidePanelWidth)
	self.roomSidePanel:SetHeight(h)
end

ui.setRoomInputsMinMax = function(self)
	self.xLeftInput:SetMinMax(self.metaroom.x, self.metaroom.x + self.metaroom.width)
	self.xRightInput:SetMinMax(self.metaroom.x, self.metaroom.x + self.metaroom.width)
	self.yTopLeftInput:SetMinMax(self.metaroom.y, self.metaroom.y + self.metaroom.height)
	self.yTopRightInput:SetMinMax(self.metaroom.y, self.metaroom.y + self.metaroom.height)
	self.yBottomLeftInput:SetMinMax(self.metaroom.y, self.metaroom.y + self.metaroom.height)
	self.yBottomRightInput:SetMinMax(self.metaroom.y, self.metaroom.y + self.metaroom.height)
end

ui.updateRoomSidePanel = function(self)
	if self.metaroom.selectedRoom ~= nil then
		self.xLeftInput:SetValue(self.metaroom.selectedRoom.xLeft)
		self.xRightInput:SetValue(self.metaroom.selectedRoom.xRight)
		self.yTopLeftInput:SetValue(self.metaroom.selectedRoom.yTopLeft)
		self.yTopRightInput:SetValue(self.metaroom.selectedRoom.yTopRight)
		self.yBottomLeftInput:SetValue(self.metaroom.selectedRoom.yBottomLeft)
		self.yBottomRightInput:SetValue(self.metaroom.selectedRoom.yBottomRight)
	end
end

return ui