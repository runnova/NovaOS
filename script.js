var batteryLevel, winds = {}, memory = {}, _nowapp, fulsapp = false, appsHistory = [], nowwindow, appicns = {}, fileslist = [], badlaunch = false, initmenuload = true, fileTypeAssociations = {}, handlers = {}, Gtodo, notifLog = {}, initialization = false, onstartup = [], novaFeaturedImage = `Dev.png`, defAppsList = [
	"store",
	"files",
	"settings",
	"calculator",
	"text",
	"musicplr",
	"camera",
	"time",
	"gallery",
	"browser",
	"studio"
], timeFormat, timetypecondition = true, genTaskBar, genDesktop, nonotif;

let currentImage = 1;
function setbgimagetourl(x) {
	const img1 = document.getElementById('bgimage1');
	const img2 = document.getElementById('bgimage2');
	if (!img1 || !img2) return;

	const activeImg = currentImage === 1 ? img1 : img2;
	const nextImg = currentImage === 1 ? img2 : img1;

	nextImg.style.opacity = 0;

	const setImageSrc = (url) => {
		nextImg.src = url;
		nextImg.onload = async () => {
			nextImg.style.opacity = 1;
			activeImg.style.opacity = 0;
			activeImg.classList.remove('current-bg');
			nextImg.classList.add('current-bg');
			currentImage = currentImage === 1 ? 2 : 1;

			const wallpos = await getSetting("wallpaperPos") || "center";
			document.getElementsByClassName("current-bg")[0].style.objectPosition = wallpos;
			const wallsiz = await getSetting("wallpaperSiz") || "cover";
			document.getElementsByClassName("current-bg")[0].style.objectFit = wallsiz;
		};
	};

	if (x.startsWith('data:')) {
		try {
			const byteString = atob(x.split(',')[1]);
			const mimeString = x.split(',')[0].split(':')[1].split(';')[0];
			const arrayBuffer = new Uint8Array(byteString.length);

			for (let i = 0; i < byteString.length; i++) {
				arrayBuffer[i] = byteString.charCodeAt(i);
			}

			const blob = new Blob([arrayBuffer], { type: mimeString });
			const blobUrl = URL.createObjectURL(blob);

			setImageSrc(blobUrl);
			setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
		} catch (e) {
			console.error("Failed to decode base64 string:", e);
		}
	} else {
		setImageSrc(x);
	}

	(async () => {
	})();
}

Object.defineProperty(window, 'nowapp', {
	get() {
		return _nowapp;
	},
	set(value) {
		_nowapp = value;
	}
});

function loginscreenbackbtn() {
	document.getElementsByClassName("backbtnscont")[0].style.display = "none";
	document.getElementsByClassName("userselect")[0].style.flex = "1";
	document.getElementsByClassName("logincard")[0].style.flex = "0";
}

async function showloginmod() {
	if (badlaunch) { return }
	var imgprvtmp = gid("wallbgpreview");
	imgprvtmp.src = novaFeaturedImage;
	imgprvtmp.onload = function handler() {
		imgprvtmp.onload = null;

		imgprvtmp.decode().then(() => {
			closeElementedis();
		}).catch(() => {
			closeElementedis();
		});
	};

	document.getElementsByClassName("backbtnscont")[0].style.display = "none";
	function createUserDivs(users) {
		const usersChooser = document.getElementById('userschooser');
		usersChooser.innerHTML = '';
		users.forEach(async (cacusername) => {
			const userDiv = document.createElement('div');
			userDiv.className = 'user';
			userDiv.tabIndex = 0;
			const selectUser = async function () {
				try {
					await cleanupram();
					CurrentUsername = cacusername;
					let isdefaultpass = false;
					try {
						isdefaultpass = await checkPassword('nova');
					} catch (err) {
						console.error("Password check failed:", err);
					}
					if (isdefaultpass) {
						gid('loginmod').close();
						gid('edison').showModal();
						startup();
					} else {
						console.log("Password check failed: ", isdefaultpass);
						document.getElementsByClassName("backbtnscont")[0].style.display = "flex";
						document.getElementsByClassName("userselect")[0].style.flex = "0";
						document.getElementsByClassName("logincard")[0].style.flex = "1";
						gid("loginform1").focus();
						gid('loginmod').showModal()
					}
				} catch (err) { }
			};

			userDiv.onclick = selectUser;
			userDiv.addEventListener("keydown", function (event) {
				if (event.key === "Enter") {
					selectUser();
				}
			});
			const img = document.createElement('img');
			img.className = 'icon';
			sharedStore.get(cacusername, "icon").then((icon) => { img.src = icon });
			const nameDiv = document.createElement('div');
			nameDiv.className = 'name';
			nameDiv.textContent = cacusername;
			userDiv.appendChild(img);
			userDiv.appendChild(nameDiv);
			usersChooser.appendChild(userDiv);
		});
	}
	let users = await sharedStore.getAllUsers();
	createUserDivs(users);
	if (users.length > 0) {
		document.querySelector('.user').focus();
	}
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	document.getElementById('loginusselctime').textContent = `${hours}:${minutes}`;
	gid('loginmod').showModal();
	gid('loginform1').addEventListener("keydown", async function (event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			await checkifpassright();
		}
	});
}
function setsrtpprgbr(val) {
	let progressBar = document.getElementById('progress-bar');
	let width = val;
	progressBar.style.width = width + '%';
}

async function loadFileTypeAssociations() {
	const associations = await getSetting('fileTypeAssociations');
	fileTypeAssociations = associations || {};
	const associations2 = await getSetting('handlers');
	handlers = associations2 || {};

	cleanupInvalidAssociations();
}

function closeElementedis(element) {
	if (!element) {
		element = document.getElementById("edison");
	}
	element.classList.add("closeEffect");
	setTimeout(function () {
		element.close()
		element.classList.remove("closeEffect");
	}, 200);
}

async function startup() {
	gid("edison").showModal();
	gid('loginmod').close();
	if (badlaunch) { return }
	lethalpasswordtimes = false;
	setsrtpprgbr(50);
	const start = performance.now();

	updateNavSize();

	await updateMemoryData().then(async () => {
		try {
			setsrtpprgbr(70);
			try {
				qsetsRefresh()
				timetypecondition = await getSetting("timefrmt") == '24 Hour' ? false : true;
			} catch { }
			gid('startupterms').innerHTML = "Initializing...";
			updateTime();
			setsrtpprgbr(80);
			await checkdmode();
			setsrtpprgbr(90);
			await genTaskBar();
			setsrtpprgbr(100);
			gid('startupterms').innerHTML = "Startup completed";
			await genDesktop();
			closeElementedis();

			let fetchupdatedataver;
			async function fetchDataAndUpdate() {
				let fetchupdatedata = await fetch("versions.json");
				if (fetchupdatedata.ok) {
					let fetchupdatedataver = await fetchupdatedata.json();
					let lclver = await getSetting("versions", "defaultApps.json") || {};
					let howmany = 0;
					for (let item of Object.keys(fetchupdatedataver)) {
						let local = lclver[item] || 6754999;
						if (local && fetchupdatedataver[item] != local) {
							initialization = 1;
							await updateApp(item);
							initialization = 0;
							howmany++;
							lclver[item] = fetchupdatedataver[item];
						}
					}
					await setSetting("versions", lclver, "defaultApps.json")
					if (howmany) toast(howmany + " default app(s) have been updated")
				} else {
					console.error("Failed to fetch data from the server.");
				}
			}

			let shouldcheckupd = await getSetting("nvaupdcheck");
			if (shouldcheckupd) await fetchDataAndUpdate();
			removeInvalidMagicStrings();
			function startUpdateTime() {
				let now = new Date();
				let delay = (60 - now.getSeconds()) * 1000;
				setTimeout(function () {
					updateTime();
					setInterval(updateTime, 60000);
				}, delay);
			}
			startUpdateTime();
			await loadFileTypeAssociations();
			await ensureAllSettingsFilesExist();
			await loadSessionSettings();
			const end = performance.now();

			rllog(
				`You are using \n\n%cNovaOS%c\n%cNovaOS is the web system made for you.%c\n\nStartup: ${(end - start).toFixed(2)}ms\nUsername: ${CurrentUsername}\n12hr Time format: ${timetypecondition}`,
				'color: white; background-color: #101010; font-size: 2rem; padding: 0.7rem 1rem; border-radius: 1rem;',
				'',
				'padding:5px 0; padding-top:1rem;',
				'color: lightgreen; font-size:70%;'
			);

			try {

				console.log("889")
				function runScriptsSequentially(scripts, delay) {
					scripts.forEach((script, index) => {
						setTimeout(script, index * delay);
					});
				}
				runScriptsSequentially(onstartup, 1000)

				// onstartup apps
				let allOnstarts = await getSetting('RunOnStartup');
				allOnstarts.forEach(item => {
					openapp(0, item, {}, 1);
				})
			} catch (e) { }
		} catch (err) { console.error("startup error:", err); }
	})
}

