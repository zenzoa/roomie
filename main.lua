local geometry = require("geometry")
local metaroom = require("metaroom")
local room = require("room")
local caos = require("caos")
local ui = require("ui")
local nativefs = require("nativefs/nativefs")

local offsetX = 0
local offsetY = 0
local scale = 1

local dragStartDistSq = 20 ^ 2

local mouseDown = false
local startX = 0
local startY = 0
local isDragging = false
local isPanning = false

local fsLoad, fsSave

love.load = function()
	fsLoad = lovefs()
	fsSave = lovefs()
	ui:setup(fsLoad, fsSave)
end

love.update = function(dt)
	
	if fsLoad.selectedFile ~= nil and ui.metaroom == nil then
		local path = fsLoad:absPath(fsLoad.selectedFile)
		local fileInfo = nativefs.getInfo(path)
		if fileInfo ~= nil then
			local data = nativefs.read("string", path)
			if data ~= nil then
				fsLoad.selectedFile = nil
				loadMetaroom(data, path)
			end
		end
	end
	
	if fsSave.selectedFile and ui.metaroom ~= nil then
		local path = fsSave:absPath(fsSave.selectedFile)
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
	if y > ui.topPanelHeight and x < ui.metaSidePanel:GetX() then
		if button == 1 then
			mouseDown = true
			startX = x
			startY = y
			if ui.metaroom ~= nil then
				if ui.isAddingRoom then
					local newRoom = room.create(
						x / scale - offsetX,
						(x + 20) / scale - offsetX,
						y / scale - offsetY,
						y / scale - offsetY,
						(y + 20) / scale - offsetY,
						(y + 20) / scale - offsetY)
					ui.metaroom:addRoom(newRoom)
					if newRoom:hasCollision() then
						ui.metaroom:removeRoom(newRoom)
						newRoom = nil
					else
						ui.metaroom.selectedRoom = newRoom
						newRoom:selectObject((x + 20) / scale - offsetX, (y + 20) / scale - offsetY)
					end
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
	if y > 0 and scale < 3 then
		scale = scale + 0.1
	elseif y < 0 and scale > 0.5 then
		scale = scale - 0.1
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
	ui:setRoomInputsMinMax()
end

loadMetaroom = function(data, path)
	local basePath = string.gsub(path, "%w+.cos", "")
	ui.metaroom = caos.decode(caos.parse(data))
	ui.metaroom.path = basePath
	if ui.metaroom.background ~= "" then
		local backgroundPath = ui.metaroom.path .. ui.metaroom.background .. ".png"
		if nativefs.getInfo(backgroundPath) then
			local imageData = nativefs.read("data", backgroundPath)
			ui.metaroom.backgroundImage = love.graphics.newImage(imageData)
		end
	end

	offsetX = -ui.metaroom.x
	offsetY = -ui.metaroom.y
	scale = 1

	ui:setRoomInputsMinMax()
end

saveMetaroom = function(metaroom, newPath)
end