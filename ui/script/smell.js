class Smell {

	constructor({ ca, amount }) {
		this.ca = ca || 15
		this.amount = amount || 0.02
	}

	static sidebarEntry(smell, index) {
		return `<div class="smell">
			<label>
				<select id="smell-ca-${index}">
					<option value="0"  ${smell.ca === 0 ?  'selected' : ''}>0 (Critters/bugs)</option>
					<option value="1"  ${smell.ca === 1 ?  'selected' : ''}>1 Light</option>
					<option value="2"  ${smell.ca === 2 ?  'selected' : ''}>2 Heat</option>
					<option value="3"  ${smell.ca === 3 ?  'selected' : ''}>3 Rain</option>
					<option value="4"  ${smell.ca === 4 ?  'selected' : ''}>4 Nutrients</option>
					<option value="5"  ${smell.ca === 5 ?  'selected' : ''}>5 Body of water</option>
					<option value="6"  ${smell.ca === 6 ?  'selected' : ''}>6 Protein</option>
					<option value="7"  ${smell.ca === 7 ?  'selected' : ''}>7 Carbohydrate</option>
					<option value="8"  ${smell.ca === 8 ?  'selected' : ''}>8 Fat</option>
					<option value="9"  ${smell.ca === 9 ?  'selected' : ''}>9 (Flowers)</option>
					<option value="10" ${smell.ca === 10 ? 'selected' : ''}>10 Machinery</option>
					<option value="11" ${smell.ca === 11 ? 'selected' : ''}>11 Creature eggs</option>
					<option value="12" ${smell.ca === 12 ? 'selected' : ''}>12 Norns</option>
					<option value="13" ${smell.ca === 13 ? 'selected' : ''}>13 Grendels</option>
					<option value="14" ${smell.ca === 14 ? 'selected' : ''}>14 Ettins</option>
					<option value="15" ${smell.ca === 15 ? 'selected' : ''}>15 Norn home</option>
					<option value="16" ${smell.ca === 16 ? 'selected' : ''}>16 Grendel home</option>
					<option value="17" ${smell.ca === 17 ? 'selected' : ''}>17 Ettin home</option>
					<option value="18" ${smell.ca === 18 ? 'selected' : ''}>18 Gadgets</option>
					<option value="19" ${smell.ca === 19 ? 'selected' : ''}>19 (Toys)</option>
				</select>
				<div class="dropdown-arrow">
					<img src="library/mono-icons/svg/chevron-down.svg">
				</div>
			</label>
			<input id="smell-amount-${index}" type="number" step="0.01" value="${smell.amount}">
			<button id="remove-smell-${index}" class="icon-button">
				<img src="library/mono-icons/svg/delete.svg" alt="Remove Smell" title="Remove Smell">
			</button>
		</div>`
	}

}

function addSmell() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		saveState()
		room.smells.push(new Smell({}))
		UI.updateSidebar()
	}
}

function removeSmell(event) {
	if (event && event.currentTarget && UI.selectedRooms.length === 1) {
		const index = parseInt(event.currentTarget.id.replace('remove-smell-', ''))
		if (!isNaN(index)) {
			const room = UI.selectedRooms[0]
			saveState()
			room.smells = room.smells.filter((s, i) => i !== index)
			UI.updateSidebar()
		}
	}
}

function changeSmellCA(event) {
	if (event && event.currentTarget && UI.selectedRooms.length === 1) {
		const index = parseInt(event.currentTarget.id.replace('smell-ca-', ''))
		if (!isNaN(index)) {
			const room = UI.selectedRooms[0]
			const smell = room.smells[index]
			if (smell) {
				const ca = parseInt(event.currentTarget.value)
				if (!isNaN(ca) && ca >= 0 && ca <= 19) {
					saveState()
					smell.ca = ca
				}
				UI.updateSidebar()
			}
		}
	}
}

function changeSmellAmount(event) {
	if (event && event.currentTarget && UI.selectedRooms.length === 1) {
		const index = parseInt(event.currentTarget.id.replace('smell-amount-', ''))
		if (!isNaN(index)) {
			const room = UI.selectedRooms[0]
			const smell = room.smells[index]
			if (smell) {
				const amount = parseFloat(event.currentTarget.value)
				if (!isNaN(amount) && amount >= 0 && amount <= 1) {
					saveState()
					smell.amount = amount
				}
				UI.updateSidebar()
			}
		}
	}
}

function changeEmitterClassifier() {
	if (UI.selectedRooms.length === 1) {
		const room = UI.selectedRooms[0]
		const input = document.getElementById('room-emitter-classifier')
		const classifier = parseInt(input.value)
		if (!isNaN(classifier) && classifier >= 0) {
			saveState()
			room.emitterClassifier = classifier
		}
		UI.updateSidebar()
	}
}
