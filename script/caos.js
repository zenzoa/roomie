let caos = {}

caos.parse = text => {
	text = text + '\n'
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

caos.decode = tokens => {
	let variables = []
	let gameVariables = []
	let newMetaroom = null

	let target = null
	let tempEmitter = null

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
					newMetaroom.rooms.forEach(r => {
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

			} else if (token.value === 'link') {
				let roomId1 = decodeNextToken()
				let roomId2 = decodeNextToken()
				if (newMetaroom) {
					r1 = newMetaroom.rooms[roomId1]
					r2 = newMetaroom.rooms[roomId2]
					if (r1 && r2) {
						r1.addLink(r2)
					}
				}

			} else if (token.value === 'mapd') {
				let mapWidth = decodeNextToken()
				let mapHeight = decodeNextToken()

			} else if (token.value === 'cmra' || token.value === 'cmrp') {
				let x = decodeNextToken()
				let y = decodeNextToken()
				let pan = decodeNextToken()

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
					} else if (newMetaroom && family === 3 && genus === 5 && sprite === 'blnk') {
						target = 'emitter'
						tempEmitter = {
							classifier: species
						}
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
				} else if (newMetaroom && target === 'emitter') {
					newMetaroom.rooms.forEach(r => {
						if (r.isPointInside(mvtoX - newMetaroom.x, mvtoY - newMetaroom.y)) {
							r.emitterClassifier = tempEmitter.classifier
							tempEmitter.room = r
						}
					})
				} else {
					ignoredLines.push(`mvto ${mvtoX} ${mvtoY}`)
				}

			} else if (token.value === 'emit') {
				let caIndex = decodeNextToken()
				let amount = decodeNextToken()
				if (target === 'emitter' && tempEmitter && tempEmitter.room) {
					tempEmitter.room.addSmell(caIndex, amount)
				} else {
					ignoredLines.push(`emit ${caIndex} ${amount}`)
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
		newMetaroom.isModified = false
	}
	return newMetaroom
}

caos.encode = m => {
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
			let roomCenter = r.getCenter()
			lines.push(`    rmsc ${roomCenter.x + m.x} ${roomCenter.y + m.y} "${r.music}"`)
		}
		// set temp variable for room id
		lines.push(`    setv game "map_tmp_${i}" va00`)
	})

	// add doors
	firstDoor = true
	m.doors.forEach(d => {
		if (d.active) {
			if (firstDoor) {
				lines.push('')
				lines.push('*ROOMIE Add doors between rooms')
				firstDoor = false
			}
			lines.push(`door game "map_tmp_${d.r1.index}" game "map_tmp_${d.r2.index}" ${d.permeability}`)
		}
	})

	// CA links
	let firstLink = true
	let existingLinks = []
	m.rooms.forEach(r1 => {
		r1.links.forEach(r2 => {
			if (firstLink) {
				lines.push('')
				lines.push('*ROOMIE Add CA links')
				firstLink = false
			}
			if (!existingLinks.includes(r1.index + '<->' + r2.index) && !existingLinks.includes(r2.index + '<->' + r1.index)) {
				lines.push(`link game "map_tmp_${r1.index}" game "map_tmp_${r2.index}"`)
				existingLinks.push(r1.index + '<->' + r2.index)
			}
		})
	})

	// remove temp variables
	lines.push('')
	lines.push('*ROOMIE Delete temporary variables')
	m.rooms.forEach((r, i) => {
		lines.push(`delg "map_tmp_${i}"`)
	})

	// CA emitters
	let firstEmitter = true
	m.rooms.forEach(r => {
		if (r.smells.length > 0) {
			if (firstEmitter) {
				lines.push('')
				lines.push('*ROOMIE Add CA emitters')
				firstEmitter = false
			}
			let roomCenter = r.getCenter()
			lines.push(`new: simp 3 5 ${r.emitterClassifier} "blnk" 2 0 0`)
			lines.push(`  attr 18`)
			lines.push(`  mvto ${roomCenter.x + m.x} ${roomCenter.y + m.y}`)
			r.smells.forEach(smell => {
				lines.push(`  emit ${smell.caIndex} ${smell.amount}`)
			})
		}
	})

	// add favorite place icon
	if (m.favPlace.enabled) {
		lines.push('')
		lines.push('*ROOMIE Add favorite place icon')
		lines.push(`new: simp 1 3 ${m.favPlace.classifier} "${m.favPlace.sprite}" 1 0 1`)
		lines.push('  attr 272')
		lines.push(`  mvto ${m.favPlace.x + m.x - 2} ${m.favPlace.y + m.y - 1}`)
		lines.push('  tick 10')
	}

	// add camera command
	lines.push('')
	lines.push('*ROOMIE Add camera command')
	if (m.favPlace.enabled) {
		lines.push(`cmrp ${m.favPlace.x + m.x} ${m.favPlace.y + m.y} 0`)
	} else {
		lines.push(`cmra ${m.x} ${m.y} 0`)
	}

	if (m.ignoredLines.length > 0) {
		lines.push('')
		lines = lines.concat(m.ignoredLines)
	}

	return lines.join('\n')
}