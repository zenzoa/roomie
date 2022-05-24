local geometry = require("geometry")
local metaroom = require("metaroom")
local room = require("room")
local caos = require("caos")
local ui = require("ui")

local offsetX = 0
local offsetY = 0
local scale = 1

local dragStartDistSq = 20 ^ 2

local mouseDown = false
local startX = 0
local startY = 0
local isDragging = false
local isPanning = false
local isExtruding = false

love.load = function()
	ui:setup()
end

love.update = function(dt)
	
	if ui.fsLoad.selectedFile ~= nil and ui.loadingType ~= nil then
		local path = ui.fsLoad:absPath(ui.fsLoad.selectedFile)
		local filename = string.match(path, "[/\\](%w+)%.")

		if ui.loadingType == "metaroom" and ui.metaroom == nil then
			local file = io.open(path, "r")
			if file ~= nil then
				local data = file:read("*all")
				if data ~= nil then
					loadMetaroom(data, path)
				end
				file:close()
			end

		elseif ui.loadingType == "background" and ui.metaroom ~= nil then
			ui.metaroom.background = filename
			local file = io.open(path, "rb")
			if file ~= nil then
				ui.fsLoad.selectedFile = nil
				local data = file:read("*all")
				local fileData = love.filesystem.newFileData(data, path)
				local imageData = love.image.newImageData(fileData)
				file:close()
				if imageData ~= nil then
					ui.metaroom.backgroundImage = love.graphics.newImage(imageData)
					ui.metaroom.width = ui.metaroom.backgroundImage:getWidth()
					ui.metaroom.height = ui.metaroom.backgroundImage:getHeight()
				end
			end
			ui:updateMetaSidePanel()

		elseif ui.loadingType == "music" and ui.metaroom ~= nil then
			ui.metaroom.music = filename
			ui:updateMetaSidePanel()

		elseif ui.loadingType == "roomMusic" and ui.metaroom ~= nil and ui.metaroom.selectedRoom ~= nil then
			ui.metaroom.selectedRoom.music = filename
			ui:updateRoomSidePanel()

		end

		ui.loadingType = nil
		ui.fsLoad.selectedFile = nil
	end
	
	if ui.fsSave.selectedFile and ui.metaroom ~= nil then
		local path = ui.fsSave:absPath(ui.fsSave.selectedFile)
		ui.fsSave.selectedFile = nil
		saveMetaroom(ui.metaroom, path)
	end
	
	ui:update()
end

love.draw = function()
	if ui.metaroom ~= nil then
		love.graphics.push()
		love.graphics.scale(scale)
		love.graphics.translate(offsetX, offsetY)
		ui.metaroom:draw()
		love.graphics.pop()
	end

	ui:draw()
end

love.resize = function(w, h)
	ui:resize(w, h)
end

love.mousepressed = function(x, y, button)
	local x2 = x / scale - offsetX
	local y2 = y / scale - offsetY

	if y > ui.topPanelHeight and x < ui.metaSidePanel:GetX() and ui.fsLoad.dialog == nil and ui.fsSave.dialog == nil then
		mouseDown = true
		startX = x
		startY = y

		if love.keyboard.isDown("space") then
			isPanning = true

		elseif button == 1 then
			if ui.metaroom ~= nil then
				if ui.isAddingRoom then
					local newRoom = room.create(x2, x2 + 10, y2, y2, y2 + 10, y2 + 10)
					ui.metaroom:addRoom(newRoom)
					ui.metaroom.selectedRoom = newRoom
					newRoom.selectedPart = "br"
					newRoom:startDrag(x2, y2)
				else
					ui.metaroom:selectObject(x2, y2)
				end
				if ui.metaroom.selectedRoom == nil then
					isPanning = true
				end
			end

		elseif button == 2 then
			ui.metaroom:selectObject(x2, y2, "edge")
			isExtruding = true
		end
	end

	ui:mousepressed(x, y, button)
end

love.mousemoved = function(x, y, dx, dy)
	local startX2 = startX / scale - offsetX
	local startY2 = startY / scale - offsetY

	if mouseDown and isPanning then
		offsetX = offsetX + dx / scale
		offsetY = offsetY + dy / scale

	elseif mouseDown and isDragging and ui.metaroom ~= nil and ui.metaroom.selectedRoom ~= nil then
		ui.metaroom:drag(x / scale - offsetX, y / scale - offsetY)
		if ui.isAddingRoom then
			ui.metaroom.selectedRoom.yBottomLeft = ui.metaroom.selectedRoom.yBottomRight
		end

	elseif mouseDown and isExtruding and ui.metaroom ~= nil then
		local distSq = (x - startX) ^ 2 + (y - startY) ^ 2
		if distSq > dragStartDistSq then
			local rm = ui.metaroom.selectedRoom
			local newRoom
			if rm ~= nil then
				ui.metaroom:deselect()
				local side = rm.selectedPart
				if side == "Top" then
					newRoom = room.create(rm.xLeft, rm.xRight, rm.yTopLeft - 10, rm.yTopRight - 10, rm.yTopLeft, rm.yTopRight)
					newRoom.selectedPart = "Top"
				elseif side == "Bottom" then
					newRoom = room.create(rm.xLeft, rm.xRight, rm.yBottomLeft, rm.yBottomRight, rm.yBottomLeft + 10, rm.yBottomRight + 10)
					newRoom.selectedPart = "Bottom"
				elseif side == "Left" then
					newRoom = room.create(rm.xLeft, rm.xLeft + 10, rm.yTopLeft, rm.yTopLeft, rm.yBottomLeft, rm.yBottomLeft)
					newRoom.selectedPart = "Left"
				elseif side == "Right" then
					newRoom = room.create(rm.xRight, rm.xRight + 10, rm.yTopRight, rm.yTopRight, rm.yBottomRight, rm.yBottomRight)
					newRoom.selectedPart = "Right"
				end
				if newRoom ~= nil then
					ui.metaroom:addRoom(newRoom)
					ui.metaroom.selectedRoom = newRoom
					ui.metaroom:startDrag(startX2, startY2)
					isDragging = true
					isExtruding = false
				end
			else
				newRoom = room.create(startX2, startX2 + 10, startY2, startY2, startY2 + 10, startY2 + 10)
				newRoom.selectedPart = "br"
				ui.metaroom:addRoom(newRoom)
				ui.metaroom.selectedRoom = newRoom
				ui.metaroom:startDrag(startX2, startY2)
				ui.isAddingRoom = true
				isDragging = true
				isExtruding = false
			end
		end

	elseif mouseDown and ui.metaroom ~= nil then
		local distSq = (x - startX) ^ 2 + (y - startY) ^ 2
		if distSq > dragStartDistSq then
			isDragging = true
			ui.metaroom:startDrag(startX2, startY2)
		end
	end
