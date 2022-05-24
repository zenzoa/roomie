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
			local xLeft = caos.decodeToken(tokens) - caos.metaroom.x
			local xRight = caos.decodeToken(tokens) - caos.metaroom.x
			local yTopLeft = caos.decodeToken(tokens) - caos.metaroom.y
			local yTopRight = caos.decodeToken(tokens) - caos.metaroom.y
			local yBottomLeft = caos.decodeToken(tokens) - caos.metaroom.y
			local yBottomRight = caos.decodeToken(tokens) - caos.metaroom.y
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
			local roomMusicX = caos.decodeToken(tokens) - caos.metaroom.x
			local roomMusicY = caos.decodeToken(tokens) - caos.metaroom.y
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
					r1:connectRoom(r2, permeability)
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

caos.encodeMetaroom = function(m)
	local lines = {}

	table.insert(lines, string.format(
		"setv va01 addm %s %s %s %s \"%s\"",
		m.x, m.y, m.width, m.height, m.background))
	table.insert(lines, string.format(
		"mmsc %s %s \"%s\"",
		m.x + math.floor(m.width / 2), m.y + math.floor(m.height / 2), m.music))

	table.insert(lines, "")

	local sides = { "Top", "Bottom", "Left", "Right" }
	local doors = {}

	for i = 1, #m.rooms do
		local r = m.rooms[i]
		m.rooms[i].index = i
	end
	
	for i = 1, #m.rooms do
		local r = m.rooms[i]
		table.insert(lines, string.format(
			"setv va00 addr va01 %s %s %s %s %s %s",
			r.xLeft + m.x, r.xRight + m.x, r.yTopLeft + m.y, r.yTopRight + m.y, r.yBottomLeft + m.y, r.yBottomRight + m.y))
		table.insert(lines, string.format(
			"    rtyp va00 %s",
			r.type))
		table.insert(lines, string.format(
			"    rmsc %s %s \"%s\"",
			r:centerX(), r:centerY(), r.music))
		table.insert(lines, string.format(
			"    setv game \"map_tmp_%s\" va00",
			i - 1))

		for j = 1, #r.connections do
			local connection = r.connections[j]
			local doorExists = false
			local i2 = connection.room.index
			for k = 1, #doors do
				local d = doors[k]
				if (d.roomIndex1 == i and d.roomIndex2 == i2) or (d.roomIndex1 == i2 and d.roomIndex2 == i) then
					doorExists = true
				end
			end
			if not doorExists then
				table.insert(doors, {
					roomIndex1 = i,
					roomIndex2 = i2,
					permeability = r["permeability" .. connection.side]
				})
			end
		end
	end

	table.insert(lines, "")

	for i = 1, #doors do
		local d = doors[i]
		table.insert(lines, string.format(
			"door game \"map_tmp_%s\" game \"map_tmp_%s\" %s",
			d.roomIndex1 - 1, d.roomIndex2 - 1, d.permeability))
	end

	table.insert(lines, "")

	for i = 1, #m.rooms do
		table.insert(lines, string.format(
			"delg \"map_tmp_%s\"",
			i - 1))
	end

	return lines
end

return caos