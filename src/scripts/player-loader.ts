import APlayer from "aplayer";
import "aplayer/dist/APlayer.min.css";

declare global {
  interface Window {
    APlayer: typeof APlayer;
  }
}

window.APlayer = APlayer;

const siteScript = document.createElement("script");
siteScript.src = "/scripts/site.js";
siteScript.defer = true;
document.body.append(siteScript);
