use serde::{ Serialize, Deserialize };

use crate::geometry::{ Point, Line };
use super::room::Room;

#[derive(Clone, Serialize, Deserialize)]
pub enum SidePosition {
	Top,
	Bottom,
	Left,
	Right
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Side {
	pub room_id: u32,
	pub x1: u32,
	pub y1: u32,
	pub x2: u32,
	pub y2: u32,
	pub position: SidePosition
}

impl Side {
	pub fn new(room: &Room, position: SidePosition) -> Self {
		let line = room.get_side_line(&position);
		Self {
			room_id: room.id,
			x1: line.a.x as u32,
			y1: line.a.y as u32,
			x2: line.b.x as u32,
			y2: line.b.y as u32,
			position
		}
	}

	pub fn as_line(&self) -> Line {
		Line::new(Point::new(self.x1 as f64, self.y1 as f64), Point::new(self.x2 as f64, self.y2 as f64))
	}

	pub fn update_from_line(&mut self, line: &Line) {
		self.x1 = line.a.x as u32;
		self.y1 = line.a.y as u32;
		self.x2 = line.b.x as u32;
		self.y2 = line.b.y as u32;
	}
}
