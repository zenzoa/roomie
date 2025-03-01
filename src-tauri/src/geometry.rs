use serde::{ Serialize, Deserialize };

pub enum GeometryType {
	Point(Point),
	Line(Line),
	Polygon(Polygon)
}

pub trait Geometry {
	fn as_geo(&self) -> GeometryType;
}

#[derive(Default, Copy, Clone, PartialEq, Serialize, Deserialize)]
pub struct Point {
	pub x: f64,
	pub y: f64
}

impl Geometry for Point {
	fn as_geo(&self) -> GeometryType {
		GeometryType::Point(*self)
	}
}

impl Point {
	pub fn new(x: f64, y: f64) -> Self {
		Self { x, y }
	}

	pub fn x_y(&self) -> (f64, f64) {
		(self.x, self.y)
	}

	pub fn floor(&self) -> Self {
		Self::new(f64::floor(self.x), f64::floor(self.y))
	}

	pub fn dist_sq<T:Geometry>(&self, other: &T) -> f64 {
		match other.as_geo() {
			GeometryType::Point(point) => {
				f64::powi(self.x - point.x, 2) + f64::powi(self.y - point.y, 2)
			},
			GeometryType::Line(line) => {
				self.dist_sq(&line.closest_point(self))
			},
			GeometryType::Polygon(polygon) => {
				let mut closest_dist = f64::MAX;
				for side in polygon.sides() {
					let dist = self.dist_sq(&side);
					if dist < closest_dist {
						closest_dist = dist;
					}
				}
				closest_dist
			}
		}
	}

	pub fn intersects<T:Geometry>(&self, other: &T) -> bool {
		match other.as_geo() {
			GeometryType::Point(point) => *self == point,
			GeometryType::Line(line) => {
				orientation(line.a, line.b, *self) == Orientation::Collinear &&
					f64::min(line.a.x, line.b.x) <= self.x && self.x <= f64::max(line.a.x, line.b.x) &&
					f64::min(line.a.y, line.b.y) <= self.y && self.y <= f64::max(line.a.y, line.b.y)
			},
			GeometryType::Polygon(polygon) => {
				for side in polygon.sides() {
					if self.intersects(&side) {
						return true;
					}
				}
				false
			}
		}
	}

	pub fn intersects_circle(&self, cx: f64, cy: f64, cr: f64) -> bool {
		self.dist_sq(&Point::new(cx, cy)) <= cr * cr
	}
}

#[derive(Default, Copy, Clone, Serialize, Deserialize)]
pub struct Line {
	pub a: Point,
	pub b: Point
}

impl Geometry for Line {
	fn as_geo(&self) -> GeometryType {
		GeometryType::Line(*self)
	}
}

impl Line {
	pub fn new(a: Point, b: Point) -> Self {
		Self { a, b }
	}

	pub fn floor(&self) -> Self {
		Line::new(self.a.floor(), self.b.floor())
	}

	pub fn len_sq(&self) -> f64 {
		self.a.dist_sq(&self.b)
	}

	pub fn center(&self) -> Point {
		Point::new(
			self.a.x + (self.b.x - self.a.x) / 2.0,
			self.a.y + (self.b.y - self.a.y) / 2.0
		)
	}

	pub fn closest_point(&self, point: &Point) -> Point {
		let dot = (((point.x-self.a.x) * (self.b.x-self.a.x)) +
			((point.y-self.a.y) * (self.b.y-self.a.y))) / self.len_sq();
		Point::new(
			self.a.x + (dot * (self.b.x - self.a.x)),
			self.a.y + (dot * (self.b.y - self.a.y))
		)
	}

	pub fn intersects<T:Geometry>(&self, other: &T) -> bool {
		match other.as_geo() {
			GeometryType::Point(point) => point.intersects(self),
			GeometryType::Line(line) => {
				let o1 = orientation(self.a, self.b, line.a);
				let o2 = orientation(self.a, self.b, line.b);
				let o3 = orientation(line.a, line.b, self.a);
				let o4 = orientation(line.a, line.b, self.b);
				o1 != o2 && o3 != o4 ||
				o1 == Orientation::Collinear && self.intersects(&line.a) ||
				o2 == Orientation::Collinear && self.intersects(&line.b) ||
				o3 == Orientation::Collinear && line.intersects(&self.a) ||
				o4 == Orientation::Collinear && line.intersects(&self.b)
			},
			GeometryType::Polygon(polygon) => {
				for side in polygon.sides() {
					if side.intersects(self) {
						return true;
					}
				}
				false
			}
		}
	}

	pub fn intersects_circle(&self, cx: f64, cy: f64, cr: f64) -> bool {
		let ac = Point::new(cx - self.a.x, cy - self.a.y);
		let ab = Point::new(self.b.x - self.a.x, self.b.y - self.a.y);
		let ab2 = dot(&ab, &ab);
		let acab = dot(&ac, &ab);
		let mut t = acab / ab2;
		t = t.clamp(0.0, 1.0);
		let h = Point::new((ab.x * t + self.a.x) - cx, (ab.y * t + self.a.y) - cy);
		let h2 = dot(&h, &h);
		h2 <= cr * cr
	}

	pub fn get_common_endpoints(&self, other: &Line) -> Vec<Point> {
		let mut points = Vec::new();
		if self.a == other.a {
			points.push(self.a);
			if self.b == other.b {
				points.push(self.b);
			}
		} else if self.a == other.b {
			points.push(self.a);
			if self.b == other.a {
				points.push(self.b);
			}
		} else if self.b == other.a {
			points.push(self.b);
			if self.a == self.b {
				points.push(self.a);
			}
		} else if self.b == other.b {
			points.push(self.b);
			if self.a == other.a {
				points.push(self.a);
			}
		}
		points
	}