function updateTime() {
	const now = new Date();
	let hours = now.getHours();
	if (timetypecondition) {
		// 12-hour format
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = (hours % 12) || 12;
		timeFormat = `${hours}:${now.getMinutes().toString().padStart(2, '0')} ${ampm}`;
	} else {
		// 24-hour format
		timeFormat = `${hours.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
	}
	const date = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
	gid('time-display').innerText = timeFormat;
	gid('date-display').innerText = date;
}
const jsonToDataURI = json => `data:application/json,${encodeURIComponent(JSON.stringify(json))}`;
async function openn() {
	gid("strtsear").value = "";
	gid("strtappsugs").style.display = "none";
	let x = await getFileNamesByFolder("Apps/");
	x.sort((a, b) => a.name.localeCompare(b.name));

	if (x.length === 0 && initmenuload) {
		initmenuload = false;
		gid("appdmod").close();
		let choicetoreinst = await justConfirm(
			`Re-initialize OS?`,
			`Did the OS initialization fail? If yes, we can re-initialize your OS and install all the default apps. \n\nNovaOS did not find any apps while the initial load of Nova Menu. \n\nRe-initializing your OS may delete your data.`
		);
		if (choicetoreinst) {
			initializeOS();
		}
		return;
	}

	initmenuload = false;

	let existingAppElements = [...gid("appsindeck").children];
	let existingAppIds = new Set(existingAppElements.map((child) => child.dataset.appId));
	let newAppIds = new Set(x.map((app) => app.id));

	existingAppElements.forEach((element) => {
		if (!newAppIds.has(element.dataset.appId)) {
			element.remove();
		}
	});

	Promise.all(
		x.map(async (app) => {
			if (existingAppIds.has(app.id)) return;

			var appShortcutDiv = document.createElement("div");
			appShortcutDiv.className = "app-shortcut ctxAvail tooltip sizableuielement";
			appShortcutDiv.setAttribute("unid", app.id || '');
			appShortcutDiv.dataset.appId = app.id;
			appShortcutDiv.addEventListener("click", () => openfile(app.id));

			var iconSpan = document.createElement("span");
			iconSpan.classList.add("appicnspan");
			iconSpan.innerHTML = "<span class='taskbarloader'></span>";
			getAppIcon(false, app.id).then((appIcon) => {
				iconSpan.innerHTML = appIcon;
				insertSVG(appIcon, iconSpan);
			});

			function getapnme(x) {
				return x.split(".")[0];
			}

			var nameSpan = document.createElement("span");
			nameSpan.className = "appname";
			nameSpan.textContent = getapnme(app.name);

			appShortcutDiv.appendChild(iconSpan);
			appShortcutDiv.appendChild(nameSpan);

			gid("appsindeck").appendChild(appShortcutDiv);
		})
	)
		.then(() => { })
		.catch((error) => {
			console.error("An error occurred:", error);
		});

	if (gid("closeallwinsbtn").checked) {
		gid("closeallwinsbtn").checked = false;
	}

	if (!Object.keys(winds).length) {
		gid("closeallwinsbtn").checked = true;
		gid("closeallwinsbtn").setAttribute("disabled", true);
	} else {
		gid("closeallwinsbtn").setAttribute("disabled", false);
	}

	gid("appdmod").showModal();
}
async function loadrecentapps() {
	gid("serrecentapps").innerHTML = ``
	if (appsHistory.length < 1) {
		gid("partrecentapps").style.display = "none";
		gid("serrecentapps").innerHTML = `No recent apps`
		return;
	} else {
		gid("partrecentapps").style.display = "block";
	}
	let x = await getFileNamesByFolder("Apps");
	x.reverse();
	Promise.all(x.map(async (app) => {
		if (!appsHistory.includes(app.name)) {
			return
		}
		var appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut ctxAvail sizableuielement";
		appShortcutDiv.setAttribute("unid", app.id || '');
		appShortcutDiv.addEventListener("click", () => openapp(app.name, app.id));
		var iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		if (!appicns[app.id]) {
			const content = await getFileById(app.id);
			const unshrunkContent = decodeBase64Content(content.content);
			const tempElement = document.createElement('div');
			tempElement.innerHTML = unshrunkContent;
			const metaTags = tempElement.getElementsByTagName('meta');
			let metaTagData = null;
			Array.from(metaTags).forEach(tag => {
				const tagName = tag.getAttribute('name');
				const tagContent = tag.getAttribute('content');
				if (tagName === 'nova-icon' && tagContent) {
					metaTagData = tagContent;
				}
			});
			if (typeof metaTagData === "string") {
				if (containsSmallSVGElement(metaTagData)) {
					iconSpan.innerHTML = metaTagData;
				} else {
					iconSpan.innerHTML = defaultAppIcon;
				}
			} else {
				iconSpan.innerHTML = defaultAppIcon;
			}
			appicns[app.id] = iconSpan.innerHTML
		} else {
			iconSpan.innerHTML = appicns[app.id]
		}
		var nameSpan = document.createElement("span");
		nameSpan.className = "appname";
		nameSpan.textContent = basename(app.name);

		appShortcutDiv.appendChild(iconSpan);
		appShortcutDiv.appendChild(nameSpan);
		gid("serrecentapps").appendChild(appShortcutDiv);
	})).then(async () => {

		gid("novamenusearchinp").focus();
	}).catch((error) => {
		console.error('An error occurred:', error);
	});

}

function makedefic(str) {
	if (!str) {
		return 'app';
	}
	const words = str.split(/\s+/);
	const result = words.map(word => {
		const consonantPattern = /[^aeiouAEIOU\s]+/g;
		const consonantMatches = word.match(consonantPattern);
		if (consonantMatches && consonantMatches.length >= 2) {
			return consonantMatches.slice(0, 2).map((letter, index) => index === 0 ? letter : letter.toLowerCase()).join('');
		} else {
			const firstLetter = word.charAt(0);
			const firstConsonantIndex = word.search(consonantPattern);
			if (firstConsonantIndex !== -1) {
				return firstLetter + word.charAt(firstConsonantIndex).toLowerCase();
			}
			return firstLetter;
		}
	});
	return result.join('').slice(0, 3);
} function updateBattery() {
	var batteryPromise;
	if ('getBattery' in navigator) {
		batteryPromise = navigator.getBattery();
	} else if ('battery' in navigator) {
		batteryPromise = Promise.resolve(navigator.battery);
	} else {
		document.getElementById("batterydisdiv").style.display = "none";
		return;
	}
	batteryPromise.then(function (battery) {
		if (typeof battery.level !== 'number' || isNaN(battery.level)) {
			document.getElementById("batterydisdiv").style.display = "none";
			return;
		}
		var batteryLevel = Math.round(battery.level * 100);
		var isCharging = !!battery.charging;
		if ((batteryLevel === 100 && isCharging) || (batteryLevel === 0 && isCharging)) {
			document.getElementById("batterydisdiv").style.display = "none";
		} else {
			document.getElementById("batterydisdiv").style.display = "flex";
		}
		let iconClass;
		if (batteryLevel >= 75) {
			iconClass = 'battery_full';
		} else if (batteryLevel >= 25) {
			iconClass = 'battery_5_bar';
		} else if (batteryLevel >= 15) {
			iconClass = 'battery_2_bar';
		} else {
			iconClass = 'battery_alert';
		}
		var batteryDisplayElement = document.getElementById('battery-display');
		var batteryPDisplayElement = document.getElementById('battery-p-display');
		if (batteryDisplayElement && batteryPDisplayElement) {
			if (iconClass !== batteryDisplayElement.innerText || batteryPDisplayElement.innerText !== batteryLevel + "%") {
				batteryDisplayElement.innerHTML = iconClass;
				batteryPDisplayElement.innerHTML = batteryLevel + "%";
			}
		}
	}).catch(function () {
		document.getElementById("batterydisdiv").style.display = "none";
	});
}

function clwin(x) {
	snappingconthide();
	const el = isElement(x) ? x : document.getElementById(x.startsWith("window") ? x : "window" + x);
	const windKey = isElement(x) ? el.getAttribute("data-winuid") : x;
	if (windKey) {
		console.log(windKey)
		URL.revokeObjectURL(winds[windKey].src)
		delete winds[windKey];
	}
	loadtaskspanel()
	if (!el) return;

	el.classList.add("transp3");
	setTimeout(() => {
		el.classList.remove("transp3");
		el.remove();
	}, 700);
}

function getMetaTagContent(unshrunkContent, metaName, decode = false) {
	const content = decode ? decodeBase64Content(unshrunkContent) : unshrunkContent;
	const tempElement = document.createElement('div');
	tempElement.innerHTML = content;
	const metaTag = Array.from(tempElement.getElementsByTagName('meta')).find(tag =>
		tag.getAttribute('name') === metaName && tag.getAttribute('content')
	);
	return metaTag ? metaTag.getAttribute('content') : null;
}
function getAppTheme(unshrunkContent) {
	return getMetaTagContent(unshrunkContent, 'theme-color', true);
}
function getAppAspectRatio(unshrunkContent) {
	const content = decodeBase64Content(unshrunkContent);
	return content.includes("aspect-ratio") ? getMetaTagContent(content, 'aspect-ratio', false) : null;
}
async function getAppIcon(content, id, lazy = 0) {
	try {
		if (content, id == undefined) {
			if (content == 'folder')
				return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--col-txt1)"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h360q17 0 28.5 11.5T880-680q0 17-11.5 28.5T840-640H447l-80-80H160v480l79-263q8-26 29.5-41.5T316-560h516q41 0 64.5 32.5T909-457l-72 240q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm-84-262v-218 218Zm84 262 72-240-72 240Z"/></svg>`;

			return defaultAppIcon;
		} else if (id == "info") {
			return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--col-txt1)"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`
		}
		const withTimeout = (promise) =>
			Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(), 3000))]);

		const getAppIconFromRegistry = async (id, registry) => {
			if (registry && registry.icon) {
				appicns = registry.icon;
				return appicns;
			}
			return null;
		};

		const saveIconToRegistry = async (id, iconContent, registry) => {
			const updatedRegistry = {
				...(registry || {}),
				icon: iconContent
			};
			await setSetting(id, updatedRegistry, "AppRegistry.json");
		};

		try {
			if (appicns[id]) return appicns[id];
			if (lazy) return defaultAppIcon;

			const registry = await getSetting(id, "AppRegistry.json") || {};
			const cachedIcon = await getAppIconFromRegistry(id, registry);
			if (cachedIcon) return cachedIcon;

			if (!content) {
				const file = await withTimeout(await getFileById(id));
				if (!file || !file.content) throw new Error("File content unavailable " + id);
				content = file.content;
			}
			const iconContent = await withTimeout(getMetaTagContent(content, 'nova-icon', true));
			if (iconContent && containsSmallSVGElement(iconContent)) {
				appicns[id] = iconContent;
				await saveIconToRegistry(id, iconContent, registry);
				return iconContent;
			}
		} catch (err) {
			console.error("Error in getAppIcon:", err);
		}

	} catch (e) { }

	const fallbackIcon = generateFallbackIcon(id);
	appicns[id] = fallbackIcon;

	return fallbackIcon;
}

