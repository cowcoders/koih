import Database from "./desktop/Database";
import Config from "./desktop/Config";
import { getMenu } from "./desktop/utils/menu"
import pkg from '../package.json';
import AppUpdater from "./desktop/utils/AppUpdater";
import IPCEvents from "./desktop/IPCEvents";

const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let mainWindow = null;
let appUpdater = null;

const config = new Config(app, pkg);
const database = new Database(config);
new IPCEvents(database, config);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support'); // eslint-disable-line
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
  const path = require('path'); // eslint-disable-line
  const p = path.join(__dirname, '..', 'app', 'node_modules'); // eslint-disable-line
  require('module').globalPaths.push(p); // eslint-disable-line
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


const installExtensions = () => {
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

    const extensions = [
      'REACT_DEVELOPER_TOOLS',
      'REDUX_DEVTOOLS'
    ];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));
  }

  return Promise.resolve([]);
};

function devTools() {
  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click() {
          mainWindow.inspectElement(x, y);
        }
      }]).popup(mainWindow);
    });
  }
}

function onReady() {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });
  mainWindow.loadURL(`file://${__dirname}/app.html`);
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
    appUpdater = new AppUpdater();
  });
  mainWindow.on('closed', () => mainWindow = null);
  devTools();
  Menu.setApplicationMenu(getMenu(mainWindow, config.version));
  ipcMain.on('app-relaunch', () => {
    appUpdater.restart();
  });
}

app.on('ready', () => installExtensions().then(() => onReady()));
