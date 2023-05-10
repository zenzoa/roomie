class Theme {
	static load(themeName) {
		Tauri.fs.readTextFile(`themes/${themeName}.json`, { dir: Tauri.fs.BaseDirectory.AppConfig })
		.then((contents) => {
			try {
				const theme = JSON.parse(contents)
				const style = document.documentElement.style
				for (const key in theme) {
					if (theme[key]) {
						style.setProperty(`--${key}`, theme[key])
					}
				}
			} catch (why) {
				console.error(why)
			}
		})
		.catch((_) => {
			this.saveDefaults()
		})
	}

	static saveDefaults() {
		this.save(THEME_DARK, 'dark')
		this.save(THEME_LIGHT, 'light')
		this.save(THEME_EEMFOO, 'eemfoo')
	}

	static save(theme, themeName) {
		const path = `themes/${themeName}.json`
		const dir = Tauri.fs.BaseDirectory.AppConfig
		const contents = JSON.stringify(theme)

		Tauri.fs.exists(path, { dir })
		.then((exists) => {
			if (exists) {
				Tauri.fs.writeTextFile({ path, contents }, { dir })
				.then(() => {})
				.catch((why) => console.error(why))

			} else {
				Tauri.fs.createDir('themes', { dir, recursive: true })
				.then(() => {
					Tauri.fs.writeTextFile({ path, contents }, { dir })
					.then(() => {})
					.catch((why) => console.error(why))
				})
				.catch((why) => console.error(why))
			}
		})
	}
}

THEME_DARK = {
	"menubar-bg": "#292929",
	"sidebar-bg": "#303030",

	"divider-color": "#444444",

	"button-bg": "#464646",
	"button-hover-bg": "#595959",
	"button-hover-bg2": "#636363",
	"button-shadow": "#222222",
	"button-active-shadow": "#444444",

	"input-bg": "#595959",
	"input-disabled-bg": "#434343",
	"input-shadow": "#494949",

	"focus-outline": "#939393",

	"text-color": "#ffffff",
	"icon-filter": "invert(1)",

	"overlay-bg": "rgba(0, 0, 0, 0.8)",
	"overlay-border": "rgba(255, 255, 255, 0.2)",
	"overlay-text-color": "#dddddd",

	"warning-bg": "rgba(255, 119, 0, 0.26)"
}

THEME_LIGHT = {
	"menubar-bg": "#b0b0b0",
	"sidebar-bg": "#d7d7d7",

	"divider-color": "#9d9d9d",

	"button-bg": "#c3c3c3",
	"button-hover-bg": "#b0b0b0",
	"button-hover-bg2": "#9d9d9d",
	"button-shadow": "#8b8b8b",
	"button-active-shadow": "#797979",

	"input-bg": "#f3f3f3",
	"input-disabled-bg": "#e0e0e0",
	"input-shadow": "#e0e0e0",

	"focus-outline": "#9d9d9d",

	"text-color": "#222222",
	"icon-filter": "invert(0.2)",

	"overlay-bg": "rgba(255, 255, 255, 0.67)",
	"overlay-border": "rgba(0, 0, 0, 0.33)",
	"overlay-text-color": "#222222",

	"warning-bg": "rgba(255, 119, 0, 0.33)"
}

THEME_EEMFOO = {
	"menubar-bg": "#201E35",
	"sidebar-bg": "#2A2744",

	"divider-color": "#3F3A63",

	"button-bg": "#3F3A63",
	"button-hover-bg": "#504c72",
	"button-hover-bg2": "#615e81",
	"button-shadow": "#201E35",
	"button-active-shadow": "#353155",

	"input-bg": "#4B4572",
	"input-disabled-bg": "#3F3A63",
	"input-shadow": "#3F3A63",

	"focus-outline": "#737190",

	"text-color": "#eaeaef",
	"icon-filter": "invert(1)",

	"overlay-bg": "rgba(18, 16, 33, 0.8)",
	"overlay-border": "rgba(255, 255, 255, 0.2)",
	"overlay-text-color": "#d5d4df",

	"warning-bg": "rgba(255, 119, 0, 0.26)"
}
