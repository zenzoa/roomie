use std::str::FromStr;
use std::{ fs, fmt };
use std::sync::Mutex;
use std::path::{ Path, PathBuf };
use std::error::Error;

use serde::Serialize;

use tauri::{ AppHandle, Manager, State, Emitter };
use tauri::menu::{ MenuItem, MenuItemKind };

pub struct ConfigState {
	pub theme: Mutex<Theme>,
	pub show_toolbar: Mutex<bool>,
	pub show_coords: Mutex<bool>,
	pub show_room_colors: Mutex<bool>,
	pub bg_opacity: Mutex<u16>,
	pub overlay_opacity: Mutex<u16>,
	pub sidebar_width: Mutex<u16>,
	pub recent_files: Mutex<Vec<String>>,
	pub show_bg: Mutex<bool>,
	pub show_rooms: Mutex<bool>,
	pub show_overlays: Mutex<bool>,
}

impl ConfigState {
	pub fn new() -> Self {
		Self {
			theme: Mutex::new(Theme::Dark),
			show_toolbar: Mutex::new(true),
			show_coords: Mutex::new(true),
			show_room_colors: Mutex::new(true),
			bg_opacity: Mutex::new(50),
			overlay_opacity: Mutex::new(100),
			sidebar_width: Mutex::new(360),
			recent_files: Mutex::new(Vec::new()),
			show_bg: Mutex::new(true),
			show_rooms: Mutex::new(true),
			show_overlays: Mutex::new(true)
		}
	}
}

#[derive(Serialize)]
pub struct ConfigInfo {
	pub theme: Theme,
	pub show_toolbar: bool,
	pub show_coords: bool,
	pub show_room_colors: bool,
	pub bg_opacity: u16,
	pub overlay_opacity: u16,
	pub sidebar_width: u16,
	pub recent_files: Vec<String>
}

impl ConfigInfo {
	pub fn new() -> Self {
		Self {
			theme: Theme::Dark,
			show_toolbar: true,
			show_coords: true,
			show_room_colors: true,
			bg_opacity: 50,
			overlay_opacity: 50,
			sidebar_width: 360,
			recent_files: Vec::new()
		}
	}
}

#[derive(Copy, Clone, PartialEq, Serialize)]
pub enum Theme {
	Dark,
	Light,
	Purple
}

impl fmt::Display for Theme {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		match *self {
			Theme::Dark => { write!(f, "dark") }
			Theme::Light => { write!(f, "light") }
			Theme::Purple => { write!(f, "purple") }
		}
    }
}

#[tauri::command]
pub fn load_config_file(handle: AppHandle) -> ConfigInfo {
	let mut config_info = ConfigInfo::new();

	if let Ok(config_dir) = handle.path().config_dir() {
		let config_file_path = config_dir.join("roomie.conf");
		if let Ok(config_contents) = fs::read_to_string(config_file_path) {
			let lines: Vec<&str> = config_contents.split('\n').collect();
			for line in lines.iter() {
				let parts: Vec<&str> = line.split(':').collect();
				if parts.len() > 1 {
					if let Some(key) = parts.first() {
						let value = parts[1..].join("");
						match key.trim() {
							"theme" => {
								config_info.theme = match value.trim() {
									"light" => Theme::Light,
									"purple" => Theme::Purple,
									_ => Theme::Dark
								};
							},
							"show_toolbar" => {
								config_info.show_toolbar = value.trim() != "false";
							},
							"show_coords" => {
								config_info.show_coords = value.trim() != "false";
							},
							"show_room_colors" => {
								config_info.show_room_colors = value.trim() != "false";
							},
							"bg_opacity" => {
								config_info.bg_opacity = value.trim().parse::<u16>().unwrap_or(50);
							},
							"overlay_opacity" => {
								config_info.overlay_opacity = value.trim().parse::<u16>().unwrap_or(100);
							},
							"sidebar_width" => {
								config_info.sidebar_width = value.trim().parse::<u16>().unwrap_or(360);
							},
							"recent_file" => {
								if fs::exists(value.trim()).unwrap_or(false) {
									config_info.recent_files.push(value.trim().to_string());
								}
							}
							_ => {}
						}
					}
				}
			}
		}
	}

	let config_state: State<ConfigState> = handle.state();

	*config_state.theme.lock().unwrap() = config_info.theme;
	set_theme(&handle, config_info.theme, true);

	*config_state.show_toolbar.lock().unwrap() = config_info.show_toolbar;
	set_toolbar_visibility(&handle, config_info.show_toolbar, true);

	*config_state.show_coords.lock().unwrap() = config_info.show_coords;
	set_coords_visibility(&handle, config_info.show_coords, true);

	*config_state.show_room_colors.lock().unwrap() = config_info.show_room_colors;
	set_room_colors_visibility(&handle, config_info.show_room_colors, true);

	*config_state.bg_opacity.lock().unwrap() = config_info.bg_opacity;
	set_bg_opacity(&handle, config_info.bg_opacity, true);

	*config_state.overlay_opacity.lock().unwrap() = config_info.overlay_opacity;
	set_overlay_opacity(&handle, config_info.overlay_opacity, true);

	*config_state.recent_files.lock().unwrap() = config_info.recent_files.clone();
	update_recent_files(&handle).unwrap_or_default();

	*config_state.sidebar_width.lock().unwrap() = config_info.sidebar_width;
	set_sidebar_width(handle, config_info.sidebar_width, true);

	config_info
}

