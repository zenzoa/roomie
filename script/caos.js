let caos = {}

caos.parse = (text) => {
	let tokenType = null
	let tokenValue = ''
	let tokens = []
	for (let i = 0; i < text.length; i++) {
		let c = text[i]
		if (!tokenType) {
			if (c === '\n' || c === '\r') {
				tokens.push({ type: 'newline' })
			} else if (c.match(/\d/g)) {
				tokenType = 'number'
				tokenValue = c
			} else if (c === '"') {
				tokenType = 'string'
				tokenValue = ''
			} else if (c.match(/\S/g)) {
				tokenType = 'command'
				tokenValue = c
			}
		} else {
			if (tokenType === 'number' && (c.match(/\d/g) || c === '.')) {
				tokenValue = tokenValue + c
			} else if (tokenType === 'string' && c !== '"') {
				tokenValue = tokenValue + c
			} else if (tokenType === 'command' && c.match(/\S/g)) {
				tokenValue = tokenValue + c
			} else {
				tokens.push({
					type: tokenType,
					value: tokenValue
				})
				if (c === '\n' || c === '\r') {
					tokens.push({ type: 'newline' })
				}
				tokenType = null
			}
		}
	}
	return tokens
}

caos.decode = (tokens) => {
	let variables = []
	let gameVariables = []
	let newMetaroom = null

	let target = null

	let ignoredLines = []

	const ignoreLine = (token, lineSoFar) => {
		let ignoredLine = lineSoFar
		let nextToken = tokens.shift()
		while(nextToken && nextToken.type !== 'newline') {
			if (nextToken.type === 'string') {
				ignoredLine += ' "' + nextToken.value + '"'
			} else {
				ignoredLine += ' ' + nextToken.value
			}
			nextToken = tokens.shift()
		}
		if (ignoredLine && token.value !== '*ROOMIE') {
			ignoredLines.push(ignoredLine)
		}
	}

	const decodeNextToken = () => {
		let token = tokens.shift()
		if (token.type === 'command') {

			if (token.value === 'setv') {
				let variable = tokens.shift().value
				if (variable === 'game') {
					let gameVariable = decodeNextToken()
					let variableValue = decodeNextToken()
					gameVariables[gameVariable] = variableValue
				} else {
					let variableValue = decodeNextToken()
					variables[variable] = variableValue
				}

			} else if (token.value[0] === 'v' && token.value[1] === 'a') {
				return variables[token.value]

			} else if (token.value === 'game') {
				let gameVariable = decodeNextToken()
				return gameVariables[gameVariable]

			} else if (token.value === 'addm') {
				let x = decodeNextToken()
				let y = decodeNextToken()
				let w = decodeNextToken()
				let h = decodeNextToken()
				let bg = decodeNextToken()
				if (!newMetaroom) {
					newMetaroom = new Metaroom(x, y, w, h, bg)
				}
				return 0

			} else if (token.value === 'addr') {
				let metaroomId = decodeNextToken()
				let xL = decodeNextToken()
				let xR = decodeNextToken()
				let yTL = decodeNextToken()
				let yTR = decodeNextToken()
				let yBL = decodeNextToken()
				let yBR = decodeNextToken()
				if (newMetaroom && metaroomId === 0) {
					let xMR = newMetaroom.x
					let yMR = newMetaroom.y
					let r = new Room(xL - xMR, xR - xMR, yTL - yMR, yTR - yMR, yBL - yMR, yBR - yMR)
					newMetaroom.addRoom(r)
					return newMetaroom.rooms.length - 1
				} else {
					return 0
				}

			} else if (token.value === 'rtyp') {
				let roomId = decodeNextToken()
				let roomType = decodeNextToken()
				if (newMetaroom && newMetaroom.rooms[roomId]) {
					newMetaroom.rooms[roomId].type = roomType
				}

			} else if (token.value === 'mmsc') {
				let x = decodeNextToken()
				let y = decodeNextToken()
				let trackName = decodeNextToken()
				if (newMetaroom && newMetaroom.isPointInside(x, y)) {
						newMetaroom.music = trackName
				}

			} else if (token.value === 'rmsc') {
				let x = decodeNextToken()
				let y = decodeNextToken()
				let trackName = decodeNextToken()
				if (newMetaroom) {
					newMetaroom.rooms.forEach((r) => {
						if (r.isPointInside(x - newMetaroom.x, y - newMetaroom.y)) {
								r.music = trackName
						}
					})
				}

			} else if (token.value === 'door') {
				let roomId1 = decodeNextToken()
				let roomId2 = decodeNextToken()
				let permeability = decodeNextToken()
				if (newMetaroom) {
					r1 = newMetaroom.rooms[roomId1]
					r2 = newMetaroom.rooms[roomId2]
					if (r1 && r2) {
						newMetaroom.addDoor(r1, r2, permeability, true)
					}
				}
			} else if (token.value === 'mapd') {
				let mapWidth = decodeNextToken()
				let mapHeight = decodeNextToken()
			} else if (token.value === 'new:') {
				let type = tokens.shift()
				if (type.value === 'simp') {
					let family = decodeNextToken()
					let genus = decodeNextToken()
					let species = decodeNextToken()
					let sprite = decodeNextToken()
					let imageCount = decodeNextToken()
					let firstImage = decodeNextToken()
					let plane = decodeNextToken()
					if (newMetaroom && family === 1 && genus === 3) {
						newMetaroom.favPlace.classifier = species
						newMetaroom.favPlace.sprite = sprite
						newMetaroom.favPlace.enabled = true
						target = 'favPlace'
					} else {
						ignoredLines.push(`new: simp ${family} ${genus} ${species} "${sprite}" ${imageCount} ${firstImage} ${plane}`)
					}
				} else {
					ignoreLine(token, 'new: ' + type.value)
				}
			} else if (token.value === 'attr') {
				let attrValue = decodeNextToken()
				if (target !== 'favPlace') {
					ignoredLines.push(`attr ${attrValue}`)
				}
			} else if (token.value === 'mvto') {
				let mvtoX = decodeNextToken()
				let mvtoY = decodeNextToken()
				if (newMetaroom && target === 'favPlace') {
					newMetaroom.favPlace.x = mvtoX - newMetaroom.x + 2
					newMetaroom.favPlace.y = mvtoY - newMetaroom.y + 1
				} else {
					ignoredLines.push(`mvto ${mvtoX} ${mvtoY}`)
				}
			} else if (token.value === 'tick') {
				let tickValue = decodeNextToken()
				if (target !== 'favPlace') {
					ignoredLines.push(`tick ${tickValue}`)
				}
			} else if (token.value === 'delg') {
				let variableToDelete = decodeNextToken()
				if (!Object.keys(gameVariables).includes(variableToDelete)) {
					ignoredLines.push(`delg "${variableToDelete}"`)
				}
			} else {
				ignoreLine(token, token.value)
			}

		} else if (token.type === 'number') {
			return parseFloat(token.value)

		} else if (token.type === 'string') {
			return token.value

		} else if (token.type === 'newline') {
			if (ignoredLines.length > 0 && ignoredLines[ignoredLines.length - 1] !== '') {
				ignoredLines.push('')
			}
		}
	}

	while (tokens.length > 0) {
		decodeNextToken()
	}

	if (newMetaroom) {
		newMetaroom.ignoredLines = ignoredLines
	}
	return newMetaroom
}

