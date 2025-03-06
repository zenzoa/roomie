use std::collections::HashMap;
use std::error::Error;
use std::fmt;

use crate::metaroom::{
	Metaroom,
	room::{ Room, Smell },
	door::Door,
	link::Link,
	favicon::Favicon,
	overlay::Overlay
};

#[derive(Clone)]
struct Emitter {
	species: u16,
	room_id: Option<u32>,
	smells: Vec<Smell>
}

#[derive(Clone)]
enum Token {
	Number(String),
	String(String),
	ByteString(String),
	Command(String),
}

#[derive(Clone)]
enum TokenValue {
	None,
	Number(f32),
	ByteString(ByteString),
	String(String)
}

#[derive(Default, Clone, PartialEq)]
enum Target {
	#[default]
	None,
	Favicon,
	Emitter,
	Overlay
}

#[derive(Clone)]
struct ByteString {
	bytes: Vec<u8>
}

impl ByteString {
	fn from_string(s: &str) -> Self {
		let mut bytes = Vec::new();
		for b in s.split(' ').collect::<Vec<&str>>() {
			if let Ok(byte) = b.parse::<u8>() {
				bytes.push(byte);
			}
		}
		ByteString{ bytes }
	}
}

impl fmt::Display for ByteString {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		let s = self.bytes.iter()
			.map(|b| b.to_string())
			.collect::<Vec<String>>()
			.join(" ");
		write!(f, "[{}]", s)
	}
}

#[derive(Default, Clone)]
struct Context {
	pub metaroom: Metaroom,
	pub temp_emitter: Option<Emitter>,
	pub temp_overlay: Option<Overlay>,
	pub target: Target,
	pub local_variables: HashMap<String, f32>,
	pub global_variables: HashMap<String, f32>
}

fn finalize_token(tokens: &mut Vec<Token>, current_token: &mut Option<Token>) {
	if let Some(current_token_inner) = current_token {
		tokens.push(current_token_inner.clone());
	}
	*current_token = None;
}

fn parse_tokens(file_contents: &str) -> Vec<Token> {
	let mut tokens: Vec<Token> = Vec::new();

	let mut current_token: Option<Token> = None;
	let mut is_escaped = false;

	for c in file_contents.chars() {
		if let Some(current_token_inner) = current_token.as_mut() {
			match current_token_inner {
				Token::Number(value) => {
					if c.is_ascii_digit() || c == '.' {
						value.push(c);
					} else {
						finalize_token(&mut tokens, &mut current_token);
					}
				},
				Token::String(value) => {
					if is_escaped {
						value.push(c);
						is_escaped = false;
					} else if c == '\\' {
						is_escaped = true;
					} else if c != '"' {
						value.push(c);
					} else {
						finalize_token(&mut tokens, &mut current_token);
					}
				},
				Token::ByteString(value) => {
					if c == ']' {
						finalize_token(&mut tokens, &mut current_token);
					} else {
						value.push(c)
					}
				},
				Token::Command(value) => {
					if !c.is_whitespace() {
						value.push(c);
					} else {
						finalize_token(&mut tokens, &mut current_token);
					}
				}
			}
		} else if c.is_ascii_digit() {
			current_token = Some(Token::Number(c.to_string()));
		} else if c == '"' {
			current_token = Some(Token::String("".to_string()));
		} else if c == '[' {
			current_token = Some(Token::ByteString("".to_string()));
		} else if !c.is_whitespace() {
			current_token = Some(Token::Command(c.to_string()));
		}
	}

	tokens
}

fn get_next_token(tokens: &[Token], i: &mut usize) -> Result<Token, Box<dyn Error>> {
	match tokens.get(*i) {
		Some(token) => {
			*i += 1;
			Ok(token.clone())
		},
		None => Err(format!("Unable to find token at index {}", i).into())
	}
}

fn get_next_token_float(context: &mut Context, tokens: &[Token], i: &mut usize) -> Result<f32, Box<dyn Error>> {
	match eval_next_token(context, tokens, i)? {
		TokenValue::Number(value) => Ok(value),
		TokenValue::String(value) => Err(format!("Expected number, found string \"{}\"", value).into()),
		TokenValue::ByteString(value) => Err(format!("Expected number, found byte string \"{}\"", value).into()),
		TokenValue::None => Err("Expected number, found nothing".into())
	}
}

