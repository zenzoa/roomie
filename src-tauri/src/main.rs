// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Cursor;

use image::ImageFormat;

use tauri::{
	Builder,
	AppHandle,
	WindowEvent,
	Manager,
	Emitter,
	State
};
use tauri::menu::{
	Menu,
	Submenu,
	MenuItem,
	CheckMenuItem,
	PredefinedMenuItem,
	MenuId
};

mod frontend;
mod file;
mod caos;
mod metaroom;
mod geometry;
mod history;
mod config;
mod format;

use file::{ FileState, new_file, open_file, open_recent_file, save_file, save_as, is_ok_to_modify };
use metaroom::MetaroomState;
use frontend::{ error_dialog, update_window_title };
use history::{ HistoryState, undo, redo };
use config::{ ConfigState, load_config_file, Theme };

fn main() {
	Builder::default()

		.on_window_event(|window, event| {
			match event {
				WindowEvent::CloseRequested { api, .. } => {
					api.prevent_close();
					try_quit(window.app_handle().clone());
				},
				_ => {}
			}
		})

		.menu(|handle| {
			Menu::with_id_and_items(handle, "main", &[

				&Submenu::with_id_and_items(handle, "file", "File", true, &[
					&MenuItem::with_id(handle, "new", "New", true, Some("CmdOrCtrl+N"))?,
					&MenuItem::with_id(handle, "open", "Open...", true, Some("CmdOrCtrl+O"))?,
					&Submenu::with_id(handle, "recent_files", "Open Recent", true)?,
					&PredefinedMenuItem::separator(handle)?,
					&MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?,
					&MenuItem::with_id(handle, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
					&PredefinedMenuItem::separator(handle)?,
					&MenuItem::with_id(handle, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?,
				])?,

				&Submenu::with_id_and_items(handle, "edit", "Edit", true, &[
					&MenuItem::with_id(handle, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?,
					&MenuItem::with_id(handle, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?
				])?,

				&Submenu::with_id_and_items(handle, "add", "Add", true, &[
					&MenuItem::with_id(handle, "add_room", "Room", true, Some("Shift+R"))?,
					&MenuItem::with_id(handle, "add_link", "CA Link", true, Some("Shift+L"))?,
					&MenuItem::with_id(handle, "add_overlay", "Overlay", true, Some("Shift+O"))?,
					&MenuItem::with_id(handle, "add_favicon", "Favicon", true, Some("Shift+F"))?,
				])?,

				&Submenu::with_id_and_items(handle, "select", "Select", true, &[
					&MenuItem::with_id(handle, "select_all", "All", true, Some("CmdOrCtrl+A"))?,
					&MenuItem::with_id(handle, "deselect", "Deselect", true, Some("CmdOrCtrl+D"))?,
				])?,

				&Submenu::with_id_and_items(handle, "view", "View", true, &[
					&MenuItem::with_id(handle, "reset_zoom", "100%", true, Some("CmdOrCtrl+0"))?,
					&MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+="))?,
					&MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
					&MenuItem::with_id(handle, "zoom_fill", "Fill Window", true, Some("CmdOrCtrl+9"))?,
					&PredefinedMenuItem::separator(handle)?,
					&Submenu::with_id_and_items(handle, "theme", "Theme", true, &[
						&CheckMenuItem::with_id(handle, "theme_dark", "Dark", true, true, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "theme_light", "Light", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "theme_purple", "Purple", true, false, None::<&str>)?,
					])?,
					&PredefinedMenuItem::separator(handle)?,
					&Submenu::with_id_and_items(handle, "bg_opacity", "Background Opacity", true, &[
						&CheckMenuItem::with_id(handle, "bg_opacity_25", "25%", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "bg_opacity_50", "50%", true, true, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "bg_opacity_75", "75%", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "bg_opacity_100", "100%", true, false, None::<&str>)?,
					])?,
					&PredefinedMenuItem::separator(handle)?,
					&Submenu::with_id_and_items(handle, "overlay_opacity", "Overlay Opacity", true, &[
						&CheckMenuItem::with_id(handle, "overlay_opacity_25", "25%", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "overlay_opacity_50", "50%", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "overlay_opacity_75", "75%", true, false, None::<&str>)?,
						&CheckMenuItem::with_id(handle, "overlay_opacity_100", "100%", true, true, None::<&str>)?,
					])?,
					&PredefinedMenuItem::separator(handle)?,
					&CheckMenuItem::with_id(handle, "show_bg", "Show Background", true, true, Some("CmdOrCtrl+Shift+B"))?,
					&CheckMenuItem::with_id(handle, "show_rooms", "Show Rooms", true, true, Some("CmdOrCtrl+Shift+R"))?,
					&CheckMenuItem::with_id(handle, "show_overlays", "Show Overlays", true, true, Some("CmdOrCtrl+Shift+O"))?,
					&PredefinedMenuItem::separator(handle)?,
					&CheckMenuItem::with_id(handle, "show_toolbar", "Show Toolbar", true, true, None::<&str>)?,
					&CheckMenuItem::with_id(handle, "show_coords", "Show Coordinates", true, true, None::<&str>)?,
					&CheckMenuItem::with_id(handle, "show_room_colors", "Show Room Colors", true, true, None::<&str>)?,
				])?,

				&Submenu::with_id_and_items(handle, "help", "Help", true, &[
					&MenuItem::with_id(handle, "about", "About", true, None::<&str>)?,
				])?,

			])
		})

		.setup(|app| {
			app.on_menu_event(|handle, event| {
				let MenuId(id) = event.id();
				let handle = handle.clone();

				match id.as_str() {
					// FILE MENU
					"new" => new_file(handle),
					"open" => open_file(handle),
					"save" => save_file(handle),
					"save_as" => save_as(handle),
					"quit" => try_quit(handle),

					// EDIT MENU
					"undo" => undo(handle),
					"redo" => redo(handle),

					// ADD MENU
					"add_room" => frontend::add_room(handle),
					"add_link" => handle.emit("start_adding_link", ()).unwrap_or_default(),
					"add_favicon" => frontend::try_adding_favicon(handle),
					"add_overlay" => frontend::try_adding_overlay(handle),

					// SELECT MENU
					"select_all" => handle.emit("select_all", ()).unwrap_or_default(),
					"deselect" => handle.emit("deselect", ()).unwrap_or_default(),

					// VIEW MENU
					"reset_zoom" => handle.emit("reset_zoom", ()).unwrap_or_default(),
					"zoom_in" => handle.emit("zoom_in", ()).unwrap_or_default(),
					"zoom_out" => handle.emit("zoom_out", ()).unwrap_or_default(),
					"zoom_fill" => handle.emit("zoom_fill", ()).unwrap_or_default(),
					"theme_dark" => config::set_theme(&handle, Theme::Dark, false),
					"theme_light" => config::set_theme(&handle, Theme::Light, false),
					"theme_purple" => config::set_theme(&handle, Theme::Purple, false),
					"show_toolbar" => config::toggle_toolbar_visibility(handle),
					"show_coords" => config::toggle_coords_visibility(handle),
					"show_room_colors" => config::toggle_room_colors_visibility(handle),

					"bg_opacity_25" => config::set_bg_opacity(&handle, 25, false),
					"bg_opacity_50" => config::set_bg_opacity(&handle, 50, false),
					"bg_opacity_75" => config::set_bg_opacity(&handle, 75, false),
					"bg_opacity_100" => config::set_bg_opacity(&handle, 100, false),

					"overlay_opacity_25" => config::set_overlay_opacity(&handle, 25, false),
					"overlay_opacity_50" => config::set_overlay_opacity(&handle, 50, false),
					"overlay_opacity_75" => config::set_overlay_opacity(&handle, 75, false),
					"overlay_opacity_100" => config::set_overlay_opacity(&handle, 100, false),

					"show_bg" => config::toggle_bg_visibility(handle),
					"show_rooms" => config::toggle_room_visibility(handle),
					"show_overlays" => config::toggle_overlay_visibility(handle),

					// HELP MENU
					"about" => handle.emit("show_about_dialog", ()).unwrap_or_default(),

					_ => {
						if id.starts_with("recent_file") {
							open_recent_file(handle, id);
						}
					}
				}
			});
			Ok(())
		})

		.manage(FileState::default())
		.manage(MetaroomState::default())
		.manage(HistoryState::default())
		.manage(ConfigState::new())

		.invoke_handler(tauri::generate_handler![
			new_file,
			open_file,
			save_file,
			save_as,

			undo,
			redo,

			frontend::get_object_at,
			frontend::get_objects_within,

			frontend::update_metaroom,

			frontend::update_doors,

			frontend::update_rooms,
			frontend::add_room,
			frontend::remove_rooms,
			frontend::update_smells,

			frontend::update_link,
			frontend::add_link,
			frontend::remove_links,

			frontend::try_adding_favicon,
			frontend::update_favicon,
			frontend::add_favicon,
			frontend::remove_favicon,

			frontend::try_adding_overlay,
			frontend::update_overlays,
			frontend::add_overlay,
			frontend::remove_overlays,

			config::toggle_bg_visibility,
			config::toggle_room_visibility,
			config::toggle_overlay_visibility,

			load_config_file,
			error_dialog,
			try_quit
		])

		.on_page_load(|window, _| {
			update_window_title(window.app_handle());
		})

		.register_uri_scheme_protocol("getimage", |context, request| {
			let handle = context.app_handle();

			let not_found = http::Response::builder().body(Vec::new()).unwrap_or_default();

			let file_state: State<FileState> = handle.state();

			let uri_parts: Vec<&str> = request.uri().path().split('-').collect();

			if uri_parts.len() >= 2 {
				match uri_parts[1] {
					"background" => {
						let mut img_data = Cursor::new(Vec::new());
						let bg_image_opt = file_state.bg_image.lock().unwrap().clone();
						if let Some(bg_image) = bg_image_opt {
							if let Ok(()) = bg_image.write_to(&mut img_data, ImageFormat::Png) {
								return http::Response::builder()
									.header("Content-Type", "image/png")
									.body(img_data.into_inner())
									.unwrap_or_default()
							}
						}
					},
					"favicon" => {
						let favicon_image_opt = file_state.favicon_image.lock().unwrap().clone();
						if let Some(favicon_image) = favicon_image_opt {
							let mut img_data = Cursor::new(Vec::new());
							if let Ok(()) = favicon_image.write_to(&mut img_data, ImageFormat::Png) {
								return http::Response::builder()
									.header("Content-Type", "image/png")
									.body(img_data.into_inner())
									.unwrap_or_default()
							}
						}
					},
					"overlay" => {
						if uri_parts.len() >= 3 {
							if let Ok(overlay_id) = u32::from_str_radix(uri_parts[2], 10) {
								let overlay_images = file_state.overlay_images.lock().unwrap();
								if let Some(overlay_image) = overlay_images.get(&overlay_id) {
									let mut img_data = Cursor::new(Vec::new());
									if let Ok(()) = overlay_image.write_to(&mut img_data, ImageFormat::Png) {
										return http::Response::builder()
											.header("Content-Type", "image/png")
											.body(img_data.into_inner())
											.unwrap_or_default()
									}
								}
							}
						}
					},
					_ => {}
				}
			}

			not_found
		})

		.run(tauri::generate_context!())

		.expect("error while running tauri application");
}


#[tauri::command]
fn try_quit(handle: AppHandle) {
	if is_ok_to_modify(&handle) {
		if let Some(window) = handle.get_webview_window("main") {
			window.destroy().unwrap_or_default();
		};
	}
}
