class Link {

	constructor({ room1Id, room2Id }) {
		this.room1Id = room1Id
		this.room2Id = room2Id
	}

	static draw(link) {
		const room1 = metaroom.rooms[link.room1Id]
		const room2 = metaroom.rooms[link.room2Id]
		if (room1 && room2) {
			if (link === UI.selectedLink) {
				strokeWeight(8)
			}
			const point1 = Room.getCenter(room1)
			const point2 = Room.getCenter(room2)
			line(point1.x, point1.y, point2.x, point2.y)
			circle(point1.x, point1.y, 6)
			circle(point2.x, point2.y, 6)
			if (link === UI.selectedLink) {
				strokeWeight(1)
			}
		}
	}

}