fn get_next_token_int(context: &mut Context, tokens: &[Token], i: &mut usize) -> Result<u32, Box<dyn Error>> {
	let original_value = get_next_token_float(context, tokens, i)?;
	let int_value = original_value as u32;
	if int_value as f32 == original_value {
		Ok(int_value)
	} else {
		Err(format!("Expected unsigned integer, found {}", original_value).into())
	}
}

fn get_next_token_str(context: &mut Context, tokens: &[Token], i: &mut usize) -> Result<String, Box<dyn Error>> {
	match eval_next_token(context, tokens, i)? {
		TokenValue::Number(value) => Err(format!("Expected string, found number {}", value).into()),
		TokenValue::String(value) => Ok(value),
		TokenValue::ByteString(value) => Err(format!("Expected string, found byte string \"{}\"", value).into()),
		TokenValue::None => Err("Expected string, found nothing".into())
	}
}

fn get_next_token_bytes(context: &mut Context, tokens: &[Token], i: &mut usize) -> Result<Vec<u8>, Box<dyn Error>> {
	match eval_next_token(context, tokens, i)? {
		TokenValue::Number(value) => Err(format!("Expected byte string, found number {}", value).into()),
		TokenValue::String(value) => Err(format!("Expected byte string, found string \"{}\"", value).into()),
		TokenValue::ByteString(value) => Ok(value.bytes),
		TokenValue::None => Err("Expected byte string, found nothing".into())
	}
}

fn get_next_token_symbol(tokens: &[Token], i: &mut usize) -> Result<String, Box<dyn Error>> {
	match get_next_token(tokens, i)? {
		Token::Number(value) => Err(format!("Expected symbol, found number {}", value).into()),
		Token::String(value) => Err(format!("Expected symbol, found string \"{}\"", value).into()),
		Token::ByteString(value) => Err(format!("Expected symbol, found byte string \"{}\"", value).into()),
		Token::Command(value) => Ok(value)
	}
}