end

love.mousereleased = function(x, y, button)
	mouseDown = false
	isPanning = false
	isDragging = false
	isExtruding = false

	if ui.isAddingRoom then
		ui.newRoomButton:SetEnabled(true)
		ui.newRoomButton2:SetEnabled(true)
		ui.isAddingRoom = false
	end

	if ui.metaroom ~= nil then
		ui.metaroom:endDrag(x / scale - offsetX, y / scale - offsetY)
		ui:updateRoomSidePanel()
	end

	ui:mousereleased(x, y, button)
end

love.wheelmoved = function(x, y)
	if ui.fsLoad.dialog == nil and ui.fsSave.dialog == nil then
		local oldScale = scale
		local mX = x - offsetX
		local mY = y - offsetY
		if y > 0 and scale < 3 then
			scale = scale + 0.1
		elseif y < 0 and scale > 0.5 then
			scale = scale - 0.1
		end
		local newX = mX * (scale / oldScale)
		local newY = mY * (scale / oldScale)
		offsetX = offsetX + mX - newX
		offsetY = offsetY + mY - newY
	end
end

love.keypressed = function(key, isrepeat)
	local ctrlPressed = love.keyboard.isDown("lctrl") or love.keyboard.isDown("rctrl")
	local shiftPressed = love.keyboard.isDown("lshift") or love.keyboard.isDown("rshift")

	if ctrlPressed and key == "n" then
		ui.newMetaroomButton:OnClick()

	elseif ctrlPressed and key == "o" then
		ui.openMetaroomButton:OnClick()

	elseif ctrlPressed and key == "s" then
		ui.saveMetaroomButton:OnClick()

	elseif ctrlPressed and shiftPressed and key == "s" then
		ui.saveAsMetaroomButton:OnClick()

	elseif shiftPressed and key == "r" and ui.metaroom ~= nil then
		ui.isAddingRoom = not ui.isAddingRoom
		ui.newRoomButton:SetEnabled(not ui.isAddingRoom)
		ui.newRoomButton2:SetEnabled(not ui.isAddingRoom)

	elseif shiftPressed and key == "x" and ui.metaroom ~= nil and ui.metaroom.selectedRoom ~= nil then
		ui.metaroom:removeRoom(ui.metaroom.selectedRoom)
		ui.metaroom.selectedRoom = nil
	end

	ui:keypressed(key, isrepeat)
end

love.keyreleased = function(key)
	ui:keyreleased(key)
end


love.textinput = function(text)
	ui:textinput(text)
end

newMetaroom = function()
	ui.metaroom = metaroom.create()
	offsetX = 20
	offsetY = ui.topPanelHeight + 20
	scale = 1
	ui:updateMetaSidePanel()
end

loadMetaroom = function(data, path)
	local basePath = string.gsub(path, "%w+.cos", "")
	ui.metaroom = caos.decode(caos.parse(data))
	ui.metaroom.path = basePath
	ui.metaroom.filename = string.sub(path, #basePath)
	if ui.metaroom.background ~= "" then
		local backgroundPath = ui.metaroom.path .. ui.metaroom.background .. ".png"
		local file = io.open(backgroundPath, "rb")
		if file ~= nil then
			local data = file:read("*all")
			local fileData = love.filesystem.newFileData(data, backgroundPath)
			local imageData = love.image.newImageData(fileData)
			file:close()
			if imageData ~= nil then
				ui.metaroom.backgroundImage = love.graphics.newImage(imageData)
			end
		end
	end

	offsetX = 20
	offsetY = ui.topPanelHeight + 20
	scale = 1

	ui:updateMetaSidePanel()
end

saveMetaroom = function(metaroom, newPath)
	local path = newPath or (metaroom.path .. metaroom.filename)
	local file = io.open(path, "w")
	if file ~= nil then
		local lines = caos.encodeMetaroom(metaroom)
		for i = 1, #lines do
			file:write(lines[i] .. "\n")
		end
		file:close()
	end
end