	pub fn get_overlap(&self, other: &Line) -> Option<Line> {
		if !self.intersects(other) {
			return None
		}

		let self_is_point = self.a == self.b;
		let other_is_point = other.a == other.b;
		if self_is_point || other_is_point {
			return None
		}

		let endpoints = self.get_common_endpoints(other);
		if endpoints.len() == 2 {
			return Some(Line::new(endpoints[0], endpoints[1]));
		}

		let collinear_segments =
			orientation(self.a, self.b, other.a) == Orientation::Collinear &&
			orientation(self.a, self.b, other.b) == Orientation::Collinear;
		if collinear_segments {
			if self.intersects(&other.a) && self.intersects(&other.b) {
				return Some(*other);
			} else if other.intersects(&self.a) && other.intersects(&self.b) {
				return Some(*self);
			} else {
				let p1 = if self.intersects(&other.a) { other.a } else { other.b };
				let p2 = if other.intersects(&self.a) { self.a } else { self.b };
				if p1 != p2 {
					return Some(Line::new(p1, p2));
				}
			}
		}

		None
	}

	pub fn dist_sq<T:Geometry>(&self, other: &T) -> f64 {
		match other.as_geo() {
			GeometryType::Point(point) =>
				point.dist_sq(self),
			GeometryType::Line(line) =>
				self.center().dist_sq(&line.center()),
			GeometryType::Polygon(polygon) =>
				self.center().dist_sq(&polygon.center())
		}
	}
}

impl PartialEq for Line {
	fn eq(&self, other: &Self) -> bool {
		(self.a == other.a && self.b == other.b) || (self.a == other.b && self.b == other.a)
	}
}

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct Polygon {
	pub points: Vec<Point>
}

impl Geometry for Polygon {
	fn as_geo(&self) -> GeometryType {
		GeometryType::Polygon(self.clone())
	}
}

impl Polygon {
	pub fn new(points: Vec<Point>) -> Self {
		Self { points }
	}

	pub fn from_rect(x: u32, y: u32, w: u32, h: u32) -> Self {
		Self::new([
			Point::new(x as f64, y as f64),
			Point::new((x+w) as f64, y as f64),
			Point::new((x+w) as f64, (y+h) as f64),
			Point::new((x) as f64, (y+h) as f64)
		].to_vec())
	}

	pub fn sides(&self) -> Vec<Line> {
		let mut sides = Vec::new();
		let n = self.points.len();
		for i in 0..self.points.len() {
			let p1 = self.points[i];
			let p2 = self.points[(i+1)%n];
			sides.push(Line::new(p1, p2));
		}
		sides
	}

	pub fn center(&self) -> Point {
		let mut centroid_x = 0.0;
		let mut centroid_y = 0.0;

		let mut signed_area = 0.0;

		let n = self.points.len();
		for i in 0..self.points.len() {
			let (x0, y0) = self.points[i].x_y();
			let (x1, y1) = self.points[(i+1)%n].x_y();

			let area = (x0 * y1) - (x1 * y0);
			signed_area += area;

			centroid_x += (x0 + x1) * area;
			centroid_y += (y0 + y1) * area;
		}

		signed_area *= 0.5;
		centroid_x /= signed_area * 6.0;
		centroid_y /= signed_area * 6.0;

		Point::new(centroid_x, centroid_y)
	}

	pub fn contains<T:Geometry>(&self, other: &T) -> bool {
		match other.as_geo() {
			GeometryType::Point(point) => {
				let n = self.points.len();
				let x = point.x;
				let y = point.y;
				let mut is_inside = false;

				let (mut x1, mut y1) = self.points[0].x_y();
				let (mut x2, mut y2);

				for i in 1..(n+1) {
					(x2, y2) = self.points[i % n].x_y();

					if y > y1.min(y2) && y <= y1.max(y2) && x <= x1.max(x2) {
						let x_intersection = ((y - y1) * (x2 - x1)) / (y2 - y1) + x1;
						if x1 == x2 || x <= x_intersection {
							is_inside = !is_inside;
						}
					}

					(x1, y1) = (x2, y2);
				}

				is_inside
			},
			GeometryType::Line(line) => {
				self.contains(&line.a) && self.contains(&line.b)
			},
			GeometryType::Polygon(polygon) => {
				for point in polygon.points {
					if !self.contains(&point) {
						return false;
					}
				}
				true
			}
		}
	}

	pub fn intersects<T:Geometry>(&self, other: &T) -> bool {
		match other.as_geo() {
			GeometryType::Point(point) => point.intersects(self),
			GeometryType::Line(line) => line.intersects(self),
			GeometryType::Polygon(polygon) => {
				if self.contains(&polygon) || polygon.contains(self){
					return true;
				}
				for side1 in self.sides() {
					for side2 in polygon.sides() {
						if side1.intersects(&side2) {
							return true;
						}
					}
				}
				false
			}
		}
	}
}

#[derive(PartialEq)]
enum Orientation {
	Collinear,
	Clockwise,
	Counterclockwise
}

fn orientation(a: Point, b: Point, c: Point) -> Orientation {
	let value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
	if value == 0.0 {
		Orientation::Collinear
	} else if value > 0.0 {
		Orientation::Clockwise
	} else {
		Orientation::Counterclockwise
	}
}

fn dot(a: &Point, b: &Point) -> f64 {
	(a.x * b.x) + (a.y * b.y)
}