async function generateFallbackIcon(id) {
	const icondatatodo = await getFileNameByID(id) || id;
	return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="115.24806" height="130.92446" viewBox="0,0,115.24806,130.92446"><g transform="translate(-182.39149,-114.49081)"><g stroke="none" stroke-miterlimit="10"><path d="M182.39149,245.41527v-130.83054h70.53005l44.68697,44.95618v85.87436z" fill="` + stringToPastelColor(icondatatodo) + `" stroke-width="none"/><path d="M252.60365,158.84688v-44.35607l45.03589,44.35607z" style="opacity: 0.7" fill="#dadada" stroke-width="0"/><text transform="translate(189,229) scale(0.9,0.9)" font-size="3rem" xml:space="preserve" fill="#dadada" style="opacity: 0.7" stroke-width="1" font-family="monospace" font-weight="normal" text-anchor="start"><tspan x="0" dy="0" fill="black">${makedefic(icondatatodo)}</tspan></text></g></g></svg>`;
}

async function applyIconPack(iconPack) {
	try {
		for (const namespace in handlers) {
			const appID = handlers[namespace];
			const iconSVG = iconPack[namespace];

			if (!iconSVG) continue;
			try {
				const appicn = await getSetting(appID, "AppRegistry.json") || {};

				appicn["icon"] = iconSVG;

				await setSetting(appID, appicn, "AppRegistry.json");
				console.log(`Icon set for app ${appID} from namespace ${namespace}`);
			} catch (err) {
				console.error(`Failed to set icon for app ${appID}`, err);
			}
		}
	} catch (err) {
		console.error("Failed to apply icon pack", err);
	}
	appicns = {};
	gid("appsindeck").innerHTML = "";
	genTaskBar();
	genDesktop();
}

async function fetchData(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) {
		console.error("Error fetching data:", error.message);
		const data = null;
		return data;
	}
}
var content;
function putwinontop(x) {
	Object.keys(winds).forEach(wid => {
		if (gid(`window${wid}`).style.zIndex)
			winds[wid].zIndex = Number(gid(`window${wid}`).style.zIndex || 0);
		else
			return;
	});

	if (Object.keys(winds).length > 1) {
		const windValues = Object.values(winds).map(wind => Number(wind.zIndex) || 0);
		const maxWindValue = Math.max(...windValues);
		document.getElementById(x).style.zIndex = maxWindValue + 1;
		normalizeZIndexes(x);
	} else {
		document.getElementById(x).style.zIndex = 0;
	}
	if (typeof updateFocusedWindowBorder === "function") updateFocusedWindowBorder();
}
function isWinOnTop(x) {
	const ourKey = x.replace(/^window/, '');
	const maxKey = Object.keys(winds).reduce((a, b) => (Number(winds[a].zIndex) > Number(winds[b].zIndex) ? a : b));

	return ourKey === maxKey;
}

function normalizeZIndexes(excludeWindowId = null) {
	const windValues = Object.entries(winds)
		.filter(([key]) => key !== excludeWindowId)
		.map(([_, wind]) => Number(wind.zIndex) || 0);

	const uniqueSorted = [...new Set(windValues)].sort((a, b) => a - b);
	if (uniqueSorted.length === uniqueSorted[uniqueSorted.length - 1]) return;

	const zIndexMap = uniqueSorted.reduce((map, value, index) => {
		map[value] = index;
		return map;
	}, {});

	winds = Object.keys(winds).reduce((normalizedWinds, key) => {
		normalizedWinds[key] = {
			...winds[key],
			zIndex: key === excludeWindowId
				? winds[key].zIndex
				: zIndexMap[Number(winds[key].zIndex) || 0],
		};
		return normalizedWinds;
	}, {});
}

function requestLocalFile() {
	var requestID = genUID()
	x = {
		"appname": "files",
		"type": "open",
		"identifier": requestID
	}
	localStorage.setItem("todo", JSON.stringify(x))
	openapp("files", 1)
}
function getMaxZIndex() {
	const elements = document.querySelectorAll('.window');
	let maxZIndex = 0;
	elements.forEach(element => {
		const zIndex = parseInt(window.getComputedStyle(element).zIndex);
		if (zIndex > maxZIndex) {
			maxZIndex = zIndex;
		}
	});
}
function folderExists(folderName) {
	const parts = folderName.replace(/\/$/, '').split('/');
	let current = memory.root;
	for (let part of parts) {
		part += '/';
		if (!current[part]) {
			return false;
		}
		current = current[part];
	}
	return true;
}
function isBase64(str) {
	try {
		function validateBase64(data) {
			const base64Pattern = /^[A-Za-z0-9+/=]+$/;
			if (!base64Pattern.test(data)) {
				return false;
			}
			const padding = data.length % 4;
			if (padding > 0) {
				data += '='.repeat(4 - padding);
			}
			atob(data);
			return true;
		}
		if (validateBase64(str)) {
			return true;
		}
		const base64Prefix = 'data:';
		const base64Delimiter = ';base64,';
		if (str.startsWith(base64Prefix)) {
			const delimiterIndex = str.indexOf(base64Delimiter);
			if (delimiterIndex !== -1) {
				const base64Data = str.substring(delimiterIndex + base64Delimiter.length);
				return validateBase64(base64Data);
			}
		}
		return false;
	} catch (err) {
		return false;
	}
}
async function extractAndRegisterCapabilities(appId, content) {
	try {
		if (!content) {
			content = await getFileById(appId);
			content = content.content;
		}
		if (isBase64(content)) {
			content = decodeBase64Content(content);
		}
		let parser = new DOMParser();
		let doc = parser.parseFromString(content, "text/html");

		let metaTag = doc.querySelector('meta[name="capabilities"]');
		let capabilities = [];
		if (metaTag) {
			capabilities = metaTag.getAttribute("content").split(',').map(s => s.trim());
		} else {
			console.log(`No capabilities: ${appId}`);
		}
		let onlyDefPerms = false;
		let totalperms = ['utility', 'sysUI'];
		let metaTag2 = doc.querySelector('meta[name="permissions"]');
		let requestedperms = [];
		if (metaTag2) {
			requestedperms = metaTag2.getAttribute("content").split(',').map(s => s.trim());
		} else {
			console.log(`No permissions: ${appId}`);
			onlyDefPerms = true
		}

		function arraysEqualIgnoreOrder(arr1, arr2) {
			if (arr1.length !== arr2.length) return false;
			let sorted1 = [...arr1].sort();
			let sorted2 = [...arr2].sort();
			for (let i = 0; i < sorted1.length; i++) {
				if (sorted1[i] !== sorted2[i]) return false;
			}
			return true;
		}

		onlyDefPerms = (onlyDefPerms) ? true : arraysEqualIgnoreOrder(requestedperms, totalperms);
		if (onlyDefPerms) {
			console.log("only def perms");
		}

		let permissions = Array.from(new Set([...totalperms, ...requestedperms]));

		if (!onlyDefPerms) {
			let modal = gid("AppInstDia");
			gid("app_inst_dia_icon").innerHTML = await getAppIcon(0, appId);
			gid("app_inst_mod_app_name").innerText = await getFileNameByID(appId);
			let listelement = gid("app_inst_mod_li");
			listelement.innerHTML = '';
			if (capabilities.length > 0) {
				let handlerList = capabilities.filter(c => !c.startsWith('.') && c !== 'onStartup').join(', ');
				if (handlerList) {
					let span = document.createElement("li");
					span.innerHTML = `Function as ${handlerList}`;
					listelement.appendChild(span);
				}

				let fileTypes = capabilities.filter(c => c.startsWith('.')).join(', ');
				if (fileTypes) {
					let span = document.createElement("li");
					span.innerHTML = `Open ${fileTypes} by default`;
					listelement.appendChild(span);
				}

				if (capabilities.includes('onStartup')) {
					let span = document.createElement("li");
					span.innerHTML = "Run during startup";
					listelement.appendChild(span);
				}
			}

			permissions.sort((a, b) => getNamespaceRisk(b) - getNamespaceRisk(a));

			if (permissions.includes("unsandboxed")) {
				let span = document.createElement("li");
				span.innerHTML = describeNamespaces("unsandboxed").replace(/^./, c => c.toUpperCase());
				span.innerHTML += `<small>Only recommended for apps you trust.</small>`;
				listelement.appendChild(span);
			} else {
				permissions.forEach((perm) => {
					let span = document.createElement("li");
					span.innerHTML = describeNamespaces(perm).replace(/^./, c => c.toUpperCase());
					listelement.appendChild(span);
				});
			}

			let yesButton = gid("app_inst_mod_agbtn");
			let noButton = gid("app_inst_mod_nobtn");

			let condition = await new Promise((resolve) => {
				if (initialization) {
					resolve(true);
				} else {
					modal.showModal();
				}
				yesButton.onclick = () => {
					modal.close();
					resolve(true);
				};
				noButton.onclick = () => {
					modal.close();
					resolve(false);
				};
			});

			if (!condition) return;
		}

		requestedperms.forEach((perm) => {
			if (!totalperms.includes(perm)) {
				totalperms.push(perm);
			}
		});
		await registerApp(appId, capabilities);

		let registry = {};
		registry.perms = totalperms;
		await setSetting(appId, registry, "AppRegistry.json");

	} catch (error) {
		console.error("Error extracting and registering capabilities:", error);
	}
}
async function registerApp(appId, capabilities) {
	for (let rawCapability of capabilities) {
		let capability = rawCapability.trim();
		if (capability === 'onStartup') continue;
		if (capability.startsWith('.')) {
			fileTypeAssociations[capability] = [appId];
		} else {
			handlers[capability] = appId;
		}
	}
	await setSetting('fileTypeAssociations', fileTypeAssociations);
	await setSetting('handlers', handlers);

	if (capabilities.includes('onStartup')) {
		let startupApps = await getSetting('RunOnStartup') || [];
		if (!startupApps.includes(appId)) startupApps.push(appId);
		await setSetting('RunOnStartup', startupApps);
	}

	if (!initialization)
		notify(await getFileNameByID(appId) + " installed", "Registered " + capabilities.toString(), "NovaOS System");
	return capabilities.toString();
}

async function cleanupInvalidAssociations() {
	const validAppIds = await getAllValidAppIds();
	let associationsChanged = false;

	for (let fileType in fileTypeAssociations) {
		const appId = fileTypeAssociations[fileType][0];
		if (!validAppIds.includes(appId)) {
			console.log(`Removing invalid file type association: ${fileType} for app ID ${appId}`);
			delete fileTypeAssociations[fileType];
			associationsChanged = true;
		}
	}

	if (associationsChanged) {
		await setSetting('fileTypeAssociations', fileTypeAssociations);
	}

	let registry = await getSetting('full', "AppRegistry.json");

	for (let key in registry) {
		if (!await window.parent.getFileNameByID(key)) {
			window.parent.remSettingKey(key, "AppRegistry.json")
			continue;
		}
	}
}

async function getAllValidAppIds() {
	const appsFolder = await getFileNamesByFolder('Apps/');
	return Object.keys(appsFolder || {}).map(appFileName => appsFolder[appFileName].id);
}
function makedialogclosable(ok) {
	const myDialog = gid(ok);

	if (!myDialog.__originalClose) {
		myDialog.__originalClose = myDialog.close;
		myDialog.close = function () {
			console.log(342, ok)
			this.classList.add("closeEffect");

			function handler() {
				myDialog.__originalClose();
				myDialog.classList.remove("closeEffect");
			};
			setTimeout(handler, 200);
		};
	}

	document.addEventListener('click', (event) => {
		if (event.target === myDialog) {
			myDialog.close();
		}
	});
}
function openModal(type, { title = '', message, options = null, status = null, preset = '' } = {}, registerRef = false) {
	if (badlaunch) { return }
	return new Promise((resolve) => {
		const modal = document.createElement('dialog');
		modal.classList.add('modal');

		const modalItemsCont = document.createElement('div');
		modalItemsCont.classList.add('modal-items');

		const icon = document.createElement('span');
		icon.classList.add('material-symbols-rounded');
		let ic = "warning";
		if (status === "success") ic = "check_circle";
		else if (status === "failed") ic = "dangerous";
		icon.textContent = ic;
		icon.classList.add('modal-icon');
		modalItemsCont.appendChild(icon);

		if (title && title.length > 0) {

			const h1 = document.createElement('h1');
			h1.textContent = title;
			modalItemsCont.appendChild(h1);
		}

		const p = document.createElement('p');
		if (type === 'say' || type === 'confirm') {
			p.innerHTML = `${message}`;
		} else {
			p.textContent = message;
		}
		modalItemsCont.appendChild(p);

		let dropdown = null;
		if (type === 'dropdown') {
			dropdown = document.createElement('select');
			let items = Array.isArray(options) ? options : Object.values(options);
			for (const option of items) {
				const opt = document.createElement('option');
				opt.value = option;
				opt.textContent = option;
				dropdown.appendChild(opt);
			}
			modalItemsCont.appendChild(dropdown);
		}

		let inputField = null;
		if (type === 'ask') {
			inputField = document.createElement('input');
			inputField.type = 'text';
			inputField.value = preset;
			modalItemsCont.appendChild(inputField);
		}

		const btnContainer = document.createElement('div');
		btnContainer.classList.add('button-container');
		modalItemsCont.appendChild(btnContainer);

		const yesButton = document.createElement('button');
		yesButton.textContent = type === 'confirm' ? 'Yes' : 'OK';
		btnContainer.appendChild(yesButton);

		if (type === 'confirm' || type === 'dropdown') {
			const noButton = document.createElement('button');
			noButton.textContent = type === 'confirm' ? 'No' : 'Cancel';
			btnContainer.appendChild(noButton);
			noButton.onclick = () => {
				modal.close();
				modal.remove();
				resolve(false);
			};
		}

		yesButton.onclick = () => {
			modal.close();
			modal.remove();
			if (type === 'dropdown') {
				resolve(dropdown.value);
			} else if (type === 'ask') {
				resolve(inputField.value);
			} else {
				resolve(true);
			}
		};

		if (registerRef) {
			document.getElementById("window" + notificationContext[registerRef]?.windowID).querySelectorAll(".windowcontent")[0].appendChild(modal);
			modal.show();
			modal.appendChild(modalItemsCont);
		} else {
			document.body.appendChild(modal);
			modal.appendChild(modalItemsCont);
			modal.showModal();
		}
	});
}

function justConfirm(title, message, registerRef = false) {
	return openModal('confirm', { title, message }, registerRef);
}
function showDropdownModal(title, message, options, registerRef = false) {
	return openModal('dropdown', { title, message, options }, registerRef);
}
function say(message, status = null, registerRef = false) {
	return openModal('say', { message, status }, registerRef);
}
function ask(question, preset = '', registerRef = false) {
	return openModal('ask', { message: question, preset }, registerRef);
}
const removalQueue = new Map();

async function loadtaskspanel() {
	let appbarelement = gid("nowrunninapps");
	let currentShortcuts = Array.from(appbarelement.querySelectorAll(".app-shortcut"));
	let currentKeys = currentShortcuts.map(el => el.dataset.key);

	let validKeys = Object.entries(winds)
		.filter(([winID, data]) => data.visualState !== "hidden" || gid("window" + winID) === null)
		.map(([winID, data]) => data.title + winID);

	let now = performance.now();

	for (let element of currentShortcuts) {
		let key = element.dataset.key;
		if (validKeys.includes(key)) continue;
		if (removalQueue.has(key)) continue;

		let addedAt = parseFloat(element.dataset.addedAt) || 0;
		let timeElapsed = now - addedAt;

		if (timeElapsed < 1000) {
			let delay = 1000 - timeElapsed;
			removalQueue.set(key, setTimeout(() => tryRemoveElement(element, key), delay));
		} else {
			tryRemoveElement(element, key);
		}
	}

	let keysToAdd = validKeys.filter(key => !currentKeys.includes(key));

	for (let key of keysToAdd) {
		let app = key.slice(0, -12);
		let wid = key.slice(-12);

		let appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut ctxAvail tooltip adock sizableuielement";
		appShortcutDiv.setAttribute("unid", app);
		appShortcutDiv.dataset.key = key;
		appShortcutDiv.setAttribute("winid", wid);
		appShortcutDiv.dataset.addedAt = performance.now();

		appShortcutDiv.addEventListener("click", () => {
			putwinontop('window' + wid);
			minim(wid);
		});

		let iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		insertSVG((await getAppIcon(0, winds[wid]?.appid)) || defaultAppIcon, iconSpan);

		let tooltip = document.createElement("span");
		tooltip.className = "tooltiptext";
		tooltip.innerText = basename(app);

		appShortcutDiv.appendChild(iconSpan);
		appShortcutDiv.appendChild(tooltip);
		appbarelement.appendChild(appShortcutDiv);
	}

	let visibleShortcuts = appbarelement.querySelectorAll(".app-shortcut");
	if (visibleShortcuts.length === 1) {
		appbarelement.classList.add("closeDockObj");
		setTimeout(() => {
			appbarelement.style.display = validKeys.length > 0 ? "flex" : "none";
			appbarelement.classList.remove("closeDockObj");
		}, 500);
	}
}

function tryRemoveElement(element, key) {
	if (!element.isConnected) {
		removalQueue.delete(key);
		return;
	}

	element.classList.add("closeEffect");
	setTimeout(() => {
		if (element.parentNode) element.parentNode.removeChild(element);
		removalQueue.delete(key);
	}, 500);
}

var dev;
function shrinkbsf(str) {
	return str;
}
function unshrinkbsf(compressedStr) {
	return compressedStr;
}
async function makewall(deid) {
	let x = deid;
	if (x != undefined) {
		let unshrinkbsfX;
		if (x.startsWith("http")) {
			unshrinkbsfX = x;
		} else {
			unshrinkbsfX = await getFileById(x);
			unshrinkbsfX = unshrinkbsfX.content;
		}
		setbgimagetourl(unshrinkbsfX);
	}
	await setSetting("wall", deid);
}
eventBusWorker.listen({
	type: "settings",
	event: "set",
	key: "wall",
	callback: () => {
		console.log(342423424)
		setTimeout(() => { loadSessionSettings(); renderWall() }, 1500)
	}
});
async function initializeOS() {
	if (badlaunch) { return }
	dbCache = null;
	cryptoKeyCache = null;
	await say(`
		<h2>NovaOS is open source.</h2>
		<p>
		This uses Google to count users and identify device kinds. 
		</p><div style="background:: #001b00; color: lightgreen; padding: 0.8rem; border: 1px solid #254625;font-size:inherit; border-radius: .5rem; margin: 0.8rem 0; display: flex;flex-direction:row; align-items: center; justify-content: flex-start;gap:0.5rem;">
			<span class="material-symbols-rounded">check</span>
			<div>We do not store or share your personal information.</div>
		</div>
	`);
	console.log("Setting Up NovaOS\n\nUsername: " + CurrentUsername + "\nWith: Sample preset\nUsing host: " + location.href)
	initialization = true
	memory = {
		"root": {
			"Downloads/": {
			},
			"Apps/": {},
			"Desktop/": {},
			"Dock/": {},
			"Media/": {}
		}
	};

	setdb().then(async function () {
		await saveMagicStringInLocalStorage(password);
		await ensureAllSettingsFilesExist()
			.then(async () => await installdefaultapps())
			.then(async () => getFileNamesByFolder("Apps"))
			.catch(error => {
				console.error("Error during initialization:", error);
			})
			.then(async () => {
				sharedStore.set(CurrentUsername, "icon", "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3Csvg%20fill%3D%22%23ffffff%22%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%20256%20256%22%20id%3D%22Flat%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M228%2C128A100%2C100%2C0%2C1%2C0%2C60.71%2C201.90967a3.97048%2C3.97048%2C0%2C0%2C0%2C.842.751%2C99.79378%2C99.79378%2C0%2C0%2C0%2C132.8982-.00195%2C3.96558%2C3.96558%2C0%2C0%2C0%2C.83813-.74756A99.76267%2C99.76267%2C0%2C0%2C0%2C228%2C128ZM36%2C128a92%2C92%2C0%2C1%2C1%2C157.17139%2C64.87207%2C75.616%2C75.616%2C0%2C0%2C0-44.50782-34.04053%2C44%2C44%2C0%2C1%2C0-41.32714%2C0%2C75.61784%2C75.61784%2C0%2C0%2C0-44.50782%2C34.04A91.70755%2C91.70755%2C0%2C0%2C1%2C36%2C128Zm92%2C28a36%2C36%2C0%2C1%2C1%2C36-36A36.04061%2C36.04061%2C0%2C0%2C1%2C128%2C156ZM68.86475%2C198.417a68.01092%2C68.01092%2C0%2C0%2C1%2C118.27.00049%2C91.80393%2C91.80393%2C0%2C0%2C1-118.27-.00049Z%22%2F%3E%3C%2Fsvg%3E")
				nonotif = false;
				await startup();
				let textcontentwelcome = await fetch("appdata/welcome.html");
				textcontentwelcome = await textcontentwelcome.text();
				await createFile('Downloads/', 'Welcome.html', 'html', textcontentwelcome)
				notify("Welcome to NovaOS, " + CurrentUsername + "!", "I really think you'd enjoy it!", "NovaOS")
				initialization = false;
			})
	})
} async function updateApp(appName, attempt = 1) {
	try {
		const filePath = "appdata/" + appName + ".html";
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error("Failed to fetch file for " + appName);
		}
		const fileContent = await response.text();
		await createFile("Apps/", toTitleCase(appName), "app", fileContent);
		return true;
	} catch (error) {
		console.error("Error updating " + appName + ":", error.message);
		if (attempt < maxRetries) {
			return await updateApp(appName, attempt + 1);
		} else {
			console.error("Max retries reached for " + appName + ". Skipping update.");
			failedApps.push(appName);
			return false;
		}
	}
}
async function installdefaultapps() {
	nonotif = true;
	gid("edison").showModal();
	gid("lazarus").showModal()
	if (gid('startupterms')) {
		gid('startupterms').innerText = "Just a moment...";
	}
	gid("appdmod").close();
	setTimeout(() => gid("lazarus").classList.add("closeEffect"), 2700);
	setTimeout(() => gid("lazarus").close(), 3000);

	const maxRetries = 3;
	const failedApps = [];
	async function waitForNonNull() {
		let result = null;
		while (result === null) {
			result = await updateMemoryData();
			if (result === null) {
				gid('startupterms').innerText = "Waiting for DB to open...";
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
		return result;
	}

	await waitForNonNull().then(async () => {
		const hangMessages = ["Hang in tight...", "Almost there...", "Just a moment more...", "Patience, young grasshopper...", "await fellow padawan...", "Let's see if the stars are with us today...", "what's the meaning of it all...", "just a sec, let me get ready...", "So, what have you been doing lately?", "What are you doing after this?", "Some apps aren't installing, i'm trying again...", "Let's take it slow and precise right?"];

		const interval = setInterval(() => {
			const randomIndex = Math.floor(Math.random() * hangMessages.length);
			gid('startupterms').innerText = hangMessages[randomIndex];
		}, 2500);

		for (let i = 0; i < defAppsList.length; i++) {
			await new Promise(res => setTimeout(res, 300));
			const appName = defAppsList[i];
			const appUpdatePromise = updateApp(appName);

			await Promise.race([appUpdatePromise, new Promise(res => setTimeout(res, 3000))]);
			setsrtpprgbr(Math.round((i + 1) / defAppsList.length * 100));
		}
		clearInterval(interval);

		if (failedApps.length > 0) {
			const response = await say(failedApps.length + " apps failed to download. This might be an internet issue, retry?");
			if (response === "yes" || response === true) {
				const stillFailed = [];
				for (let i = 0; i < failedApps.length; i++) {
					const appName = failedApps[i];
					const success = await updateApp(appName, 1);
					if (!success) {
						stillFailed.push(appName);
					}
				}
				if (stillFailed.length > 0) {
					console.error("These apps still failed after retry:", stillFailed);
					await say("Some apps still failed to download: " + stillFailed.join(", "));
				}
			}
		}

		if (!initialization) {
			closeElementedis();
		}
	});
}
async function prepareArrayToSearch() {
	let arrayToSearch = [];
	function scanFolder(folderPath, folderContents) {
		for (let name in folderContents) {
			let item = folderContents[name];
			let fullPath = `${folderPath}${name}`;
			if (item.id) {
				let displayName = mtpetxt(name) == "app" ? basename(name) : name;
				arrayToSearch.push({ name: displayName, id: item.id, type: "file", path: folderPath });
			} else {
				let folderId = folderContents[name]._id || fullPath;
				arrayToSearch.push({ name, id: folderId, type: "folder", path: fullPath });
				scanFolder(fullPath, item);
			}
		}
	}
	scanFolder("", memory["root"]);
	fileslist = arrayToSearch;
}

strtappse = debounce(rlstrtappse, 100);

async function rlstrtappse(event) {
	if (fileslist.length === 0) await prepareArrayToSearch();
	const searchValue = gid("strtsear").value.toLowerCase().trim();
	if (searchValue === "") return;
	const abracadra = await getSetting("smartsearch");
	let maxSimilarity = 0.5;
	let appToOpen = null;
	let mostRelevantItem = null;
	const itemsWithSimilarity = [];
	fileslist.forEach(item => {
		const itemName = item.name.toLowerCase();
		let similarity = abracadra ? calculateSimilarity(itemName, searchValue) : 0;
		if (!abracadra && itemName.startsWith(searchValue)) similarity = 1;
		if (similarity > maxSimilarity) {
			maxSimilarity = similarity;
			appToOpen = item;
		}
		if (similarity >= 0.2) {
			itemsWithSimilarity.push({ item, similarity });
		}
	});

	if (event.key === "Enter") {
		event.preventDefault();
		if (searchValue === "i love nova") {
			closeElementedis(gid("searchwindow"));
			let x = await ask("What can i call you?");
			say("i love you too, " + x);
			return;
		}
		if (appToOpen) {
			if (appToOpen.type === 'folder') {
				useHandler('file_manager', { 'opener': 'showDir', 'path': appToOpen.path });
			} else {
				openfile(appToOpen.id);
			}
		}
		return;
	}

	itemsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
	const groupedResults = itemsWithSimilarity.reduce((acc, { item }) => {
		const path = item.path || '';
		if (!acc[path]) acc[path] = [];
		acc[path].push(item);
		return acc;
	}, {});

	gid("strtappsugs").innerHTML = "";
	let elements = 0;
	for (const path in groupedResults) {
		const items = groupedResults[path];
		if (path.length > 0) {
			const pathElement = document.createElement("div");
			pathElement.innerHTML = `<strong>${path}</strong>`;
			gid("strtappsugs").appendChild(pathElement);
		}

		for (const item of items) {
			if (!mostRelevantItem) mostRelevantItem = item;
			const newElement = document.createElement("div");

			let icon;
			if (item.type == "folder") {
				icon = await getAppIcon('folder');
				newElement.innerHTML = `<div>${icon} ${item.path}</div><span class="material-symbols-rounded">arrow_outward</span>`;
				newElement.onclick = () => useHandler('file_manager', { 'opener': 'showDir', 'path': item.path });
			} else {
				icon = await getAppIcon(0, item.id);
				newElement.innerHTML = `<div>${icon} ${item.name}</div><span class="material-symbols-rounded">arrow_outward</span>`;
				newElement.onclick = () => openfile(item.id);
			}

			gid("strtappsugs").appendChild(newElement);
			elements++;
		}
	}

	gid("strtappsugs").style.display = "flex";
	if (mostRelevantItem) {
		gid("partrecentapps").style.display = "none";
		document.getElementsByClassName("previewsside")[0].style.display = "flex";
		gid("seapppreview").style.display = "block";
		gid('seprw-icon').innerHTML = await getAppIcon(0, mostRelevantItem.id);
		gid('seprw-appname').innerText = mostRelevantItem.name;
		gid('seprw-openb').onclick = function () {
			if (mostRelevantItem.type === 'folder') {
				useHandler('file_manager', { 'opener': 'showDir', 'path': mostRelevantItem.path });
			} else {
				openfile(mostRelevantItem.id);
			}
		};
	} else {
		gid("partrecentapps").style.display = "block";
		gid("seapppreview").style.display = "none";
	}

	if (elements == 0) {
		gid("strtappsugs").innerHTML = `<p style="margin:1rem; opacity: 0.5;">No results</p>`;
	}

}

function calculateSimilarity(string1, string2) {
	const m = string1.length;
	const n = string2.length;
	const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
	for (let i = 0; i <= m; i++) {
		for (let j = 0; j <= n; j++) {
			if (i === 0) dp[i][j] = j;
			else if (j === 0) dp[i][j] = i;
			else if (string1[i - 1] === string2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
			else {
				const penalty = (i + j) / (m + n);
				dp[i][j] = 1 + Math.min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1] + penalty);
			}
		}
	}
	return 1 - dp[m][n] / Math.max(m, n);
}
function containsSmallSVGElement(str) {
	var svgRegex = /^<svg\s*[^>]*>[\s\S]*<\/svg>$/i;
	if (!svgRegex.test(str) || str.length > 10000) return false;

	var idMap = {};
	var idRegex = /\bid="([^"]+)"/g;
	var urlRefRegex = /url\(#([^")]+)\)/g;

	str = str.replace(idRegex, function (match, id) {
		if (!idMap[id]) {
			idMap[id] = 'svguid_' + Math.random().toString(36).substr(2, 8);
		}
		return `id="${idMap[id]}"`;
	});

	str = str.replace(urlRefRegex, function (match, id) {
		return idMap[id] ? `url(#${idMap[id]})` : match;
	});

	return str;
}

