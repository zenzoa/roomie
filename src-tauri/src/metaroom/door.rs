use std::error::Error;

use serde::{ Serialize, Deserialize };

use crate::geometry::{ Line, Polygon };
use super::room::Room;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Door {
	pub id: u32,
	pub room1_id: u32,
	pub room2_id: u32,
	pub permeability: u32,
	pub line: Line
}

impl Door {
	pub fn new(id: u32, room1_id: u32, room2_id: u32, permeability: u32, rooms: &[Room]) -> Result<Self, Box<dyn Error>> {
		let room1 = rooms.get(room1_id as usize)
			.ok_or(format!("Unable to create door {}: can't find room {}", id, room1_id))?;
		let room2 = rooms.get(room2_id as usize)
			.ok_or(format!("Unable to create door {}: can't find room {}", id, room2_id))?;
		let line = room1.get_overlap(room2)
			.ok_or(format!("Unable to create door {}: can't find overlap between rooms {} and {}", id, room1_id, room2_id))?;
		Ok(Self {
			id,
			room1_id,
			room2_id,
			permeability,
			line
		})
	}

	pub fn intersects_rect(&self, x: u32, y: u32, w: u32, h: u32) -> bool {
		let rect = Polygon::from_rect(x, y, w, h);
		rect.intersects(&self.line) || rect.contains(&self.line)
	}
}
