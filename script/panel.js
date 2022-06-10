const { h, render, Component } = preact

class NumberInput extends Component {
	render({ label, value, min, max, step, isRow, onChange }) {
		return [
			h('label', { className: 'numberInput' + (isRow ? ' row' : '' ) }, [
				label ? h('span', null, label) : null,
				isRow ? h('div', { className: 'line' }) : null,
				h('input', {
					type: 'number',
					value: value,
					min: min,
					max: max,
					step: step,
					onChange: (e) => { onChange(parseInt(e.target.value)) }
				})
			])
		]
	}
}

class FileInput extends Component {
	render({ label, value, onChange, onClick }) {
		return [
			h('label', { className: 'fileInput' }, [
				label ? h('span', null, label) : null,
				h('div', { className: 'row' }, [
					h('input', {
						type: 'text',
						value: value,
						onChange: (e) => { onChange(e.target.value) }
					}),
					h('button', {
						type: 'button',
						onClick: onClick
					}, h('i', { className: 'gg-folder' }))
				])
			])
		]
	}
}

class DropdownInput extends Component {
	render({ label, value, options, onChange }) {
		return [
			h('label', null, [
				label ? h('span', null, label) : null,
				h('select', {
					value: value,
					onChange: (e) => { onChange(parseInt(e.target.value)) }
				},
					options.map((o, i) => h('option', { value: i }, o))
				)
			])
		]
	}
}

class MetaroomSettings extends Component {
	render({ metaroom }) {
		return [
			h('h3', null, 'Metaroom Properties'),
			h(NumberInput, { label: 'X', min: 0, max: window.sketch.mapWidth, isRow: true,
				value: metaroom.x,
				onChange: (v) => { metaroom.setX(v) }
			}),
			h(NumberInput, { label: 'Y', min: 0, max: window.sketch.mapHeight, isRow: true,
				value: metaroom.y,
				onChange: (v) => { metaroom.setY(v) }
			}),
			h(NumberInput, { label: 'Width', min: 0, max: window.sketch.mapWidth - metaroom.x, isRow: true,
				value: metaroom.w,
				onChange: (v) => { metaroom.setWidth(v) }
			}),
			h(NumberInput, { label: 'Height', min: 0, max: window.sketch.mapHeight - metaroom.y, isRow: true,
				value: metaroom.h,
				onChange: (v) => { metaroom.setHeight(v) }
			}),
			h('hr'),
			h(FileInput, { label: 'Background',
				value: metaroom.bg,
				onChange: (v) => { metaroom.bg = v },
				onClick: () => { metaroom.chooseBackground() }
			}),
			h(FileInput, { label: 'Music',
				value: metaroom.music,
				onChange: (v) => { metaroom.music = v },
				onClick: () => { metaroom.chooseMusic() }
			}),
			h(DropdownInput, { label: 'Favorite Place Icon', value: (metaroom.favPlace.enabled ? 0 : 1),
				options: [
					'Include',
					'Don\'t Include'
				],
				onChange: (v) => { metaroom.favPlace.enabled = (v === 0) }
			}),
		]
	}
}

class RoomSettings extends Component {
	render({ metaroom, room }) {
		return [
			h('h3', null, 'Room Properties'),
			h(NumberInput, { label: 'X Left', min: 0, max: metaroom.w, isRow: true,
				value: room.xL,
				onChange: (v) => { room.setProperty('xL', v) }
			}),
			h(NumberInput, { label: 'X Right', min: 0, max: metaroom.w, isRow: true,
				value: room.xR,
				onChange: (v) => { room.setProperty('xR', v) }
			}),
			h(NumberInput, { label: 'Y Top Left', min: 0, max: metaroom.h, isRow: true,
				value: room.yTL,
				onChange: (v) => { room.setProperty('yTL', v) }
			}),
			h(NumberInput, { label: 'Y Top Right', min: 0, max: metaroom.h, isRow: true,
				value: room.yTR,
				onChange: (v) => { room.setProperty('yTR', v) }
			}),
			h(NumberInput, { label: 'Y Bot. Left', min: 0, max: metaroom.h, isRow: true,
				value: room.yBL,
				onChange: (v) => { room.setProperty('yBL', v) }
			}),
			h(NumberInput, { label: 'Y Bot. Right', min: 0, max: metaroom.h, isRow: true,
				value: room.yBR,
				onChange: (v) => { room.setProperty('yBR', v) }
			}),
			h('hr'),
			h(DropdownInput, { label: 'Type', value: room.type,
				options: [
					'0 Atmosphere',
					'1 Wooden Walkway',
					'2 Concrete Walkway',
					'3 Indoor Concrete',
					'4 Outdoor Concrete',
					'5 Normal Soil',
					'6 Boggy Soil',
					'7 Drained Soil',
					'8 Fresh Water',
					'9 Salt Water',
					'10 Ettin Home'
				],
				onChange: (v) => { room.setType(v) }
			}),
			h(FileInput, { label: 'Music',
				value: room.music,
				onChange: (v) => { room.music = v },
				onClick: () => { room.chooseMusic() }
			}),
			h('hr'),
			h(EmitterSettings, { room })
		]
	}
}