let countdown, countdown2;
function startTimer(minutes) {
	document.getElementById("sleepbtns").style.display = "none";
	clearInterval(countdown);
	const now = Date.now();
	const then = now + minutes * 60 * 1000;
	displayTimeLeft(minutes * 60);
	countdown = setInterval(() => {
		const secondsLeft = Math.round((then - Date.now()) / 1000);
		if (secondsLeft <= 0) {
			clearInterval(countdown);
			document.getElementById('sleeptimer').textContent = '00:00';
			playBeeps();
			document.getElementById('sleepwindow').close()
			return;
		}
		displayTimeLeft(secondsLeft);
	}, 1000);
}
function playBeeps() {
	const context = new (window.AudioContext || window.webkitAudioContext)();
	const now = context.currentTime;
	const duration = 0.1;
	const fadeDuration = 0.02;
	const gap = 0.1;
	const pitch = 700;
	const rhythm = [
		[0, 0.2, 0.4, 0.6],
		[1.2, 1.4, 1.6, 1.8],
		[2.4, 2.6, 2.8, 3.0]
	];
	const getOffsetTime = (index, time) => now + time + index * (4 * (duration + gap));
	rhythm.forEach((set, index) => {
		set.forEach(time => {
			const offsetTime = getOffsetTime(index, time);
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();
			oscillator.type = 'triangle';
			oscillator.frequency.setValueAtTime(pitch, offsetTime);
			gainNode.gain.setValueAtTime(0, offsetTime);
			gainNode.gain.linearRampToValueAtTime(1, offsetTime + fadeDuration); // Fade in
			gainNode.gain.linearRampToValueAtTime(0, offsetTime + duration - fadeDuration); // Fade out
			oscillator.connect(gainNode);
			gainNode.connect(context.destination);
			oscillator.start(offsetTime);
			oscillator.stop(offsetTime + duration);
		});
	});
}
async function setMessage() {
	const message = await ask('What should be the message?', 'Do not disturb...');
	document.getElementById('sleepmessage').innerHTML = message;
}

