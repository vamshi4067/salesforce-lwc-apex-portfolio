import { createElement } from "lwc";
import App from "c/app";
document.getElementById("app").appendChild(createElement("c-app", { is: App }));
