local metaroom = require("metaroom")
local room = require("room")

local caos = {}

caos.parse = function(text)
	local tokenType = nil
	local tokenValue = ""
	local tokens = {}
	for i = 1, #text do
    local c = text:sub(i, i)
		if tokenType == nil then
			if c:match("%d") then
				tokenType = "number"
				tokenValue = c
			elseif c:match("%a") then
				tokenType = "command"
				tokenValue = c
			elseif c == "\"" then
				tokenType = "string"
				tokenValue = ""
			end
		else
			if tokenType == "number" and (c:match("%d") or c == ".") then
				tokenValue = tokenValue .. c
			elseif tokenType == "command" and c:match("%w") then
				tokenValue = tokenValue .. c
			elseif tokenType == "string" and not c:match("\"") then
				tokenValue = tokenValue .. c
			else
				table.insert(tokens, { type = tokenType, value = tokenValue })
				tokenType = nil
			end
		end
	end
	return tokens
end

caos.pop = function(list)
	local value = list[1]
	table.remove(list, 1)
	return value
end

caos.decodeToken = function(tokens)
	local token = caos.pop(tokens)
	if token.type == "command" then
		if token.value == "setv" then
			local variable = caos.pop(tokens).value
			if variable == "game" then
				local gameVariable = caos.decodeToken(tokens)
				local variableValue = caos.decodeToken(tokens)
				caos.gameVariables[gameVariable] = variableValue
			else
				local variableValue = caos.decodeToken(tokens)
				caos.variables[variable] = variableValue
			end
		elseif token.value:sub(1, 2) == "va" then
			return caos.variables[token.value]
		elseif token.value == "game" then
			local gameVariable = caos.decodeToken(tokens)
			return caos.gameVariables[gameVariable]
		elseif token.value == "addm" then
			local x = caos.decodeToken(tokens)
			local y = caos.decodeToken(tokens)
			local width = caos.decodeToken(tokens)
			local height = caos.decodeToken(tokens)
			local background = caos.decodeToken(tokens)
			if caos.metaroom == nil then
				caos.metaroom = metaroom.create(x, y, width, height, background)
			end
			return 1
		elseif token.value == "addr" then
			local metaroomId = caos.decodeToken(tokens)
			local xLeft = caos.decodeToken(tokens)
			local xRight = caos.decodeToken(tokens)
			local yTopLeft = caos.decodeToken(tokens)
			local yTopRight = caos.decodeToken(tokens)
			local yBottomLeft = caos.decodeToken(tokens)
			local yBottomRight = caos.decodeToken(tokens)
			if metaroomId == 1 and caos.metaroom ~= nil then
				local r = room.create(xLeft, xRight, yTopLeft, yTopRight, yBottomLeft, yBottomRight)
				caos.metaroom:addRoom(r)
				return #caos.metaroom.rooms
			else
				return 0
			end
		elseif token.value == "rtyp" then
			local roomId = caos.decodeToken(tokens)
			local roomType = caos.decodeToken(tokens)
			if caos.metaroom ~= nil and caos.metaroom.rooms[roomId] ~= nil then
				caos.metaroom.rooms[roomId].type = roomType
			end
		elseif token.value == "mmsc" then
			local metaMusicX = caos.decodeToken(tokens)
			local metaMusicY = caos.decodeToken(tokens)
			local metaMusicTrackName = caos.decodeToken(tokens)
			if caos.metaroom ~= nil and caos.metaroom:isPointInside(metaMusicX, metaMusicY) then
				caos.metaroom.music = metaMusicTrackName
			end
		elseif token.value == "rmsc" then
			local roomMusicX = caos.decodeToken(tokens)
			local roomMusicY = caos.decodeToken(tokens)
			local roomMusicTrackName = caos.decodeToken(tokens)
			if caos.metaroom ~= nil then
				for i = 1, #caos.metaroom.rooms do
					local r = caos.metaroom.rooms[i]
					if r:isPointInside(roomMusicX, roomMusicY) then
						r.music = roomMusicTrackName
						break
					end
				end
			end
		elseif token.value == "door" then
			local roomId1 = caos.decodeToken(tokens)
			local roomId2 = caos.decodeToken(tokens)
			local permeability = caos.decodeToken(tokens)
			if caos.metaroom ~= nil then
				r1 = caos.metaroom.rooms[roomId1]
				r2 = caos.metaroom.rooms[roomId2]
				if r1 ~= nil and r2 ~= nil then
					r1:connectRoom(r2, true, permeability)
				end
			end
		elseif token.value == "delg" then
			local gameVariableToDelete = caos.decodeToken(tokens)
		end
	elseif token.type == "number" then
		return tonumber(token.value)
	elseif token.type == "string" then
		return token.value
	end
end

caos.decode = function(tokens)
	caos.variables = {}
	caos.gameVariables = {}
	caos.metaroom = nil
	caos.rooms = {}

	while #tokens >= 1 do
		caos.decodeToken(tokens)
	end

	return caos.metaroom
end

return caos