function displayTimeLeft(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainderSeconds = seconds % 60;
	const display = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
	document.getElementById('sleeptimer').textContent = display;
}

async function notify(...args) {
	if (nonotif) { return }
	let appname = "System";
	let [title = "Notification", description = "There is a notification", isid] = args;
	let appID = notificationContext[isid]?.appID;
	appname = (!(appID == undefined)) ? basename(await getFileNameByID(appID)) : appname;

	if (document.getElementById("notification").style.display == "block") {
		document.getElementById("notification").style.display = "none";
		setTimeout(() => notify(title, description, appname), 2500);
	}
	var appnameb = document.getElementById('notifappName');
	var descb = document.getElementById('notifappDesc');
	var titleb = document.getElementById('notifTitle');
	if (appnameb && descb && titleb) {
		appnameb.innerText = appname;
		descb.innerText = description;
		titleb.innerText = title;
		const windValues = Object.values(winds).map(wind => Number(wind.zIndex) || 0);
		const maxWindValue = Math.max(...windValues);
		document.getElementById("notification").style.zIndex = maxWindValue + 1;
		document.getElementById("notification").style.display = "block";
		document.getElementById("notification").onclick = () => {
			openfile(appID);
		}
		setTimeout(function () {
			document.getElementById("notification").style.display = "none";
		}, 5000);
	} else {
		console.error("One or more DOM elements not found.");
	}
	const notificationID = genUID();
	notifLog[notificationID] = { title, description, appname };
	(isid) ? delete notificationContext[isid] : 0;
}