caos.encode = (m) => {
	let lines = []

	// set map size
	lines.push('*ROOMIE Expand map size')
	lines.push(`mapd ${window.sketch.mapWidth} ${window.sketch.mapHeight}`)

	// add metaroom
	lines.push('')
	lines.push('*ROOMIE Create new metaroom')
	lines.push(`setv va01 addm ${m.x} ${m.y} ${m.w} ${m.h} "${m.bg}"`)

	// set metaroom music
	if (m.music) {
		let xCenter = m.x + Math.floor(m.w / 2)
		let yCenter = m.y + Math.floor(m.h / 2)
		lines.push(`mmsc ${xCenter} ${yCenter} "${m.music}"`)
	}

	m.rooms.forEach((r, i) => {
		r.index = i
		// add room
		lines.push(`  setv va00 addr va01 ${r.xL + m.x} ${r.xR + m.x} ${r.yTL + m.y} ${r.yTR + m.y} ${r.yBL + m.y} ${r.yBR + m.y}`)
		// set room type
		lines.push(`    rtyp va00 ${r.type}`)
		// set room music
		if (r.music) {
			let xRoomCenter = r.xL + Math.floor((r.xR - r.xL) / 2)
			let yRoomCenterLeft = r.yTL + Math.floor((r.yBL - r.yTL) / 2)
			let yRoomCenterRight = r.yTR + Math.floor((r.yBR - r.yTR) / 2)
			let yRoomCenter = Math.min(yRoomCenterLeft, yRoomCenterRight) + Math.abs(Math.floor((yRoomCenterRight - yRoomCenterLeft) / 2))
			lines.push(`    rmsc ${xRoomCenter + m.x} ${yRoomCenter + m.y} "${r.music}"`)
		}
		// set temp variable for room id
		lines.push(`    setv game "map_tmp_${i}" va00`)
	})

	
	// add doors
	if (m.doors.length > 0) {
		lines.push('')
		lines.push('*ROOMIE Add doors between rooms')
		m.doors.forEach((d) => {
			if (d.active) {
				lines.push(`door game "map_tmp_${d.r1.index}" game "map_tmp_${d.r2.index}" ${d.permeability}`)
			}
		})
	}

	// TODO: CA links

	// TODO: CA emitters
	
	// remove temp variables
	lines.push('')
	lines.push('*ROOMIE Delete temporary variables')
	m.rooms.forEach((r, i) => {
		lines.push(`delg "map_tmp_${i}"`)
	})

	// add favorite place icon
	if (m.favPlace.enabled) {
		lines.push('')
		lines.push('*ROOMIE Add favorite place icon')
		lines.push(`new: simp 1 3 ${m.favPlace.classifier} "${m.favPlace.sprite}" 1 0 1`)
		lines.push('attr 272')
		lines.push(`mvto ${m.favPlace.x + m.x - 2} ${m.favPlace.y + m.y - 1}`)
		lines.push('tick 10')
	}

	if (m.ignoredLines.length > 0) {
		lines.push('')
		lines = lines.concat(m.ignoredLines)
	}

	return lines.join('\n')
}