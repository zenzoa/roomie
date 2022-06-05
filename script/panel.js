const { h, render, Component } = preact

class NumberInput extends Component {
	render({ label, value, min, max, onChange }) {
		return [
			h('label', { className: 'numberInput' }, [
				h('span', null, label),
				h('input', {
					type: 'number',
					value: value,
					min: min,
					max: max,
					onChange: (e) => { onChange(e.target.value) }
				})
			])
		]
	}
}

class FileInput extends Component {
	render({ label, value, onChange, onClick }) {
		return [
			h('label', { className: 'fileInput' }, [
				h('span', null, label),
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
				h('span', null, label),
				h('select', {
					value: value,
					onChange: (e) => { onChange(e.target.value) }
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
			h(NumberInput, { label: 'X', min: 0, max: 100000,
				value: metaroom.x,
				onChange: (v) => { metaroom.x = Math.floor(v) }
			}),
			h(NumberInput, { label: 'Y', min: 0, max: 100000,
				value: metaroom.y,
				onChange: (v) => { metaroom.y = Math.floor(v) }
			}),
			h(NumberInput, { label: 'Width', min: 0, max: 100000,
				value: metaroom.w,
				onChange: (v) => { metaroom.w = Math.floor(v) }
			}),
			h(NumberInput, { label: 'Height', min: 0, max: 100000,
				value: metaroom.h,
				onChange: (v) => { metaroom.h = Math.floor(v) }
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
			})
		]
	}
}

class RoomSettings extends Component {
	render({ metaroom, room }) {
		return [
			h('h3', null, 'Room Properties'),
			h(NumberInput, { label: 'X Left', min: 0, max: metaroom.w,
				value: room.xL,
				onChange: (v) => { room.setProperty('xL', v) }
			}),
			h(NumberInput, { label: 'X Right', min: 0, max: metaroom.w,
				value: room.xR,
				onChange: (v) => { room.setProperty('xR', v) }
			}),
			h(NumberInput, { label: 'Y Top Left', min: 0, max: metaroom.h,
				value: room.yTL,
				onChange: (v) => { room.setProperty('yTL', v) }
			}),
			h(NumberInput, { label: 'Y Top Right', min: 0, max: metaroom.h,
				value: room.yTR,
				onChange: (v) => { room.setProperty('yTR', v) }
			}),
			h(NumberInput, { label: 'Y Bottom Left', min: 0, max: metaroom.h,
				value: room.yBL,
				onChange: (v) => { room.setProperty('yBL', v) }
			}),
			h(NumberInput, { label: 'Y Bottom Right', min: 0, max: metaroom.h,
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
			})
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

class Panel extends Component {
	render({ metaroom }) {
		if (metaroom) {
			if (metaroom.selectedDoor) {
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