fn eval_next_token(context: &mut Context, tokens: &[Token], i: &mut usize) -> Result<TokenValue, Box<dyn Error>> {
	match get_next_token(tokens, i)? {
		Token::Number(value) => Ok(TokenValue::Number(value.parse::<f32>().unwrap_or(0.0))),
		Token::String(value) => Ok(TokenValue::String(value)),
		Token::ByteString(value) => Ok(TokenValue::ByteString(ByteString::from_string(&value))),
		Token::Command(value) => {
			match value.as_str() {
				// ADD METAROOM
				"addm" => {
					context.metaroom.x = get_next_token_int(context, tokens, i)?;
					context.metaroom.y = get_next_token_int(context, tokens, i)?;
					context.metaroom.width = get_next_token_int(context, tokens, i)?;
					context.metaroom.height = get_next_token_int(context, tokens, i)?;
					context.metaroom.background = get_next_token_str(context, tokens, i)?;
					Ok(TokenValue::Number(0.0))
				},

				// ADD ROOM
				"addr" => {
					let room_id = context.metaroom.rooms.len() as u32;
					let _metaroom_id = get_next_token_int(context, tokens, i)?;
					let x_left = get_next_token_int(context, tokens, i)?;
					let x_right = get_next_token_int(context, tokens, i)?;
					let y_top_left = get_next_token_int(context, tokens, i)?;
					let y_top_right = get_next_token_int(context, tokens, i)?;
					let y_bot_left = get_next_token_int(context, tokens, i)?;
					let y_bot_right = get_next_token_int(context, tokens, i)?;
					if x_left >= context.metaroom.x && x_right >= context.metaroom.x &&
						y_top_left >= context.metaroom.y && y_top_right >= context.metaroom.y &&
						y_bot_left >= context.metaroom.y && y_bot_right >= context.metaroom.y
						{
							context.metaroom.add_room(Room::new(
								room_id,
								x_left - context.metaroom.x,
								x_right - context.metaroom.x,
								y_top_left - context.metaroom.y,
								y_top_right - context.metaroom.y,
								y_bot_left - context.metaroom.y,
								y_bot_right - context.metaroom.y
							), false);
							Ok(TokenValue::Number(room_id as f32))
					} else {
						Err(format!("ADDR room {} is outside metaroom", room_id).into())
					}
				}

				// SET ROOM TYPE
				"rtyp" => {
					let room_id = get_next_token_int(context, tokens, i)?;
					let room_type = get_next_token_int(context, tokens, i)?;
					if let Some(room) = context.metaroom.rooms.get_mut(room_id as usize) {
						room.room_type = room_type;
						Ok(TokenValue::None)
					} else {
						Err(format!("RTYPE couldn't find room id {}", room_id).into())
					}
				}

				// ADD DOOR
				"door" => {
					let room1_id = get_next_token_int(context, tokens, i)?;
					let room2_id = get_next_token_int(context, tokens, i)?;
					let permeability = get_next_token_int(context, tokens, i)?;
					if context.metaroom.rooms.len() <= room1_id as usize {
						Err(format!("DOOR couldn't find room id {}", room1_id).into())
					} else if context.metaroom.rooms.len() <= room2_id as usize {
						Err(format!("DOOR couldn't find room id {}", room2_id).into())
					} else {
						let id = context.metaroom.doors.len() as u32;
						context.metaroom.doors.push(Door::new(id, room1_id, room2_id, permeability, &context.metaroom.rooms)?);
						Ok(TokenValue::None)
					}
				}

				// ADD LINK
				"link" => {
					let room1_id = get_next_token_int(context, tokens, i)?;
					let room2_id = get_next_token_int(context, tokens, i)?;
					if context.metaroom.rooms.len() <= room1_id as usize {
						Err(format!("LINK couldn't find room id {}", room1_id).into())
					} else if context.metaroom.rooms.len() <= room2_id as usize {
						Err(format!("LINK couldn't find room id {}", room2_id).into())
					} else {
						let id = context.metaroom.links.len() as u32;
						context.metaroom.links.push(Link::new(id, room1_id, room2_id, &context.metaroom.rooms)?);
						Ok(TokenValue::None)
					}
				}

				// SET METAROOM MUSIC
				"mmsc" => {
					let x = get_next_token_int(context, tokens, i)?;
					let y = get_next_token_int(context, tokens, i)?;
					let music = get_next_token_str(context, tokens, i)?;
					let music_parts: Vec<&str> = music.split('\\').collect();
					if music_parts.len() == 2 {
						if context.metaroom.contains_point(x, y) {
							context.metaroom.music_file_name = music_parts[0].to_string();
							context.metaroom.music_track_name = music_parts[1].to_string();
							Ok(TokenValue::None)
						} else {
							Err(format!("MMSC point ({}, {}) is outside metaroom", x, y).into())
						}
					} else {
						Err(format!("MMSC music \"{}\" needs to be in the format \"[file].mng\\\\[track]\"", music).into())
					}
				}

				// SET ROOM MUSIC
				"rmsc" => {
					let mut x = get_next_token_int(context, tokens, i)?;
					let mut y = get_next_token_int(context, tokens, i)?;
					if x >= context.metaroom.x && y >= context.metaroom.y {
						x -= context.metaroom.x;
						y -= context.metaroom.y;
					} else {
						return Err(format!("RMSC point ({}, {}) is outside metaroom", x, y).into());
					}

					let music = get_next_token_str(context, tokens, i)?;
					let music_parts: Vec<&str> = music.split('\\').collect();
					if music_parts.len() == 2 {
						if let Some(room) = context.metaroom.get_room_mut_at(x, y) {
							room.music_file_name = music_parts[0].to_string();
							room.music_track_name = music_parts[1].to_string();
							Ok(TokenValue::None)
						} else  {
							Err(format!("RMSC could not find room at ({}, {})", x, y).into())
						}
					} else {
						Err(format!("RMSC music \"{}\" needs to be in the format \"[file].mng\\\\[track]\"", music).into())
					}
				}

				// NEW OBJECT
				"new:" => {
					push_temp_objects(context);
					let new_type = get_next_token_symbol(tokens, i)?;
					if new_type == "simp" {
						let family = get_next_token_int(context, tokens, i)?;
						let genus = get_next_token_int(context, tokens, i)?;
						let species = get_next_token_int(context, tokens, i)? as u16;
						let sprite = get_next_token_str(context, tokens, i)?;
						let image_count = get_next_token_int(context, tokens, i)?;
						let first_image = get_next_token_int(context, tokens, i)?;
						let plane = get_next_token_int(context, tokens, i)?;
						if family == 1 && genus == 3 {
							context.target = Target::Favicon;
							context.metaroom.favicon = Some(Favicon::new(species, sprite));
						} else if &sprite == "blnk" && ((family == 1 && genus == 1) || (family == 3 && genus == 5)) {
							context.target = Target::Emitter;
							context.temp_emitter = Some(Emitter{ species, room_id: None, smells: Vec::new() });
						} else if family == 1 && genus == 1 {
							context.target = Target::Overlay;
							context.temp_overlay = Some(Overlay::new(species, sprite, image_count, first_image, plane));
						} else {
							return Err(format!("NEW: SIMP {} {} {} is not a recognized Favicon, Emitter, or Overlay", family, genus, species).into());
						}
					} else {
						return Err(format!("NEW: {} is not allowed inside Roomie code", value).into());
					}
					Ok(TokenValue::None)
				}

				// MOVE (OBJECT) TO
				"mvto" => {
					let mut x = get_next_token_int(context, tokens, i)?;
					let mut y = get_next_token_int(context, tokens, i)?;
					if x >= context.metaroom.x && y >= context.metaroom.y {
						x -= context.metaroom.x;
						y -= context.metaroom.y;
					} else {
						return Err(format!("MVTO point ({}, {}) is outside metaroom", x, y).into());
					}

					match context.target {
						Target::Favicon => {
							if let Some(favicon) = context.metaroom.favicon.as_mut() {
								favicon.x = x;
								favicon.y = y;
							}
						},
						Target::Emitter => {
							if let Some(emitter) = context.temp_emitter.as_mut() {
								if let Some(room_id) = context.metaroom.get_room_id_at(x, y) {
									emitter.room_id = Some(room_id);
								}
							}
						},
						Target::Overlay => {
							if let Some(overlay) = context.temp_overlay.as_mut() {
								overlay.x = x;
								overlay.y = y;
							}
						},
						Target::None => {
							return Err(format!("MVTO ({}, {}) has no target", x, y).into());
						},
					}
					Ok(TokenValue::None)
				},

				// SET OVERLAY ANIMATION
				"anim" => {
					let bytes = get_next_token_bytes(context, tokens, i)?;
					if context.target == Target::Overlay {
						if let Some(overlay) = context.temp_overlay.as_mut() {
							overlay.animation = bytes;
						}
						Ok(TokenValue::None)
					} else {
						Err(format!("ANIM {} has no target overlay", ByteString{ bytes }).into())
					}
				},

				// ADD EMITTER SMELL
				"emit" => {
					let ca = get_next_token_int(context, tokens, i)?;
					let amount = get_next_token_float(context, tokens, i)?;
					if context.target == Target::Emitter {
						if let Some(emitter) = context.temp_emitter.as_mut() {
							emitter.smells.push(Smell{ ca, amount });
						}
						Ok(TokenValue::None)
					} else {
						Err(format!("EMIT ({}, {}) has no target emitter", ca, amount).into())
					}
				},

				// SET VARIABLE
				"setv" => {
					let variable_name = get_next_token_symbol(tokens, i)?;
					if variable_name == "game" {
						let global_variable_name = get_next_token_str(context, tokens, i)?;
						let new_value = get_next_token_float(context, tokens, i)?;
						context.global_variables.insert(global_variable_name, new_value);
						Ok(TokenValue::None)
					} else if variable_name.starts_with("va") {
						let new_value = get_next_token_float(context, tokens, i)?;
						context.local_variables.insert(variable_name, new_value);
						Ok(TokenValue::None)
					} else {
						Err(format!("SETV {} is not a recognized variable type in Roomie code", variable_name).into())
					}
				}

				// GET GAME VARIABLE
				"game" => {
					let variable_name = get_next_token_str(context, tokens, i)?;
					if let Some(value) = context.global_variables.get(&variable_name) {
						Ok(TokenValue::Number(*value))
					} else {
						Err(format!("Reference to undefined game variable \"{}\"", variable_name).into())
					}
				}

				_ => {
					if value.starts_with("va") {
						if let Some(value) = context.local_variables.get(&value) {
							Ok(TokenValue::Number(*value))
						} else {
							Err(format!("Reference to undefined local variable variable \"{}\"", value).into())
						}
					} else {
						Ok(TokenValue::None)
					}
				}
			}
		}
	}
}