let toastInProgress = false;
let totalDuration = 0;
const maxToastDuration = 5000;
let toastQueue = [];

function toast(text, regref, duration = 5000,) {
	console.log("Toast: ", duration);
	let displayDuration = Math.min(duration, maxToastDuration);

	if (toastInProgress) {
		toastQueue.push({ text, duration: displayDuration });
	} else {
		totalDuration = displayDuration;
		toastInProgress = true;
		displayToast(text, displayDuration, regref);
	}
}

function displayToast(text, duration, regref) {
	console.log("Toast4534: ", regref);
	var titleb = document.getElementById('toastdivtext');
	if (titleb) {
		titleb.innerText = text;
		(async () => { insertSVG(await getAppIcon(0, notificationContext[regref]?.appID || "info"), document.getElementById('toasticon')); })();

		const windValues = Object.values(winds).map(wind => Number(wind.zIndex) || 0);
		const maxWindValue = Math.max(...windValues);
		document.getElementById("toastdiv").style.zIndex = maxWindValue + 2;
		document.getElementById("toastdiv").classList.add('notifpullanim');
		document.getElementById("toastdiv").style.display = "block";

		setTimeout(function () {
			document.getElementById("toastdiv").classList.remove('closeEffect');
		}, 200);

		document.getElementById("toastdiv").onclick = function () {
			document.getElementById("toastdiv").classList.add('closeEffect');
			document.getElementById("toastdiv").style.display = "none";
			toastInProgress = false;
			if (toastQueue.length > 0) {
				const nextToast = toastQueue.shift();
				displayToast(nextToast.text, nextToast.duration);
			}
		};

		setTimeout(function () {
			document.getElementById("toastdiv").classList.add('closeEffect');
			setTimeout(function () {
				document.getElementById("toastdiv").style.display = "none";
				toastInProgress = false;
				if (toastQueue.length > 0) {
					const nextToast = toastQueue.shift();
					displayToast(nextToast.text, nextToast.duration);
				}
			}, 200);
		}, duration);
	} else {
		console.error("DOM elements not found.");
	}
}

