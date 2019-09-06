import { remote, app } from "electron";
// Get the electron application's user directory
const APP = process.type === "renderer" ? remote.app : app;
const STORE_PATH = APP.getPath("userData");
const Settings = {
  userDataPath: STORE_PATH
};
export default Settings;