pub fn save_config_file(handle: &AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	if let Ok(config_dir) = handle.path().config_dir() {
		let config_file_path = config_dir.join("roomie.conf");
		if let Ok(()) = fs::create_dir_all(config_dir) {
			fs::write(config_file_path, format!(
				"theme: {}\nshow_toolbar: {}\nshow_coords: {}\nshow_room_colors: {}\nbg_opacity: {}\noverlay_opacity: {}\nsidebar_width: {}{}",
				config_state.theme.lock().unwrap(),
				config_state.show_toolbar.lock().unwrap(),
				config_state.show_coords.lock().unwrap(),
				config_state.show_room_colors.lock().unwrap(),
				config_state.bg_opacity.lock().unwrap(),
				config_state.overlay_opacity.lock().unwrap(),
				config_state.sidebar_width.lock().unwrap(),
				config_state.recent_files.lock().unwrap().iter().map(|f| format!("\nrecent_file: {}", f)).collect::<Vec<String>>().join("")
			)).unwrap_or_default();
		}
	}
}

pub fn set_theme(handle: &AppHandle, new_theme: Theme, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Submenu(theme_menu)) = view_menu.get("theme") {
				if let Some(MenuItemKind::Check(menu_item)) = theme_menu.get("theme_dark") {
					menu_item.set_checked(new_theme == Theme::Dark).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = theme_menu.get("theme_light") {
					menu_item.set_checked(new_theme == Theme::Light).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = theme_menu.get("theme_purple") {
					menu_item.set_checked(new_theme == Theme::Purple).unwrap_or_default();
				};
			}
		}
	}

	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.theme.lock().unwrap() = new_theme;
		handle.emit("set_theme", new_theme.to_string()).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn set_toolbar_visibility(handle: &AppHandle, show_toolbar: bool, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_toolbar") {
				menu_item.set_checked(show_toolbar).unwrap_or_default();
			};
		}
	}

	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.show_toolbar.lock().unwrap() = show_toolbar;
		handle.emit("set_toolbar_visibility", show_toolbar).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn toggle_toolbar_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_toolbar = !*config_state.show_toolbar.lock().unwrap();
	set_toolbar_visibility(&handle, show_toolbar, false)
}

pub fn set_coords_visibility(handle: &AppHandle, show_coords: bool, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_coords") {
				menu_item.set_checked(show_coords).unwrap_or_default();
			};
		}
	}
	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.show_coords.lock().unwrap() = show_coords;
		handle.emit("set_coords_visibility", show_coords).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn toggle_coords_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_coords = !*config_state.show_coords.lock().unwrap();
	set_coords_visibility(&handle, show_coords, false)
}

pub fn set_bg_opacity(handle: &AppHandle, bg_opacity: u16, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Submenu(bg_opacity_menu)) = view_menu.get("bg_opacity") {
				if let Some(MenuItemKind::Check(menu_item)) = bg_opacity_menu.get("bg_opacity_100") {
					menu_item.set_checked(bg_opacity > 75).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = bg_opacity_menu.get("bg_opacity_75") {
					menu_item.set_checked(bg_opacity > 50 && bg_opacity <= 75).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = bg_opacity_menu.get("bg_opacity_50") {
					menu_item.set_checked(bg_opacity > 25 && bg_opacity <= 50).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = bg_opacity_menu.get("bg_opacity_25") {
					menu_item.set_checked(bg_opacity <= 25).unwrap_or_default();
				};
			}
		}
	}
	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.bg_opacity.lock().unwrap() = bg_opacity;
		handle.emit("set_bg_opacity", bg_opacity).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn set_overlay_opacity(handle: &AppHandle, overlay_opacity: u16, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Submenu(overlay_opacity_menu)) = view_menu.get("overlay_opacity") {
				if let Some(MenuItemKind::Check(menu_item)) = overlay_opacity_menu.get("overlay_opacity_100") {
					menu_item.set_checked(overlay_opacity > 75).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = overlay_opacity_menu.get("overlay_opacity_75") {
					menu_item.set_checked(overlay_opacity > 50 && overlay_opacity <= 75).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = overlay_opacity_menu.get("overlay_opacity_50") {
					menu_item.set_checked(overlay_opacity > 25 && overlay_opacity <= 50).unwrap_or_default();
				};
				if let Some(MenuItemKind::Check(menu_item)) = overlay_opacity_menu.get("overlay_opacity_25") {
					menu_item.set_checked(overlay_opacity <= 25).unwrap_or_default();
				};
			}
		}
	}
	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.overlay_opacity.lock().unwrap() = overlay_opacity;
		handle.emit("set_overlay_opacity", overlay_opacity).unwrap_or_default();
		save_config_file(handle);
	}
}

