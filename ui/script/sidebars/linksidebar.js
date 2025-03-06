class LinkSidebar {
	static setup(links) {
		Sidebar.createHeader(links.length > 1 ? 'CA Links' : `CA Link ${links[0].room1_id} to ${links[0].room2_id}`)
	}
}
