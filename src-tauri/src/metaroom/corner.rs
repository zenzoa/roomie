use serde::{ Serialize, Deserialize };

use crate::geometry::Point;

#[derive(Clone, Serialize, Deserialize)]
pub enum CornerPosition {
	TopLeft,
	TopRight,
	BottomRight,
	BottomLeft
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Corner {
	pub room_id: u32,
	pub x: u32,
	pub y: u32,
	pub position: CornerPosition
}

impl Corner {
	pub fn as_point(&self) -> Point {
		Point::new(self.x as f64, self.y as f64)
	}
}
