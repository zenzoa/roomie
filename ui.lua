local loveframes = require("loveframes")
require("lovefs/lovefs")
require("lovefs/loveframesDialog")

local ui = {}

ui.metaroom = nil

ui.isAddingRoom = false
ui.loadingType = nil

ui.sidePanelWidth = 200
ui.panelPadding = 10
ui.panelSpacing = 10
ui.labelSpacing = 5
ui.itemWidth = ui.sidePanelWidth - (ui.panelPadding * 2)
ui.labelWidth = 100
ui.numberboxWidth = ui.itemWidth - ui.labelWidth
ui.topItemWidth = 100
ui.itemHeight = 25
ui.topPanelHeight = ui.itemHeight + (ui.panelPadding * 2)
ui.labelOffsetY = 5

ui.roomTypes = {
	"0 Atmosphere",
	"1 Wooden Walkway",
	"2 Concrete Walkway",
	"3 Indoor Concrete",
	"4 Outdoor Concrete",
	"5 Normal Soil",
	"6 Boggy Soil",
	"7 Drained Soil",
	"8 Fresh Water",
	"9 Salt Water",
	"10 Ettin Home"
}

ui.setup = function(self)
	self.fsLoad = lovefs()
	self.fsSave = lovefs()

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
		self.loadingType = "metaroom"
		if self.metaroom == nil then
			self.fsLoad:loadDialog(loveframes, nil, { 'COS | *.cos' })
		else
			local pressedButton = love.window.showMessageBox(
				"Open Metaroom",
				"Close current metaroom and open another one? Changes will not be saved.",
				{"Cancel", "Yes"})
			if pressedButton == 2 then
				self.metaroom = nil
				self.fsLoad:loadDialog(loveframes, nil, { 'COS | *.cos' })
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
			if self.metaroom.filename == "" then
				self.fsSave:saveDialog(loveframes)
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
			self.fsSave:saveDialog(loveframes)
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
	y = y + self.newRoomButton:GetHeight() + self.panelSpacing

	local metaroomXLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomXLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	metaroomXLabel:SetSize(self.labelWidth, self.itemHeight)
	metaroomXLabel:SetText("x")
	self.metaroomXInput = loveframes.Create("numberbox", self.metaSidePanel)
	self.metaroomXInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.metaroomXInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.metaroomXInput:SetMinMax(0, 100000)
	self.metaroomXInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			self.metaroom.x = newValue
		end
	end
	y = y + self.metaroomXInput:GetHeight() + self.panelSpacing

	local metaroomYLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomYLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	metaroomYLabel:SetSize(self.labelWidth, self.itemHeight)
	metaroomYLabel:SetText("y")
	self.metaroomYInput = loveframes.Create("numberbox", self.metaSidePanel)
	self.metaroomYInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.metaroomYInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.metaroomYInput:SetMinMax(0, 100000)
	self.metaroomYInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			self.metaroom.y = newValue
		end
	end
	y = y + self.metaroomYInput:GetHeight() + self.panelSpacing

	local metaroomWidthLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomWidthLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	metaroomWidthLabel:SetSize(self.labelWidth, self.itemHeight)
	metaroomWidthLabel:SetText("Width")
	self.metaroomWidthInput = loveframes.Create("numberbox", self.metaSidePanel)
	self.metaroomWidthInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.metaroomWidthInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.metaroomWidthInput:SetMinMax(0, 100000)
	self.metaroomWidthInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			local newWidth = newValue
			for i = 1, #self.metaroom.rooms do
				local r = self.metaroom.rooms[i]
				if r.xRight > newWidth then
					newWidth = r.xRight
				end
			end
			self.metaroom.width = newWidth
		end
	end
	y = y + self.metaroomWidthInput:GetHeight() + self.panelSpacing

	local metaroomHeightLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomHeightLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	metaroomHeightLabel:SetSize(self.labelWidth, self.itemHeight)
	metaroomHeightLabel:SetText("Height")
	self.metaroomHeightInput = loveframes.Create("numberbox", self.metaSidePanel)
	self.metaroomHeightInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.metaroomHeightInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.metaroomHeightInput:SetMinMax(0, 100000)
	self.metaroomHeightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			local newHeight = newValue
			for i = 1, #self.metaroom.rooms do
				local r = self.metaroom.rooms[i]
				if r.yBottomLeft > newHeight then
					newHeight = r.yBottomLeft
				end
				if r.yBottomRight > newHeight then
					newHeight = r.yBottomRight
				end
			end
			self.metaroom.height = newHeight
		end
	end
	y = y + self.metaroomHeightInput:GetHeight() + self.panelSpacing

	local metaroomBackgroundLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomBackgroundLabel:SetPos(self.panelPadding, y)
	metaroomBackgroundLabel:SetSize(self.itemWidth, self.itemHeight)
	metaroomBackgroundLabel:SetText("Background")
	y = y + metaroomBackgroundLabel:GetHeight() + self.labelSpacing
	self.metaroomBackgroundInput = loveframes.Create("textinput", self.metaSidePanel)
	self.metaroomBackgroundInput:SetPos(self.panelPadding, y)
	self.metaroomBackgroundInput:SetSize(self.itemWidth, self.itemHeight)
	self.metaroomBackgroundInput.OnTextChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			self.metaroom.background = newValue
		end
	end
	y = y + self.metaroomBackgroundInput:GetHeight() + self.labelSpacing
	self.metaroomBackgroundButton = loveframes.Create("button", self.metaSidePanel)
	self.metaroomBackgroundButton:SetPos(self.panelPadding, y)
	self.metaroomBackgroundButton:SetSize(self.itemWidth, self.itemHeight)
	self.metaroomBackgroundButton:SetText("Choose File")
	self.metaroomBackgroundButton.OnClick = function(obj, newValue)
		if self.metaroom ~= nil then
			self.loadingType = "background"
			self.fsLoad:loadDialog(loveframes, nil, { 'PNG | *.png', 'BLK | *.blk' })
		end
	end
	y = y + self.metaroomBackgroundButton:GetHeight() + self.panelSpacing

	local metaroomMusicLabel = loveframes.Create("text", self.metaSidePanel)
	metaroomMusicLabel:SetPos(self.panelPadding, y)
	metaroomMusicLabel:SetSize(self.itemWidth, self.itemHeight)
	metaroomMusicLabel:SetText("Music")
	y = y + metaroomMusicLabel:GetHeight() + self.labelSpacing
	self.metaroomMusicInput = loveframes.Create("textinput", self.metaSidePanel)
	self.metaroomMusicInput:SetPos(self.panelPadding, y)
	self.metaroomMusicInput:SetSize(self.itemWidth, self.itemHeight)
	self.metaroomMusicInput.OnTextChanged = function(obj, newValue)
		if self.metaroom ~= nil then
			self.metaroom.music = newValue
		end
	end
	y = y + self.metaroomMusicInput:GetHeight() + self.labelSpacing
	self.metaroomMusicButton = loveframes.Create("button", self.metaSidePanel)
	self.metaroomMusicButton:SetPos(self.panelPadding, y)
	self.metaroomMusicButton:SetSize(self.itemWidth, self.itemHeight)
	self.metaroomMusicButton:SetText("Choose File")
	self.metaroomMusicButton.OnClick = function(obj, newValue)
		if self.metaroom ~= nil then
			self.loadingType = "music"
			self.fsLoad:loadDialog(loveframes, nil, { 'WAV | *.wav' })
		end
	end
	y = y + self.metaroomMusicButton:GetHeight() + self.panelSpacing

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
	xLeftLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	xLeftLabel:SetSize(self.labelWidth, self.itemHeight)
	xLeftLabel:SetText("x Left")
	self.xLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.xLeftInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.xLeftInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.xLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("xLeft", newValue)
		end
	end
	y = y + self.xLeftInput:GetHeight() + self.panelSpacing

	local xRightLabel = loveframes.Create("text", self.roomSidePanel)
	xRightLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	xRightLabel:SetSize(self.labelWidth, self.itemHeight)
	xRightLabel:SetText("x Right")
	self.xRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.xRightInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.xRightInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.xRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("xRight", newValue)
		end
	end
	y = y + self.xRightInput:GetHeight() + self.panelSpacing

	local yTopLeftLabel = loveframes.Create("text", self.roomSidePanel)
	yTopLeftLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	yTopLeftLabel:SetSize(self.labelWidth, self.itemHeight)
	yTopLeftLabel:SetText("y Top Left")
	self.yTopLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yTopLeftInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.yTopLeftInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.yTopLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yTopLeft", newValue)
		end
	end
	y = y + self.yTopLeftInput:GetHeight() + self.panelSpacing

	local yTopRightLabel = loveframes.Create("text", self.roomSidePanel)
	yTopRightLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	yTopRightLabel:SetSize(self.labelWidth, self.itemHeight)
	yTopRightLabel:SetText("y Top Right")
	self.yTopRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yTopRightInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.yTopRightInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.yTopRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yTopRight", newValue)
		end
	end
	y = y + self.yTopRightInput:GetHeight() + self.panelSpacing

	local yBottomLeftLabel = loveframes.Create("text", self.roomSidePanel)
	yBottomLeftLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	yBottomLeftLabel:SetSize(self.labelWidth, self.itemHeight)
	yBottomLeftLabel:SetText("y Bottom Left")
	self.yBottomLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yBottomLeftInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.yBottomLeftInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.yBottomLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yBottomLeft", newValue)
		end
	end
	y = y + self.yBottomLeftInput:GetHeight() + self.panelSpacing

	local yBottomRightLabel = loveframes.Create("text", self.roomSidePanel)
	yBottomRightLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	yBottomRightLabel:SetSize(self.labelWidth, self.itemHeight)
	yBottomRightLabel:SetText("y Bottom Right")
	self.yBottomRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.yBottomRightInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.yBottomRightInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.yBottomRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setProperty("yBottomRight", newValue)
		end
	end
	y = y + self.yBottomRightInput:GetHeight() + self.panelSpacing

	local permTopLabel = loveframes.Create("text", self.roomSidePanel)
	permTopLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	permTopLabel:SetSize(self.labelWidth, self.itemHeight)
	permTopLabel:SetText("Perm. Top")
	self.permTopInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.permTopInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.permTopInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.permTopInput:SetMinMax(0, 100)
	self.permTopInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setPermeability("Top", newValue)
		end
	end
	y = y + self.permTopInput:GetHeight() + self.panelSpacing

	local permBottomLabel = loveframes.Create("text", self.roomSidePanel)
	permBottomLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	permBottomLabel:SetSize(self.labelWidth, self.itemHeight)
	permBottomLabel:SetText("Perm. Bottom")
	self.permBottomInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.permBottomInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.permBottomInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.permBottomInput:SetMinMax(0, 100)
	self.permBottomInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setPermeability("Bottom", newValue)
		end
	end
	y = y + self.permBottomInput:GetHeight() + self.panelSpacing

	local permLeftLabel = loveframes.Create("text", self.roomSidePanel)
	permLeftLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	permLeftLabel:SetSize(self.labelWidth, self.itemHeight)
	permLeftLabel:SetText("Perm. Left")
	self.permLeftInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.permLeftInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.permLeftInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.permLeftInput:SetMinMax(0, 100)
	self.permLeftInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setPermeability("Left", newValue)
		end
	end
	y = y + self.permLeftInput:GetHeight() + self.panelSpacing

	local permRightLabel = loveframes.Create("text", self.roomSidePanel)
	permRightLabel:SetPos(self.panelPadding, y + ui.labelOffsetY)
	permRightLabel:SetSize(self.labelWidth, self.itemHeight)
	permRightLabel:SetText("Perm. Right")
	self.permRightInput = loveframes.Create("numberbox", self.roomSidePanel)
	self.permRightInput:SetPos(self.panelPadding + self.labelWidth, y)
	self.permRightInput:SetSize(self.numberboxWidth, self.itemHeight)
	self.permRightInput:SetMinMax(0, 100)
	self.permRightInput.OnValueChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom:setPermeability("Right", newValue)
		end
	end
	y = y + self.permRightInput:GetHeight() + self.panelSpacing

	local roomTypeLabel = loveframes.Create("text", self.roomSidePanel)
	roomTypeLabel:SetPos(self.panelPadding, y)
	roomTypeLabel:SetSize(self.itemWidth, self.itemHeight)
	roomTypeLabel:SetText("Type")
	y = y + roomTypeLabel:GetHeight() + self.labelSpacing
	self.roomTypeInput = loveframes.Create("multichoice", self.roomSidePanel)
	self.roomTypeInput:SetPos(self.panelPadding, y)
	self.roomTypeInput:SetSize(self.itemWidth, self.itemHeight)
	for i = 1, #ui.roomTypes do
		self.roomTypeInput:AddChoice(ui.roomTypes[i])
	end
	self.roomTypeInput.OnChoiceSelected = function(obj, choice)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			for i = 1, #ui.roomTypes do
				if ui.roomTypes[i] == choice then
					self.metaroom.selectedRoom.type = i - 1
					break
				end
			end
		end
	end
	y = y + self.roomTypeInput:GetHeight() + self.labelSpacing

	local roomMusicLabel = loveframes.Create("text", self.roomSidePanel)
	roomMusicLabel:SetPos(self.panelPadding, y)
	roomMusicLabel:SetSize(self.itemWidth, self.itemHeight)
	roomMusicLabel:SetText("Music")
	y = y + roomMusicLabel:GetHeight() + self.labelSpacing
	self.roomMusicInput = loveframes.Create("textinput", self.roomSidePanel)
	self.roomMusicInput:SetPos(self.panelPadding, y)
	self.roomMusicInput:SetSize(self.itemWidth, self.itemHeight)
	self.roomMusicInput.OnTextChanged = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.metaroom.selectedRoom.music = newValue
		end
	end
	y = y + self.roomMusicInput:GetHeight() + self.labelSpacing
	self.roomMusicButton = loveframes.Create("button", self.roomSidePanel)
	self.roomMusicButton:SetPos(self.panelPadding, y)
	self.roomMusicButton:SetSize(self.itemWidth, self.itemHeight)
	self.roomMusicButton:SetText("Choose File")
	self.roomMusicButton.OnClick = function(obj, newValue)
		if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
			self.loadingType = "roomMusic"
			self.fsLoad:loadDialog(loveframes, nil, { 'WAV | *.wav' })
		end
	end
	y = y + self.roomMusicButton:GetHeight() + self.panelSpacing