function displayNotifications(x) {
	if (x == "clear") {
		notifLog = {};

	}
	const notifList = document.getElementById("notiflist");
	notifList.innerHTML = "";
	if (Object.values(notifLog).length == 0) {
		document.querySelector(".notiflist").style.display = "none";
	} else {
		document.querySelector(".notiflist").style.display = "flex";
	}
	Object.values(notifLog).forEach(({ title, description, appname }) => {
		const notifDiv = document.createElement("div");
		notifDiv.className = "notification";
		const titleDiv = document.createElement("div");
		titleDiv.className = "notifTitle";
		titleDiv.innerText = title;
		const descDiv = document.createElement("div");
		descDiv.className = "notifDesc";
		descDiv.innerText = description;
		const appNameDiv = document.createElement("div");
		appNameDiv.className = "notifAppName";
		appNameDiv.innerText = appname;
		notifDiv.appendChild(appNameDiv);
		notifDiv.appendChild(titleDiv);
		notifDiv.appendChild(descDiv);
		notifList.appendChild(notifDiv);
	});
}
function runAsOSL(content) {
	const encodedContent = encodeURIComponent(content).replace(/'/g, "%27").replace(/"/g, "%22");
	const cont = `<iframe class="oslframe" src="https://origin.mistium.com/Versions/originv5.5.4?embed=${encodedContent}"></iframe>
	<style>
		.oslframe {
			width: 100%;
			height: 100%;
			border: none;
		}
	</style>`;
	openwindow("Nova OSL Runner", cont);
}
function runAsWasm(content) {
	const wasmBytes = new Uint8Array(content);
	const div = document.createElement('div');
	const script = document.createElement('script');
	script.innerHTML = `
		function greenflag() {
			const memory = new WebAssembly.Memory({ initial: 1 });
			const imports = { env: { memory: memory } };

			const wasmCode = new Uint8Array([${Array.from(wasmBytes)}]);
			WebAssembly.instantiate(wasmCode, imports)
				.then(obj => {
					console.log(obj.instance.exports.memory);
					// Additional code to execute the WebAssembly module as needed
				})
				.catch(err => console.error(err));
		}
	`;
	div.appendChild(script);
	openwindow("Nova Wasm Runner", div.innerHTML);
}

(async () => {
	let appbarelement = document.getElementById("dock");
	let dropZone = appbarelement;
	dropZone.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	dropZone.addEventListener('drop', async (event) => {
		event.preventDefault();
		const unid = event.dataTransfer.getData("Text");
		await moveFileToFolder(unid, "Dock/");
		genTaskBar();
	});
	dropZone.addEventListener('dragend', (event) => {
		event.preventDefault();
	});
})();

async function realgenTaskBar() {
	gid("dock").style.display = "none";
	gid("novanav").style.display = "grid";

	// nav theme
	try {

		var NovNavCtrl = await getSetting("NovNavCtrl")
		if (NovNavCtrl.bg) {
			gid("novanav").style.backgroundColor = "transparent";
		} else {
			gid("novanav").style.backgroundColor = "var(--col-bg1)";
		}

		gid("novanav").style.justifyContent = NovNavCtrl.align;
	} catch (e) { }

	var appbarelement = document.getElementById("dock");
	appbarelement.innerHTML = "<span class='taskbarloader' id='taskbarloaderprime'></span>";
	if (appbarelement) {
		try {

			let x = await getFileNamesByFolder("Dock");
			if (Array.isArray(x) && x.length === 0) {
				const y = await getFileNamesByFolder("Apps");
				x = (await Promise.all(
					('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) ?
						y.filter(item =>
							item.name === "Files.app"
						)
						:
						y.filter(item =>
							item.name === "Files.app" ||
							item.name === "Settings.app" ||
							item.name === "Store.app"
						)

				)).filter(Boolean);
			}
			x.forEach(async function (app, index) {
				index++;
				var islnk = false;

				var appShortcutDiv = document.createElement("biv");
				appShortcutDiv.setAttribute("draggable", true);
				appShortcutDiv.setAttribute("ondragstart", "dragfl(event, this)");
				appShortcutDiv.setAttribute("unid", app.id || '');
				appShortcutDiv.className = "app-shortcut ctxAvail tooltip adock sizableuielement";

				let lnkappidcatched = app.id;
				if (mtpetxt(app.name) == "lnk") {
					app = await getFileById(app.id);
					let z = JSON.parse(decodeBase64Content(app.content));
					app = await getFileById(z.open);
					if (!app) {
						await remfile(lnkappidcatched);
						say("LNK file removed as real file was deleted.");
						genTaskBar();
						return;
					}
					islnk = true;
				}

				var iconSpan = document.createElement("span");
				iconSpan.classList.add("appicnspan");

				var tooltisp = document.createElement("span");
				tooltisp.className = "tooltiptext";
				tooltisp.innerHTML = islnk ? basename(app.name) + `*` : basename(app.name);
				appShortcutDiv.appendChild(iconSpan);
				appShortcutDiv.appendChild(tooltisp);
				appbarelement.appendChild(appShortcutDiv);

				if (!app.id) {
					let folderName = app.name;
					await getAppIcon('folder')
						.then(icon => iconSpan.innerHTML = icon)
						.catch(error => console.error(error));
					appShortcutDiv.addEventListener("click", async () => {

						let filesInFolder = await getFileNamesByFolder(`Dock/${folderName}`);
						console.log(45, filesInFolder, folderName)
						let appIds = filesInFolder.map(file => file.id);
						appGroupModal(folderName, appIds);
					});
				} else {
					await getAppIcon(0, app.id, 0)
						.then(icon => iconSpan.innerHTML = icon)
						.catch(error => console.error(error));
					appShortcutDiv.addEventListener("click", () => openfile(app.id));
				}

			});
			gid("dock").style.display = "flex";

		} catch (err) {
			console.log(err)
		}
		document.querySelector('#taskbarloaderprime').remove();
	}
}

(async () => {
	let dropZone = document.getElementById("desktop");
	dropZone.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	dropZone.addEventListener('drop', async (event) => {
		event.preventDefault();
		const unid = event.dataTransfer.getData("Text");
		await moveFileToFolder(unid, "Desktop/");
		genDesktop()
	});
	dropZone.addEventListener('dragend', (event) => {
		event.preventDefault();
	});
})();

async function realgenDesktop() {
	gid("desktop").innerHTML = ``;
	let x;
	try {
		let y = await getFileNamesByFolder("Desktop");

		y.forEach(async function (app) {
			var appShortcutDiv = document.createElement("div");
			appShortcutDiv.className = "app-shortcut ctxAvail sizableuielement";
			appShortcutDiv.setAttribute("unid", app.id || '');
			app = await getFileById(app.id);
			let islnk = false;
			if (mtpetxt(app.fileName) == "lnk") {
				let z = JSON.parse(decodeBase64Content(app.content));
				app = await getFileById(z.open);
				islnk = true;
			}
			appShortcutDiv.setAttribute("draggable", true);
			appShortcutDiv.setAttribute("ondragstart", "dragfl(event, this)");
			appShortcutDiv.addEventListener("click", () => openfile(app.id));
			appShortcutDiv.setAttribute("unid", app.id);
			var iconSpan = document.createElement("span");

			iconSpan.classList.add("appicnspan");
			getAppIcon(app.content, app.id).then((icon) => {
				iconSpan.innerHTML = `${icon}`;
			})
			var nameSpan = document.createElement("span");
			nameSpan.className = "appname";
			nameSpan.textContent = islnk ? basename(app.fileName) + `*` : basename(app.fileName);
			appShortcutDiv.appendChild(iconSpan);
			appShortcutDiv.appendChild(nameSpan);
			gid("desktop").appendChild(appShortcutDiv);
		});
		renderWall();
	} catch (error) {
		console.error(error)
	}

}

async function renderWall() {
	let x = await getSetting("wall");
	if (x != undefined && x != '' && x != ' ') {
		let unshrinkbsfX;
		if (x.startsWith("http")) {
			unshrinkbsfX = x;
		} else {
			unshrinkbsfX = await getFileById(x);
			unshrinkbsfX = unshrinkbsfX.content;
		}
		setbgimagetourl(unshrinkbsfX);
	}
	document.getElementById("bgimage").onerror = async function (event) {
		toast("It doesn't seem to work as the wallpaper...")
		setbgimagetourl(novaFeaturedImage);
		if (await getSetting("wall")) {
			remSettingKey("wall");
		}
	};
}

async function opensearchpanel(preset = "") {
	gid("seapppreview").style.display = "none";
	if (appsHistory.length > 0) {
		gid("partrecentapps").style.display = "block";
	} else {
		gid("partrecentapps").style.display = "none";
		document.querySelector(".previewsside").style.display = "none";
	}
	if (await getSetting("smartsearch")) {
		gid('searchiconthingy').setAttribute("type", "smart")
	} else {
		gid('searchiconthingy').setAttribute("type", "regular")
	}
	if (window.innerWidth > 500) {
		gid("strtsear").focus()
	}
	if (typeof preset === "string") {
		gid("strtsear").value = preset;
	}

	loadrecentapps();
	displayNotifications();
	gid('searchwindow').showModal();
	prepareArrayToSearch()
}
function mtpetxt(str) {
	if (!str) {
		return;
	}
	try {
		const parts = str.split('.');
		return parts.length > 1 ? parts.pop() : '';
	} catch (err) {
		console.error(err)
	}
}
function closeallwindows() {
	Object.keys(winds).forEach(key => {
		const taskId = key.slice(-12);
		clwin(taskId);
	});
	gid("closeallwinsbtn").checked = true;
}
async function checkifpassright() {
	lethalpasswordtimes = true;
	var trypass = gid("loginform1").value;
	if (await checkPassword(trypass)) {
		password = trypass;
		lethalpasswordtimes = false;
		startup();
	} else {
		gid("loginform1").classList.add("thatsnotrightcls");
		setTimeout(function () {
			gid("loginform1").classList.remove("thatsnotrightcls");
		}, 1000)
	}
	gid("loginform1").value = '';
}
async function logoutofnova() {
	await cleanupram();
	await showloginmod();
	removeTheme();
	loginscreenbackbtn();
	console.log("logged out of " + CurrentUsername);
	CurrentUsername = null;
}
async function cleanupram() {
	closeallwindows();
	document.querySelectorAll('dialog[open].onramcloseable').forEach(dialog => dialog.close());
	memory = null;
	CurrentUsername = null;
	password = 'nova';
	winds = {};
	MemoryTimeCache = null;
	lethalpasswordtimes = true;
	dbCache = null;
	cryptoKeyCache = null;
	fileTypeAssociations = {};
	handlers = {};
}
async function setandinitnewuser() {
	gid("edison").showModal()
	await cleanupram();
	CurrentUsername = await ask("Enter a username:", "");
	await initializeOS();
	gid('loginmod').close();
}
async function novarefresh() {
	genDesktop();
	genTaskBar();
	cleanupInvalidAssociations();
	checkdmode();
	loadtaskspanel()
	loadrecentapps();
	sessionSettingsLoaded = false;
	loadSessionSettings();
}
function launchbios() {
	document.getElementById('novasetupusernamedisplay').innerText = CurrentUsername;
	document.getElementById('bios').showModal();
}
function domLoad_checkedgecases() {
	const request = indexedDB.deleteDatabase('trojencat');

	let existed = false;

	request.onblocked = function () { };

	request.onsuccess = function (event) {
		if (event.oldVersion > 0) existed = true;
		if (existed) location.reload();
	};

	request.onerror = function () {
		console.error('Failed to delete database trojencat');
	};
}
document.addEventListener("DOMContentLoaded", async function () {
	sysLog("DOM", "Loaded");
	domLoad_checkedgecases()

	genTaskBar = debounce(realgenTaskBar, 500);
	genDesktop = debounce(realgenDesktop, 500);

	const searchInput5342 = document.querySelector('#novamenusearchinp');
	let keyHeld = false;

	searchInput5342.addEventListener('keydown', () => {
		keyHeld = true;
	});

	searchInput5342.addEventListener('keyup', (e) => {
		if (keyHeld) {
			keyHeld = false;
			opensearchpanel(searchInput5342.value);
			gid('appdmod').close();
			searchInput5342.value = "";
		}
	});
	const scriptSources = [
		"scripts/fflate.js",
		"scripts/encdec.js",
		"scripts/kernel.js",
		"scripts/rotur.js",
		"scripts/ctxmenu.js",
		"scripts/edgecases.js",
		"scripts/dompurify.js",
		"scripts/scripties.js",
		"scripts/windman.js",
		"scripts/ntx.js"
	];

	const loadScripts = async () => {
		let prog = 10;
		setsrtpprgbr(prog);
		const increment = 40 / scriptSources.length;

		for (const src of scriptSources) {
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = src;
				script.onload = resolve;
				script.onerror = reject;
				document.body.appendChild(script);
			});
			prog += increment;
			setsrtpprgbr(prog);
		}

		setsrtpprgbr(40);
	};

	await loadScripts();

	setbgimagetourl(novaFeaturedImage);

	gid("nowrunninapps").style.display = "none";
	gid('seprw-openb').onclick = function () {
		gid('searchside').style.flexGrow = 1;
	}

	function startfunctions() {
		try {
			updateBattery();
			navigator.getBattery().then(function (battery) {
				battery.addEventListener('levelchange', updateBattery);
			});
		} catch (e) { }

		makedialogclosable('appdmod');

		// hotkeys
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && (event.key === 'f' || event.keyCode === 70)) {
				event.preventDefault();
				openapp('files', 1);
			}
			if (event.ctrlKey && (event.key === 's')) {
				event.preventDefault();
				openapp('settings', 1);
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') {
				var appdmod = document.getElementById('appdmod');
				if (appdmod && appdmod.open) {
					appdmod.close();
				}
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && event.key === '/') {
				event.preventDefault();
				opensearchpanel();
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && event.key === ' ') {
				event.preventDefault();
				openn();
			}
		});

		makedialogclosable('searchwindow');
		prepareArrayToSearch();

		onstartup.push(async () => {
			edgecases();

			if (detectIE()) {
				issues = `<li><b>HTMLDialogElement Not supported: </b> We have taken some efforts to fix this for you.</li>
				<li><b>Internet explorer detected: </b> i dunno what to say ;-;</li>`;
				say(cantusetext + issues + caniuse2 + `<br><b>Anyway, it is so interesting why you still use explorer.</b>`, "failed");
				badlaunch = true;
			}
		});
	}

	startfunctions();
	gid("novanav").style.display = "none";
	async function waitForNonNull() {
		const startTime = Date.now();
		const maxWaitTime = 2000;
		while (Date.now() - startTime < maxWaitTime) {
			const result = await updateMemoryData();
			if (result !== null) {
				return result;
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return null;
	}
	waitForNonNull().then(async (result) => {
		await checkAndRunFromURL();
		gid('startupterms').innerHTML = "<span>Checking database...</span>";
		try {
			if (result || result == 3) {
				await showloginmod();
			} else {
				await cleanupram();
				CurrentUsername = 'Admin';
				await initializeOS();
			}
		} catch (error) {
			console.error('Error in database operations:', error);
		}
	});

	var bgImage = document.getElementById("bgimage");
	bgImage.addEventListener("click", function () {
		nowapp = '';
	});
});

