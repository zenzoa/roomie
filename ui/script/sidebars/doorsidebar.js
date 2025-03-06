class DoorSidebar {
	static setup(doors) {
		Sidebar.createHeader(doors.length > 1 ? 'Doors' : `Door ${doors[0].room1_id} to ${doors[0].room2_id}`)

		console.log(doors)

		const permeabilityInput = Sidebar.createIntInput('door-permeability', 'permeability', 100)
		permeabilityInput.value = Sidebar.allTheSame(doors, 'permeability') ? doors[0].permeability : ''
		permeabilityInput.addEventListener('change', () => {
			const newPermeability = Sidebar.getInputInt(permeabilityInput, doors[0].permeability)
			for (let door of doors) door.permeability = newPermeability
			tauri_invoke('update_doors', { doors })
		})
	}
}