#[tauri::command]
pub fn set_sidebar_width(handle: AppHandle, sidebar_width: u16, init: bool) {
	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.sidebar_width.lock().unwrap() = sidebar_width;
		handle.emit("set_sidebar_width", sidebar_width).unwrap_or_default();
		save_config_file(&handle);
	}
}

pub fn set_room_colors_visibility(handle: &AppHandle, show_room_colors: bool, init: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_room_colors") {
				menu_item.set_checked(show_room_colors).unwrap();
			};
		}
	}

	if !init {
		let config_state: State<ConfigState> = handle.state();
		*config_state.show_room_colors.lock().unwrap() = show_room_colors;
		handle.emit("set_room_color_visibility", show_room_colors).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn toggle_room_colors_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_room_colors = !*config_state.show_room_colors.lock().unwrap();
	set_room_colors_visibility(&handle, show_room_colors, false)
}

pub fn add_recent_file(handle: &AppHandle, path: &Path) {
	if let Some(path_str) = path.to_str() {
		let config_state: State<ConfigState> = handle.state();
		let mut recent_files = config_state.recent_files.lock().unwrap().clone();
		recent_files.retain(|f| f != path_str);
		recent_files.push(path_str.to_string());
		if recent_files.len() > 10 {
			recent_files.remove(0);
		}
		*config_state.recent_files.lock().unwrap() = recent_files;
		update_recent_files(handle).unwrap_or_default();
		save_config_file(handle);
	}
}

pub fn update_recent_files(handle: &AppHandle) -> Result<(), Box<dyn Error>> {
	let config_state: State<ConfigState> = handle.state();
	let recent_files = config_state.recent_files.lock().unwrap();
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(file_menu)) = menu.get("file") {
			if let Some(MenuItemKind::Submenu(recent_files_menu)) = file_menu.get("recent_files") {
				let items = recent_files_menu.items()?;
				for item in items {
					recent_files_menu.remove(&item)?;
				}
				for (i, file) in recent_files.iter().enumerate() {
					let menu_item = MenuItem::with_id(handle, format!("recent_file_{}", i), file, true, None::<&str>)?;
					recent_files_menu.prepend(&menu_item)?;
				}
			}
		}
	}
	Ok(())
}

pub fn get_recent_file_path(handle: &AppHandle, id: &str) -> Option<PathBuf> {
	let config_state: State<ConfigState> = handle.state();
	let recent_files = config_state.recent_files.lock().unwrap();
	if let Some(index_str) = id.split('_').last() {
		if let Ok(index) = index_str.parse::<usize>() {
			if let Some(recent_file) = recent_files.get(index) {
				return PathBuf::from_str(recent_file).ok();
			}
		}
	}
	None
}

pub fn set_bg_visibility(handle: &AppHandle, show_bg: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_bg") {
				menu_item.set_checked(show_bg).unwrap_or_default();
			};
		}
	}
	let config_state: State<ConfigState> = handle.state();
	*config_state.show_bg.lock().unwrap() = show_bg;
	handle.emit("set_bg_visibility", show_bg).unwrap_or_default();
}

#[tauri::command]
pub fn toggle_bg_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_bg = !*config_state.show_bg.lock().unwrap();
	set_bg_visibility(&handle, show_bg)
}

pub fn set_room_visibility(handle: &AppHandle, show_rooms: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_rooms") {
				menu_item.set_checked(show_rooms).unwrap_or_default();
			};
		}
	}
	let config_state: State<ConfigState> = handle.state();
	*config_state.show_rooms.lock().unwrap() = show_rooms;
	handle.emit("set_room_visibility", show_rooms).unwrap_or_default();
}

#[tauri::command]
pub fn toggle_room_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_rooms = !*config_state.show_rooms.lock().unwrap();
	set_room_visibility(&handle, show_rooms)
}

pub fn set_overlay_visibility(handle: &AppHandle, show_overlays: bool) {
	if let Some(menu) = handle.menu() {
		if let Some(MenuItemKind::Submenu(view_menu)) = menu.get("view") {
			if let Some(MenuItemKind::Check(menu_item)) = view_menu.get("show_overlays") {
				menu_item.set_checked(show_overlays).unwrap_or_default();
			};
		}
	}
	let config_state: State<ConfigState> = handle.state();
	*config_state.show_overlays.lock().unwrap() = show_overlays;
	handle.emit("set_overlay_visibility", show_overlays).unwrap_or_default();
}

#[tauri::command]
pub fn toggle_overlay_visibility(handle: AppHandle) {
	let config_state: State<ConfigState> = handle.state();
	let show_overlays = !*config_state.show_overlays.lock().unwrap();
	set_overlay_visibility(&handle, show_overlays)
}