end

ui.update = function(self)
	if self.metaroom == nil then
		self.metaSidePanel:SetVisible(false)
		self.roomSidePanel:SetVisible(false)
	elseif self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil and self.roomSidePanel:GetVisible() == false then
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

ui.updateMetaSidePanel = function(self)
	if self.metaroom ~= nil then
		self.metaroomXInput:SetValue(self.metaroom.x)
		self.metaroomYInput:SetValue(self.metaroom.y)
		self.metaroomWidthInput:SetValue(self.metaroom.width)
		self.metaroomHeightInput:SetValue(self.metaroom.height)
		self.metaroomBackgroundInput:SetValue(self.metaroom.background)
		self.metaroomMusicInput:SetValue(self.metaroom.music)
		self:setRoomInputsMinMax()
	end
end

ui.setRoomInputsMinMax = function(self)
	self.xLeftInput:SetMinMax(0, self.metaroom.width)
	self.xRightInput:SetMinMax(0, self.metaroom.width)
	self.yTopLeftInput:SetMinMax(0, self.metaroom.height)
	self.yTopRightInput:SetMinMax(0, self.metaroom.height)
	self.yBottomLeftInput:SetMinMax(0, self.metaroom.height)
	self.yBottomRightInput:SetMinMax(0, self.metaroom.height)
