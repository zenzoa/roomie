use rfd::{ MessageDialog, MessageButtons };

use serde::{ Serialize, Deserialize };

use tauri::{ AppHandle, State, Manager, Emitter };

use crate::file::FileState;
use crate::history::add_history_state;
use crate::metaroom::{
	Metaroom,
	MetaroomState,
	room::{ Room, Smell },
	door::Door,
	link::{ Link, link_exists },
	overlay::Overlay,
	favicon::Favicon
};
use crate::config::{ ConfigState, set_overlay_visibility };

#[derive(Clone, Serialize)]
pub enum MetaroomObjectIds {
	Rooms(Vec<u32>),
	Sides(Vec<u32>),
	Corners(Vec<u32>),
	Doors(Vec<u32>),
	Links(Vec<u32>),
	Overlays(Vec<u32>),
	Favicon(bool)
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SelectionType {
	Any,
	AnyMoveable,
	Rooms,
	Sides,
	Corners,
	Doors,
	Links,
	Overlays,
	Favicon
}

pub fn update_frontend_metaroom(handle: &AppHandle, reset: bool) {
	let metaroom_state: State<MetaroomState> = handle.state();
	let metaroom_opt = metaroom_state.metaroom.lock().unwrap();
	if let Some(metaroom) = metaroom_opt.as_ref() {
		handle.emit("update_metaroom", (metaroom, reset)).unwrap_or_default();
	}
}

#[tauri::command]
pub fn error_dialog(error_message: String) {
	MessageDialog::new()
		.set_title("Error")
		.set_description(error_message)
		.set_buttons(MessageButtons::Ok)
		.show();
}

pub fn update_window_title(handle: &AppHandle) {
	let window = handle.get_webview_window("main").unwrap();

	let metaroom_state: State<MetaroomState> = handle.state();
	let metaroom_exists = metaroom_state.metaroom.lock().unwrap().is_some();

	if metaroom_exists {
		let file_state: State<FileState> = handle.state();

		let is_modified = *file_state.is_modified.lock().unwrap();
		let modified = if is_modified { "*" } else { "" };
		let mut file_name = "Untitled".to_string();

		let path_opt = file_state.path.lock().unwrap().clone();
		if let Some(path) = path_opt {
			if let Some(actual_file_name) = path.file_name() {
				file_name = actual_file_name.to_string_lossy().into_owned();
			}
		};

		window.set_title(&format!("{}{} - Roomie", modified, file_name)).unwrap_or_default();

	} else {
		window.set_title("Roomie").unwrap_or_default();
	}
}

#[tauri::command]
pub fn get_object_at(metaroom_state: State<MetaroomState>, config_state: State<ConfigState>, x: u32, y: u32, r: f64, selection_type: SelectionType) -> Option<MetaroomObjectIds> {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_ref() {
		let select_any = selection_type == SelectionType::Any || selection_type == SelectionType::AnyMoveable;
		let show_rooms = *config_state.show_rooms.lock().unwrap();
		let show_overlays = *config_state.show_overlays.lock().unwrap();

		if show_overlays && (selection_type == SelectionType::Overlays || select_any) {
			if let Some(overlay_id) = metaroom.get_overlay_id_at(x, y) {
				return Some(MetaroomObjectIds::Overlays([overlay_id].to_vec()));
			}
		}

		if show_rooms {
			if selection_type == SelectionType::Favicon || select_any {
				if let Some(favicon) = &metaroom.favicon {
					if favicon.contains(x, y) {
						return Some(MetaroomObjectIds::Favicon(true));
					}
				}
			}
			if selection_type == SelectionType::Links || select_any {
				if let Some(link_id) = metaroom.get_link_id_at(x, y, r) {
					return Some(MetaroomObjectIds::Links([link_id].to_vec()));
				}
			}
			if selection_type == SelectionType::Corners || select_any {
				if let Some(corner_id) = metaroom.get_corner_id_at(x, y, r) {
					return Some(MetaroomObjectIds::Corners([corner_id].to_vec()));
				}
			}
			if selection_type == SelectionType::Doors || selection_type == SelectionType::Any {
				if let Some(door_id) = metaroom.get_door_id_at(x, y, r) {
					return Some(MetaroomObjectIds::Doors([door_id].to_vec()));
				}
			}
			if selection_type == SelectionType::Sides || select_any {
				if let Some(side_id) = metaroom.get_side_id_at(x, y, r) {
					return Some(MetaroomObjectIds::Sides([side_id].to_vec()));
				}
			}
			if selection_type == SelectionType::Rooms || select_any {
				if let Some(room_id) = metaroom.get_room_id_at(x, y) {
					return Some(MetaroomObjectIds::Rooms([room_id].to_vec()));
				}
			}
		}
	}
	None
}

#[tauri::command]
pub fn get_objects_within(metaroom_state: State<MetaroomState>, config_state: State<ConfigState>, x: u32, y: u32, w: u32, h: u32, selection_type: SelectionType) -> Option<MetaroomObjectIds> {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_ref() {
		let select_any = selection_type == SelectionType::Any || selection_type == SelectionType::AnyMoveable;
		let show_rooms = *config_state.show_rooms.lock().unwrap();
		let show_overlays = *config_state.show_overlays.lock().unwrap();

		if show_rooms {
			if selection_type == SelectionType::Rooms || select_any {
				if let Some(room_ids) = metaroom.get_room_ids_within(x, y, w, h) {
					return Some(MetaroomObjectIds::Rooms(room_ids));
				}
			}
			if selection_type == SelectionType::Sides || select_any {
				if let Some(side_ids) = metaroom.get_side_ids_within(x, y, w, h) {
					return Some(MetaroomObjectIds::Sides(side_ids));
				}
			}
			if selection_type == SelectionType::Corners || select_any {
				if let Some(corner_ids) = metaroom.get_corner_ids_within(x, y, w, h) {
					return Some(MetaroomObjectIds::Corners(corner_ids));
				}
			}
			if selection_type == SelectionType::Doors || selection_type == SelectionType::Any {
				if let Some(door_ids) = metaroom.get_door_ids_within(x, y, w, h) {
					return Some(MetaroomObjectIds::Doors(door_ids));
				}
			}
			if selection_type == SelectionType::Favicon || select_any {
				if let Some(favicon) = &metaroom.favicon {
					if favicon.within(x, y, w, h) {
						return Some(MetaroomObjectIds::Favicon(true));
					}
				}
			}
		}

		if show_overlays && (selection_type == SelectionType::Overlays || select_any) {
			if let Some(overlay_ids) = metaroom.get_overlay_ids_within(x, y, w, h) {
				return Some(MetaroomObjectIds::Overlays(overlay_ids));
			}
		}
	}
	None
}

#[tauri::command]
pub fn update_metaroom(handle: AppHandle, metaroom_state: State<MetaroomState>, metaroom: Metaroom) {
	if let Some(old_metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, old_metaroom);
		*old_metaroom = metaroom;
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn update_metaroom_bg(handle: AppHandle, metaroom_state: State<MetaroomState>, bg: String) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.background = bg;
		metaroom.load_background_image(&handle);
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn resize_metaroom(handle: AppHandle, metaroom_state: State<MetaroomState>, w: u32, h: u32) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		if let Err(why) = metaroom.resize(w, h) {
			error_dialog(why.to_string());
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn update_doors(handle: AppHandle, metaroom_state: State<MetaroomState>, doors: Vec<Door>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		for updated_door in doors {
			let door_id = updated_door.id as usize;
			if let Some(door) = metaroom.doors.get_mut(door_id) {
				*door = updated_door;
			}
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn update_rooms(handle: AppHandle, metaroom_state: State<MetaroomState>, rooms: Vec<Room>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		for updated_room in rooms {
			let room_id = updated_room.id as usize;
			if let Some(room) = metaroom.rooms.get_mut(room_id) {
				*room = updated_room;
			}
			if let Some(room) = metaroom.rooms.get(room_id) {
				metaroom.update_room_bits(room.id);
			}
		}
		metaroom.mark_room_collisions();
		metaroom.doors = metaroom.create_doors();
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn add_room(handle: AppHandle) {
	let metaroom_state: State<MetaroomState> = handle.state();
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.add_room(Room::default());
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
	handle.emit("start_adding_room", ()).unwrap_or_default();
}

#[tauri::command]
pub fn remove_rooms(handle: AppHandle, metaroom_state: State<MetaroomState>, mut ids: Vec<u32>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		for i in 0..ids.len() {
			metaroom.remove_room(ids[i]);
			for j in i..ids.len() {
				if ids[j] > ids[i] {
					ids[j] -= 1;
				}
			}
		}

	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn update_smells(handle: AppHandle, metaroom_state: State<MetaroomState>, room_id: usize, smells: Vec<Smell>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		if let Some(room) = metaroom.rooms.get_mut(room_id) {
			room.smells = smells
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn update_link(handle: AppHandle, metaroom_state: State<MetaroomState>, id: usize, end: char, x: u32, y: u32) {
	let room_id = if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_ref() {
		metaroom.get_room_id_at(x, y)
	} else {
		None
	};
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		let links = metaroom.links.clone();
		if let Some(link) = metaroom.links.get_mut(id) {
			if let Some(room_id) = room_id {
				match end {
					'a' => {
						if !link_exists(&links, room_id, link.room2_id) {
							link.room1_id = room_id;
							link.line.a = metaroom.rooms[room_id as usize].center();
						}
					},
					'b' => {
						if !link_exists(&links, link.room1_id, room_id) {
							link.room2_id = room_id;
							link.line.b = metaroom.rooms[room_id as usize].center();
						}
					},
					_ => {}
				}
			}
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn add_link(handle: AppHandle, room1_id: u32, room2_id: u32) {
	let metaroom_state: State<MetaroomState> = handle.state();
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		let links = metaroom.links.clone();
		if !link_exists(&links, room1_id, room2_id) {
			let link_id = metaroom.links.len() as u32;
			if let Ok(link) = Link::new(link_id, room1_id, room2_id, &metaroom.rooms) {
				add_history_state(&handle, metaroom);
				metaroom.links.push(link);
			}
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn remove_links(handle: AppHandle, metaroom_state: State<MetaroomState>, ids: Vec<u32>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.links = metaroom.links.clone().into_iter()
			.filter(|l| !ids.contains(&l.id))
			.collect::<Vec<Link>>();
		for (i, link) in metaroom.links.iter_mut().enumerate() {
			link.id = i as u32;
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn try_adding_favicon(handle: AppHandle) {
	let metaroom_state: State<MetaroomState> = handle.state();
	let metaroom_opt = metaroom_state.metaroom.lock().unwrap();
	if let Some(metaroom) = metaroom_opt.as_ref() {
		match metaroom.favicon {
			Some(_) => {
				MessageDialog::new()
					.set_title("Unable to Add Favicon")
					.set_description("Favicon already exists in this metaroom.")
					.set_buttons(MessageButtons::Ok)
					.show();
			},
			None => {
				handle.emit("start_adding_favicon", ()).unwrap_or_default();
			}
		}
	}
}

#[tauri::command]
pub fn update_favicon(handle: AppHandle, metaroom_state: State<MetaroomState>, favicon: Favicon, reload_image: bool) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		if reload_image {
			favicon.load_image(&handle);
		}
		metaroom.favicon = Some(favicon);
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn add_favicon(handle: AppHandle, metaroom_state: State<MetaroomState>, x: u32, y: u32) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.favicon = Some(Favicon { species: 0, sprite: String::new(), x, y })
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn remove_favicon(handle: AppHandle, metaroom_state: State<MetaroomState>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.favicon = None
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn try_adding_overlay(handle: AppHandle) {
	set_overlay_visibility(&handle, true);
	handle.emit("start_adding_overlay", ()).unwrap_or_default();
}

#[tauri::command]
pub fn update_overlays(handle: AppHandle, metaroom_state: State<MetaroomState>, overlays: Vec<Overlay>, reload_images: bool) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		for updated_overlay in overlays {
			let overlay_id = updated_overlay.id as usize;
			if let Some(overlay) = metaroom.overlays.get_mut(overlay_id) {
				*overlay = updated_overlay;
				if reload_images {
					overlay.load_image(&handle);
				}
			}
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn add_overlay(handle: AppHandle, metaroom_state: State<MetaroomState>, x: u32, y: u32) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		let mut new_overlay = Overlay::new_at(x, y);
		new_overlay.id = metaroom.overlays.len() as u32;
		new_overlay.load_image(&handle);
		metaroom.overlays.push(new_overlay);
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}

#[tauri::command]
pub fn remove_overlays(handle: AppHandle, metaroom_state: State<MetaroomState>, ids: Vec<u32>) {
	if let Some(metaroom) = metaroom_state.metaroom.lock().unwrap().as_mut() {
		add_history_state(&handle, metaroom);
		metaroom.overlays = metaroom.overlays.clone().into_iter()
			.filter(|o| !ids.contains(&o.id))
			.collect::<Vec<Overlay>>();
		for (i, overlay) in metaroom.overlays.iter_mut().enumerate() {
			overlay.id = i as u32;
			overlay.load_image(&handle);
		}
	}
	update_frontend_metaroom(&handle, false);
	update_window_title(&handle);
}