fn push_temp_objects(context: &mut Context) {
	if let Some(emitter) = context.temp_emitter.as_mut() {
		context.metaroom.emitter_species = Some(emitter.species);
		if let Some(room_id) = emitter.room_id {
			if let Some(room) = context.metaroom.rooms.get_mut(room_id as usize) {
				room.smells.extend_from_slice(&emitter.smells);
			}
		}
		context.temp_emitter = None;
	}

	if let Some(overlay) = context.temp_overlay.as_mut() {
		let id = context.metaroom.overlays.len() as u32;
		context.metaroom.overlays.push(Overlay { id, ..overlay.clone() });
		context.temp_overlay = None;
	}

	context.target = Target::None;
}

pub fn decode_metaroom(file_contents: &str) -> Result<Metaroom, Box<dyn Error>> {
	let tokens = parse_tokens(file_contents);

	let mut context = Context::default();

	let mut i = 0;
	while i < tokens.len() {
		eval_next_token(&mut context, &tokens, &mut i)?;
	}

	push_temp_objects(&mut context);

	context.metaroom.doors = context.metaroom.create_doors();

	Ok(context.metaroom)
}

pub fn encode_metaroom(metaroom: &Metaroom, version: &str) -> String {
	let mut contents: Vec<String> = Vec::new();

	contents.push("***ROOMIE_START***".to_string());
	contents.push(format!("*Auto-generated by Roomie v{}", version));
	contents.push("".to_string());

	contents.push("*Expand map size".to_string());
	contents.push("mapd 200000 200000".to_string());
	contents.push("".to_string());

	contents.push("*Create new metaroom".to_string());
	contents.push(format!("setv va01 addm {} {} {} {} \"{}\"",
		metaroom.x,
		metaroom.y,
		metaroom.width,
		metaroom.height,
		metaroom.background,
	));
	contents.push("".to_string());

	if !metaroom.music_file_name.is_empty() && !metaroom.music_track_name.is_empty() {
		contents.push("*Set metaroom music".to_string());
		contents.push(format!("mmsc {} {} \"{}\\\\{}\"",
			metaroom.x + metaroom.width / 2,
			metaroom.y + metaroom.height / 2,
			metaroom.music_file_name,
			metaroom.music_track_name
		));
		contents.push("".to_string());
	}

	if !metaroom.rooms.is_empty() {
		contents.push("*Add rooms".to_string());
		for room in &metaroom.rooms {
			contents.push(format!("setv va00 addr va01 {} {} {} {} {} {}",
				metaroom.x + room.x_left,
				metaroom.x + room.x_right,
				metaroom.y + room.y_top_left,
				metaroom.y + room.y_top_right,
				metaroom.y + room.y_bot_left,
				metaroom.y + room.y_bot_right,
			));
			contents.push(format!("    rtyp va00 {}", room.room_type));
			if !room.music_file_name.is_empty() && !room.music_track_name.is_empty() {
				let room_center = room.center();
				contents.push(format!("    rmsc {} {} \"{}\\\\{}\"",
					metaroom.x + room_center.x as u32,
					metaroom.y + room_center.y as u32,
					room.music_file_name,
					room.music_track_name
				));
			}
			contents.push(format!("    setv game \"map_tmp_{}\" va00", room.id));
		}
		contents.push("".to_string());
	}

	if !metaroom.doors.is_empty() {
		contents.push("*Add doors between rooms".to_string());
		for door in &metaroom.doors {
			contents.push(format!("door game \"map_tmp_{}\" game \"map_tmp_{}\" {}",
				door.room1_id,
				door.room2_id,
				door.permeability
			));
		}
		contents.push("".to_string());
	}

	if !metaroom.links.is_empty() {
		contents.push("*Add CA links".to_string());
		for link in &metaroom.links {
			contents.push(format!("link game \"map_tmp_{}\" game \"map_tmp_{}\" 100",
				link.room1_id,
				link.room2_id
			));
		}
		contents.push("".to_string());
	}

	if !metaroom.rooms.is_empty() {
		contents.push("*Delete temporary variables".to_string());
		for room in &metaroom.rooms {
			contents.push(format!("delg \"map_tmp_{}\"", room.id))
		}
		contents.push("".to_string());
	}

	if let Some(emitter_species) = metaroom.emitter_species {
		if !metaroom.rooms.is_empty() {
			contents.push("*Add CA emitters".to_string());
			for room in &metaroom.rooms {
				let room_center = room.center();
				for smell in &room.smells {
					contents.push(format!("new: simp 1 1 {} \"blnk\" 2 0 0",
						emitter_species
					));
					contents.push("    attr 16".to_string());
					contents.push(format!("    mvto {} {}",
						metaroom.x + room_center.x as u32,
						metaroom.y + room_center.y as u32
					));
					contents.push(format!("    emit {} {}",
						smell.ca,
						smell.amount
					));
					contents.push("".to_string());
				}
			}
			contents.push("".to_string());
		}
	}

	if !metaroom.overlays.is_empty() {
		contents.push("*Add overlays".to_string());
		for overlay in &metaroom.overlays {
			contents.push(format!("new: simp 1 1 {} \"{}\" 1 {} {}",
				overlay.species,
				overlay.sprite,
				overlay.first_image,
				overlay.plane
			));
			contents.push(format!("    mvto {} {}",
				metaroom.x + overlay.x,
				metaroom.y + overlay.y
			));
			if !overlay.animation.is_empty() {
				contents.push(format!("    anim [{}]",
					overlay.animation.iter().map(|n| n.to_string()).collect::<Vec<String>>().join(" ")
				));
			}
		}
		contents.push("".to_string());
	}

	if let Some(favicon) = &metaroom.favicon {
		contents.push("*Add favorite place signpost".to_string());
		contents.push(format!("new: simp 1 3 {} \"{}\" 1 0 1",
			favicon.species,
			favicon.sprite
		));
		contents.push("    attr 272".to_string());
		contents.push(format!("    mvto {} {}",
			metaroom.x + favicon.x,
			metaroom.y + favicon.y
		));
		contents.push("    tick 10".to_string());
		contents.push(format!("    cmrp {} {} 0",
			metaroom.x + favicon.x,
			metaroom.y + favicon.y
		));
		contents.push("".to_string());
	} else {
		contents.push("*Move camera to metaroom".to_string());
		contents.push(format!("cmrp {} {} 0",
			metaroom.x + metaroom.width / 2,
			metaroom.y + metaroom.height / 2
		));
		contents.push("".to_string());
	}

	contents.push("*Removal script".to_string());

	contents.push("    rscr".to_string());
	contents.push("".to_string());

	contents.push("    *Get metaroom ID".to_string());
	contents.push(format!("    setv va00 gmap {} {}",
		metaroom.x + metaroom.width / 2,
		metaroom.y + metaroom.height / 2
	));
	contents.push("".to_string());

	contents.push("    inst".to_string());
	contents.push("".to_string());

	contents.push("    *Move camera out of metaroom".to_string());
	contents.push("    cmra 281 8736 0".to_string());
	contents.push("".to_string());

	contents.push("    *Delete all agents in the metaroom".to_string());
	contents.push("    enum 0 0 0".to_string());
	contents.push("        doif room targ ne -1".to_string());
	contents.push("            doif gmap posx posy eq va00".to_string());
	contents.push("                kill targ".to_string());
	contents.push("            endi".to_string());
	contents.push("        endi".to_string());
	contents.push("    next".to_string());
	contents.push("".to_string());

	if !metaroom.rooms.is_empty() {
		contents.push("    *Delete links".to_string());
		for link in &metaroom.links {
			if let Some(room1) = metaroom.rooms.get(link.room1_id as usize) {
				if let Some(room2) = metaroom.rooms.get(link.room2_id as usize) {
					let room1_center = room1.center();
					let room2_center = room2.center();
					contents.push(format!("    link grap {} {} grap {} {} 0",
						metaroom.x + room1_center.x as u32,
						metaroom.y + room1_center.y as u32,
						metaroom.x + room2_center.x as u32,
						metaroom.y + room2_center.y as u32
					));
				}
			}
		}
		contents.push("".to_string());
	}

	if !metaroom.rooms.is_empty() {
		contents.push("    *Delete rooms".to_string());
		for room in &metaroom.rooms {
			let room_center = room.center();
			contents.push(format!("    delr grap {} {}",
				metaroom.x + room_center.x as u32,
				metaroom.y + room_center.y as u32
			));
		}
		contents.push("".to_string());
	}

	contents.push("    *Delete metaroom".to_string());
	contents.push("    delm va00".to_string());
	contents.push("".to_string());

	contents.push("    slow".to_string());
	contents.push("".to_string());

	if let Some(favicon) = &metaroom.favicon {
		contents.push("    *Delete favicon".to_string());
		contents.push(format!("    rtar 1 4 {}", favicon.species));
		contents.push("    setv va00 ov50".to_string());
		contents.push("    kill targ".to_string());
		contents.push("    subv game \"ds_favourites\" 1".to_string());
		contents.push("    enum 1 4 0".to_string());
		contents.push("        doif ov50 gt va00".to_string());
		contents.push("            subv ov50 1".to_string());
		contents.push("            tick 1".to_string());
		contents.push("        endi".to_string());
		contents.push("    next".to_string());
		contents.push("".to_string());
	}

	contents.push("***ROOMIE_END***".to_string());

	contents.join("\r\n")
}
