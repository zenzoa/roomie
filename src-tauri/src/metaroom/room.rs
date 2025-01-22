use serde::{ Serialize, Deserialize };

use crate::geometry::{ Point, Line, Polygon };
use super::side::{ Side, SidePosition };
use super::corner::{ Corner, CornerPosition };

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Room {
	pub id: u32,
	pub room_type: u32,
	pub x_left: u32,
	pub x_right: u32,
	pub y_top_left: u32,
	pub y_top_right: u32,
	pub y_bot_left: u32,
	pub y_bot_right: u32,
	pub music_file_name: String,
	pub music_track_name: String,
	pub polygon: Polygon,
	pub collision: bool,
	pub smells: Vec<Smell>
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Smell {
	pub ca: u32,
	pub amount: f32
}

impl Room {
	pub fn new(id: u32, x_l: u32, x_r: u32, y_tl: u32, y_tr: u32, y_bl: u32, y_br: u32) -> Self {
		let mut room = Room::default();
		room.id = id;
		room.x_left = x_l;
		room.x_right = x_r;
		room.y_top_left = y_tl;
		room.y_top_right = y_tr;
		room.y_bot_left = y_bl;
		room.y_bot_right = y_br;
		room
	}

	pub fn as_polygon(&self) -> Polygon {
		Polygon::new(vec![
			Point::new(self.x_left as f64, self.y_top_left as f64),
			Point::new(self.x_right as f64, self.y_top_right as f64),
			Point::new(self.x_right as f64, self.y_bot_right as f64),
			Point::new(self.x_left as f64, self.y_bot_left as f64)
		])
	}

	pub fn center(&self) -> Point {
		self.as_polygon().center()
	}

	pub fn corners(&self) -> Vec<Corner> {
		Vec::from([
			Corner { room_id: self.id, x: self.x_left, y: self.y_top_left, position: CornerPosition::TopLeft },
			Corner { room_id: self.id, x: self.x_right, y: self.y_top_right, position: CornerPosition::TopRight },
			Corner { room_id: self.id, x: self.x_right, y: self.y_bot_right, position: CornerPosition::BottomRight },
			Corner { room_id: self.id, x: self.x_left, y: self.y_bot_left, position: CornerPosition::BottomLeft }
		])
	}

	pub fn get_corner_xy(&self, position: &CornerPosition) -> (u32, u32) {
		match position {
			CornerPosition::TopLeft => (self.x_left, self.y_top_left),
			CornerPosition::TopRight => (self.x_right, self.y_top_right),
			CornerPosition::BottomRight => (self.x_right, self.y_bot_right),
			CornerPosition::BottomLeft => (self.x_left, self.y_bot_left),
		}
	}

	pub fn sides(&self) -> Vec<Side> {
		Vec::from([
			Side::new(self, SidePosition::Top),
			Side::new(self, SidePosition::Bottom),
			Side::new(self, SidePosition::Left),
			Side::new(self, SidePosition::Right)
		])
	}

	pub fn get_side_line(&self, position: &SidePosition) -> Line {
		match position {
			SidePosition::Top => Line::new(
				Point::new(self.x_left as f64, self.y_top_left as f64),
				Point::new(self.x_right as f64, self.y_top_right as f64)
			),
			SidePosition::Bottom => Line::new(
				Point::new(self.x_left as f64, self.y_bot_left as f64),
				Point::new(self.x_right as f64, self.y_bot_right as f64)
			),
			SidePosition::Left => Line::new(
				Point::new(self.x_left as f64, self.y_top_left as f64),
				Point::new(self.x_left as f64, self.y_bot_left as f64)
			),
			SidePosition::Right => Line::new(
				Point::new(self.x_right as f64, self.y_top_right as f64),
				Point::new(self.x_right as f64, self.y_bot_right as f64)
			)
		}
	}

	pub fn point_on_side(&self, x: u32, y: u32) -> bool {
		let p = Point::new(x as f64, y as f64);
		let top = self.get_side_line(&SidePosition::Top);
		let bottom = self.get_side_line(&SidePosition::Bottom);
		let left = self.get_side_line(&SidePosition::Left);
		let right = self.get_side_line(&SidePosition::Right);
		p.intersects(&top) || p.intersects(&bottom) || p.intersects(&left) || p.intersects(&right)
	}

	pub fn contains_point(&self, x: u32, y: u32) -> bool {
		self.as_polygon().contains(&Point::new(x as f64, y as f64))
	}

	pub fn strictly_contains_point(&self, x: u32, y: u32) -> bool {
		self.contains_point(x, y) && !self.point_on_side(x, y)
	}

	pub fn collides_room(&self, other_room: &Room) -> bool {
		self.strictly_contains_point(other_room.x_left, other_room.y_top_left) ||
			self.strictly_contains_point(other_room.x_right, other_room.y_top_right) ||
			self.strictly_contains_point(other_room.x_left, other_room.y_bot_left) ||
			self.strictly_contains_point(other_room.x_right, other_room.y_bot_right) ||
			other_room.strictly_contains_point(self.x_left, self.y_top_left) ||
			other_room.strictly_contains_point(self.x_right, self.y_top_right) ||
			other_room.strictly_contains_point(self.x_left, self.y_bot_left) ||
			other_room.strictly_contains_point(self.x_right, self.y_bot_right)
	}

	pub fn get_overlap(&self, other_room: &Room) -> Option<Line> {
		for side1 in self.sides() {
			let side1_line = side1.as_line();
			for side2 in other_room.sides() {
				let side2_line = side2.as_line();
				if let Some(overlap) = side1_line.get_overlap(&side2_line) {
					return Some(overlap)
				}
			}
		}
		None
	}
}
