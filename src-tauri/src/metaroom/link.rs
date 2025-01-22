use std::error::Error;

use serde::{ Serialize, Deserialize };

use crate::geometry::Line;
use super::room::Room;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Link {
	pub id: u32,
	pub room1_id: u32,
	pub room2_id: u32,
	pub line: Line
}

impl Link {
	pub fn new(id: u32, room1_id: u32, room2_id: u32, rooms: &[Room]) -> Result<Self, Box<dyn Error>> {
		let room1 = rooms.get(room1_id as usize)
			.ok_or(format!("Unable to create link {}: can't find room {}", id, room1_id))?;
		let room2 = rooms.get(room2_id as usize)
			.ok_or(format!("Unable to create link {}: can't find room {}", id, room2_id))?;
		Ok(Self {
			id,
			room1_id,
			room2_id,
			line: Line::new(room1.center(), room2.center()).floor()
		})
	}
}

pub fn link_exists(links: &[Link], room1_id: u32, room2_id: u32) -> bool {
	for link in links {
		if (link.room1_id == room1_id && link.room2_id == room2_id) ||
			(link.room1_id == room1_id && link.room2_id == room2_id) {
				return true;
		}
	}
	false
}