end

ui.updateRoomSidePanel = function(self)
	if self.metaroom ~= nil and self.metaroom.selectedRoom ~= nil then
		self.xLeftInput:SetValue(self.metaroom.selectedRoom.xLeft)
		self.xRightInput:SetValue(self.metaroom.selectedRoom.xRight)
		self.yTopLeftInput:SetValue(self.metaroom.selectedRoom.yTopLeft)
		self.yTopRightInput:SetValue(self.metaroom.selectedRoom.yTopRight)
		self.yBottomLeftInput:SetValue(self.metaroom.selectedRoom.yBottomLeft)
		self.yBottomRightInput:SetValue(self.metaroom.selectedRoom.yBottomRight)
		self.permTopInput:SetValue(self.metaroom.selectedRoom.permeabilityTop)
		self.permBottomInput:SetValue(self.metaroom.selectedRoom.permeabilityBottom)
		self.permLeftInput:SetValue(self.metaroom.selectedRoom.permeabilityLeft)
		self.permRightInput:SetValue(self.metaroom.selectedRoom.permeabilityRight)
		self.roomTypeInput:SetChoice(ui.roomTypes[self.metaroom.selectedRoom.type + 1])
		self.roomMusicInput:SetValue(self.metaroom.selectedRoom.music)
	end
end

return ui