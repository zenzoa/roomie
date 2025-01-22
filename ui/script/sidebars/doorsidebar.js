class DoorSidebar {
	static setup(doors) {
		Sidebar.createHeader(doors.length > 1 ? 'Doors' : 'Door')

		const permeabilityInput = Sidebar.createIntInput('door-permeability', 'permeability', 100)
		permeabilityInput.value = Sidebar.allTheSame(doors, 'permeability') ? doors[0].permeability : ''
		permeabilityInput.addEventListener('change', () => {
			const newPermeability = Sidebar.getInputInt(permeabilityInput, doors[0].permeability)
			for (let door of doors) door.permeability = newPermeability
			tauri_invoke('update_doors', { doors })
		})
	}
}
