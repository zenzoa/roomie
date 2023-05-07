const Caos = {
	parse: (text) => {
		text = text + '\n'
		let tokenType = null
		let tokenValue = ''
		let whitespace = ''
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
				} else if (c == ' ') {
					whitespace += ' '
				} else if (c == '\t') {
					whitespace += '\t'
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
						value: tokenValue,
						whitespace: whitespace
					})
					if (c === '\n' || c === '\r') {
						tokens.push({ type: 'newline' })
					}
					tokenType = null
					whitespace = ''
				}
			}
		}
		return tokens
	},

	decode: (tokens, inRoomieCode = false) => {
		tokens = tokens.slice()
		let reachedRoomieCode = inRoomieCode

		let variables = []
		let gameVariables = []
		let newMetaroom = null

		let target = null
		let tempEmitter = null
		let tempOverlay = null

		let ignoredLinesPre = []
		let ignoredLines = []
		let lastTokenType = null

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
				if (token.whitespace) {
					ignoredLine = token.whitespace + ignoredLine
				}
				if (reachedRoomieCode) {
					ignoredLines.push(ignoredLine)
				} else {
					ignoredLinesPre.push(ignoredLine)
				}
			}
		}

		const decodeNextToken = () => {
			let token = tokens.shift()

			if (token.type === 'command') {

				if (!inRoomieCode) {
					if (token.value === '***ROOMIE_START***') {
						inRoomieCode = true
						reachedRoomieCode = true
					} else {
						ignoreLine(token, token.value)
					}

				} else if (token.value === '***ROOMIE_END***') {
					inRoomieCode = false

				} else if (token.value === 'setv') {
					const variable = tokens.shift().value
					if (variable === 'game') {
						const gameVariable = decodeNextToken()
						const variableValue = decodeNextToken()
						gameVariables[gameVariable] = variableValue
					} else {
						const variableValue = decodeNextToken()
						variables[variable] = variableValue
					}

				} else if (token.value[0] === 'v' && token.value[1] === 'a') {
					return variables[token.value]

				} else if (token.value === 'game') {
					const gameVariable = decodeNextToken()
					return gameVariables[gameVariable]

				} else if (token.value === 'addm') {
					const x = decodeNextToken()
					const y = decodeNextToken()
					const w = decodeNextToken()
					const h = decodeNextToken()
					let background = decodeNextToken()
					if (!newMetaroom) {
						newMetaroom = new Metaroom({ x, y, w, h, background })
					}
					return 0

				} else if (token.value === 'addr') {
					const metaroomId = decodeNextToken()
					const xL = decodeNextToken()
					const xR = decodeNextToken()
					const yTL = decodeNextToken()
					const yTR = decodeNextToken()
					const yBL = decodeNextToken()
					const yBR = decodeNextToken()
					if (newMetaroom && metaroomId === 0) {
						const xMR = newMetaroom.x
						const yMR = newMetaroom.y
						const newRoom = new Room({
							xL: xL - xMR,
							xR: xR - xMR,
							yTL: yTL - yMR,
							yTR: yTR - yMR,
							yBL: yBL - yMR,
							yBR: yBR - yMR
						})
						newMetaroom.rooms.push(newRoom)
						return newMetaroom.rooms.length - 1
					} else {
						return 0
					}

				} else if (token.value === 'rtyp') {
					const roomId = decodeNextToken()
					const roomType = decodeNextToken()
					if (newMetaroom && newMetaroom.rooms[roomId]) {
						newMetaroom.rooms[roomId].type = roomType
					}

				} else if (token.value === 'mmsc') {
					const x = decodeNextToken()
					const y = decodeNextToken()
					const trackName = decodeNextToken()
					if (newMetaroom && newMetaroom.isPointInside(x, y)) {
						newMetaroom.music = trackName
					}

				} else if (token.value === 'rmsc') {
					const x = decodeNextToken()
					const y = decodeNextToken()
					const trackName = decodeNextToken()
					if (newMetaroom) {
						const room = newMetaroom.roomAt(x - newMetaroom.x, y - newMetaroom.y)
						if (room) {
							room.music = trackName
						}
					}

				} else if (token.value === 'door') {
					const room1Id = decodeNextToken()
					const room2Id = decodeNextToken()
					const permeability = decodeNextToken()
					if (newMetaroom) {
						const room1 = newMetaroom.rooms[room1Id]
						const room2 = newMetaroom.rooms[room2Id]
						if (room1 && room2) {
							newMetaroom.doors.push(new Door({ room1Id, room2Id, permeability }))
						}
					}

				} else if (token.value === 'link') {
					let room1Id = decodeNextToken()
					let room2Id = decodeNextToken()
					if (newMetaroom) {
						const room1 = newMetaroom.rooms[room1Id]
						const room2 = newMetaroom.rooms[room2Id]
						if (room1 && room2) {
							newMetaroom.links.push(new Link({ room1Id, room2Id }))
						}
					}

				} else if (token.value === 'mapd') {
					const mapWidth = decodeNextToken()
					const mapHeight = decodeNextToken()

				} else if (token.value === 'cmra' || token.value === 'cmrp') {
					const x = decodeNextToken()
					const y = decodeNextToken()
					const pan = decodeNextToken()

				} else if (token.value === 'new:') {
					const type = tokens.shift()
					if (type.value === 'simp') {
						const family = decodeNextToken()
						const genus = decodeNextToken()
						const species = decodeNextToken()
						const sprite = decodeNextToken()
						const imageCount = decodeNextToken()
						const firstImage = decodeNextToken()
						const plane = decodeNextToken()
						if (newMetaroom && family === 1 && genus === 3) {
							newMetaroom.favicon.classifier = species
							newMetaroom.favicon.sprite = sprite
							newMetaroom.hasFavicon = true
							target = 'favicon'
						} else if ((newMetaroom && family === 3 && genus === 5 && sprite === 'blnk')
							|| (newMetaroom && family === 1 && genus === 1 && sprite === 'blnk')) {
							target = 'emitter'
							tempEmitter = {
								classifier: species
							}
						} else if (newMetaroom && family === 1 && genus === 1) {
							target = 'overlay'
							tempOverlay = {
								sprite: sprite,
								classifier: species,
								plane: plane
							}
						} else {
							ignoredLines.push(`new: simp ${family} ${genus} ${species} "${sprite}" ${imageCount} ${firstImage} ${plane}`)
						}
					} else {
						ignoreLine(token, 'new: ' + type.value)
					}

				} else if (token.value === 'attr') {
					const attrValue = decodeNextToken()
					if (target !== 'favicon' && target !== 'emitter') {
						ignoredLines.push(`attr ${attrValue}`)
					}

				} else if (token.value === 'mvto') {
					const mvtoX = decodeNextToken()
					const mvtoY = decodeNextToken()
					if (newMetaroom && target === 'favicon') {
						newMetaroom.favicon.x = mvtoX - newMetaroom.x
						newMetaroom.favicon.y = mvtoY - newMetaroom.y
					} else if (newMetaroom && target === 'emitter') {
						const room = Metaroom.roomAt(newMetaroom, mvtoX - newMetaroom.x, mvtoY - newMetaroom.y)
						if (room) {
							room.emitterClassifier = tempEmitter.classifier
							tempEmitter.room = room
						}
					} else if (newMetaroom && target === 'overlay') {
						tempOverlay.x = mvtoX
						tempOverlay.y = mvtoY
						newMetaroom.overlays.push(new Overlay(tempOverlay))
					} else {
						ignoredLines.push(`mvto ${mvtoX} ${mvtoY}`)
					}

				} else if (token.value === 'emit') {
					const ca = decodeNextToken()
					const amount = decodeNextToken()
					if (target === 'emitter' && tempEmitter && tempEmitter.room) {
						tempEmitter.room.smells.push(new Smell({ ca, amount }))
					} else {
						ignoredLines.push(`emit ${ca} ${amount}`)
					}

				} else if (token.value === 'tick') {
					const tickValue = decodeNextToken()
					if (target !== 'favicon') {
						ignoredLines.push(`tick ${tickValue}`)
					}

				} else if (token.value === 'delg') {
					const variableToDelete = decodeNextToken()
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

			} else if (token.type === 'newline'
				&& lastTokenType === 'newline'
				&& ignoredLines.length > 0
				&& ignoredLines[ignoredLines.length - 1] !== '') {
					ignoredLines.push('')
			}

			lastTokenType = token.type
		}

		while (tokens.length > 0) {
			decodeNextToken()
		}

		if (newMetaroom) {
			newMetaroom.ignoredLinesPre = ignoredLinesPre
			newMetaroom.ignoredLines = ignoredLines
		}
		return newMetaroom
	},

	encode: (m) => {
		let lines = []

		if (m.ignoredLinesPre && m.ignoredLinesPre.length > 0) {
			lines = lines.concat(m.ignoredLinesPre)
			lines.push('')
		}

		lines.push('***ROOMIE_START***')
		lines.push('')

		// set map size
		lines.push('*ROOMIE Expand map size')
		lines.push(`mapd ${WORLD_WIDTH} ${WORLD_HEIGHT}`)

		// add metaroom
		lines.push('')
		lines.push('*ROOMIE Create new metaroom')
		lines.push(`setv va01 addm ${m.x} ${m.y} ${m.w} ${m.h} "${m.background}"`)

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
				let roomCenter = Room.getCenter(r)
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
				lines.push(`door game "map_tmp_${d.room1Id}" game "map_tmp_${d.room2Id}" ${d.permeability}`)
			}
		})

		// CA links
		if (m.links.length > 0) {
			lines.push('')
			lines.push('*ROOMIE Add CA links')
			m.links.forEach(l => {
				lines.push(`link game "map_tmp_${l.room1Id}" game "map_tmp_${l.room2Id}" 100`)
			})
		}

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
				let roomCenter = Room.getCenter(r)
				lines.push(`new: simp 1 1 ${r.emitterClassifier} "blnk" 2 0 0`)
				lines.push(`  attr 18`)
				lines.push(`  mvto ${roomCenter.x + m.x} ${roomCenter.y + m.y}`)
				r.smells.forEach(smell => {
					lines.push(`  emit ${smell.ca} ${smell.amount}`)
				})
			}
		})

		// add overlays
		const overlays = m.overlays.filter(o => o.sprite)
		if (overlays.length > 0) {
			lines.push('')
			lines.push('*ROOMIE Add overlays')
			overlays.forEach(o => {
				lines.push(`new: simp 1 1 ${o.classifier} "${o.sprite}" 1 0 ${o.plane}`)
				lines.push(`  mvto ${o.x + m.x} ${o.y + m.y}`)
			})
		}

		// add favorite place icon
		if (m.hasFavicon) {
			lines.push('')
			lines.push('*ROOMIE Add favorite place icon')
			lines.push(`new: simp 1 3 ${m.favicon.classifier} "${m.favicon.sprite}" 1 0 1`)
			lines.push('  attr 272')
			lines.push(`  mvto ${m.favicon.x + m.x} ${m.favicon.y + m.y}`)
			lines.push('  tick 10')
		}

		// add camera command
		lines.push('')
		lines.push('*ROOMIE Add camera command')
		if (m.hasFavicon) {
			lines.push(`cmrp ${m.favicon.x + m.x} ${m.favicon.y + m.y} 0`)
		} else {
			lines.push(`cmra ${m.x} ${m.y} 0`)
		}

		lines.push('')
		lines.push('***ROOMIE_END***')

		if (m.ignoredLines && m.ignoredLines.length > 0) {
			lines.push('')
			lines = lines.concat(m.ignoredLines)
		}

		return lines.join('\r\n')
	}
}