async function appGroupModal(name, list) {
	const modal = gid("appgrpmodal");
	const listElement = gid("appgrp_list");
	const heading = gid("appgrp_name");

	listElement.innerHTML = '';

	if (name) {
		heading.innerText = name;
		heading.style.display = "block";
	} else {
		heading.style.display = "none";
	}

	if (list) {
		modal.showModal();
	}

	list.forEach(async (appid) => {
		let app = await getFileById(appid, "fileName");

		var appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut sizableuielement";
		appShortcutDiv.setAttribute("unid", app.id || '');
		appShortcutDiv.dataset.appId = app.id;
		appShortcutDiv.addEventListener("click", () => openfile(app.id));

		var iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		iconSpan.innerHTML = "<span class='taskbarloader'></span>";
		getAppIcon(false, app.id).then((appIcon) => {
			iconSpan.innerHTML = appIcon;
		});

		function getapnme(x) {
			return x.split(".")[0];
		}

		var nameSpan = document.createElement("span");
		nameSpan.className = "appname";
		nameSpan.textContent = getapnme(app.fileName);

		appShortcutDiv.appendChild(iconSpan);
		appShortcutDiv.appendChild(nameSpan);

		listElement.appendChild(appShortcutDiv);
	})
}

function setTitle(windowID, title) {
	if (typeof title !== "string") {
		console.error("Title must be a string.");
		return;
	}
	const element = document.getElementById("window" + windowID + "titlespan");
	if (element) {
		element.innerText = title;
	} else {
		console.warn("Title element not found in the DOM.");
	}
}