class EmitterSettings extends Component {
	render({ room }) {
		if (room.smells.length > 0) {
			return [
				h('label', null, [
					h('span', null, 'Smell Emitter')
				]),
				h('div', null, room.smells.map((smell, smellIndex) => {
					return h(SmellSettings, { smell, deleteSmell: () => {
						room.removeSmell(smellIndex)
					}})
				})),
				h('label', null, [
					h('button', {
						type: 'button',
						onClick: () => { room.addSmell() }
					}, 'Add Smell')
				]),
				h(NumberInput, { label: 'Smell Emitter Classifier',
				value: room.emitterClassifier,
				onChange: (v) => { room.emitterClassifier = v }
			})
			]
		} else {
			return h('label', null, [
				h('button', {
					type: 'button',
					onClick: () => { room.addSmell() }
				}, 'Add Smell Emitter')
			])
		}
	}
}

class SmellSettings extends Component {
	render({ smell, deleteSmell }) {
		return [
			h('div', { className: 'row' }, [
				h(DropdownInput, { value: smell.caIndex,
					options: [
						'0 (Critters/bugs)',
						'1 Light',
						'2 Heat',
						'3 Rain',
						'4 Nutrients',
						'5 Body of water',
						'6 Protein',
						'7 Carbohydrate',
						'8 Fat',
						'9 (Flowers)',
						'10 Machinery',
						'11 Creature eggs',
						'12 Norns',
						'13 Grendels',
						'14 Ettins',
						'15 Norn home',
						'16 Grendel home',
						'17 Ettin home',
						'18 Gadgets',
						'19 (Toys)'
					],
					onChange: (v) => { smell.caIndex = v }
				}),
				h(NumberInput, {
					min: 0,
					max: 1,
					step: 0.01,
					value: smell.amount,
					onChange: (v) => { smell.amount = v }
				}),
				h('button', {
					type: 'button',
					onClick: () => { deleteSmell() }
				}, 'x')
			])
		]
	}
}

class DoorSettings extends Component {
	render({ door }) {
		return [
			h('h3', null, 'Door Properties'),
			h(NumberInput, { label: 'Permeability', min: 0, max: 100,
				value: door.permeability,
				onChange: (v) => { door.permeability = v }
			})
		]
	}
}

class FavPlaceSettings extends Component {
	render({ metaroom, favPlace }) {
		return [
			h('h3', null, 'Favorite Place Icon'),
			h(NumberInput, { label: 'X', min: 2, max: metaroom.w - 2, isRow: true,
				value: favPlace.x,
				onChange: (v) => { favPlace.setX(v) }
			}),
			h(NumberInput, { label: 'Y', min: 1, max: metaroom.h - 1, isRow: true,
				value: favPlace.y,
				onChange: (v) => { favPlace.setY(v) }
			}),
			h('hr'),
			h(FileInput, { label: 'Sprite',
				value: favPlace.sprite,
				onChange: (v) => { favPlace.sprite = v },
				onClick: () => { favPlace.chooseSprite() }
			}),
			h(NumberInput, { label: 'Classifier',
				value: favPlace.classifier,
				onChange: (v) => { favPlace.classifier = v }
			})
		]
	}
}

class Panel extends Component {
	render({ metaroom }) {
		if (metaroom) {
			if (metaroom.selectedFavPlace) {
				return [
					h('div', { className: 'panel'}, [
						h(FavPlaceSettings, { metaroom: metaroom, favPlace: metaroom.favPlace })
					])
				]
			} else if (metaroom.selectedDoor) {
				return [
					h('div', { className: 'panel'}, [
						h(DoorSettings, { door: metaroom.selectedDoor })
					])
				]
			} else if (metaroom.selectedRoom) {
				return [
					h('div', { className: 'panel'}, [
						h(RoomSettings, { metaroom: metaroom, room: metaroom.selectedRoom })
					])
				]
			} else {
				return [
					h('div', { className: 'panel'}, [
						h(MetaroomSettings, { metaroom: metaroom })
					])
				]
			}
		}
	}
}

let updatePanel = (metaroom) => {
	let container = document.getElementById('main')
	let node = document.getElementById('panel')
	render(
		h(Panel, { metaroom: metaroom }), container, node
	)
}
