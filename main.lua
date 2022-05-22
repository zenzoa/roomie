-- TODO:
-- fix adjacent-side/kitty-corner join issue
-- include connections/doors when saving

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
		ui.metaroom:draw(offsetX, offsetY)
		love.graphics.pop()
	end

	ui:draw()
end

love.resize = function(w, h)
	ui:resize(w, h)
end

love.mousepressed = function(x, y, button)
	if y > ui.topPanelHeight and x < ui.metaSidePanel:GetX() and ui.fsLoad.dialog == nil and ui.fsSave.dialog == nil then
		if button == 1 then
			mouseDown = true
			startX = x
			startY = y
			if ui.metaroom ~= nil then
				if ui.isAddingRoom then
					local newRoom = room.create(
						x / scale - offsetX,
						(x + 10) / scale - offsetX,
						y / scale - offsetY,
						y / scale - offsetY,
						(y + 10) / scale - offsetY,
						(y + 10) / scale - offsetY)
					ui.metaroom:addRoom(newRoom)
					-- if newRoom:checkCollisions() then
						ui.metaroom.selectedRoom = newRoom
						newRoom.selectedPart = "br"
						newRoom:startDrag(x / scale - offsetX, y / scale - offsetY)
					-- else
					-- 	ui.metaroom:removeRoom(newRoom)
					-- 	newRoom = nil
					-- end
				else
					ui.metaroom:selectObject(x / scale - offsetX, y / scale - offsetY)
				end
			end
		end

		if ui.metaroom ~= nil and ui.metaroom.selectedRoom == nil or button == 2 then
			mouseDown = true
			startX = x
			startY = y
			isPanning = true
		end
	end

	ui:mousepressed(x, y, button)
end

love.mousemoved = function(x, y, dx, dy)
	if mouseDown and isPanning then
		offsetX = offsetX + dx / scale
		offsetY = offsetY + dy / scale
	elseif mouseDown and isDragging and ui.metaroom ~= nil and ui.metaroom.selectedRoom ~= nil then
		ui.metaroom:drag(x / scale - offsetX, y / scale - offsetY)
		if ui.isAddingRoom then
			ui.metaroom.selectedRoom.yBottomLeft = ui.metaroom.selectedRoom.yBottomRight
		end
	elseif mouseDown and ui.metaroom ~= nil then
		local distSq = (x - startX) ^ 2 + (y - startY) ^ 2
		if distSq > dragStartDistSq then
			isDragging = true
			ui.metaroom:startDrag(startX / scale - offsetX, startY / scale - offsetY)
		end
	end
end

love.mousereleased = function(x, y, button)
	mouseDown = false
	isPanning = false
	isDragging = false

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
		if y > 0 and scale < 3 then
			scale = scale + 0.1
		elseif y < 0 and scale > 0.5 then
			scale = scale - 0.1
		end
	end
end

love.keypressed = function(key, isrepeat)
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

	offsetX = -ui.metaroom.x
	offsetY = -ui.metaroom.y
	scale = 1

	ui:updateMetaSidePanel()
end

saveMetaroom = function(metaroom, newPath)
	local path = newPath or (metaroom.path .. "newmetaroom.cos")
	local file = io.open(path, "w")
	if file ~= nil then
		local lines = caos.encodeMetaroom(metaroom)
		for i = 1, #lines do
			file:write(lines[i] .. "\n")
		end
		file:close()
	end
end